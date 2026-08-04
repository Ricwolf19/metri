import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { TrainingDayStatus } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { localDateKey, rangeDaysQuery } from '../adherence.repo';
import { DAY_LETTERS } from '../labels';
import { DayDetailSheet } from './DayDetailSheet';

const WEEKS_BACK = 8;

type Day = { key: string; day: number; weekdayIndex: number; isToday: boolean; isFuture: boolean };

/** The trailing weeks as a flat, Monday-first day list ending this Sunday. */
const trailingDays = (): Day[] => {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - (WEEKS_BACK - 1) * 7);
  const todayKey = localDateKey(today);
  return Array.from({ length: WEEKS_BACK * 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = localDateKey(d);
    return {
      key,
      day: d.getDate(),
      weekdayIndex: i % 7,
      isToday: key === todayKey,
      isFuture: key > todayKey,
    };
  });
};

/**
 * Horizontally scrollable adherence strip (last 8 weeks), current week in view
 * on mount. Tapping a day opens its detail sheet (workout done, mark, why it
 * was missed…) — the calendar as a record, not just dots.
 */
export const WeekStrip = () => {
  const { user } = useAuth();
  const { locale } = useI18n();
  const { brand } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const days = trailingDays();
  const { data } = useLiveQuery(
    rangeDaysQuery(user?.id ?? '', days[0].key, days[days.length - 1].key),
  );

  if (!user) return null;

  const byDate = new Map(data.map((d) => [d.date, d.status as TrainingDayStatus]));
  const labels = DAY_LETTERS[locale] ?? DAY_LETTERS.en;

  const dotColor = (status: TrainingDayStatus | undefined): string => {
    if (status === 'trained') return brand;
    if (status === 'rest') return '#52525b';
    if (status === 'skipped') return 'rgba(239,68,68,0.8)';
    return 'transparent';
  };

  return (
    <View className="rounded-card border border-ink-700 bg-ink-850 py-3">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-3"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {days.map(({ key, day, weekdayIndex, isToday, isFuture }) => {
          const status = byDate.get(key);
          return (
            <Pressable
              key={key}
              onPress={() => !isFuture && setSelected(key)}
              accessibilityRole="button"
              className="w-11 items-center gap-1"
            >
              <Text className="font-mono-medium text-[10px] uppercase text-ink-500">
                {labels[weekdayIndex]}
              </Text>
              <View
                className={[
                  'h-8 w-8 items-center justify-center rounded-full',
                  isToday ? 'border border-brand/50' : '',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-xs',
                    isToday
                      ? 'font-sans-semibold text-brand'
                      : isFuture
                        ? 'text-ink-600'
                        : 'text-ink-300',
                  ].join(' ')}
                >
                  {day}
                </Text>
              </View>
              <View
                style={{ backgroundColor: dotColor(status) }}
                className="h-1.5 w-1.5 rounded-full"
              />
            </Pressable>
          );
        })}
      </ScrollView>

      <DayDetailSheet date={selected} onClose={() => setSelected(null)} />
    </View>
  );
};
