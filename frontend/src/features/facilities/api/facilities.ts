import { apiClient, type Page } from '../../../lib/api-client';
import type { BulkImportResult } from '../../../lib/bulkImport';
import type { FacilityFormValues, FacilityResponse, FacilityType } from '../types/facility';

export interface FacilitySearchParams {
  q?: string;
  type?: FacilityType | '';
  active?: boolean;
  page: number;
  size: number;
  sort?: string;
}

export async function fetchFacilities(params: FacilitySearchParams): Promise<Page<FacilityResponse>> {
  const { data } = await apiClient.get<Page<FacilityResponse>>('/facilities', {
    params: { ...params, type: params.type || undefined },
  });
  return data;
}

export async function fetchAllFacilities(): Promise<FacilityResponse[]> {
  const { data } = await apiClient.get<Page<FacilityResponse>>('/facilities', {
    params: { page: 0, size: 500 },
  });
  return data.content;
}

export async function createFacility(values: FacilityFormValues): Promise<FacilityResponse> {
  const { data } = await apiClient.post<FacilityResponse>('/facilities', values);
  return data;
}

export async function updateFacility(id: number, values: FacilityFormValues): Promise<FacilityResponse> {
  const { data } = await apiClient.put<FacilityResponse>(`/facilities/${id}`, values);
  return data;
}

export async function deleteFacility(id: number): Promise<void> {
  await apiClient.delete(`/facilities/${id}`);
}

export async function exportFacilitiesCsv(): Promise<Blob> {
  const { data } = await apiClient.get('/facilities/export', { responseType: 'blob' });
  return data;
}

export async function importFacilitiesCsv(file: File): Promise<BulkImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<BulkImportResult>('/facilities/import', formData);
  return data;
}
