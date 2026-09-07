import { z } from 'zod';

// Mirrors MailRequest's Bean Validation constraints on the backend so the
// user sees the same errors before a round-trip, not instead of it.
export const mailSchema = z.object({
  to: z.string().trim().min(1, 'Recipient is required').email('Recipient must be a valid email address'),
  subject: z.string().trim().min(1, 'Subject is required').max(200, 'Subject must be at most 200 characters'),
  message: z.string().trim().min(1, 'Message is required').max(5000, 'Message must be at most 5000 characters'),
});

export type MailFormValues = z.infer<typeof mailSchema>;
