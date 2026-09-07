import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createInspection,
  deleteInspection,
  fetchInspections,
  updateInspection,
  type InspectionSearchParams,
} from '../api/inspections';
import type { InspectionFormValues } from '../types/inspection';

export function useInspections(params: InspectionSearchParams) {
  return useQuery({
    queryKey: ['inspections', params],
    queryFn: () => fetchInspections(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: InspectionFormValues) => createInspection(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspections'] }),
  });
}

export function useUpdateInspection(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: InspectionFormValues) => updateInspection(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspections'] }),
  });
}

export function useDeleteInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteInspection(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspections'] }),
  });
}
