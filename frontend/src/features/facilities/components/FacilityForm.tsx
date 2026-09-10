import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form } from '@heroui/react';
import { TextInputField } from '../../../components/form/TextInputField';
import { SelectField } from '../../../components/form/SelectField';
import { CheckboxField } from '../../../components/form/CheckboxField';
import { StateComboBoxField } from '../../../components/form/StateComboBoxField';
import { FormErrorSummary } from '../../../components/form/FormErrorSummary';
import { useApplyServerErrors } from '../../../components/form/useApplyServerErrors';
import { useStateCodes } from '../hooks/useStateCodes';
import {
  FACILITY_TYPES,
  FACILITY_TYPE_LABELS,
  facilitySchema,
  type FacilityFormInput,
  type FacilityFormValues,
} from '../types/facility';

const typeOptions = FACILITY_TYPES.map((t) => ({ value: t, label: FACILITY_TYPE_LABELS[t] }));

const GEO_ERROR_MESSAGES: Record<number, string> = {
  1: 'Location permission was denied - enter coordinates manually or allow location access.',
  2: 'Location is unavailable right now - try again or enter coordinates manually.',
  3: 'Timed out getting a location fix - try again or enter coordinates manually.',
};

interface FacilityFormProps {
  defaultValues?: Partial<FacilityFormInput>;
  onSubmit: (values: FacilityFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** The failed create/update mutation's error, if any - see useApplyServerErrors. */
  serverError?: unknown;
}

export function FacilityForm({ defaultValues, onSubmit, onCancel, isSubmitting, serverError }: FacilityFormProps) {
  // Three generics: raw field values (coordinates may be strings), context,
  // and the schema's parsed output that onSubmit actually receives.
  const { control, handleSubmit, setError, setValue, watch } = useForm<FacilityFormInput, unknown, FacilityFormValues>({
    resolver: zodResolver(facilitySchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      facilityType: undefined,
      addressLine1: '',
      city: '',
      state: '',
      zip: '',
      active: true,
      latitude: null,
      longitude: null,
      locationAccuracyM: null,
      locationAltitudeM: null,
      locationAltitudeAccuracyM: null,
      locationHeadingDeg: null,
      locationSpeedMps: null,
      locationCapturedAt: null,
      locationSource: null,
      ...defaultValues,
    },
  });
  useApplyServerErrors(setError, serverError);

  const { data: stateCodes } = useStateCodes();

  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const locationSource = useWatch({ control, name: 'locationSource' });
  const locationAccuracyM = useWatch({ control, name: 'locationAccuracyM' });
  const locationAltitudeM = useWatch({ control, name: 'locationAltitudeM' });
  const locationCapturedAt = useWatch({ control, name: 'locationCapturedAt' });
  const latitude = useWatch({ control, name: 'latitude' });

  // Hand-editing either coordinate turns the entry MANUAL and drops the device
  // fix's metadata - it described a different point. watch's subscription gives
  // type: 'change' only for real user input, not our own setValue calls.
  useEffect(() => {
    const subscription = watch((_values, { name, type }) => {
      if (type === 'change' && (name === 'latitude' || name === 'longitude')) {
        setValue('locationAccuracyM', null);
        setValue('locationAltitudeM', null);
        setValue('locationAltitudeAccuracyM', null);
        setValue('locationHeadingDeg', null);
        setValue('locationSpeedMps', null);
        setValue('locationCapturedAt', null);
        setValue('locationSource', 'MANUAL');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  function captureLocation() {
    if (!('geolocation' in navigator)) {
      setGeoError('This browser does not support geolocation - enter coordinates manually.');
      return;
    }
    setGeoBusy(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const c = position.coords;
        setValue('latitude', Number(c.latitude.toFixed(6)), { shouldValidate: true, shouldDirty: true });
        setValue('longitude', Number(c.longitude.toFixed(6)), { shouldValidate: true, shouldDirty: true });
        setValue('locationAccuracyM', Number.isFinite(c.accuracy) ? Math.round(c.accuracy * 100) / 100 : null);
        setValue('locationAltitudeM', c.altitude != null ? Math.round(c.altitude * 100) / 100 : null);
        setValue('locationAltitudeAccuracyM', c.altitudeAccuracy != null ? Math.round(c.altitudeAccuracy * 100) / 100 : null);
        setValue('locationHeadingDeg', c.heading != null && Number.isFinite(c.heading) ? c.heading : null);
        setValue('locationSpeedMps', c.speed != null && Number.isFinite(c.speed) ? c.speed : null);
        setValue('locationCapturedAt', new Date(position.timestamp).toISOString());
        setValue('locationSource', 'DEVICE');
        setGeoBusy(false);
      },
      (err) => {
        setGeoBusy(false);
        setGeoError(GEO_ERROR_MESSAGES[err.code] ?? 'Could not get a location fix.');
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  function clearLocation() {
    setValue('latitude', null, { shouldValidate: true });
    setValue('longitude', null, { shouldValidate: true });
    setValue('locationAccuracyM', null);
    setValue('locationAltitudeM', null);
    setValue('locationAltitudeAccuracyM', null);
    setValue('locationHeadingDeg', null);
    setValue('locationSpeedMps', null);
    setValue('locationCapturedAt', null);
    setValue('locationSource', null);
    setGeoError(null);
  }

  return (
    <Form validationBehavior="aria" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary error={serverError} />
      <TextInputField control={control} name="name" label="Facility name" isRequired />
      <SelectField
        control={control}
        name="facilityType"
        label="Facility type"
        options={typeOptions}
        isRequired
      />
      <TextInputField control={control} name="addressLine1" label="Address" isRequired />
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <TextInputField control={control} name="city" label="City" isRequired />
        </div>
        <StateComboBoxField control={control} name="state" label="State" options={stateCodes ?? []} isRequired />
        <TextInputField control={control} name="zip" label="ZIP" isRequired />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-default-200 p-3">
        <legend className="px-1 text-sm font-medium">Location (optional)</legend>
        <div className="grid grid-cols-2 gap-3">
          <TextInputField control={control} name="latitude" label="Latitude" />
          <TextInputField control={control} name="longitude" label="Longitude" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onPress={captureLocation} isDisabled={geoBusy}>
            {geoBusy ? 'Getting location…' : 'Use my location'}
          </Button>
          {latitude != null && (
            <Button type="button" size="sm" variant="ghost" onPress={clearLocation}>
              Clear location
            </Button>
          )}
        </div>
        {geoError && <p className="text-sm text-danger">{geoError}</p>}
        {locationSource === 'DEVICE' && (
          <p className="text-xs text-muted">
            Captured from this device
            {locationAccuracyM != null && <> · accuracy ±{locationAccuracyM} m</>}
            {locationAltitudeM != null && <> · altitude {locationAltitudeM} m</>}
            {locationCapturedAt && <> · {new Date(locationCapturedAt).toLocaleString()}</>}
          </p>
        )}
        {locationSource === 'MANUAL' && latitude != null && (
          <p className="text-xs text-muted">Coordinates entered manually.</p>
        )}
      </fieldset>

      <CheckboxField control={control} name="active" label="Facility is active" />
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" onPress={onCancel} isDisabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isDisabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </Form>
  );
}
