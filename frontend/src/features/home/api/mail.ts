import { apiClient } from '../../../lib/api-client';
import type { MailFormValues } from '../types/mail';

export async function sendMail(values: MailFormValues): Promise<void> {
  await apiClient.post('/emails', values);
}
