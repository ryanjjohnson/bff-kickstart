import { apiClient } from '../../../lib/api-client';
import { FRONTEND_BASE_PATH } from '../../../lib/config';

export interface InspectionAttachment {
  id: number;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  uploadedAt: string;
}

export async function fetchInspectionAttachments(inspectionId: number): Promise<InspectionAttachment[]> {
  const { data } = await apiClient.get<InspectionAttachment[]>(`/inspections/${inspectionId}/attachments`);
  return data;
}

export async function uploadInspectionAttachment(inspectionId: number, file: File): Promise<InspectionAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<InspectionAttachment>(
    `/inspections/${inspectionId}/attachments`,
    formData,
  );
  return data;
}

export async function deleteInspectionAttachment(inspectionId: number, attachmentId: number): Promise<void> {
  await apiClient.delete(`/inspections/${inspectionId}/attachments/${attachmentId}`);
}

/**
 * Plain same-origin GET (session cookie rides along), so a normal anchor href
 * downloads it - no blob plumbing needed.
 */
export function inspectionAttachmentDownloadUrl(inspectionId: number, attachmentId: number): string {
  return `${FRONTEND_BASE_PATH}/api/v1/inspections/${inspectionId}/attachments/${attachmentId}`;
}
