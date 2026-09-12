#!/usr/bin/env bash
# One-shot public deployment for an Unraid/any-docker host, hand in hand with
# a Cloudflare Tunnel. Run FROM THE REPO ROOT on the box:
#
#   CF_API_TOKEN=... ZONE_NAME=example.com \
#   APP_HOSTNAME=kickstart.example.com SSO_HOSTNAME=kickstart-sso.example.com \
#   ./deploy/deploy.sh
#
# What it does, idempotently:
#   1. Provisions the Cloudflare tunnel + ingress + proxied DNS (provision-tunnel.sh).
#   2. Generates deploy/.env.deploy - hostnames, tunnel token, and ROTATED
#      secrets (OAuth2 client secret, Keycloak admin password) - kept only if
#      absent, so re-runs never rotate a live deployment's credentials.
#   3. Patches a deploy copy of the realm export: public redirect URIs/web
#      origins/post-logout URIs added, backchannel-logout URL pointed at the
#      backend container, client secret set to the rotated one.
#   4. Builds the registration SPI jar via dockerized Maven (no host JDK needed).
#   5. docker compose up with the deploy overlay.
#
# Requires: docker with the compose plugin, curl, python3, openssl.

set -euo pipefail

# Hosts like stock Unraid have no python3 - fall back to a throwaway container.
if command -v python3 >/dev/null 2>&1; then
  PY() { python3 "$@"; }
else
  PY() { docker run --rm -i -v "$PWD:$PWD" -w "$PWD" python:3.12-alpine python3 "$@"; }
fi
cd "$(dirname "$0")/.."
: "${CF_API_TOKEN:?}" "${ZONE_NAME:?}" "${APP_HOSTNAME:?}" "${SSO_HOSTNAME:?}"

ENV_DEPLOY=deploy/.env.deploy

# --- 1. Cloudflare side ---
TUNNEL_LINE=$(CF_API_TOKEN="$CF_API_TOKEN" ZONE_NAME="$ZONE_NAME" \
  APP_HOSTNAME="$APP_HOSTNAME" SSO_HOSTNAME="$SSO_HOSTNAME" \
  bash deploy/provision-tunnel.sh | grep '^TUNNEL_TOKEN=')

# --- 2. Deploy env (secrets survive re-runs) ---
if [ ! -f "$ENV_DEPLOY" ]; then
  cat > "$ENV_DEPLOY" <<EOF
APP_HOSTNAME=$APP_HOSTNAME
SSO_HOSTNAME=$SSO_HOSTNAME
$TUNNEL_LINE
KEYCLOAK_CLIENT_SECRET=$(openssl rand -hex 24)
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=')
EOF
  chmod 600 "$ENV_DEPLOY"
  echo "wrote $ENV_DEPLOY (new secrets generated)"
else
  # keep secrets, refresh hostnames + token
  PY - "$ENV_DEPLOY" "$APP_HOSTNAME" "$SSO_HOSTNAME" "${TUNNEL_LINE#TUNNEL_TOKEN=}" <<'EOF'
import sys
path, app, sso, token = sys.argv[1:]
lines = {l.split('=',1)[0]: l.rstrip('\n') for l in open(path) if '=' in l}
lines['APP_HOSTNAME'] = f'APP_HOSTNAME={app}'
lines['SSO_HOSTNAME'] = f'SSO_HOSTNAME={sso}'
lines['TUNNEL_TOKEN'] = f'TUNNEL_TOKEN={token}'
open(path, 'w').write('\n'.join(lines.values()) + '\n')
print(f'updated {path} (existing secrets preserved)')
EOF
fi

# --- 3. Realm export, deploy-patched ---
# 755/644, not the umask default: Keycloak runs as the non-root `keycloak` user
# inside the container and must be able to list+read this mounted import dir
# (a root-only 700 dir makes ExportImportManager NPE with "directory not found").
mkdir -p deploy/realm-export
chmod 755 deploy/realm-export
PY - "$APP_HOSTNAME" <<'EOF'
import json, sys, os
app = sys.argv[1]
secret = next(l.split('=',1)[1].strip() for l in open('deploy/.env.deploy') if l.startswith('KEYCLOAK_CLIENT_SECRET='))
realm = json.load(open('keycloak/realm-export/gizmoshop-realm.json'))
for client in realm.get('clients', []):
    if client.get('clientId') == 'bff-kickstart-client':
        client['secret'] = secret
        for uri in (f'https://{app}/bff-kickstart/login/oauth2/code/keycloak',):
            if uri not in client['redirectUris']:
                client['redirectUris'].append(uri)
        for origin in (f'https://{app}',):
            if origin not in client.get('webOrigins', []):
                client.setdefault('webOrigins', []).append(origin)
        attrs = client.setdefault('attributes', {})
        plr = attrs.get('post.logout.redirect.uris', '')
        pub = f'https://{app}/bff-kickstart/'
        if pub not in plr:
            attrs['post.logout.redirect.uris'] = (plr + '##' if plr else '') + pub
        # Backchannel logout: straight to the backend container - Keycloak and
        # the backend share the compose network, no tunnel round-trip.
        attrs['backchannel.logout.url'] = 'http://backend:8081/bff-kickstart-api/logout/connect/back-channel/keycloak'
    if client.get('clientId') == 'bff-kickstart-service-client':
        # machine-client demo secret: rotate it too so nothing ships defaults
        client['secret'] = secret[::-1]
json.dump(realm, open('deploy/realm-export/gizmoshop-realm.json', 'w'), indent=2)
print('wrote deploy/realm-export/gizmoshop-realm.json')
EOF
chmod 644 deploy/realm-export/gizmoshop-realm.json

# --- 4. SPI jar via dockerized Maven (Unraid has no JDK) ---
SPI_JAR=keycloak/providers/bff-registration-spi/target/bff-registration-spi.jar
if [ ! -f "$SPI_JAR" ]; then
  echo "Building registration SPI jar (dockerized maven)..."
  docker run --rm \
    -v "$PWD/keycloak/providers/bff-registration-spi:/src" -w /src \
    -v bff-kickstart-m2:/root/.m2 \
    maven:3.9-eclipse-temurin-17 mvn -q clean package -DskipTests
fi

# --- 5. Up ---
[ -f .env ] || cp .env.example .env
docker compose --env-file .env --env-file "$ENV_DEPLOY" \
  -f docker-compose.yml -f deploy/docker-compose.deploy.yml \
  up -d --build

echo
echo "Deployed. App:  https://$APP_HOSTNAME/bff-kickstart/"
echo "          SSO:  https://$SSO_HOSTNAME  (admin console: /admin, user 'admin', password in $ENV_DEPLOY)"
echo "Demo app users (admin/inspector/viewer/manager, password 'password') are PUBLIC - fine for a demo, rotate for anything real."
