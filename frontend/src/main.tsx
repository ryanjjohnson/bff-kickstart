import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { queryClient } from './lib/query-client.ts'
import { FRONTEND_BASE_PATH } from './lib/config.ts'

// Importing the PWA register here (rather than letting injectRegister:'auto'
// drop in its minimal register-only script) is what wires up autoUpdate's
// reload: the generated service worker already skip-waits and claims clients,
// but without this the open page never learns a new build activated and keeps
// running the cached old bundle until the user manually clears their cache.
// registerSW's autoUpdate mode reloads the page when the new worker takes
// control (only on a real update, never the first install - no reload loop).
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={FRONTEND_BASE_PATH}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
