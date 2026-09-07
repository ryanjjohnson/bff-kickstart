import { ListBox, Select } from '@heroui/react';

const ALL = '__ALL__';

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  /** '' means "no filter" / show everything. */
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder: string;
  allLabel?: string;
  className?: string;
}

/** A standalone (non-form) filter dropdown with a built-in "show everything" option. */
export function FilterSelect({ value, onChange, options, placeholder, allLabel = 'All', className }: FilterSelectProps) {
  return (
    <Select
      value={value || ALL}
      onChange={(key) => onChange(key == null || key === ALL ? '' : String(key))}
      placeholder={placeholder}
      className={className}
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id={ALL} textValue={allLabel}>
            {allLabel}
          </ListBox.Item>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
