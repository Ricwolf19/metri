import { Text, View } from 'react-native';

import type { ClockFormat } from '@/lib/storage';

import { WheelPicker } from './WheelPicker';

const pad2 = (n: number) => String(n).padStart(2, '0');
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1…12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = [0, 1]; // 0 = AM, 1 = PM

type Props = {
  hour: number; // always 24h (0…23) — `clock` only changes how it's shown
  minute: number;
  onChange: (t: { hour: number; minute: number }) => void;
  clock?: ClockFormat;
};

/** Apple-style HH : MM wheel picker; adds an AM/PM column when `clock` is 12h. */
export const TimePicker = ({ hour, minute, onChange, clock = '24' }: Props) => {
  if (clock === '12') {
    const h12 = hour % 12 || 12;
    const period = hour < 12 ? 0 : 1;
    const to24 = (h: number, p: number) => (h % 12) + (p === 1 ? 12 : 0);
    return (
      <View className="flex-row items-center justify-center rounded-2xl border border-ink-600 bg-ink-800 px-4">
        <WheelPicker
          values={HOURS_12}
          value={h12}
          onChange={(h) => onChange({ hour: to24(h, period), minute })}
          format={String}
        />
        <Text className="px-2 text-2xl font-bold text-ink-300">:</Text>
        <WheelPicker
          values={MINUTES}
          value={minute}
          onChange={(m) => onChange({ hour, minute: m })}
          format={pad2}
        />
        <WheelPicker
          values={PERIODS}
          value={period}
          onChange={(p) => onChange({ hour: to24(h12, p), minute })}
          format={(p) => (p === 0 ? 'AM' : 'PM')}
        />
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-center rounded-2xl border border-ink-600 bg-ink-800 px-4">
      <WheelPicker
        values={HOURS_24}
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
};
