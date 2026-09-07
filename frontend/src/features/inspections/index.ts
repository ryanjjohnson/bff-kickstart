/**
 * Public surface of the inspections feature. Other features must import from
 * here, never from a sibling file like './inspections/api/inspections' directly -
 * anything not re-exported below is private to this feature.
 */
import type { AppRoute } from '../../lib/appRoute';
import { InspectionsPage } from './components/InspectionsPage';

export { InspectionsPage } from './components/InspectionsPage';
// Needed by the reports feature to type and color-code compliance report rows.
export { INSPECTION_OUTCOME_COLORS, type InspectionOutcome } from './types/inspection';

export const inspectionsRoute: AppRoute = {
  path: '/inspections',
  label: 'Inspections',
  Component: InspectionsPage,
};
