# One-and-done prompt: generate this kickstart from scratch

The prompt below, given to a capable AI coding agent, produces a starter equivalent to this
repository. It is also the honest spec of what this template is.

---

Build a production-shaped full-stack starter called **BFF Kickstart**: a template teams clone
to start internal business apps where the browser never handles an OAuth token. Optimize every
decision for "a mid-level developer clones this and ships a feature on day one." Comment the
non-obvious choices in the code itself, including the failure that motivated them.

## Architecture (non-negotiable)

- **Backend-for-frontend pattern.** React SPA + Spring Boot backend + Keycloak OIDC. The
  backend is an OAuth2 Client (`oauth2Login`): it performs the authorization-code flow
  server-side, stores tokens in `OAuth2AuthorizedClientService`, and gives the browser exactly
  one httpOnly session cookie. No token ever reaches JavaScript-readable storage.
- **Single origin via proxy.** The SPA and API share one browser origin. Vite's dev server and
  an nginx container implement the same rewrite table: app-path requests
  (`/<app>/api`, `/oauth2`, `/login`, `/logout`, Swagger paths) are rewritten onto the
  backend's own context path, adding `X-Forwarded-Prefix`; Spring's framework
  forward-headers strategy makes generated redirect URIs correct from the browser's point of
  view. The backend publishes no port in the compose production topology. Provide
  `vite preview` proxying too, so a no-Docker production-style run exists.
- **One `SecurityFilterChain`, two doors.** Session-cookie auth always on; an opt-in OAuth2
  Resource Server (`API_EXPOSED` env flag) accepts `Authorization: Bearer` JWTs for
  machine clients. Both doors read roles from Keycloak's `resource_access.<client>.roles`
  claim through one shared converter, so each endpoint's `@PreAuthorize` is written once.
- **CSRF done right for cookie auth.** `CookieCsrfTokenRepository` (httpOnly=false, cookie
  path `/` so sibling paths both see it), BREACH-safe deferred tokens, a small filter that
  forces the cookie onto responses, axios mirroring cookie→header. Exempt Bearer calls by
  matching the `"Bearer "` scheme prefix specifically — never mere Authorization-header
  presence, which is a session-CSRF bypass.
- **Session lifecycle, three mechanisms.** (1) Client idle countdown with a centered warning
  dialog, env-tunable seconds, real RP-initiated logout at zero. (2) Keycloak backchannel
  logout wired through `OidcSessionRegistry` with a handler that carries the app's renamed
  session cookie. (3) Pull verification: every `/api/v1/me` call re-checks the token against
  Keycloak via RFC 7662 introspection, failing open on transient errors. A 401 anywhere flips
  client auth state immediately via an axios interceptor (single toast, no stale pages).

## Stack

Frontend: React 19, Vite, TypeScript strict, TanStack Query (all fetching via per-feature
hooks), HeroUI, Tailwind, react-hook-form + zod schemas mirroring server validation, axios,
oxlint. Feature-module layout (`src/features/<name>/{components,hooks,api,types}`), shared
`DataTable` with sorting/pagination (page size 10), route table driving nav automatically.

Backend: Spring Boot 3.5 (Java 17+; toolchain and Docker images pinned to 17 so the floor is real), Hibernate/JPA, Flyway, H2 in-memory in Oracle
compatibility mode, OpenPDF for PDF reports, Apache Commons CSV, springdoc-openapi, Lombok
(declared in `annotationProcessorPaths` — JDK 23+ silently disables classpath processors).
Packages plural by layer: `controllers`, `services`, `repositories`, `models`, `dtos`,
`configurations`, `exceptions`, `utilities`, `security`. A second read-only "reporting"
datasource with its own EntityManagerFactory/Flyway to demonstrate the two-datasource pattern.

Identity: Keycloak with a fully scripted local stand-in — realm export auto-imported (client
roles Viewer/Inspector/Data Manager/Admin, plus API Developer and a composite API Owner; demo
users, one per role), custom login/account/email theme, a registration SPI, all baked into a
Dockerfile AND runnable natively via a bootstrap script that downloads the Keycloak
distribution. `/etc/hosts` alias (`127.0.0.1 keycloak`) so container and native runs share
one hostname and zero config changes.

## Demo domain

An inspection-and-reporting system for gizmo-manufacturing organizations: Facilities (with
optional latitude/longitude plus full Geolocation-capture metadata and a DEVICE/MANUAL source
flag), Permits, Inspections (with file/photo attachments stored as BLOBs, camera-capture
input on mobile), a read-only DailyReports warehouse view, CSV import/export per resource
(Data Manager role), and a compliance report as JSON/CSV/PDF. Seed enough demo rows that
pagination actually paginates (12+ facilities, 16+ permits/inspections).

## Product finish

- Swagger UI gated behind login + an "API Developer" role, served through the same proxy,
  reskinned via a `SwaggerIndexTransformer` (branding in resource files, not Java strings),
  with each operation's required roles surfaced from its own `@PreAuthorize` by an
  `OperationCustomizer` so docs cannot drift from enforcement.
- Installable PWA: manifest + icons (incl. maskable) + a service worker that precaches static
  assets only and denylists every backend path from its SPA fallback.
- Responsive app shell: collapsing nav below desktop widths, no-wrap wordmark, a footer
  showing "Application Version" from package.json via a Vite define.
- Every timing knob in env with documented defaults: server session timeout, client idle
  timeout, warning lead, auth re-check interval; frontend ones as Vite build args threaded
  through compose.
- Uniform JSON error shape from a `GlobalExceptionHandler` AND from the security layer's
  401/403 handlers, with field errors mapped back onto forms.
- Docker Compose (app-named project, healthchecks, named volumes) and a fully native path,
  documented as equals. Mailhog/Mailpit for SMTP demo with an HTML template email.
- Three brief READMEs (root, backend, frontend) that get someone to a running, signed-in app
  with no Docker and no local Keycloak (env-pointed at a shared instance), linking to deeper
  guides in `docs/`: a full reference, a frontend guide, an "adding a secure feature"
  walkthrough, and a threat-model-grade auth reference.
- A `kickstart.sh` that interactively renames the app: slug, display name, Java package,
  realm — every path, config default, and identity string.
- License: CC0. No attribution required, anywhere, ever.

## Working style

Verify everything live before calling it done: run the stack, log in as each role, exercise
CRUD, exports, Swagger, the timeout dialog, pagination, and the proxy paths. When a bug
surfaces (a CSRF bypass, a cookie path, an nginx redirect dropping the port), fix it and
leave a comment at the site explaining what broke and why the fix is shaped the way it is —
those comments are the template's real documentation.

---

*Provenance note: this repository was in fact built roughly this way — iteratively, with an
AI pair, each piece verified against the running stack before being kept.*
