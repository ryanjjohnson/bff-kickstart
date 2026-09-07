import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

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

  return {
    base: `${frontendBasePath}/`,
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        // The backend has no browser-facing path of its own - everything it
        // serves (api/oauth2/login/logout, plus Swagger/OpenAPI when
        // SWAGGER_ENABLED=true) is nested under the frontend's own path
        // instead, so /bff-kickstart/api/facilities is what a browser ever
        // sees, never /bff-kickstart-api/api/facilities. This key is a
        // RegExp source (Vite treats a proxy key starting with "^" as one)
        // matching all backend-owned sub-paths in one entry.
        [`^${frontendBasePath}/(api|oauth2|login|logout|swagger-ui\\.html|swagger-ui|v3/api-docs)(?:/|$)`]: {
          target: 'http://localhost:8081',
          // Not changeOrigin'd, so the Host header stays "localhost:5173" -
          // Spring computes the scheme+host half of its OAuth2 {baseUrl}
          // from the request's Host, and that value must match a redirect
          // URI registered on the Keycloak client.
          changeOrigin: false,
          // Swaps the external prefix for the backend's actual internal one
          // (server.servlet.context-path, unchanged - the backend has no
          // idea any of this rewriting is happening).
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
      },
    },
  }
})
