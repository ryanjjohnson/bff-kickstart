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

function positiveIntEnv(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Session-timing knobs, all overridable per environment (see .env / the root
 * .env.example) with the documented defaults baked in as fallbacks.
 */

/** Idle time before the client signs the user out (default 5 minutes). */
export const IDLE_TIMEOUT_SECONDS = positiveIntEnv(import.meta.env.VITE_IDLE_TIMEOUT_SECONDS, 300);

/**
 * How long before the idle timeout the countdown warning appears (default 1
 * minute). Clamped below the timeout itself - a lead >= the timeout would
 * mean the warning shows the moment the user goes idle.
 */
export const IDLE_WARNING_SECONDS = Math.min(
  positiveIntEnv(import.meta.env.VITE_IDLE_WARNING_SECONDS, 60),
  IDLE_TIMEOUT_SECONDS - 1,
);

/** How often the SPA re-confirms auth state with the backend (default 30s). */
export const AUTH_RECHECK_SECONDS = positiveIntEnv(import.meta.env.VITE_AUTH_RECHECK_SECONDS, 30);
