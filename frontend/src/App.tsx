import { Navigate, Route, Routes } from 'react-router-dom';
import { Toast } from '@heroui/react';
import { useAuth } from './auth/AuthContext';
import { SessionTimeoutMonitor } from './auth/SessionTimeoutMonitor';
import { AppShell } from './components/layout/AppShell';
import { LoadingScreen } from './components/layout/LoadingScreen';
import { RequireAuth } from './components/layout/RequireAuth';
import { APP_ROUTES } from './app-routes';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Toast.Provider />
      <SessionTimeoutMonitor />
      <Routes>
        <Route element={<AppShell />}>
          {APP_ROUTES.map(({ path, Component, requiresAuth = true }) => (
            <Route
              key={path}
              path={path}
              element={requiresAuth ? (
                <RequireAuth>
                  <Component />
                </RequireAuth>
              ) : (
                <Component />
              )}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
