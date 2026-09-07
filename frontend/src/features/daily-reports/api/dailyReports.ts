import { apiClient } from '../../../lib/api-client';
import type { DailyReportResponse } from '../types/dailyReport';

export async function fetchDailyReports(): Promise<DailyReportResponse[]> {
  const { data } = await apiClient.get<DailyReportResponse[]>('/daily-reports');
  return data;
}
