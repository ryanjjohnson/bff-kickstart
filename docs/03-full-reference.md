# Full reference - auth architecture

*For whoever owns this app's security posture, or is extending the auth setup itself (not just
building a feature on top of it - see [02](02-adding-a-secure-feature.md) for that). This doc
assumes you've read the [Security architecture](full-guide.md#security-architecture) section of
the root README and the [Security](frontend-guide.md#security) / [How the BFF pattern
works](frontend-guide.md#how-the-bff-pattern-works) sections of the frontend README - it
doesn't repeat that material, it builds on it.*

## Map of where everything actually lives

| Topic | Where |
|---|---|
| Dual auth mechanisms in one `SecurityFilterChain` (session BFF + optional Bearer resource server) | `README.md` → [Security architecture](full-guide.md#security-architecture) |
| Role mapping, shared by both mechanisms (`KeycloakRealmRoleConverter`) | `README.md` → [Role mapping](full-guide.md#role-mapping---shared-by-both-mechanisms) |
| CSRF, and why Bearer requests are exempt | `README.md` → [CSRF](full-guide.md#csrf) |
| `API_EXPOSED` / `SWAGGER_ENABLED` flags | `README.md` → [Configuration](full-guide.md#configuration) |
| Calling the API as a machine client (`client_credentials`) | `README.md` → [Try it](full-guide.md#try-it-calling-the-api-as-a-machine-client) |
| Session timeout tuning, back-channel logout | `README.md` → [Session lifecycle](full-guide.md#session-lifecycle) |
| The sign-in redirect chain, end to end | `docs/frontend-guide.md` → [How the BFF pattern works](frontend-guide.md#how-the-bff-pattern-works) |
| The two independent "are you still logged in" layers (back-channel push + introspection pull) | `docs/frontend-guide.md`, same section, "Staying signed out when Keycloak says so" |
| Session-timeout UI (idle detection, countdown modal) | `docs/frontend-guide.md` → [Session timeout](frontend-guide.md#session-timeout) |
| Backend proxying / path rewriting (`X-Forwarded-Prefix`) | `docs/frontend-guide.md` → [Backend proxying](frontend-guide.md#backend-proxying) |

Everything below is what isn't already covered by those.

## Local stand-in vs. the real gizmoshop SSO

This app authenticates against **gizmoshop SSO**, gizmoshop's centrally-run identity service
(`https://sso.gizmoshop.example/gizmoshop-auth` in dev/test, a Keycloak instance under the
`/gizmoshop-auth` context root) - an identity/platform team owns that realm, its clients, and its
users, the same way you wouldn't expect an app team to run its own Active Directory. Nothing in
this repo talks to that real instance, and nothing here should - see the root README's
[Identity provider: gizmoshop SSO](full-guide.md#identity-provider-gizmoshop-sso) section for the
practical summary; this section is the detail behind it.

What actually lives in this repo is a **local stand-in**: `docker-compose.yml`'s `keycloak`
service, `keycloak/realm-export/gizmoshop-realm.json`, and (see below) a gizmoshop-branded theme
and a custom registration provider baked into a custom Keycloak image. It exists purely so the
full sign-in flow - login, roles, claims, back-channel logout, all of it - can be developed and
tested end-to-end on a laptop with zero dependency on network access or real gizmoshop
credentials. It is built to resemble gizmoshop SSO's realm shape closely enough that code written
and tested against it behaves the same way against the real thing, but it is a separate,
disposable Keycloak instance that only you can see, not a copy of or a connection to gizmoshop
SSO.

**What carries over when this app is pointed at the real gizmoshop SSO instead** (by setting
`KEYCLOAK_*_URI`/`KEYCLOAK_CLIENT_ID`/`KEYCLOAK_CLIENT_SECRET` - already parameterized in
`docker-compose.yml`'s `backend` service and `application.properties` - to values your
identity/platform team gives you): the entire
BFF pattern, the role-mapping pipeline, CSRF, session lifecycle, back-channel logout, introspection
- none of that is local-stand-in-specific, it's all standard OIDC/Keycloak client behavior that
works identically against any correctly-configured realm.

**What doesn't carry over - local-stand-in-only concerns:**

- The `/etc/hosts` entry and `keycloak:8080` addressing (root README's
  [One-time host setup](full-guide.md#one-time-host-setup-local-dev-only)) - the real gizmoshop SSO
  is just reached over the network like any other gizmoshop application, no hosts-file entry
  needed.
- Editing `keycloak/realm-export/gizmoshop-realm.json` directly, or the admin console at
  `keycloak:8080/admin` - against the real gizmoshop SSO, adding a role, a client, or a user goes
  through whatever process your identity/platform team has for the shared realm; this repo has no
  visibility into or control over that realm at all.
- The custom theme and registration SPI, described next - these are a *reference implementation*
  of what gizmoshop SSO's platform team might run centrally (a branded login/registration
  experience), not something this app's own developers build, deploy, or maintain against the
  real instance.

### The local stand-in's theme + registration SPI

Two additions live under `keycloak/`, baked into the local stand-in's custom image
(`keycloak/Dockerfile`, which extends `quay.io/keycloak/keycloak:26.7.3`):

```
keycloak/
  themes/gizmoshop/                   - login/registration, account console skin, email - see themes/gizmoshop/*/theme.properties
  providers/bff-registration-spi/     - Java SPI: system username generation during registration
```

The local realm (`registrationAllowed: true`, `registrationFlow: "BFF registration"`) shows a
"Register" link on the login page. Self-registered users against the local stand-in:

- **Never choose a username.** `bff-registration-user-creation` (a custom Keycloak `FormAction`,
  replacing the built-in `registration-user-creation` step) generates one server-side as
  `lastname_fm_#` (lowercased last name, first + middle initials, next free sequence number),
  stored both as the account username and as a `gizmo_username` attribute. See
  `keycloak/providers/bff-registration-spi/src/.../BffRegistrationUserCreation.java`'s class
  comment for the exact rule.
- **Fill in mailing address, phone, and a security question/answer** (stored as a SHA-256 hash,
  never plaintext) - declared in the realm's User Profile config
  (`keycloak/realm-export/gizmoshop-realm.json`'s
  `components.org.keycloak.userprofile.UserProfileProvider`), which is also what drives the
  auto-rendered registration form (stock `register.ftl`, no template changes needed for these
  fields). The address/phone attribute names (`addressLine1`, `addressLine2`, `telephone`) were
  chosen to match the ones `bff-kickstart-client`'s existing protocol mappers and `MeController`
  already read - not the `address1`/`address2`/`phone` names the SPI originally used standalone.
- **Get no `bff-kickstart-client` roles by default.** Registration and role-provisioning are
  deliberately separate here, the same as this app's own admin-provisioned demo users - a
  self-registered user can sign in but sees an empty, no-access app shell until an admin grants
  them a role in the local stand-in's admin console. Least-privilege by default, not a gap to fix.
- **Verify their email first** (`verifyEmail: true`, sent through this app's own Mailhog, styled
  by `themes/gizmoshop/email`) - Keycloak defers the password step until after that link is
  clicked.

A disabled Active Directory federation stub (`gizmoshop-ad`, `editMode: READ_ONLY`) also ships in
the local realm export, inert until you fill in real connection details and enable it in the local
stand-in's admin console.

**Rebuilding the local stand-in after a theme or SPI change:**

```bash
mvn -f keycloak/providers/bff-registration-spi/pom.xml clean package
docker compose up -d --build keycloak
```

**Rebuilding after a local realm-export change** (anything under `keycloak/realm-export/`) needs a
full reimport, not just a restart - Keycloak's `--import-realm` only reads that file the first
time against an empty Postgres volume; see [Changing the realm export after first
boot](#changing-the-realm-export-after-first-boot) below.

**Not done by `kickstart.sh`:** the bootstrap script (see the root README's [Adding a new
feature](full-guide.md#adding-a-new-feature) and `kickstart.sh` itself) rebrands the main app's
package, docker/URL slugs, and realm name, but does not currently rewrite the theme's own
`com.example.keycloak` Java package, its `bff-registration-spi` artifact id, or the "gizmoshop"/
"BFF Kickstart" strings baked into the theme's CSS/images/templates - a generated app keeps this
theme and SPI exactly as branded as they are here until someone rebrands them by hand.

## Threat model

What this architecture defends against, specifically:

- **Token exfiltration via XSS.** There is no access token, ID token, or refresh token reachable
  from `document.cookie`, `localStorage`, or `sessionStorage` - verified directly: after a real
  login, `localStorage` and `sessionStorage` are both `{}`, and the only cookie visible to
  `document.cookie` is `XSRF-TOKEN` (not secret by design - see CSRF below). The session cookie
  itself (`DEPKICKSTARTSESSION`) is `HttpOnly`, invisible to any JavaScript running on the page,
  malicious or not.
- **Long-lived stolen credentials.** Even if a session cookie were somehow exfiltrated (e.g. a
  compromised machine, not an XSS bug - `HttpOnly` doesn't help there), it's bounded by the
  5-minute idle timeout and by `MeController`'s introspection check, which asks Keycloak directly
  whether the underlying token is still active on every `/api/v1/me` call - an admin revoking the
  user in Keycloak ends the session on the *next* request, not whenever a JWT's own `exp` claim
  happens to elapse.
- **Session fixation.** Spring Security's default `ChangeSessionIdAuthenticationStrategy` issues a
  fresh session ID on every successful login (visible in the security debug log as "Changed
  session id from ...") - an attacker who fixes a pre-auth session ID gains nothing once the
  victim actually authenticates.

What it explicitly does **not** defend against, because no BFF pattern can:

- **A backend RCE or SSRF.** The backend itself holds real tokens and can act as the user for as
  long as their token is valid - compromising the backend process is equivalent to compromising
  every active session. This is the trade-off inherent to "the backend is the trust boundary" -
  it concentrates risk there instead of eliminating it, which is the right trade only because a
  server-side codebase is far easier to keep patched and monitored than "every dependency in every
  browser session."
- **A malicious browser extension** with full page access can still act as the logged-in user for
  the life of the session (submit forms, read responses) - it just can't extract a portable
  credential to reuse later, from a different machine, after the session ends.
- **Phishing of the Keycloak login page itself.** BFF changes *where* tokens live, not how the
  user proves who they are to Keycloak - that's Keycloak/realm configuration (MFA, WebAuthn, etc.),
  entirely orthogonal to this app.
- **CSRF, on its own** - that's what the `X-XSRF-TOKEN` mechanism is for (see the root README's
  [CSRF](full-guide.md#csrf) section), a separate control layered on top, not a side effect of BFF.

## Case studies: real incidents this app already had

### Audience mapper missing after a Keycloak version bump

This happened against the **local gizmoshop SSO stand-in** (see [above](#local-stand-in-vs-the-real-gizmoshop-sso))
while bumping its Keycloak version - it's included here because the underlying lesson applies
equally to the real gizmoshop SSO, not because of anything specific to the local instance. Worth keeping
as a concrete lesson, not hypothetical: after bumping this app's Keycloak version,
every other health signal looked fine - Keycloak started healthy, the realm imported without
error, the full OAuth2 authorization-code exchange completed successfully (a valid session cookie
came back, no error anywhere in the logs) - and yet `/api/v1/me` reported `authenticated: false`
immediately afterward, on every single login.

Root cause: `keycloak/realm-export/gizmoshop-realm.json`'s client had never had an **audience
mapper** configured, so its access tokens' `aud` claim never included the client itself (Keycloak
defaults new access tokens to `aud: ["account"]` only). `MeController`'s introspection check (see
[Threat model](#threat-model) above) calls Keycloak's `/token/introspect` endpoint as this same
client, and Keycloak's introspection endpoint requires the *introspecting* client to appear in the
token's own audience - so it correctly, silently returned `active: false` for a token that was, in
every other respect, completely valid. The fix was one `oidc-audience-mapper` protocol mapper on
the client:

```json
{
  "name": "audience-self",
  "protocol": "openid-connect",
  "protocolMapper": "oidc-audience-mapper",
  "consentRequired": false,
  "config": {
    "included.client.audience": "bff-kickstart-client",
    "id.token.claim": "false",
    "access.token.claim": "true"
  }
}
```

The lesson generalizes: **"login succeeds" and "the session Keycloak gave you actually stays
authenticated on the next request" are two different claims, and only the second one is the one
that matters.** A health check, a successful redirect chain, or a 200 from the token endpoint can
all look perfect while this specific failure mode is present, because none of them exercise
introspection. If you ever change Keycloak version, realm config, or client config, the
regression test that actually catches this class of bug is: log in, then call `/api/v1/me` (or
whatever your own equivalent is) a second time, in a second request - not just "did the redirect
chain complete."

### CSRF bypass via a non-Bearer `Authorization` header

Found during a security review of `SecurityConfig`, not reported by anyone - worth keeping for the
same reason as the incident above: it passed every test that wasn't specifically designed to catch
it. The `API_EXPOSED=true` opt-in exempts genuine Bearer-token API calls from CSRF (a Bearer token
can't be silently attached to a request the way a cookie can, so there's nothing CSRF is meant to
guard against there). The original check was:

```java
csrf.ignoringRequestMatchers(request -> request.getHeader("Authorization") != null);
```

This checks only for the header's *presence*, not that it's actually a Bearer-scheme attempt. A
request carrying a valid session cookie *plus* an `Authorization: Basic anything` header (the value
is never validated - `Basic anything` works exactly as well as a real one) skipped CSRF entirely,
and since `BearerTokenAuthenticationFilter` only engages for a `Bearer ` prefix and silently
no-ops otherwise, the request fell through to session-cookie authentication anyway - a confirmed
CSRF bypass on every mutating endpoint once `API_EXPOSED=true`. Confirmed with `curl`: the exact
same request with a genuine `Authorization: Bearer <garbage>` correctly 401s (`BearerTokenAuthenticationFilter`
rejects a malformed token outright, rather than falling back to the session), but swap the scheme
to anything else and it silently succeeds via the cookie, with no CSRF token presented at all.

Fixed by checking for the `Bearer ` prefix specifically:

```java
csrf.ignoringRequestMatchers(request -> {
    String header = request.getHeader("Authorization");
    return header != null && header.regionMatches(true, 0, "Bearer ", 0, 7);
});
```

In the current default configuration this was masked by two independent, coincidental defenses -
the session cookie's `SameSite=Lax` (blocks the classic cross-site fetch/XHR CSRF vector outright)
and locked-down CORS (blocks a cross-origin `fetch` from ever attaching a custom `Authorization`
header in the first place, since that triggers a preflight the origin wouldn't pass). Neither of
those is what CSRF protection is supposed to be doing the work of - if either one is ever loosened
for an unrelated reason, this exact bug becomes directly exploitable again. The generalizable
lesson: a CSRF-exemption predicate should positively identify the mechanism it's meant to exempt
(the Bearer scheme, here), never just the *absence* of what it's guarding against.

## Changing the realm export after first boot

*Local gizmoshop SSO stand-in only - the real gizmoshop SSO's realm isn't provisioned from a file in this
repo; see [Local stand-in vs. the real gizmoshop SSO](#local-stand-in-vs-the-real-gizmoshop-sso) above.*

`keycloak/realm-export/gizmoshop-realm.json` is only read by Keycloak's `--import-realm` flag at
its *first* startup against an empty Postgres volume - editing the file and restarting the
`keycloak` container does **not** re-apply it. Two ways to actually apply a change, in order of
preference:

**For local dev, a small change: use Keycloak's Admin REST API directly**, no data loss. This is
how the audience-mapper fix above was actually applied and verified without wiping local demo
data:

```bash
ADMIN_TOKEN=$(curl -s -X POST "http://keycloak:8080/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" -d "username=admin" -d "password=admin" -d "grant_type=password" \
  | jq -r .access_token)

CLIENT_UUID=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://keycloak:8080/admin/realms/gizmoshop/clients?clientId=bff-kickstart-client" \
  | jq -r '.[0].id')

curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  "http://keycloak:8080/admin/realms/gizmoshop/clients/$CLIENT_UUID/protocol-mappers/models" \
  -d @your-new-mapper.json
```

Remember to make the equivalent edit in the realm-export JSON file too, even after doing this -
otherwise the fix only lives in your local Keycloak's Postgres volume and every fresh clone (or
`kickstart.sh`-generated app) regresses right back to the bug.

**For a bigger change, or to confirm the export file itself is correct**: wipe the dev Keycloak
data and let it reimport from scratch (fully reversible - this is disposable dev/demo data, not
anything worth preserving):

```bash
docker compose stop keycloak postgres-keycloak
docker compose rm -f keycloak postgres-keycloak
docker volume rm bff-kickstart_postgres_keycloak_data
docker compose up -d
```

## Extending the auth setup

**Adding a second Bearer/machine-to-machine client:** against the **local stand-in**, alongside
the existing `bff-kickstart-service-client` demo, add another `clientId` to the realm export with
`serviceAccountsEnabled: true` and `publicClient: false`, grant it whatever client roles it needs
(same `resource_access.bff-kickstart-client.roles` shape the rest of this app already reads - a
service account's roles are still granted *on* `bff-kickstart-client`, not on the new client
itself, since that's the client whose roles `KeycloakRealmRoleConverter` and every
`@PreAuthorize` check actually look at). Against the **real gizmoshop SSO**, request the new client from
your identity/platform team the same way this app's own client was provisioned there - there's
nothing to add on this app's side either way; `SecurityConfig`'s `oauth2ResourceServer` accepts
any JWT that validates against the shared JWK set, regardless of which client obtained it.

**Rotating the client secret:** against the **local stand-in**, change it in both the realm
export's client `secret` field and `.env`, then restart the backend and reimport (or `PUT` the
client via the Admin API, same pattern as [above](#changing-the-realm-export-after-first-boot)) -
there's no secondary place it's cached. A secret checked into `.env.example` (the current demo
default, `bff-kickstart-secret`) is fine for local dev and must never be reused anywhere a real
credential matters. Against the **real gizmoshop SSO**, secret rotation is coordinated with your
identity/platform team - update `KEYCLOAK_CLIENT_SECRET` in that environment's own config once
they've rotated it on their end, in the same change.

**Adding a role** - see [02's Step 2](02-adding-a-secure-feature.md#step-2---does-this-need-a-new-role)
for the mechanics; the one thing worth restating here is that it must be a *client* role on
`bff-kickstart-client`, not a realm role, or the whole `resource_access`-based mapping pipeline
never sees it - true whether the role is added to the local stand-in or requested from the real
gizmoshop SSO.

**Adding a "does everything" super-role, the way `API Owner` does it:** rather than teaching every
controller's `@PreAuthorize` about a new role, mark the role composite in the realm export and list
the roles it should expand to:

```json
{
  "name": "API Owner",
  "description": "...",
  "composite": true,
  "composites": {
    "client": {
      "bff-kickstart-client": ["Admin", "Inspector", "Viewer", "Data Manager", "API Developer"]
    }
  }
}
```

Keycloak expands this **at token-issuance time**: a user granted only `API Owner` gets all five
listed roles in their token's `resource_access.bff-kickstart-client.roles` claim, indistinguishably
from a user who was directly granted each one. Verified empirically against a running local
instance before writing this into the realm export - create the composite via the Admin REST API
(`POST .../roles/{role}/composites` with an array of role reps), issue a password-grant token for a
test user holding only the composite role, and decode the JWT's `resource_access` claim to confirm
the expansion actually happened, rather than assuming the schema from Keycloak's docs. This is also
why adding a *new* plain role later and wanting `API Owner` to imply it too is a one-line realm
export change (append to the `composites` array) and not a Java change - the composite, not any
`@PreAuthorize`, is the single place that relationship is declared.

## Production hardening checklist

This app ships configured for local development and demos. Before any real deployment, split this
into what you actually own:

**Identity-side settings - not yours to harden if you're using the real gizmoshop SSO.** These only
apply if you (or your platform team) are the ones operating the Keycloak instance itself, which
for a normal deployment of this app you are not - you'd instead confirm with your identity/platform
team that *their* instance is configured this way, and just plug in the resulting
`KEYCLOAK_*_URI`/`KEYCLOAK_CLIENT_ID`/`KEYCLOAK_CLIENT_SECRET` values:

- A single, strict, correct hostname (`KC_HOSTNAME_STRICT: true`, unlike the local stand-in's
  `false`, which exists only for the reach-it-two-different-ways local setup - browser via
  `/etc/hosts`, containers via Docker DNS).
- Every demo secret rotated - `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ADMIN_PASSWORD`, every demo
  user's `password` password - none of these are meant to survive contact with a real environment.
- Real SMTP settings (the local stand-in's realm SMTP block points at Mailhog) - otherwise things
  like "Forgot Password" emails go nowhere.

**This app's own settings - yours regardless of which gizmoshop SSO instance you point at:**

- **`server.servlet.session.cookie.secure`** isn't set (defaults to `false`, fine over plain HTTP
  locally) - set it `true` behind real TLS, or the session cookie is sent in the clear.
- **The app's own database is in-memory H2** (`db.kickstart-tx.jdbc-url` /
  `db.kickstart-rpt.jdbc-url` in `application.properties`) - everything the app stores is gone on
  every backend restart. This is deliberate for a kickstart/demo, but is the single most important
  thing to replace before anything resembling production use - this is independent of, and not
  fixed by, pointing at the real gizmoshop SSO for identity.
- **`APP_CORS_ALLOWED_ORIGINS`** defaults to `localhost` origins only (`docker-compose.yml`) -
  narrow this to the real deployed origin(s); a wide-open CORS policy combined with
  `allowCredentials(true)` (set in `SecurityConfig#corsConfigurationSource`) is a meaningful
  cross-origin risk if ever loosened to a wildcard.
- **`SWAGGER_ENABLED`** must stay `false` on anything internet- or intranet-reachable beyond a
  trusted dev network - it's un-authenticated by design (see the root README's
  [Configuration](full-guide.md#configuration) security note) and publishes your full API shape.
- **`API_EXPOSED`** - only turn on if something actually needs the Bearer/machine-client path;
  it's an additional attack surface (the JWK-set-validated Bearer path) that a pure-browser
  deployment doesn't need at all.

## Testing the security config

The fastest manual check for a `@PreAuthorize` change, without touching the UI at all: sign in
once through the browser to get a session cookie, then replay a request with a different
role's session (or use the machine-client `curl` recipe in the root README's [Try
it](full-guide.md#try-it-calling-the-api-as-a-machine-client) section, which is the easiest way to
get a token for a specific, fixed role without juggling multiple browser sessions/cookie jars).

For an automated test, `@WithMockUser(roles = "Viewer")` (Spring Security Test) on a
`@WebMvcTest` is the standard, fast way to assert a `@PreAuthorize` rule without spinning up
Keycloak at all - it substitutes a fake `Authentication` with exactly the authorities you specify,
which is sufficient since every `@PreAuthorize` check in this app only ever looks at `ROLE_*`
authorities, never at anything else on the principal.
