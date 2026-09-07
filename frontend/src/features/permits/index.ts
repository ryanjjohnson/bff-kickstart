/**
 * Public surface of the permits feature. Other features must import from
 * here, never from a sibling file like './permits/api/permits' directly -
 * anything not re-exported below is private to this feature.
 */
import type { AppRoute } from '../../lib/appRoute';
import { PermitsPage } from './components/PermitsPage';

export { PermitsPage } from './components/PermitsPage';
export { useAllPermitsForFacility } from './hooks/usePermits';
// Needed by the reports feature to type and color-code compliance report rows.
export { PERMIT_STATUS_COLORS, type PermitStatus, type PermitType } from './types/permit';

export const permitsRoute: AppRoute = {
  path: '/permits',
  label: 'Permits',
  Component: PermitsPage,
};
