import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
// Default-imported with an import attribute (rather than a named import)
// because tsconfig's NodeNext module mode requires both for JSON modules.
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv (unlike import.meta.env in app code) can read any variable, not
  // just VITE_-prefixed ones - which is exactly why BACKEND_BASE_PATH below
  // isn't VITE_-prefixed: it's a proxy-config-only concern, never read by
  // client code (see src/lib/config.ts), so it shouldn't be auto-injected
  // into the client bundle the way a VITE_ var would be.
  const env = loadEnv(mode, process.cwd(), '')
  const frontendBasePath = (env.VITE_FRONTEND_BASE_PATH || '/').replace(/\/+$/, '')
  const backendBasePath = env.BACKEND_BASE_PATH || '/api'

  // The backend has no browser-facing path of its own - everything it
  // serves (api/oauth2/login/logout, plus Swagger/OpenAPI when
  // SWAGGER_ENABLED=true) is nested under the frontend's own path instead,
  // so /bff-kickstart/api/facilities is what a browser ever sees, never
  // /bff-kickstart-api/api/facilities. Shared between `server` (npm run dev)
  // and `preview` (npm run build && npm run preview) so a no-Docker,
  // no-nginx run of the built app still proxies the backend correctly -
  // `vite preview` is this project's nginx-free stand-in for that container,
  // used by devs who don't have (or don't want) Docker at all.
  const backendProxy: Record<string, ProxyOptions> = {
    // This key is a RegExp source (Vite treats a proxy key starting with "^"
    // as one) matching all backend-owned sub-paths in one entry.
    [`^${frontendBasePath}/(api|oauth2|login|logout|swagger-ui\\.html|swagger-ui|v3/api-docs)(?:/|$)`]: {
      target: 'http://localhost:8081',
      // Not changeOrigin'd, so the Host header stays whatever the browser
      // sent (localhost:5173 in dev, localhost:4173 in preview) - Spring
      // computes the scheme+host half of its OAuth2 {baseUrl} from the
      // request's Host, and that value must match a redirect URI registered
      // on the Keycloak client.
      changeOrigin: false,
      // Swaps the external prefix for the backend's actual internal one
      // (server.servlet.context-path, unchanged - the backend has no idea
      // any of this rewriting is happening).
      rewrite: (path) => path.replace(new RegExp(`^${frontendBasePath}`), backendBasePath),
      // Supplies the path half of {baseUrl}: Spring's ForwardedHeaderFilter
      // (server.forward-headers-strategy=framework) uses X-Forwarded-Prefix
      // to override what it thinks its own context-path is for URL
      // generation (e.g. the OAuth2 redirect_uri), regardless of what
      // server.servlet.context-path is actually configured to. Verified
      // directly against the backend:
      //   curl -H "X-Forwarded-Prefix: /bff-kickstart" \
      //     http://localhost:8081/bff-kickstart-api/oauth2/authorization/keycloak
      //   -> redirect_uri=.../bff-kickstart/login/oauth2/code/keycloak
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('X-Forwarded-Prefix', frontendBasePath)
        })
      },
    },
  }

  return {
    base: `${frontendBasePath}/`,
    // package.json's version, compiled into the bundle (the footer shows it).
    // JSON.stringify because `define` values are spliced in as raw source text.
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      react(),
      tailwindcss(),
      // Installability (add-to-homescreen on iOS/Android, standalone window),
      // deliberately NOT offline data: the app is session-cookie + live-API
      // driven, so the service worker precaches only the built static assets.
      // Auth and API traffic must never be served from a cache.
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'BFF Kickstart',
          short_name: 'BFF Kickstart',
          description: 'Gizmo-manufacturing inspection and reporting',
          start_url: `${frontendBasePath}/`,
          scope: `${frontendBasePath}/`,
          display: 'standalone',
          theme_color: '#0F6A44',
          background_color: '#ffffff',
          icons: [
            { src: 'pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // SPA fallback for client-side routes only - every backend-owned
          // path (see backendProxy above) must reach the network, never the
          // cached index.html. A cached response to an OAuth2 redirect or an
          // /api call is the classic PWA-breaks-auth failure mode.
          navigateFallback: `${frontendBasePath}/index.html`,
          navigateFallbackDenylist: [
            /\/api\//,
            /\/oauth2\//,
            /\/login(\/|$)/,
            /\/logout(\/|$)/,
            /\/swagger-ui/,
            /\/v3\/api-docs/,
          ],
        },
      }),
    ],
    server: {
      port: 5173,
      proxy: backendProxy,
    },
    preview: {
      port: 4173,
      proxy: backendProxy,
    },
  }
})
