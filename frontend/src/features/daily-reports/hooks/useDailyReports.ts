import { useQuery } from '@tanstack/react-query';
import { fetchDailyReports } from '../api/dailyReports';

export function useDailyReports() {
  return useQuery({
    queryKey: ['daily-reports'],
    queryFn: fetchDailyReports,
  });
}
