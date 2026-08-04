import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { DumbbellIcon, FlameIcon } from '@/components/icons';
import { useAuth } from '@/features/auth/auth-context';
import { useT, type TranslationKey } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { dayQuery } from '../adherence.repo';
import { getDayDetail } from '../day-events';

const STATUS_DOT: Record<string, string> = {
  trained: '#bef82b',
  rest: '#52525b',
  skipped: 'rgba(239,68,68,0.85)',
};

const Row = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) => (
  <View className="flex-row items-center gap-3 py-2.5">
    <View className="h-9 w-9 items-center justify-center rounded-field bg-ink-800">{icon}</View>
    <View className="flex-1">
      <Text className="text-sm font-sans-semibold text-ink-50">{title}</Text>
      {subtitle ? <Text className="mt-0.5 text-xs text-ink-400">{subtitle}</Text> : null}
    </View>
  </View>
);

/**
 * Bottom sheet with everything the app recorded on a day: the workout done,
 * the adherence mark (and why it was missed), calculations… Future feeds
 * (weigh-ins, measurements) plug in as more rows.
 */
export const DayDetailSheet = ({
  date,
  onClose,
}: {
  /** 'YYYY-MM-DD' or null when closed. */
  date: string | null;
  onClose: () => void;
}) => {
  const t = useT();
  const { user } = useAuth();
  const { brand } = useTheme();
  const { data: adherenceRows } = useLiveQuery(dayQuery(user?.id ?? '', date ?? ''));
  const adherence = adherenceRows[0] ?? null;

  const detail = useMemo(() => (user && date ? getDayDetail(user.id, date) : null), [user, date]);

  const fmtDur = (s: number | null): string => (s ? `${Math.round(s / 60)}m` : '');

  return (
    <Modal visible={date !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable
          className="max-h-[70%] rounded-t-3xl border-t border-ink-700 bg-ink-900 px-5 pb-8 pt-4"
          onPress={() => {}}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-ink-600" />
          <Text className="text-lg font-sans-bold text-ink-50">{date}</Text>

          {adherence ? (
            <View className="mt-3 flex-row items-center gap-2.5">
              <View
                style={{ backgroundColor: STATUS_DOT[adherence.status] }}
                className="h-2.5 w-2.5 rounded-full"
              />
              <Text className="text-sm text-ink-200">
                {t(`adherence.logged.${adherence.status}` as TranslationKey)}
                {adherence.skipReason
                  ? ` · ${t(`reason.${adherence.skipReason}` as TranslationKey)}`
                  : ''}
              </Text>
            </View>
          ) : null}

          <View className="mt-2">
            {detail?.workouts.map((w) => (
              <Row
                key={w.logId}
                icon={<DumbbellIcon color={brand} size={18} />}
                title={w.dayName}
                subtitle={`${w.setCount} sets · ${w.volumeKg} kg${
                  w.durationSeconds ? ` · ${fmtDur(w.durationSeconds)}` : ''
                }`}
              />
            ))}
            {detail?.tdeeComputed ? (
              <Row icon={<FlameIcon color={brand} size={18} />} title={t('dayDetail.tdee')} />
            ) : null}
            {!adherence && !detail?.workouts.length && !detail?.tdeeComputed ? (
              <Text className="mt-4 text-center text-sm text-ink-400">{t('dayDetail.empty')}</Text>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
