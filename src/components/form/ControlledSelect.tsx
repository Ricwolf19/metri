import { Controller, type Control, type FieldPathByValue, type FieldValues } from 'react-hook-form';

import { Select, type SelectItem } from '@/components/ui';

type Props<T extends FieldValues, N extends FieldPathByValue<T, string | undefined>> = {
  control: Control<T>;
  name: N;
  label?: string;
  items: SelectItem<string>[];
  placeholder?: string;
};

/** `Select` bound to a form field (`undefined` = nothing chosen yet). */
export const ControlledSelect = <
  T extends FieldValues,
  N extends FieldPathByValue<T, string | undefined>,
>({
  control,
  name,
  label,
  items,
  placeholder,
}: Props<T, N>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <Select
        label={label}
        items={items}
        value={field.value}
        placeholder={placeholder}
        onChange={(next) => {
          if (next !== field.value) field.onChange(next);
        }}
      />
    )}
  />
);
