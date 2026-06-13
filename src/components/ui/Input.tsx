import { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  rightSlot?: React.ReactNode;
  secureToggle?: boolean;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, hint, rightSlot, secureToggle, secureTextEntry, className, ...rest },
  ref,
) {
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const showToggle = secureToggle ?? !!secureTextEntry;

  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-300">
          {label}
        </Text>
      ) : null}

      <View
        className={[
          'w-full flex-row items-center rounded-xl border bg-ink-800 px-4',
          error ? 'border-red-500/60' : 'border-ink-600',
        ].join(' ')}
      >
        <TextInput
          ref={ref}
          placeholderTextColor="#566077"
          selectionColor="#bef82b"
          secureTextEntry={showToggle ? hidden : secureTextEntry}
          className={['flex-1 py-3 text-base text-ink-50', className ?? ''].join(' ')}
          {...rest}
        />
        {showToggle ? (
          <Pressable
            hitSlop={8}
            onPress={() => setHidden((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Text className="text-xs font-semibold uppercase tracking-wider text-lime-400">
              {hidden ? 'Show' : 'Hide'}
            </Text>
          </Pressable>
        ) : (
          rightSlot
        )}
      </View>

      {error ? (
        <Text className="mt-1.5 text-xs text-red-400">{error}</Text>
      ) : hint ? (
        <Text className="mt-1.5 text-xs text-ink-400">{hint}</Text>
      ) : null}
    </View>
  );
});
