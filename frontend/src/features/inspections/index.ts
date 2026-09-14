/**
 * Public surface of the inspections feature. Other features must import from
 * here, never from a sibling file like './inspections/api/inspections' directly -
 * anything not re-exported below is private to this feature.
 */
import type { AppRoute } from '../../lib/appRoute';
import { InspectionsPage } from './components/InspectionsPage';

export { InspectionsPage } from './components/InspectionsPage';
// Needed by the facility overview to list a facility's inspections.
export { useInspections } from './hooks/useInspections';
// Needed by the reports feature to type and color-code compliance report rows,
// and by the facility overview (InspectionResponse) to render inspection rows.
export { INSPECTION_OUTCOME_COLORS, type InspectionOutcome, type InspectionResponse } from './types/inspection';

export const inspectionsRoute: AppRoute = {
  path: '/inspections',
  label: 'Inspections',
  Component: InspectionsPage,
};
