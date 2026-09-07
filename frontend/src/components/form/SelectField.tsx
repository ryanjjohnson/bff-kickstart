import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Description, FieldError, Label, ListBox, Select } from '@heroui/react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  isRequired?: boolean;
  /** Converts the selected string key back into the shape the form field expects (e.g. Number for an id). */
  parseValue?: (key: string) => unknown;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  description,
  isRequired,
  parseValue,
}: SelectFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Select
          isRequired={isRequired}
          isInvalid={fieldState.invalid}
          fullWidth
          placeholder={placeholder}
          value={field.value == null || field.value === '' ? null : String(field.value)}
          onChange={(key) =>
            field.onChange(key == null ? null : parseValue ? parseValue(String(key)) : String(key))
          }
        >
          <Label>{label}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          {description && !fieldState.invalid && <Description>{description}</Description>}
          <FieldError>{fieldState.error?.message}</FieldError>
          <Select.Popover>
            <ListBox>
              {options.map((option) => (
                <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                  {option.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      )}
    />
  );
}
