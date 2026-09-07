import { Button, Card } from '@heroui/react';
import { useAuth } from '../../auth/AuthContext';

/**
 * Gates a single route behind login without blocking the rest of the app -
 * only pages backed by authenticated API calls (facilities, permits, ...)
 * need this. The home page stays public so visitors can see what the app is
 * before signing in.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return (
      <Card className="mx-auto max-w-md">
        <Card.Header>
          <Card.Title>Sign in required</Card.Title>
          <Card.Description>
            Sign in with your gizmoshop account to view this page.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Button onPress={login}>Sign in with Keycloak</Button>
        </Card.Content>
      </Card>
    );
  }

  return <>{children}</>;
}
