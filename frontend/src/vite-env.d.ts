/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRONTEND_BASE_PATH: string;
  readonly VITE_IDLE_TIMEOUT_SECONDS?: string;
  readonly VITE_IDLE_WARNING_SECONDS?: string;
  readonly VITE_AUTH_RECHECK_SECONDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** package.json's version, injected by vite.config.ts's `define`. */
declare const __APP_VERSION__: string;
