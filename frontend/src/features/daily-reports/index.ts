/**
 * Public surface of the daily-reports feature. Other features must import
 * from here, never from a sibling file directly.
 */
import type { AppRoute } from '../../lib/appRoute';
import { DailyReportsPage } from './components/DailyReportsPage';

export const dailyReportsRoute: AppRoute = {
  path: '/daily-reports',
  label: 'Daily Reports',
  Component: DailyReportsPage,
};
