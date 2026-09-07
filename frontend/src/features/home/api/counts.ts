import { apiClient, type Page } from '../../../lib/api-client';

export async function fetchResourceCount(resource: string): Promise<number> {
  const { data } = await apiClient.get<Page<unknown>>(`/${resource}`, { params: { page: 0, size: 1 } });
  return data.totalElements;
}
