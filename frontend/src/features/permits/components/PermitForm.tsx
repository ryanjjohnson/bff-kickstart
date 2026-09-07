import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form } from '@heroui/react';
import { TextInputField } from '../../../components/form/TextInputField';
import { SelectField } from '../../../components/form/SelectField';
import { TextAreaField } from '../../../components/form/TextAreaField';
import { DatePickerField } from '../../../components/form/DatePickerField';
import { FormErrorSummary } from '../../../components/form/FormErrorSummary';
import { useApplyServerErrors } from '../../../components/form/useApplyServerErrors';
import { useAllFacilities } from '../../facilities';
import { PERMIT_STATUSES, PERMIT_TYPES, permitSchema, type PermitFormValues } from '../types/permit';

const typeOptions = PERMIT_TYPES.map((t) => ({ value: t, label: t }));
const statusOptions = PERMIT_STATUSES.map((s) => ({
  value: s,
  label: s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

interface PermitFormProps {
  defaultValues?: Partial<PermitFormValues>;
  onSubmit: (values: PermitFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** The failed create/update mutation's error, if any - see useApplyServerErrors. */
  serverError?: unknown;
}

export function PermitForm({ defaultValues, onSubmit, onCancel, isSubmitting, serverError }: PermitFormProps) {
  const { data: facilities } = useAllFacilities();
  const facilityOptions = (facilities ?? []).map((f) => ({ value: String(f.id), label: f.name }));

  const { control, handleSubmit, setError } = useForm<PermitFormValues>({
    resolver: zodResolver(permitSchema),
    mode: 'onBlur',
    defaultValues: {
      facilityId: undefined,
      permitNumber: '',
      permitType: undefined,
      status: undefined,
      description: '',
      issuedDate: '',
      expirationDate: '',
      ...defaultValues,
    },
  });
  useApplyServerErrors(setError, serverError);

  return (
    <Form validationBehavior="aria" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary error={serverError} />
      <SelectField
        control={control}
        name="facilityId"
        label="Facility"
        options={facilityOptions}
        parseValue={(key) => Number(key)}
        isRequired
      />
      <div className="grid grid-cols-2 gap-3">
        <TextInputField control={control} name="permitNumber" label="Permit number" isRequired />
        <SelectField control={control} name="permitType" label="Permit type" options={typeOptions} isRequired />
      </div>
      <SelectField control={control} name="status" label="Status" options={statusOptions} isRequired />
      <div className="grid grid-cols-2 gap-3">
        <DatePickerField control={control} name="issuedDate" label="Issued date" />
        <DatePickerField control={control} name="expirationDate" label="Expiration date" />
      </div>
      <TextAreaField control={control} name="description" label="Description" />
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
