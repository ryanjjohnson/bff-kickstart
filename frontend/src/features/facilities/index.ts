/**
 * Public surface of the facilities feature. Other features must import from
 * here, never from a sibling file like './facilities/api/facilities' directly -
 * anything not re-exported below is private to this feature.
 */
import type { AppRoute } from '../../lib/appRoute';
import { FacilitiesPage } from './components/FacilitiesPage';

export { FacilitiesPage } from './components/FacilitiesPage';
export { useAllFacilities } from './hooks/useFacilities';

export const facilitiesRoute: AppRoute = {
  path: '/facilities',
  label: 'Facilities',
  Component: FacilitiesPage,
};
