import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { TrainingDayStatus } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { localDateKey, rangeDaysQuery } from '../adherence.repo';

// Monday-first single letters (display-only, matches TrainingCalendar).
const WEEKDAYS: Record<string, string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  es: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
};

/** The current week's seven days keyed 'YYYY-MM-DD', Monday first. */
const currentWeek = (): { key: string; day: number; isToday: boolean }[] => {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const todayKey = localDateKey(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = localDateKey(d);
    return { key, day: d.getDate(), isToday: key === todayKey };
  });
};

/**
 * Compact 7-day adherence strip for Home — the mini calendar. Green = trained,
 * muted = rest, red = missed. Tapping opens the training hub (full month view).
 */
export const WeekStrip = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useI18n();
  const { brand } = useTheme();

  const week = currentWeek();
  const { data } = useLiveQuery(rangeDaysQuery(user?.id ?? '', week[0].key, week[6].key));

  if (!user) return null;

  const byDate = new Map(data.map((d) => [d.date, d.status as TrainingDayStatus]));
  const labels = WEEKDAYS[locale] ?? WEEKDAYS.en;

  const dotColor = (status: TrainingDayStatus | undefined): string => {
    if (status === 'trained') return brand;
    if (status === 'rest') return '#52525b';
    if (status === 'skipped') return 'rgba(239,68,68,0.8)';
    return 'transparent';
  };

  return (
    <Pressable
      onPress={() => router.push('/training')}
      accessibilityRole="button"
      className="flex-row justify-between rounded-card border border-ink-700 bg-ink-850 px-4 py-3"
    >
      {week.map(({ key, day, isToday }, i) => {
        const status = byDate.get(key);
        return (
          <View key={key} className="items-center gap-1">
            <Text className="font-mono-medium text-[10px] uppercase text-ink-500">{labels[i]}</Text>
            <View
              className={[
                'h-8 w-8 items-center justify-center rounded-full',
                isToday ? 'border border-brand/50' : '',
              ].join(' ')}
            >
              <Text
                className={[
                  'text-xs',
                  isToday ? 'font-sans-semibold text-brand' : 'text-ink-300',
                ].join(' ')}
              >
                {day}
              </Text>
            </View>
            <View
              style={{ backgroundColor: dotColor(status) }}
              className="h-1.5 w-1.5 rounded-full"
            />
          </View>
        );
      })}
    </Pressable>
  );
};
