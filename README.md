# BFF Kickstart

A full-stack starter where the browser never touches a token: React SPA + Spring Boot
backend-for-frontend + Keycloak OIDC. Session cookie in the browser, OAuth2 machinery on the
server, role-gated REST API, CSV/PDF reports, installable as a PWA.

**Stack:** React 19 · Vite · TanStack Query · HeroUI · Tailwind — Spring Boot 3.5 · Hibernate ·
Flyway · H2 (dev) — Keycloak.

## Fastest start (no Docker, no local Keycloak)

You need Java 21+, Node 20+, Maven, and the Keycloak connection details someone gave you
(issuer URL, client id, client secret). Your client config must allow the redirect URI
`http://localhost:5173/bff-kickstart/login/oauth2/code/keycloak` — if login bounces, that's why.

**1. Backend** — point it at the shared Keycloak and run it:

```bash
cd backend
export KEYCLOAK_ISSUER_URI=https://sso.example.com/realms/YOUR_REALM
export KEYCLOAK_AUTH_URI=$KEYCLOAK_ISSUER_URI/protocol/openid-connect/auth
export KEYCLOAK_TOKEN_URI=$KEYCLOAK_ISSUER_URI/protocol/openid-connect/token
export KEYCLOAK_JWK_SET_URI=$KEYCLOAK_ISSUER_URI/protocol/openid-connect/certs
export KEYCLOAK_USER_INFO_URI=$KEYCLOAK_ISSUER_URI/protocol/openid-connect/userinfo
export KEYCLOAK_INTROSPECT_URI=$KEYCLOAK_ISSUER_URI/protocol/openid-connect/token/introspect
export KEYCLOAK_CLIENT_ID=your-client-id
export KEYCLOAK_CLIENT_SECRET=your-client-secret
mvn spring-boot:run
```

**2. Frontend** — in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

**3.** Open http://localhost:5173/bff-kickstart/ and sign in. Done.

The database is in-memory H2 — schema and demo data appear on startup, vanish on shutdown,
nothing to install. Sending email needs an SMTP server on `mailhog:1025` (optional:
`brew install mailpit && mailpit`, plus `127.0.0.1 mailhog` in /etc/hosts, or just
`export SMTP_HOST=localhost`). Everything else just works.

## Going deeper

| Where | What |
|---|---|
| [backend/README.md](backend/README.md) | Backend quick orientation |
| [frontend/README.md](frontend/README.md) | Frontend quick orientation |
| [docs/full-guide.md](docs/full-guide.md) | The whole story: Docker Compose setup, local Keycloak stand-in, security architecture, roles, Swagger, reports, PWA, why each technology was chosen |
| [docs/frontend-guide.md](docs/frontend-guide.md) | Frontend deep dive: feature modules, validation, security wiring, proxying |
| [docs/](docs/README.md) | Auth-focused docs by depth, plus an architecture slide deck |

Want the full local stack (own Keycloak, nginx, mail catcher)? `docker compose up -d --build`
after the one-time setup in [docs/full-guide.md](docs/full-guide.md) — or run every piece
natively, also covered there.

## License

[CC0 1.0](LICENSE) — public domain. Take it, rebrand it, ship it.
