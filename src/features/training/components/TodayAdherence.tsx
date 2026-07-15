import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Pressable, Text, View } from 'react-native';

import { FlameIcon } from '@/components/icons';
import { Card } from '@/components/ui';
import type { SkipReason, TrainingDayStatus } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { useT, type TranslationKey } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import {
  clearTrainingDay,
  computeStreak,
  dayQuery,
  localDateKey,
  markTrainingDay,
} from '../adherence.repo';

const REASONS: SkipReason[] = ['sick', 'busy', 'travel', 'injury', 'fatigue', 'deload', 'other'];

type Tone = 'brand' | 'ink' | 'danger';
const CHOICES: { status: TrainingDayStatus; key: TranslationKey; tone: Tone }[] = [
  { status: 'trained', key: 'adherence.trained', tone: 'brand' },
  { status: 'rest', key: 'adherence.rest', tone: 'ink' },
  { status: 'skipped', key: 'adherence.skipped', tone: 'danger' },
];

const TONE_BOX: Record<Tone, string> = {
  brand: 'border-brand/40 bg-brand/10',
  ink: 'border-ink-700 bg-ink-800',
  danger: 'border-red-500/40 bg-red-500/10',
};
const TONE_TEXT: Record<Tone, string> = {
  brand: 'text-brand',
  ink: 'text-ink-200',
  danger: 'text-red-400',
};

/**
 * The "did you train today?" widget — one tap to log adherence, with a reason
 * picker when a planned session is missed. Shared by the training hub and Home.
 */
export const TodayAdherence = () => {
  const t = useT();
  const { user } = useAuth();
  const { brand } = useTheme();
  const today = localDateKey();
  const { data } = useLiveQuery(dayQuery(user?.id ?? '', today));
  const entry = data[0] ?? null;

  if (!user) return null;

  const streak = computeStreak(user.id, today);
  const mark = (status: TrainingDayStatus) => markTrainingDay(user.id, { status });
  const setReason = (skipReason: SkipReason) =>
    markTrainingDay(user.id, { status: 'skipped', skipReason });
  const undo = () => clearTrainingDay(user.id, today);

  const dotColor =
    entry?.status === 'trained' ? brand : entry?.status === 'rest' ? '#71717a' : '#ef4444';

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('adherence.title')}
        </Text>
        {streak > 0 ? (
          <View className="flex-row items-center gap-1">
            <FlameIcon color={brand} size={14} />
            <Text className="text-xs font-sans-semibold text-brand">
              {t('adherence.streak', { n: streak })}
            </Text>
          </View>
        ) : null}
      </View>

      {!entry ? (
        <>
          <Text className="mt-2 text-base font-sans-semibold text-ink-50">
            {t('adherence.todayQuestion')}
          </Text>
          <View className="mt-3 flex-row gap-2">
            {CHOICES.map((c) => (
              <Pressable
                key={c.status}
                onPress={() => mark(c.status)}
                accessibilityRole="button"
                className={`flex-1 items-center rounded-field border py-2.5 ${TONE_BOX[c.tone]}`}
              >
                <Text className={`text-sm font-sans-semibold ${TONE_TEXT[c.tone]}`}>
                  {t(c.key)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <>
          <View className="mt-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View style={{ backgroundColor: dotColor }} className="h-2.5 w-2.5 rounded-full" />
              <Text className="text-base font-sans-semibold text-ink-50">
                {t(`adherence.logged.${entry.status}` as TranslationKey)}
              </Text>
            </View>
            <Pressable onPress={undo} hitSlop={8} accessibilityRole="button">
              <Text className="text-xs font-sans-semibold text-ink-400">{t('adherence.undo')}</Text>
            </Pressable>
          </View>

          {entry.status === 'skipped' ? (
            <>
              <Text className="mb-2 mt-4 font-mono-medium text-[11px] uppercase tracking-wider text-ink-400">
                {t('adherence.whyMissed')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {REASONS.map((r) => {
                  const active = entry.skipReason === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setReason(r)}
                      accessibilityRole="button"
                      className={[
                        'rounded-full border px-3 py-1.5',
                        active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
                      ].join(' ')}
                    >
                      <Text
                        className={[
                          'text-xs font-sans-medium',
                          active ? 'text-brand' : 'text-ink-300',
                        ].join(' ')}
                      >
                        {t(`reason.${r}` as TranslationKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </>
      )}
    </Card>
  );
};
