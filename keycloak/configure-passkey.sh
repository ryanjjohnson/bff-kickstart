#!/usr/bin/env bash
# Adds biometric passkey login (WebAuthn passwordless, as an ALTERNATIVE to
# password) to an ALREADY-RUNNING Keycloak whose realm was imported before this
# feature existed. Fresh deploys get it from realm-export/gizmoshop-realm.json
# automatically; this script is for retrofitting a live realm (which Keycloak
# won't re-import over). Idempotent: re-running rebuilds the flow cleanly.
#
# Builds:
#   browser-passkey
#     Cookie [ALTERNATIVE]
#     Identity Provider Redirector [ALTERNATIVE]
#     browser-passkey forms (subflow) [ALTERNATIVE]
#       Username Password Form [ALTERNATIVE]
#       WebAuthn Passwordless   [ALTERNATIVE]
# ...binds it as the realm browserFlow, and sets the passwordless WebAuthn
# policy for device biometrics (resident key + user verification required).
# The "Webauthn Register Passwordless" required action must be enabled (it is by
# default) so users can self-enrol a passkey from the account console.
#
# Usage:
#   KC=https://kickstart-sso.example ADMIN_USER=admin ADMIN_PASS=... \
#   REALM=gizmoshop ./keycloak/configure-passkey.sh
set -euo pipefail
KC="${KC:-http://localhost:8080}"; REALM="${REALM:-gizmoshop}"
ADMIN_USER="${ADMIN_USER:-admin}"; ADMIN_PASS="${ADMIN_PASS:-admin}"
TOKEN=$(curl -s -d client_id=admin-cli -d "username=$ADMIN_USER" -d "password=$ADMIN_PASS" -d grant_type=password \
  "$KC/realms/master/protocol/openid-connect/token" | python3 -c 'import json,sys;print(json.load(sys.stdin)["access_token"])')
AH=(-H "Authorization: Bearer $TOKEN")
JH=(-H "Content-Type: application/json")
B="$KC/admin/realms/$REALM"
export TOKEN B REALM

# --- idempotency: if browser-passkey exists, rebind default browser then delete it ---
existing=$(curl -s "${AH[@]}" "$B/authentication/flows" | python3 -c 'import json,sys;print(next((f["id"] for f in json.load(sys.stdin) if f["alias"]=="browser-passkey"),""))')
if [ -n "$existing" ]; then
  echo "rebinding browser + deleting existing browser-passkey"
  curl -s "${AH[@]}" "${JH[@]}" -X PUT "$B" -d '{"realm":"'"$REALM"'","browserFlow":"browser"}' >/dev/null
  curl -s "${AH[@]}" -X DELETE "$B/authentication/flows/$existing" >/dev/null
fi

echo "== create top flow browser-passkey =="
curl -s "${AH[@]}" "${JH[@]}" -X POST "$B/authentication/flows" \
  -d '{"alias":"browser-passkey","description":"Browser flow with a passkey (WebAuthn passwordless) alternative to password","providerId":"basic-flow","topLevel":true,"builtIn":false}' -o /dev/null -w "  %{http_code}\n"

echo "== add Cookie + IdP redirector executions =="
curl -s "${AH[@]}" "${JH[@]}" -X POST "$B/authentication/flows/browser-passkey/executions/execution" -d '{"provider":"auth-cookie"}' -o /dev/null -w "  cookie %{http_code}\n"
curl -s "${AH[@]}" "${JH[@]}" -X POST "$B/authentication/flows/browser-passkey/executions/execution" -d '{"provider":"identity-provider-redirector"}' -o /dev/null -w "  idp %{http_code}\n"

echo "== add 'browser-passkey forms' subflow =="
curl -s "${AH[@]}" "${JH[@]}" -X POST "$B/authentication/flows/browser-passkey/executions/flow" \
  -d '{"alias":"browser-passkey forms","type":"basic-flow","description":"username+password OR passkey"}' -o /dev/null -w "  subflow %{http_code}\n"

echo "== add the two alternatives into the subflow =="
SUB="browser-passkey%20forms"
curl -s "${AH[@]}" "${JH[@]}" -X POST "$B/authentication/flows/$SUB/executions/execution" -d '{"provider":"auth-username-password-form"}' -o /dev/null -w "  userpass %{http_code}\n"
curl -s "${AH[@]}" "${JH[@]}" -X POST "$B/authentication/flows/$SUB/executions/execution" -d '{"provider":"webauthn-authenticator-passwordless"}' -o /dev/null -w "  webauthn %{http_code}\n"

echo "== set requirements (all ALTERNATIVE) =="
curl -s "${AH[@]}" "$B/authentication/flows/browser-passkey/executions" -o /tmp/passkey-execs.json
python3 - <<'PYEOF'
import json, os, subprocess
execs = json.load(open("/tmp/passkey-execs.json"))
tok = os.environ["TOKEN"]; B = os.environ["B"]
want = {"auth-cookie":"ALTERNATIVE","identity-provider-redirector":"ALTERNATIVE",
        "auth-username-password-form":"ALTERNATIVE","webauthn-authenticator-passwordless":"ALTERNATIVE"}
for e in execs:
    pid = e.get("providerId"); dn = e.get("displayName","")
    req = want.get(pid) or ("ALTERNATIVE" if dn == "browser-passkey forms" else None)
    if req and e.get("requirement") != req:
        e["requirement"] = req
        subprocess.run(["curl","-s","-H","Authorization: Bearer "+tok,"-H","Content-Type: application/json",
                        "-X","PUT",B+"/authentication/flows/browser-passkey/executions","-d",json.dumps(e)], check=True)
        print("  set", (pid or dn), "->", req)
PYEOF

echo "== bind browser-passkey as the realm browser flow + name the RP =="
curl -s "${AH[@]}" "${JH[@]}" -X PUT "$B" \
  -d '{"realm":"'"$REALM"'","browserFlow":"browser-passkey","webAuthnPolicyPasswordlessRpEntityName":"BFF Kickstart"}' -o /dev/null -w "  bind %{http_code}\n"

echo "== verify =="
curl -s "${AH[@]}" "$B" | python3 -c 'import json,sys;d=json.load(sys.stdin);print("  browserFlow:",d["browserFlow"]);print("  RP name:",d.get("webAuthnPolicyPasswordlessRpEntityName"))'
echo "  --- flow executions ---"
curl -s "${AH[@]}" "$B/authentication/flows/browser-passkey/executions" | python3 -c 'import json,sys;[print("   "+"    "*e.get("level",0)+(e.get("displayName") or e.get("providerId"))+" ["+e["requirement"]+"]") for e in json.load(sys.stdin)]'
