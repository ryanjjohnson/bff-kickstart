import { useMemo, useState } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { ComboBox, FieldError, Input, Label, ListBox } from '@heroui/react';

export interface StateComboBoxOption {
  code: string;
  name: string;
}

interface StateComboBoxFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: StateComboBoxOption[];
  isRequired?: boolean;
}

/**
 * Freeform 2-letter entry, not a closed pick-from-list dropdown - some addresses
 * aren't in the US, so `options` (the known state/territory codes) is only ever
 * a suggestion list. `allowsCustomValue` is what lets typing a code not in the
 * list still be accepted; the surrounding zod schema (not this component)
 * enforces "2 A-Z letters" - same validation as every other field.
 */
export function StateComboBoxField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  isRequired,
}: StateComboBoxFieldProps<T>) {
  const [filterText, setFilterText] = useState('');

  const filteredOptions = useMemo(() => {
    const q = filterText.trim().toUpperCase();
    if (!q) return options;
    return options.filter((o) => o.code.startsWith(q) || o.name.toUpperCase().includes(q));
  }, [filterText, options]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <ComboBox
          allowsCustomValue
          fullWidth
          isRequired={isRequired}
          isInvalid={fieldState.invalid}
          inputValue={field.value ?? ''}
          onInputChange={(value) => {
            const next = value.toUpperCase().slice(0, 2);
            setFilterText(next);
            field.onChange(next);
          }}
          onSelectionChange={(key) => {
            if (key != null) {
              field.onChange(String(key));
            }
          }}
          onBlur={field.onBlur}
        >
          <Label>{label}</Label>
          <ComboBox.InputGroup>
            <Input ref={field.ref} />
          </ComboBox.InputGroup>
          <FieldError>{fieldState.error?.message}</FieldError>
          <ComboBox.Popover>
            <ListBox>
              {filteredOptions.map((option) => (
                <ListBox.Item key={option.code} id={option.code} textValue={option.code}>
                  {option.code} - {option.name}
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>
      )}
    />
  );
}
