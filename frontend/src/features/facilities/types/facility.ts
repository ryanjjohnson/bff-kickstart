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

export const LOCATION_SOURCES = ['DEVICE', 'MANUAL'] as const;
export type LocationSource = (typeof LOCATION_SOURCES)[number];

/**
 * Optional coordinate typed into a text input: '' means "not set" (-> null),
 * anything else must parse as a number within range. Also accepts numbers
 * directly, since edit-form default values come from the API as numbers.
 */
function optionalCoordinate(min: number, max: number, label: string) {
  return z.union([z.string(), z.number(), z.null()]).transform((value, ctx) => {
    if (value == null || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      ctx.addIssue({ code: 'custom', message: `${label} must be a number` });
      return z.NEVER;
    }
    if (parsed < min || parsed > max) {
      ctx.addIssue({ code: 'custom', message: `${label} must be between ${min} and ${max}` });
      return z.NEVER;
    }
    return parsed;
  });
}

// Mirrors FacilityRequest's Bean Validation constraints on the backend so the
// user sees the same errors before a round-trip, not instead of it.
export const facilitySchema = z
  .object({
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
    latitude: optionalCoordinate(-90, 90, 'Latitude'),
    longitude: optionalCoordinate(-180, 180, 'Longitude'),
    // Geolocation-capture metadata - never typed by the user, set alongside the
    // coordinates by the "Use my location" button (see FacilityForm) and echoed
    // back from the API when editing.
    locationAccuracyM: z.number().nullable().optional(),
    locationAltitudeM: z.number().nullable().optional(),
    locationAltitudeAccuracyM: z.number().nullable().optional(),
    locationHeadingDeg: z.number().nullable().optional(),
    locationSpeedMps: z.number().nullable().optional(),
    locationCapturedAt: z.string().nullable().optional(),
    locationSource: z.enum(LOCATION_SOURCES).nullable().optional(),
  })
  .superRefine((values, ctx) => {
    if ((values.latitude == null) !== (values.longitude == null)) {
      const missing = values.latitude == null ? 'latitude' : 'longitude';
      ctx.addIssue({
        code: 'custom',
        path: [missing],
        message: 'Latitude and longitude must be provided together',
      });
    }
  });

/** What the form's fields hold while editing (coordinates may be raw strings). */
export type FacilityFormInput = z.input<typeof facilitySchema>;
/** What validation produces and the API receives (coordinates parsed to numbers). */
export type FacilityFormValues = z.output<typeof facilitySchema>;

export interface FacilityResponse {
  id: number;
  name: string;
  facilityType: FacilityType;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  locationAccuracyM: number | null;
  locationAltitudeM: number | null;
  locationAltitudeAccuracyM: number | null;
  locationHeadingDeg: number | null;
  locationSpeedMps: number | null;
  locationCapturedAt: string | null;
  locationSource: LocationSource | null;
  createdAt: string;
  updatedAt: string;
}
