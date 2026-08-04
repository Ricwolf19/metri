import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { CheckIcon, FlameIcon } from '@/components/icons';
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

const STATUS_DOT: Record<TrainingDayStatus, string> = {
  trained: '#bef82b',
  rest: '#52525b',
  skipped: 'rgba(239,68,68,0.85)',
};

/** Springy check that pops in when the day gets closed (the Duolingo moment). */
const ClosedBadge = ({ status }: { status: TrainingDayStatus }) => {
  const scale = useSharedValue(0.3);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 260 });
  }, [scale]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      style={anim}
      className={[
        'h-9 w-9 items-center justify-center rounded-full',
        status === 'trained' ? 'bg-brand' : status === 'rest' ? 'bg-ink-600' : 'bg-red-500/80',
      ].join(' ')}
    >
      <CheckIcon color={status === 'rest' ? '#fafafa' : '#08090d'} size={20} />
    </Animated.View>
  );
};

/**
 * The daily check-in. One tap closes the day (with a springy check, streak
 * pop); "missed" asks the reason once and then closes too. Undo stays
 * available in the compact state — nothing traps the user.
 */
export const TodayAdherence = () => {
  const t = useT();
  const { user } = useAuth();
  const { brand } = useTheme();
  const today = localDateKey();
  const { data } = useLiveQuery(dayQuery(user?.id ?? '', today));
  const entry = data[0] ?? null;

  // "skipped" stays open until a reason is picked, then the card closes.
  const pendingReason = entry?.status === 'skipped' && !entry.skipReason;
  const streakPop = useSharedValue(1);

  // Pop the flame when today lands as "trained". Effect (not handler), and
  // declared before useAnimatedStyle captures the value — both compiler rules.
  const trainedToday = entry?.status === 'trained';
  useEffect(() => {
    if (!trainedToday) return;
    streakPop.value = 1.6;
    streakPop.value = withSpring(1, { damping: 7, stiffness: 220 });
  }, [trainedToday, streakPop]);

  const streakAnim = useAnimatedStyle(() => ({ transform: [{ scale: streakPop.value }] }));

  if (!user) return null;

  const streak = computeStreak(user.id, today);
  const mark = (status: TrainingDayStatus) => markTrainingDay(user.id, { status });
  const setReason = (skipReason: SkipReason) =>
    markTrainingDay(user.id, { status: 'skipped', skipReason });
  const undo = () => clearTrainingDay(user.id, today);

  const closed = entry && !pendingReason;

  return (
    <Card
      // The open states (question / reasons) share a fixed footprint so mid-
      // interaction nothing below jumps; once closed the card compacts.
      className={[
        closed ? '' : 'min-h-[150px]',
        closed && entry.status === 'trained' ? 'border-brand/30' : '',
      ].join(' ')}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('adherence.title')}
        </Text>
        {streak > 0 ? (
          <Animated.View style={streakAnim} className="flex-row items-center gap-1">
            <FlameIcon color={brand} size={14} />
            <Text className="text-xs font-sans-semibold text-brand">
              {t('adherence.streak', { n: streak })}
            </Text>
          </Animated.View>
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
                className={`flex-1 items-center rounded-field border py-3 ${TONE_BOX[c.tone]}`}
              >
                <Text className={`text-sm font-sans-semibold ${TONE_TEXT[c.tone]}`}>
                  {t(c.key)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : pendingReason ? (
        <>
          <Text className="mb-2 mt-3 font-mono-medium text-[11px] uppercase tracking-wider text-ink-400">
            {t('adherence.whyMissed')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {REASONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                accessibilityRole="button"
                className="rounded-full border border-ink-700 bg-ink-800 px-3 py-1.5"
              >
                <Text className="text-xs font-sans-medium text-ink-300">
                  {t(`reason.${r}` as TranslationKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <View className="mt-3 flex-row items-center gap-3">
          <ClosedBadge status={entry.status} />
          <View className="flex-1">
            <Text className="text-base font-sans-semibold text-ink-50">
              {t(`adherence.logged.${entry.status}` as TranslationKey)}
            </Text>
            {entry.skipReason ? (
              <Text className="mt-0.5 text-xs text-ink-400">
                {t(`reason.${entry.skipReason}` as TranslationKey)}
              </Text>
            ) : (
              <View
                style={{ backgroundColor: STATUS_DOT[entry.status] }}
                className="mt-1 h-1.5 w-8 rounded-full"
              />
            )}
          </View>
          <Pressable onPress={undo} hitSlop={8} accessibilityRole="button">
            <Text className="text-xs font-sans-semibold text-ink-400">{t('adherence.undo')}</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
};
