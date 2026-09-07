import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Description, FieldError, Label, TextArea, TextField } from '@heroui/react';

interface TextAreaFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  placeholder?: string;
}

export function TextAreaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
}: TextAreaFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          fullWidth
          isInvalid={fieldState.invalid}
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
        >
          <Label>{label}</Label>
          <TextArea placeholder={placeholder} ref={field.ref} rows={3} />
          {description && !fieldState.invalid && <Description>{description}</Description>}
          <FieldError>{fieldState.error?.message}</FieldError>
        </TextField>
      )}
    />
  );
}
