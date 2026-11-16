import type { ComponentProps } from 'react';
import {
  Controller,
  type Control,
  type FieldPathByValue,
  type FieldValues,
  type UseControllerProps,
} from 'react-hook-form';

import { Input } from '@/components/ui';

/** Text fields; an optional one (`detail?: string`) reads as empty. */
type TextPath<T extends FieldValues> = FieldPathByValue<T, string | undefined>;

type Props<T extends FieldValues, N extends TextPath<T>> = Omit<
  ComponentProps<typeof Input>,
  'ref' | 'value' | 'onChangeText'
> & {
  control: Control<T>;
  name: N;
  rules?: UseControllerProps<T, N>['rules'];
};

/**
 * `Input` bound to a text field of a `useSaveForm`: value, typing and blur go
 * through the form (nothing is written while typing), and a broken rule's
 * message — when the rule carries one — shows under the field. An `error`
 * passed in (a refusal from the server) wins over the rule's.
 */
export const ControlledInput = <T extends FieldValues, N extends TextPath<T>>({
  control,
  name,
  rules,
  onBlur,
  error,
  ...input
}: Props<T, N>) => (
  <Controller
    control={control}
    name={name}
    rules={rules}
    render={({ field, fieldState }) => (
      <Input
        {...input}
        ref={field.ref}
        value={field.value ?? ''}
        onChangeText={field.onChange}
        onBlur={(e) => {
          field.onBlur();
          onBlur?.(e);
        }}
        error={error ?? (fieldState.error?.message || undefined)}
      />
    )}
  />
);
