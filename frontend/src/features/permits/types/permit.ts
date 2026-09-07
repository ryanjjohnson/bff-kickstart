import { z } from 'zod';

export const PERMIT_TYPES = ['SAFETY', 'QUALITY', 'ELECTRICAL', 'PACKAGING', 'EXPORT'] as const;
export type PermitType = (typeof PERMIT_TYPES)[number];

export const PERMIT_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'ISSUED', 'EXPIRED', 'REVOKED'] as const;
export type PermitStatus = (typeof PERMIT_STATUSES)[number];

export const PERMIT_STATUS_COLORS: Record<PermitStatus, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'default',
  PENDING_REVIEW: 'accent',
  ISSUED: 'success',
  EXPIRED: 'warning',
  REVOKED: 'danger',
};

export const permitSchema = z
  .object({
    facilityId: z.number({ message: 'Facility is required' }),
    permitNumber: z
      .string()
      .trim()
      .min(1, 'Permit number is required')
      .max(50, 'Permit number must be at most 50 characters'),
    permitType: z.enum(PERMIT_TYPES, { message: 'Permit type is required' }),
    status: z.enum(PERMIT_STATUSES, { message: 'Status is required' }),
    description: z.string().trim().max(1000, 'Description must be at most 1000 characters').optional().or(z.literal('')),
    issuedDate: z.string().optional().or(z.literal('')),
    expirationDate: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => !data.issuedDate || !data.expirationDate || data.expirationDate >= data.issuedDate,
    { message: 'Expiration date must be on or after the issued date', path: ['expirationDate'] },
  );

export type PermitFormValues = z.infer<typeof permitSchema>;

export interface PermitResponse {
  id: number;
  facilityId: number;
  facilityName: string;
  permitNumber: string;
  permitType: PermitType;
  status: PermitStatus;
  description?: string;
  issuedDate?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}
