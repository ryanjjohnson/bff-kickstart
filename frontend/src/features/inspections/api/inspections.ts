import { apiClient, type Page } from '../../../lib/api-client';
import type { BulkImportResult } from '../../../lib/bulkImport';
import type { InspectionFormValues, InspectionOutcome, InspectionResponse } from '../types/inspection';

export interface InspectionSearchParams {
  q?: string;
  facilityId?: number;
  outcome?: InspectionOutcome | '';
  page: number;
  size: number;
  sort?: string;
}

export async function fetchInspections(params: InspectionSearchParams): Promise<Page<InspectionResponse>> {
  const { data } = await apiClient.get<Page<InspectionResponse>>('/inspections', {
    params: { ...params, outcome: params.outcome || undefined },
  });
  return data;
}

export async function createInspection(values: InspectionFormValues): Promise<InspectionResponse> {
  const { data } = await apiClient.post<InspectionResponse>('/inspections', values);
  return data;
}

export async function updateInspection(id: number, values: InspectionFormValues): Promise<InspectionResponse> {
  const { data } = await apiClient.put<InspectionResponse>(`/inspections/${id}`, values);
  return data;
}

export async function deleteInspection(id: number): Promise<void> {
  await apiClient.delete(`/inspections/${id}`);
}

export async function exportInspectionsCsv(): Promise<Blob> {
  const { data } = await apiClient.get('/inspections/export', { responseType: 'blob' });
  return data;
}

export async function importInspectionsCsv(file: File): Promise<BulkImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<BulkImportResult>('/inspections/import', formData);
  return data;
}
