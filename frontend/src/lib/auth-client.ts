import axios from 'axios';
import { FRONTEND_BASE_PATH } from './config';

// Separate from apiClient (which is baseURL-scoped to /api) because /logout and
// the OAuth2 redirects live outside that prefix.
export const authClient = axios.create({
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export type Role = 'Admin' | 'Inspector' | 'Viewer' | 'Data Manager';

export interface MeResponse {
  authenticated: boolean;
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
  roles?: Role[];
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await authClient.get<MeResponse>(`${FRONTEND_BASE_PATH}/api/v1/me`);
  return data;
}

export function beginLogin() {
  window.location.href = `${FRONTEND_BASE_PATH}/oauth2/authorization/keycloak`;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Logout must be a real browser navigation, not an XHR/fetch call: Spring's
 * RP-initiated logout replies with a 302 to Keycloak's end_session_endpoint,
 * and Keycloak's own post-logout redirect back to the app only works as part
 * of an actual top-level navigation chain (an XHR would just follow the
 * redirects internally and hit CORS on Keycloak's origin).
 */
export function performLogout() {
  const csrfToken = readCookie('XSRF-TOKEN');
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${FRONTEND_BASE_PATH}/logout`;
  if (csrfToken) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = '_csrf';
    input.value = csrfToken;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
