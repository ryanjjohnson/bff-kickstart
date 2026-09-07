import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Description, FieldError, Input, Label, TextField } from '@heroui/react';

interface TextInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  placeholder?: string;
  type?: string;
  isRequired?: boolean;
}

export function TextInputField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  type = 'text',
  isRequired,
}: TextInputFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          fullWidth
          isRequired={isRequired}
          isInvalid={fieldState.invalid}
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
        >
          <Label>{label}</Label>
          <Input type={type} placeholder={placeholder} ref={field.ref} />
          {description && !fieldState.invalid && <Description>{description}</Description>}
          <FieldError>{fieldState.error?.message}</FieldError>
        </TextField>
      )}
    />
  );
}
