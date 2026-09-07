import { useQuery } from '@tanstack/react-query';
import { fetchResourceCount } from '../api/counts';

export function useResourceCount(resource: string, enabled = true) {
  return useQuery({
    queryKey: ['count', resource],
    queryFn: () => fetchResourceCount(resource),
    enabled,
  });
}
