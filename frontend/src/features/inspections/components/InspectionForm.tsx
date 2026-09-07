import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form } from '@heroui/react';
import { TextInputField } from '../../../components/form/TextInputField';
import { SelectField } from '../../../components/form/SelectField';
import { TextAreaField } from '../../../components/form/TextAreaField';
import { DatePickerField } from '../../../components/form/DatePickerField';
import { useAllFacilities } from '../../facilities';
import { useAllPermitsForFacility } from '../../permits';
import { FormErrorSummary } from '../../../components/form/FormErrorSummary';
import { useApplyServerErrors } from '../../../components/form/useApplyServerErrors';
import { INSPECTION_OUTCOMES, inspectionSchema, type InspectionFormValues } from '../types/inspection';

const outcomeOptions = INSPECTION_OUTCOMES.map((o) => ({
  value: o,
  label: o.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

interface InspectionFormProps {
  defaultValues?: Partial<InspectionFormValues>;
  onSubmit: (values: InspectionFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** The failed create/update mutation's error, if any - see useApplyServerErrors. */
  serverError?: unknown;
}

export function InspectionForm({ defaultValues, onSubmit, onCancel, isSubmitting, serverError }: InspectionFormProps) {
  const { data: facilities } = useAllFacilities();
  const facilityOptions = (facilities ?? []).map((f) => ({ value: String(f.id), label: f.name }));

  const { control, handleSubmit, setError } = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    mode: 'onBlur',
    defaultValues: {
      facilityId: undefined,
      permitId: null,
      inspectorName: '',
      scheduledDate: '',
      completedDate: '',
      outcome: undefined,
      notes: '',
      ...defaultValues,
    },
  });
  useApplyServerErrors(setError, serverError);

  const facilityId = useWatch({ control, name: 'facilityId' });
  const { data: permits } = useAllPermitsForFacility(facilityId ?? null);
  const permitOptions = (permits ?? []).map((p) => ({ value: String(p.id), label: p.permitNumber }));

  return (
    <Form validationBehavior="aria" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary error={serverError} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          control={control}
          name="facilityId"
          label="Facility"
          options={facilityOptions}
          parseValue={(key) => Number(key)}
          isRequired
        />
        <SelectField
          control={control}
          name="permitId"
          label="Related permit (optional)"
          options={permitOptions}
          parseValue={(key) => Number(key)}
          placeholder={facilityId ? 'None' : 'Select a facility first'}
        />
      </div>
      <TextInputField control={control} name="inspectorName" label="Inspector name" isRequired />
      <div className="grid grid-cols-2 gap-3">
        <DatePickerField control={control} name="scheduledDate" label="Scheduled date" isRequired />
        <DatePickerField control={control} name="completedDate" label="Completed date" />
      </div>
      <SelectField control={control} name="outcome" label="Outcome" options={outcomeOptions} isRequired />
      <TextAreaField control={control} name="notes" label="Notes" />
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
