import { z } from 'zod';

export const INSPECTION_OUTCOMES = ['PENDING', 'PASSED', 'FAILED', 'NEEDS_FOLLOWUP'] as const;
export type InspectionOutcome = (typeof INSPECTION_OUTCOMES)[number];

export const INSPECTION_OUTCOME_COLORS: Record<
  InspectionOutcome,
  'default' | 'accent' | 'success' | 'warning' | 'danger'
> = {
  PENDING: 'accent',
  PASSED: 'success',
  FAILED: 'danger',
  NEEDS_FOLLOWUP: 'warning',
};

export const inspectionSchema = z
  .object({
    facilityId: z.number({ message: 'Facility is required' }),
    permitId: z.number().optional().nullable(),
    inspectorName: z
      .string()
      .trim()
      .min(1, 'Inspector name is required')
      .max(150, 'Inspector name must be at most 150 characters'),
    scheduledDate: z.string().min(1, 'Scheduled date is required'),
    completedDate: z.string().optional().or(z.literal('')),
    outcome: z.enum(INSPECTION_OUTCOMES, { message: 'Outcome is required' }),
    notes: z.string().trim().max(2000, 'Notes must be at most 2000 characters').optional().or(z.literal('')),
  })
  .refine(
    (data) => !data.completedDate || data.completedDate >= data.scheduledDate,
    { message: 'Completed date cannot be before the scheduled date', path: ['completedDate'] },
  );

export type InspectionFormValues = z.infer<typeof inspectionSchema>;

export interface InspectionResponse {
  id: number;
  facilityId: number;
  facilityName: string;
  permitId?: number;
  permitNumber?: string;
  inspectorName: string;
  scheduledDate: string;
  completedDate?: string;
  outcome: InspectionOutcome;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
