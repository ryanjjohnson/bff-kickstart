# Frontend

React 19 + Vite SPA. It knows nothing about OAuth — it calls same-origin APIs with a session
cookie and lets the backend do the identity work.

## Run it

```bash
npm install
npm run dev     # http://localhost:5173/bff-kickstart/
```

The dev server proxies every backend-bound path (`/bff-kickstart/api`, `/oauth2`, `/login`, …)
to the backend on `:8081`, so start that first (see [../backend/README.md](../backend/README.md)).
No CORS, no tokens, no env setup — `frontend/.env` ships working defaults.

## Where things are

| Path | What lives there |
|---|---|
| `src/features/<feature>/` | One folder per feature: `components/`, `hooks/`, `api/`, `types/` |
| `src/components/` | Shared UI - `DataTable`, form fields, dialogs |
| `src/auth/` | `useAuth()`, session-timeout countdown, route guards |
| `src/lib/` | axios client (CSRF + 401 handling baked in), config, query client |
| `src/app-routes.ts` | Add a page here; nav and routing pick it up |

## Rules of the road

- Data fetching goes through TanStack Query hooks in each feature's `hooks/` — never raw
  axios in a component.
- Forms are react-hook-form + a zod schema in the feature's `types/` that mirrors the
  backend's validation, so users see errors before the round-trip.
- Role-gate UI with `useAuth().hasRole(...)` — and remember the backend enforces the same
  roles for real; hiding a button is UX, not security.
- `npm run build && npm run preview` = production build with the same proxying, no nginx.

Everything in depth — validation patterns, security wiring, session timeout, styling,
proxying: [../docs/frontend-guide.md](../docs/frontend-guide.md).
