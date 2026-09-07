import type { ComponentType } from 'react';

/**
 * One top-level page: what path it lives at, what renders there, and how it
 * should be treated by the two things that care - the router (App.tsx) and
 * the nav bar (AppShell.tsx). Feature modules export these from their own
 * index.ts (their "public surface", same as a page component or a type);
 * app-routes.ts assembles them into the single list both consume.
 */
export interface AppRoute {
  path: string;
  label: string;
  Component: ComponentType;
  /** @default true */
  requiresAuth?: boolean;
  /** @default true */
  showInNav?: boolean;
}
