# Backend

Spring Boot 3.5 BFF: it holds the OAuth2 tokens, owns the session, enforces the roles, and
serves the REST API the SPA calls. The browser only ever sees a session cookie.

## Run it

```bash
export KEYCLOAK_ISSUER_URI=...   # plus the other KEYCLOAK_* vars - see the root README
mvn spring-boot:run              # http://localhost:8081, in-memory H2, migrations auto-apply
```

No Docker, no local database, no local Keycloak needed — just the connection details for the
shared one.

## Where things are

| Package | What lives there |
|---|---|
| `controllers` | REST endpoints (`/api/v1/...`), role checks via `@PreAuthorize` |
| `services` | Business logic, CSV import/export, PDF reports |
| `repositories` | Spring Data JPA |
| `models` | Entities and enums |
| `dtos` | Request/response shapes (Bean Validation lives on requests) |
| `configurations` | Security (start with `SecurityConfig` — it's heavily commented), datasources, Swagger |
| `exceptions` | `GlobalExceptionHandler` turns everything into one JSON error shape |

Database changes go in `src/main/resources/db/migration/` as the next `V<n>__*.sql` — Flyway
runs them on startup.

## The three-minute mental model

Login: SPA redirects to the backend's `/oauth2/authorization/keycloak`, backend does the whole
OIDC dance server-side, browser comes back with an httpOnly session cookie. Every API call
after: cookie → session → roles → `@PreAuthorize` → controller. Sessions die by idle timeout,
Keycloak backchannel logout, or the periodic introspection check in `MeController`.

Full detail (Swagger, machine clients via `API_EXPOSED`, CSRF, session timing knobs):
[../docs/full-guide.md](../docs/full-guide.md). Adding a secure endpoint end to end:
[../docs/02-adding-a-secure-feature.md](../docs/02-adding-a-secure-feature.md).
