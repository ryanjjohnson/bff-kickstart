import { useMutation } from '@tanstack/react-query';
import { sendMail } from '../api/mail';

export function useSendMail() {
  return useMutation({
    mutationFn: sendMail,
  });
}
