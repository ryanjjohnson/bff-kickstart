import { apiClient, type Page } from '../../../lib/api-client';
import type { BulkImportResult } from '../../../lib/bulkImport';
import type { PermitFormValues, PermitResponse, PermitStatus, PermitType } from '../types/permit';

export interface PermitSearchParams {
  q?: string;
  facilityId?: number;
  type?: PermitType | '';
  status?: PermitStatus | '';
  page: number;
  size: number;
  sort?: string;
}

export async function fetchPermits(params: PermitSearchParams): Promise<Page<PermitResponse>> {
  const { data } = await apiClient.get<Page<PermitResponse>>('/permits', {
    params: { ...params, type: params.type || undefined, status: params.status || undefined },
  });
  return data;
}

export async function fetchAllPermitsForFacility(facilityId: number | null): Promise<PermitResponse[]> {
  const { data } = await apiClient.get<Page<PermitResponse>>('/permits', {
    params: { facilityId, page: 0, size: 500 },
  });
  return data.content;
}

export async function createPermit(values: PermitFormValues): Promise<PermitResponse> {
  const { data } = await apiClient.post<PermitResponse>('/permits', values);
  return data;
}

export async function updatePermit(id: number, values: PermitFormValues): Promise<PermitResponse> {
  const { data } = await apiClient.put<PermitResponse>(`/permits/${id}`, values);
  return data;
}

export async function deletePermit(id: number): Promise<void> {
  await apiClient.delete(`/permits/${id}`);
}

export async function exportPermitsCsv(): Promise<Blob> {
  const { data } = await apiClient.get('/permits/export', { responseType: 'blob' });
  return data;
}

export async function importPermitsCsv(file: File): Promise<BulkImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<BulkImportResult>('/permits/import', formData);
  return data;
}
