import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMe, beginLogin, performLogout, type Role } from '../lib/auth-client';
import { AUTH_RECHECK_SECONDS } from '../lib/config';

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  telephone?: string;
  external?: boolean;
  roles: Role[];
  hasRole: (...roles: Role[]) => boolean;
  login: () => void;
  logout: () => void;
  /** Touches the server session (extends its inactivity timeout) and re-checks auth state. */
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    // Backchannel logout (Keycloak pushing revocations to the backend) can fail
    // silently - a missed notification, a network blip - so this also actively
    // re-verifies with Keycloak on a timer rather than trusting the push alone.
    // /api/me itself does the actual re-verification (token introspection); this
    // just makes sure that happens periodically, not only at page load.
    // Interval is env-configurable - see lib/config.ts.
    refetchInterval: AUTH_RECHECK_SECONDS * 1000,
    refetchIntervalInBackground: false,
  });

  const roles = data?.roles ?? [];

  const value: AuthContextValue = {
    isLoading,
    isAuthenticated: data?.authenticated ?? false,
    username: data?.username,
    firstName: data?.firstName,
    lastName: data?.lastName,
    fullName: data?.fullName,
    email: data?.email,
    addressLine1: data?.addressLine1,
    addressLine2: data?.addressLine2,
    city: data?.city,
    state: data?.state,
    zip: data?.zip,
    telephone: data?.telephone,
    external: data?.external,
    roles,
    hasRole: (...check) => check.some((role) => roles.includes(role)),
    login: beginLogin,
    logout: performLogout,
    refreshSession: () => {
      void refetch();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
