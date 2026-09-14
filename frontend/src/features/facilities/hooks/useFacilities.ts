import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFacility,
  deleteFacility,
  fetchAllFacilities,
  fetchFacilities,
  fetchFacility,
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

/** One facility by id - powers the facility overview page. Disabled for a
 *  non-numeric/absent route param so a bad URL doesn't fire a doomed request. */
export function useFacility(id: number) {
  return useQuery({
    queryKey: ['facilities', 'detail', id],
    queryFn: () => fetchFacility(id),
    enabled: Number.isInteger(id) && id > 0,
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
