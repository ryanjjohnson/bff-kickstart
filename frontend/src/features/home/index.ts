/**
 * Public surface of the home feature. Other features must import from here,
 * never from a sibling file directly - anything not re-exported below is
 * private to this feature.
 */
import type { AppRoute } from '../../lib/appRoute';
import { HomePage } from './components/HomePage';

export { HomePage } from './components/HomePage';

export const homeRoute: AppRoute = {
  path: '/',
  label: 'Home',
  Component: HomePage,
  requiresAuth: false,
};
