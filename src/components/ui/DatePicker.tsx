import { View } from 'react-native';

import { WheelPicker } from './WheelPicker';

const pad2 = (n: number) => String(n).padStart(2, '0');
const daysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

type Props = { value: Date; onChange: (d: Date) => void; yearsBack?: number };

/** Apple-style day / month / year wheel picker (recent years only). */
export const DatePicker = ({ value, onChange, yearsBack = 8 }: Props) => {
  const year = value.getFullYear();
  const month = value.getMonth();
  const day = value.getDate();

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: yearsBack }, (_, i) => thisYear - (yearsBack - 1) + i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);

  const update = (y: number, m: number, d: number) =>
    onChange(new Date(y, m, Math.min(d, daysInMonth(y, m))));

  return (
    <View className="flex-row items-center justify-center rounded-2xl border border-ink-600 bg-ink-800 px-4">
      <WheelPicker
        values={days}
        value={day}
        onChange={(d) => update(year, month, d)}
        format={pad2}
      />
      <WheelPicker
        values={months}
        value={month}
        onChange={(m) => update(year, m, day)}
        format={(m) => pad2(m + 1)}
      />
      <WheelPicker values={years} value={year} onChange={(y) => update(y, month, day)} />
    </View>
  );
};
