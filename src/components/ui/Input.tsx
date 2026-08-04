import { forwardRef, useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  rightSlot?: React.ReactNode;
  secureToggle?: boolean;
};

/** How long the last typed character of a secure field stays readable. */
const TAIL_REVEAL_MS = 1300;

export const Input = forwardRef<TextInput, Props>(function Input(
  {
    label,
    error,
    hint,
    rightSlot,
    secureToggle,
    secureTextEntry,
    className,
    value,
    onChangeText,
    ...rest
  },
  ref,
) {
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);
  const showToggle = secureToggle ?? !!secureTextEntry;

  // Secure fields mask in JS (not natively) so the last typed character can
  // stay visible for a beat — typing feedback without exposing the whole value.
  const masked = !!secureTextEntry && hidden;
  const [tailVisible, setTailVisible] = useState(false);
  const tailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (tailTimer.current) clearTimeout(tailTimer.current);
    },
    [],
  );

  const raw = value ?? '';
  const display = masked
    ? tailVisible && raw.length
      ? '•'.repeat(raw.length - 1) + raw.slice(-1)
      : '•'.repeat(raw.length)
    : raw;

  const handleChange = (txt: string) => {
    if (!masked) {
      onChangeText?.(txt);
      return;
    }
    // Reconstruct the real value from the masked display: growth appends the
    // newly typed characters, shrinkage truncates from the end.
    const next = txt.length >= raw.length ? raw + txt.slice(raw.length) : raw.slice(0, txt.length);
    onChangeText?.(next);
    if (txt.length > raw.length) {
      setTailVisible(true);
      if (tailTimer.current) clearTimeout(tailTimer.current);
      tailTimer.current = setTimeout(() => setTailVisible(false), TAIL_REVEAL_MS);
    }
  };

  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
          {label}
        </Text>
      ) : null}

      <View
        className={[
          'w-full flex-row items-center rounded-field border bg-ink-900 px-4',
          error ? 'border-red-500/60' : focused ? 'border-brand/60' : 'border-ink-600',
        ].join(' ')}
      >
        <TextInput
          ref={ref}
          placeholderTextColor="#71717a"
          selectionColor="#bef82b"
          // Masking happens in JS above; the native flag would hide the tail too.
          secureTextEntry={false}
          autoCorrect={masked ? false : rest.autoCorrect}
          autoCapitalize={masked ? 'none' : rest.autoCapitalize}
          {...rest}
          // Only secure fields go through the JS mask; plain inputs keep their
          // original (possibly uncontrolled) value handling.
          value={secureTextEntry ? display : value}
          onChangeText={secureTextEntry ? handleChange : onChangeText}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          className={['flex-1 py-3 text-base text-ink-50', className ?? ''].join(' ')}
        />
        {showToggle ? (
          <Pressable
            hitSlop={8}
            onPress={() => setHidden((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Text className="font-mono-medium text-xs uppercase tracking-wider text-brand">
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
