import { apiClient } from '../../../lib/api-client';

export interface StateCodeResponse {
  code: string;
  name: string;
}

export async function fetchStateCodes(): Promise<StateCodeResponse[]> {
  const { data } = await apiClient.get<StateCodeResponse[]>('/state-codes');
  return data;
}
