/**
 * Path this frontend itself is mounted under (Vite's `base`, driven by the
 * same FRONTEND_BASE_PATH value at the docker-compose level). Sourced from
 * VITE_FRONTEND_BASE_PATH (see .env).
 *
 * The backend has no browser-facing path of its own anymore - every
 * backend-bound request (see api-client.ts, auth-client.ts) is built from
 * this same constant instead. vite.config.ts's dev proxy and
 * frontend/nginx.conf.template's location blocks nest the backend's actual
 * (internal-only) path underneath it - see "Backend proxying" in the README.
 */
export const FRONTEND_BASE_PATH: string = import.meta.env.VITE_FRONTEND_BASE_PATH || '/';
