import axios from 'axios';
import { toast } from '@heroui/react';
import { FRONTEND_BASE_PATH } from './config';
import { queryClient } from './query-client';
import type { MeResponse } from './auth-client';

// withCredentials sends the session cookie; axios pairs the XSRF-TOKEN cookie
// (set by Spring's CookieCsrfTokenRepository) with an X-XSRF-TOKEN header
// automatically on same-origin requests, satisfying Spring Security's CSRF check.
// Nested under FRONTEND_BASE_PATH, not a sibling path - see "Backend proxying"
// in the README for how vite/nginx route this to the backend underneath.
export const apiClient = axios.create({
  baseURL: `${FRONTEND_BASE_PATH}/api/v1`,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response) {
      let body = error.response.data as
        | { message?: string; fieldErrors?: Record<string, string> }
        | undefined;

      // requests with responseType: 'blob' (the CSV export downloads) get their error bodies
      // delivered as a Blob too, not parsed JSON - without this, the backend's actual message
      // is silently lost and every failed export falls back to axios's generic
      // "Request failed with status code ___", exactly the vague-error problem this is fixing.
      if (body instanceof Blob) {
        try {
          body = JSON.parse(await body.text());
        } catch {
          body = undefined;
        }
      }

      // A 401 here means the session died server-side since the page loaded - backchannel
      // logout, an admin-forced sign-out, or the periodic Keycloak re-check in MeController -
      // not just this one request being unlucky. Flip auth state immediately rather than
      // waiting for the next scheduled /api/me poll (up to 30s away): every RequireAuth-gated
      // page reacts to that flip right away, so a lingering table full of stale data (the
      // "still logged in" bug this was papering over) is swapped out for a sign-in prompt
      // instead of silently sitting there. Only toast on the true -> false transition, so
      // concurrent requests failing around the same moment don't each pop their own banner.
      if (error.response.status === 401) {
        const previous = queryClient.getQueryData<MeResponse>(['me']);
        queryClient.setQueryData<MeResponse>(['me'], { authenticated: false });
        if (previous?.authenticated) {
          toast.danger("You've been signed out. Sign in again to continue.");
        }
      }

      return Promise.reject(
        new ApiError(
          body?.message ?? error.message,
          error.response.status,
          body?.fieldErrors,
        ),
      );
    }
    return Promise.reject(error);
  },
);

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Shared toast for a failed create/update/delete/import/export action. Skips 401s - the
 * interceptor above already announced those with its own "you've been signed out" toast, so
 * showing this one too would just be the same news twice.
 */
export function showActionError(err: unknown, fallbackMessage: string) {
  if (err instanceof ApiError && err.status === 401) {
    return;
  }
  toast.danger(err instanceof ApiError ? err.message : fallbackMessage);
}
