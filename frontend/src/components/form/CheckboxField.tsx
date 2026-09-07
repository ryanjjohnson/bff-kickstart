import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Checkbox } from '@heroui/react';

interface CheckboxFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
}

export function CheckboxField<T extends FieldValues>({ control, name, label }: CheckboxFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Checkbox isSelected={!!field.value} onChange={field.onChange}>
          {label}
        </Checkbox>
      )}
    />
  );
}
