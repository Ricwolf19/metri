import { Controller, type Control, type FieldPathByValue, type FieldValues } from 'react-hook-form';

import { SegmentedControl, type Segment } from '@/components/ui';

type Props<T extends FieldValues, N extends FieldPathByValue<T, string>> = {
  control: Control<T>;
  name: N;
  label?: string;
  segments: readonly Segment<string>[];
};

/** `SegmentedControl` bound to a form field; picking the segment already chosen changes nothing. */
export const ControlledSegmentedControl = <
  T extends FieldValues,
  N extends FieldPathByValue<T, string>,
>({
  control,
  name,
  label,
  segments,
}: Props<T, N>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <SegmentedControl
        label={label}
        segments={segments}
        value={field.value}
        onChange={(next) => {
          if (next !== field.value) field.onChange(next);
        }}
      />
    )}
  />
);
