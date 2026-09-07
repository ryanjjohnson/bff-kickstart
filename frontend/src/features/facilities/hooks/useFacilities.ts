import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFacility,
  deleteFacility,
  fetchAllFacilities,
  fetchFacilities,
  updateFacility,
  type FacilitySearchParams,
} from '../api/facilities';
import type { FacilityFormValues } from '../types/facility';

export function useFacilities(params: FacilitySearchParams) {
  return useQuery({
    queryKey: ['facilities', params],
    queryFn: () => fetchFacilities(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllFacilities() {
  return useQuery({
    queryKey: ['facilities', 'all'],
    queryFn: fetchAllFacilities,
  });
}

export function useCreateFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FacilityFormValues) => createFacility(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facilities'] }),
  });
}

export function useUpdateFacility(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FacilityFormValues) => updateFacility(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facilities'] }),
  });
}

export function useDeleteFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFacility(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facilities'] }),
  });
}
