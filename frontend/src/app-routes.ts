import { homeRoute } from './features/home';
import { facilitiesRoute } from './features/facilities';
import { permitsRoute } from './features/permits';
import { inspectionsRoute } from './features/inspections';
import { reportsRoute } from './features/reports';
import { dailyReportsRoute } from './features/daily-reports';

/**
 * This app's top-level pages, in nav order. App.tsx turns this into <Route>s,
 * AppShell.tsx turns it into nav links - neither hardcodes the page list
 * itself, so adding a page to *this* app means adding one line here, not
 * touching either of those (AppShell in particular is meant to carry over to
 * other apps built on this kickstart largely unchanged).
 */
export const APP_ROUTES = [
  homeRoute,
  facilitiesRoute,
  permitsRoute,
  inspectionsRoute,
  reportsRoute,
  dailyReportsRoute,
];
