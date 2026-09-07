import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { parseDate, type DateValue } from '@internationalized/date';
import type { DateSegment } from 'react-stately/useDateFieldState';
import {
  Calendar,
  DateField,
  DatePicker,
  Description,
  FieldError,
  Label,
} from '@heroui/react';

interface DatePickerFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  isRequired?: boolean;
}

/**
 * The form value stays a plain "YYYY-MM-DD" string throughout (what zod validates and what the
 * backend's LocalDate fields expect) - only converted to/from @internationalized/date's CalendarDate
 * at this component's boundary, since that's what HeroUI's DatePicker/Calendar need internally.
 */
export function DatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  isRequired,
}: DatePickerFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DatePicker
          isRequired={isRequired}
          isInvalid={fieldState.invalid}
          value={field.value ? parseDate(field.value) : null}
          onChange={(date: DateValue | null) => field.onChange(date ? date.toString() : '')}
          onBlur={field.onBlur}
        >
          <Label>{label}</Label>
          <DateField.Group fullWidth>
            <DateField.Input>
              {(segment: DateSegment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
            <DatePicker.Trigger>
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateField.Group>
          {description && !fieldState.invalid && <Description>{description}</Description>}
          <FieldError>{fieldState.error?.message}</FieldError>
          <DatePicker.Popover>
            <Calendar>
              <Calendar.Header>
                <Calendar.NavButton slot="previous" />
                <Calendar.Heading />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
              </Calendar.Grid>
            </Calendar>
          </DatePicker.Popover>
        </DatePicker>
      )}
    />
  );
}
