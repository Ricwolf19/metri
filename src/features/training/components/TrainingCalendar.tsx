import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { Card } from '@/components/ui';
import type { TrainingDayStatus } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { localDateKey, monthDaysQuery } from '../adherence.repo';

// Display-only labels (kept local — not worth i18n key bloat).
const MONTHS: Record<string, string[]> = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  es: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
};
// Week starts Monday (common in MX/EU).
const WEEKDAYS: Record<string, string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  es: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
};

const currentYm = (): string => localDateKey().slice(0, 7);

const shiftMonth = (ym: string, delta: number): string => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;
};

type Cell = { day: number; key: string; status?: TrainingDayStatus; future: boolean } | null;

/** Monthly consistency heatmap. Green = trained, muted = rest, red = missed. */
export const TrainingCalendar = () => {
  const { user } = useAuth();
  const { locale } = useI18n();
  const { brand } = useTheme();
  const [ym, setYm] = useState(currentYm);

  const { data } = useLiveQuery(monthDaysQuery(user?.id ?? '', ym));

  if (!user) return null;

  const byDate = new Map(data.map((d) => [d.date, d.status]));
  const [year, month] = ym.split('-').map(Number);
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first offset
  const today = localDateKey();

  const cells: Cell[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${ym}-${`${day}`.padStart(2, '0')}`;
    cells.push({ day, key, status: byDate.get(key), future: key > today });
  }

  const atCurrentMonth = ym >= currentYm();

  const colorFor = (cell: NonNullable<Cell>): string => {
    if (cell.status === 'trained') return brand;
    if (cell.status === 'rest') return '#3f3f46'; // ink-700
    if (cell.status === 'skipped') return 'rgba(239,68,68,0.65)';
    return cell.future ? 'transparent' : '#18181b'; // ink-850 for empty past days
  };
  const textFor = (cell: NonNullable<Cell>): string => {
    if (cell.status === 'trained') return '#09090b';
    if (cell.key === today) return brand;
    return cell.future ? '#3f3f46' : '#71717a';
  };

  const months = MONTHS[locale] ?? MONTHS.en;
  const weekdays = WEEKDAYS[locale] ?? WEEKDAYS.en;

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => setYm((m) => shiftMonth(m, -1))}
          hitSlop={8}
          accessibilityRole="button"
          className="h-8 w-8 items-center justify-center rounded-full bg-ink-800"
        >
          <ChevronLeftIcon color="#a1a1aa" size={18} />
        </Pressable>
        <Text className="text-sm font-sans-semibold text-ink-100">
          {months[month - 1]} {year}
        </Text>
        <Pressable
          onPress={() => setYm((m) => shiftMonth(m, 1))}
          hitSlop={8}
          disabled={atCurrentMonth}
          accessibilityRole="button"
          className={[
            'h-8 w-8 items-center justify-center rounded-full bg-ink-800',
            atCurrentMonth ? 'opacity-30' : '',
          ].join(' ')}
        >
          <ChevronRightIcon color="#a1a1aa" size={18} />
        </Pressable>
      </View>

      <View className="mt-3 flex-row">
        {weekdays.map((w, i) => (
          <View key={i} className="items-center" style={{ width: `${100 / 7}%` }}>
            <Text className="font-mono-medium text-[10px] uppercase text-ink-500">{w}</Text>
          </View>
        ))}
      </View>

      <View className="mt-1 flex-row flex-wrap">
        {cells.map((cell, i) => (
          <View key={i} className="items-center py-1" style={{ width: `${100 / 7}%` }}>
            {cell ? (
              <View
                style={{ backgroundColor: colorFor(cell) }}
                className="h-8 w-8 items-center justify-center rounded-md"
              >
                <Text
                  style={{ color: textFor(cell) }}
                  className={['text-[11px]', cell.status ? 'font-sans-semibold' : ''].join(' ')}
                >
                  {cell.day}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </Card>
  );
};
