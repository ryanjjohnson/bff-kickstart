import { apiClient } from '../../../lib/api-client';
import type { ComplianceReportRow } from '../types/report';

export async function fetchComplianceReport(): Promise<ComplianceReportRow[]> {
  const { data } = await apiClient.get<ComplianceReportRow[]>('/reports/compliance');
  return data;
}
