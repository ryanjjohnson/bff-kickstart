import { useQuery } from '@tanstack/react-query';
import { fetchStateCodes } from '../api/stateCodes';

export function useStateCodes() {
  return useQuery({
    queryKey: ['state-codes'],
    queryFn: fetchStateCodes,
    staleTime: Infinity,
  });
}
