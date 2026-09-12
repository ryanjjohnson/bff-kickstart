#!/usr/bin/env bash
# Provisions the Cloudflare side, idempotently: a named tunnel, its
# hostname->service ingress rules, and proxied CNAME records for both
# hostnames. Prints TUNNEL_TOKEN=... on success (deploy.sh captures it).
#
# Required env:
#   CF_API_TOKEN   scoped token: Account>Cloudflare Tunnel>Edit + Zone>DNS>Edit
#   ZONE_NAME      e.g. example.com (must be a zone the token can edit)
#   APP_HOSTNAME   e.g. kickstart.example.com   -> http://frontend:80
#   SSO_HOSTNAME   e.g. kickstart-sso.example.com -> http://keycloak:8080
#   TUNNEL_NAME    optional, default bff-kickstart

set -euo pipefail
: "${CF_API_TOKEN:?}" "${ZONE_NAME:?}" "${APP_HOSTNAME:?}" "${SSO_HOSTNAME:?}"
TUNNEL_NAME="${TUNNEL_NAME:-bff-kickstart}"

api() { # method path [json-body]
  local method=$1 path=$2 body=${3:-}
  curl -sS -X "$method" "https://api.cloudflare.com/client/v4$path" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    ${body:+--data "$body"}
}

jqpy() { python3 -c "import json,sys; r=json.load(sys.stdin); $1"; }

echo "Looking up zone $ZONE_NAME..." >&2
ZONE_JSON=$(api GET "/zones?name=$ZONE_NAME")
ZONE_ID=$(echo "$ZONE_JSON" | jqpy "assert r['success'] and r['result'], r; print(r['result'][0]['id'])")
ACCOUNT_ID=$(echo "$ZONE_JSON" | jqpy "print(r['result'][0]['account']['id'])")
echo "zone=$ZONE_ID account=$ACCOUNT_ID" >&2

echo "Finding or creating tunnel '$TUNNEL_NAME'..." >&2
TUNNEL_ID=$(api GET "/accounts/$ACCOUNT_ID/cfd_tunnel?is_deleted=false&name=$TUNNEL_NAME" \
  | jqpy "print(r['result'][0]['id'] if r.get('result') else '')")
if [ -z "$TUNNEL_ID" ]; then
  TUNNEL_ID=$(api POST "/accounts/$ACCOUNT_ID/cfd_tunnel" \
    "{\"name\":\"$TUNNEL_NAME\",\"config_src\":\"cloudflare\"}" \
    | jqpy "assert r['success'], r; print(r['result']['id'])")
  echo "created tunnel $TUNNEL_ID" >&2
else
  echo "reusing tunnel $TUNNEL_ID" >&2
fi

echo "Writing ingress config..." >&2
api PUT "/accounts/$ACCOUNT_ID/cfd_tunnel/$TUNNEL_ID/configurations" "{
  \"config\": { \"ingress\": [
    {\"hostname\": \"$APP_HOSTNAME\", \"service\": \"http://frontend:80\"},
    {\"hostname\": \"$SSO_HOSTNAME\", \"service\": \"http://keycloak:8080\"},
    {\"service\": \"http_status:404\"}
  ]}}" | jqpy "assert r['success'], r; print('ingress ok', file=sys.stderr)"

ensure_cname() { # hostname
  local host=$1 target="$TUNNEL_ID.cfargotunnel.com"
  local existing
  existing=$(api GET "/zones/$ZONE_ID/dns_records?type=CNAME&name=$host" \
    | jqpy "print(r['result'][0]['id'] if r.get('result') else '')")
  local body="{\"type\":\"CNAME\",\"name\":\"$host\",\"content\":\"$target\",\"proxied\":true,\"comment\":\"managed by bff-kickstart deploy\"}"
  if [ -n "$existing" ]; then
    api PUT "/zones/$ZONE_ID/dns_records/$existing" "$body" \
      | jqpy "assert r['success'], r; print('dns updated: $host', file=sys.stderr)"
  else
    api POST "/zones/$ZONE_ID/dns_records" "$body" \
      | jqpy "assert r['success'], r; print('dns created: $host', file=sys.stderr)"
  fi
}
ensure_cname "$APP_HOSTNAME"
ensure_cname "$SSO_HOSTNAME"

TOKEN=$(api GET "/accounts/$ACCOUNT_ID/cfd_tunnel/$TUNNEL_ID/token" \
  | jqpy "assert r['success'], r; print(r['result'])")
echo "TUNNEL_TOKEN=$TOKEN"
