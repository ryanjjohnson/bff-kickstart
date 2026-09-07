import { Button, Card } from '@heroui/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { useResourceCount } from '../hooks/useResourceCount';
import { SendMailModal } from './SendMailModal';

const STAT_CARDS = [
  { resource: 'facilities', label: 'Facilities', to: '/facilities' },
  { resource: 'permits', label: 'Permits', to: '/permits' },
  { resource: 'inspections', label: 'Inspections', to: '/inspections' },
] as const;

export function HomePage() {
  const { isAuthenticated, fullName, roles, login } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {isAuthenticated ? `Welcome, ${fullName}` : 'Welcome to BFF Kickstart'}
        </h1>
        <p className="text-sm text-muted">
          {isAuthenticated ? (
            `Signed in with ${roles.join(', ').toLowerCase() || 'no'} access.`
          ) : (
            <>
              Sign in with your gizmoshop account to manage facilities, permits, and
              inspections.
            </>
          )}
        </p>
        {!isAuthenticated && (
          <Button className="mt-3" onPress={login}>
            Sign in with Keycloak
          </Button>
        )}
        {isAuthenticated && (
          <div className="mt-3">
            <SendMailModal />
          </div>
        )}
      </div>

      {isAuthenticated && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STAT_CARDS.map((card) => (
            <StatCard key={card.resource} {...card} />
          ))}
        </div>
      )}

      <Card>
        <Card.Header>
          <Card.Title>About this kickstart</Card.Title>
          <Card.Description>
            A starting point for gizmo-manufacturing inspection and reporting tools.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <ul className="list-inside list-disc text-sm text-muted">
            <li>React + Vite + TanStack Query + HeroUI on the frontend</li>
            <li>Spring Boot 3.5 REST + Hibernate on the backend</li>
            <li>Keycloak OIDC via a backend-for-frontend (session-based) login</li>
            <li>Client and server-side validation on every form</li>
            <li>CSV/PDF compliance report generation</li>
          </ul>
        </Card.Content>
      </Card>
    </div>
  );
}

function StatCard({ resource, label, to }: { resource: string; label: string; to: string }) {
  const { data: count, isLoading } = useResourceCount(resource);
  return (
    <Link to={to}>
      <Card className="transition-shadow hover:shadow-md">
        <Card.Header>
          <Card.Description>{label}</Card.Description>
          <Card.Title className="text-3xl">{isLoading ? '…' : count}</Card.Title>
        </Card.Header>
      </Card>
    </Link>
  );
}
