import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPermit,
  deletePermit,
  fetchAllPermitsForFacility,
  fetchPermits,
  updatePermit,
  type PermitSearchParams,
} from '../api/permits';
import type { PermitFormValues } from '../types/permit';

export function usePermits(params: PermitSearchParams) {
  return useQuery({
    queryKey: ['permits', params],
    queryFn: () => fetchPermits(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllPermitsForFacility(facilityId: number | null) {
  return useQuery({
    queryKey: ['permits', 'byFacility', facilityId],
    queryFn: () => fetchAllPermitsForFacility(facilityId),
    enabled: facilityId != null,
  });
}

export function useCreatePermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PermitFormValues) => createPermit(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permits'] }),
  });
}

export function useUpdatePermit(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PermitFormValues) => updatePermit(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permits'] }),
  });
}

export function useDeletePermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePermit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permits'] }),
  });
}
