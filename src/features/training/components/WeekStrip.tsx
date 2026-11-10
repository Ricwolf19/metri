import { useLiveQuery } from '@/db/useLiveQuery';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { XIcon } from '@/components/icons';
import type { TrainingDayStatus } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { useI18n, useT } from '@/i18n';
import { formatDateKey } from '@/lib/date-format';
import { useTheme } from '@/theme/theme-context';

import { localDateKey, rangeDaysQuery } from '../adherence.repo';
import { DAY_LETTERS } from '../labels';
import { adherenceDot, adherenceMark, adherenceStatusKey } from '../adherence-colors';
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

/** A day's mark under its number: the colour of `adherenceDot` in the shape of
 * `adherenceMark` — rest a ring, missed a cross — so no two read as one dot. */
const DayMark = ({ status }: { status: TrainingDayStatus | undefined }) => {
  const theme = useTheme();
  const mark = adherenceMark(status);
  const color = adherenceDot(theme, status);
  return (
    <View className="h-2.5 w-2.5 items-center justify-center">
      {mark === 'dot' ? (
        <View style={{ backgroundColor: color }} className="h-1.5 w-1.5 rounded-full" />
      ) : mark === 'ring' ? (
        <View style={{ borderColor: color }} className="h-2 w-2 rounded-full border-[1.5px]" />
      ) : mark === 'cross' ? (
        <XIcon color={color} size={10} strokeWidth={3} />
      ) : null}
    </View>
  );
};

/**
 * Horizontally scrollable adherence strip (last 8 weeks), current week in view
 * on mount. Tapping a day opens its detail sheet (workout done, mark, why it
 * was missed…) — the calendar as a record, not just dots.
 */
export const WeekStrip = () => {
  const { user } = useAuth();
  const { locale } = useI18n();
  const t = useT();
  const scrollRef = useRef<ScrollView>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const days = trailingDays();
  const from = days[0].key;
  const to = days[days.length - 1].key;
  // Deps: the user id can resolve after mount; pinned to '' the strip stayed empty.
  const { data } = useLiveQuery(rangeDaysQuery(user?.id ?? '', from, to), [user?.id, from, to]);

  if (!user) return null;

  const byDate = new Map(data.map((d) => [d.date, d.status as TrainingDayStatus]));
  const labels = DAY_LETTERS[locale] ?? DAY_LETTERS.en;

  /** Spoken in full: the letter and the number alone do not say which day it is. */
  const dayLabel = (d: Day, status: TrainingDayStatus | undefined) => {
    const name = adherenceStatusKey(status, d.isFuture);
    return [
      formatDateKey(d.key, 'full', locale),
      name ? t(name) : null,
      d.isToday ? t('training.today') : null,
    ]
      .filter(Boolean)
      .join(', ');
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
        {days.map((d) => {
          const { key, day, weekdayIndex, isToday, isFuture } = d;
          const status = byDate.get(key);
          return (
            <Pressable
              key={key}
              onPress={() => !isFuture && setSelected(key)}
              disabled={isFuture}
              accessibilityRole="button"
              accessibilityLabel={dayLabel(d, status)}
              accessibilityState={{ selected: selected === key }}
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
                        ? 'text-ink-500'
                        : 'text-ink-300',
                  ].join(' ')}
                >
                  {day}
                </Text>
              </View>
              <DayMark status={status} />
            </Pressable>
          );
        })}
      </ScrollView>

      <DayDetailSheet date={selected} onClose={() => setSelected(null)} />
    </View>
  );
};
