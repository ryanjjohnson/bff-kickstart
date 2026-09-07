import { useForm } from 'react-hook-form';
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
  type FacilityFormValues,
} from '../types/facility';

const typeOptions = FACILITY_TYPES.map((t) => ({ value: t, label: FACILITY_TYPE_LABELS[t] }));

interface FacilityFormProps {
  defaultValues?: Partial<FacilityFormValues>;
  onSubmit: (values: FacilityFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** The failed create/update mutation's error, if any - see useApplyServerErrors. */
  serverError?: unknown;
}

export function FacilityForm({ defaultValues, onSubmit, onCancel, isSubmitting, serverError }: FacilityFormProps) {
  const { control, handleSubmit, setError } = useForm<FacilityFormValues>({
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
      ...defaultValues,
    },
  });
  useApplyServerErrors(setError, serverError);

  const { data: stateCodes } = useStateCodes();

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
