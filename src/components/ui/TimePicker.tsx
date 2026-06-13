import { Text, View } from 'react-native';

import { WheelPicker } from './WheelPicker';

const pad2 = (n: number) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

type Props = {
  hour: number;
  minute: number;
  onChange: (t: { hour: number; minute: number }) => void;
};

/** Apple-style HH : MM wheel picker. */
export const TimePicker = ({ hour, minute, onChange }: Props) => (
  <View className="flex-row items-center justify-center rounded-2xl border border-ink-600 bg-ink-800 px-4">
    <WheelPicker
      values={HOURS}
      value={hour}
      onChange={(h) => onChange({ hour: h, minute })}
      format={pad2}
    />
    <Text className="px-2 text-2xl font-bold text-ink-300">:</Text>
    <WheelPicker
      values={MINUTES}
      value={minute}
      onChange={(m) => onChange({ hour, minute: m })}
      format={pad2}
    />
  </View>
);
