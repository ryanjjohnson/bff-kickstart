import { useQuery } from '@tanstack/react-query';
import { fetchComplianceReport } from '../api/reports';

export function useComplianceReport() {
  return useQuery({
    queryKey: ['reports', 'compliance'],
    queryFn: fetchComplianceReport,
  });
}
