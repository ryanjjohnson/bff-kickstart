import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteInspectionAttachment,
  fetchInspectionAttachments,
  uploadInspectionAttachment,
} from '../api/inspectionAttachments';

function attachmentsKey(inspectionId: number) {
  return ['inspections', inspectionId, 'attachments'] as const;
}

export function useInspectionAttachments(inspectionId: number) {
  return useQuery({
    queryKey: attachmentsKey(inspectionId),
    queryFn: () => fetchInspectionAttachments(inspectionId),
  });
}

export function useUploadInspectionAttachment(inspectionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadInspectionAttachment(inspectionId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attachmentsKey(inspectionId) }),
  });
}

export function useDeleteInspectionAttachment(inspectionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: number) => deleteInspectionAttachment(inspectionId, attachmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attachmentsKey(inspectionId) }),
  });
}
