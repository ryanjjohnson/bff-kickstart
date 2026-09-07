import { z } from 'zod';

export const FACILITY_TYPES = [
  'ASSEMBLY',
  'FABRICATION',
  'QUALITY_CONTROL',
  'PACKAGING',
  'OTHER',
] as const;

export type FacilityType = (typeof FACILITY_TYPES)[number];

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  ASSEMBLY: 'Assembly',
  FABRICATION: 'Fabrication',
  QUALITY_CONTROL: 'Quality Control',
  PACKAGING: 'Packaging',
  OTHER: 'Other',
};

// Mirrors FacilityRequest's Bean Validation constraints on the backend so the
// user sees the same errors before a round-trip, not instead of it.
export const facilitySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
  facilityType: z.enum(FACILITY_TYPES, { message: 'Facility type is required' }),
  addressLine1: z.string().trim().min(1, 'Address is required').max(200, 'Address must be at most 200 characters'),
  city: z.string().trim().min(1, 'City is required').max(100, 'City must be at most 100 characters'),
  state: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, 'State must be a 2-letter code (e.g. OH)')
    .transform((s) => s.toUpperCase()),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'ZIP must be in the form 12345 or 12345-6789'),
  active: z.boolean(),
});

export type FacilityFormValues = z.infer<typeof facilitySchema>;

export interface FacilityResponse {
  id: number;
  name: string;
  facilityType: FacilityType;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
