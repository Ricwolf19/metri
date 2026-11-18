import { Pressable, View } from 'react-native';

/**
 * The capture button: a white ring around a white disc for a photo, a red
 * disc to record and a red square to stop. 72 dp — the one control a thumb
 * finds without looking.
 */
export const CaptureShutter = ({
  mode,
  recording,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  mode: 'photo' | 'video';
  recording: boolean;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ disabled }}
    className={[
      'h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-ink-50',
      disabled ? 'opacity-40' : 'active:opacity-80',
    ].join(' ')}
  >
    {mode === 'photo' ? (
      <View className="h-14 w-14 rounded-full bg-ink-50" />
    ) : recording ? (
      <View className="h-7 w-7 rounded-md bg-red-500" />
    ) : (
      <View className="h-14 w-14 rounded-full bg-red-500" />
    )}
  </Pressable>
);
