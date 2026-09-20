import { Text, View } from 'react-native';

import { WheelPicker } from './WheelPicker';

const pad2 = (n: number) => String(n).padStart(2, '0');
const MINUTES = Array.from({ length: 11 }, (_, i) => i); // 0…10 min covers any rest
const SECONDS = Array.from({ length: 12 }, (_, i) => i * 5); // 5 s granularity

type Props = {
  /** Total duration in seconds. */
  seconds: number;
  onChange: (seconds: number) => void;
};

/** MM : SS wheel picker (rest times), sibling of the HH:MM `TimePicker`. */
export const DurationPicker = ({ seconds, onChange }: Props) => {
  const m = Math.floor(seconds / 60);
  // Legacy values may not sit on the 5 s grid; snap so the wheel still lands.
  const s = Math.min(55, Math.round((seconds % 60) / 5) * 5);

  return (
    <View className="flex-row items-center justify-center rounded-card border border-ink-600 bg-ink-800 px-4">
      <WheelPicker
        values={MINUTES}
        value={m}
        onChange={(next) => onChange(next * 60 + s)}
        format={pad2}
      />
      <Text className="px-2 text-2xl font-sans-bold text-ink-300">:</Text>
      <WheelPicker
        values={SECONDS}
        value={s}
        onChange={(next) => onChange(m * 60 + next)}
        format={pad2}
      />
    </View>
  );
};
