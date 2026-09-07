/**
 * Public surface of the reports feature. Other features must import from
 * here, never from a sibling file directly - anything not re-exported below
 * is private to this feature.
 */
import type { AppRoute } from '../../lib/appRoute';
import { ReportsPage } from './components/ReportsPage';

export { ReportsPage } from './components/ReportsPage';

export const reportsRoute: AppRoute = {
  path: '/reports',
  label: 'Reports',
  Component: ReportsPage,
};
