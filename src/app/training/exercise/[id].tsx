import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, Screen, ScreenTitle, TextLink } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { CalcChart } from '@/features/calculators/components/CalcChart';
import type { CalcChart as Chart } from '@/features/calculators/types';
import { ExerciseFrames } from '@/features/training/components/ExerciseFrames';
import { getExercise } from '@/features/training/exercises.repo';
import { EXERCISE_CONTENT } from '@/features/training/exercise-content';
import { visualIdFor } from '@/features/training/exercise-visuals';
import { exerciseDisplayName } from '@/features/training/labels';
import { fromKg } from '@/features/training/progression';
import { exerciseHistory, topSetByWeek } from '@/features/training/stats.repo';
import { useI18n, useT } from '@/i18n';
import { settings, type Units } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTheme } from '@/theme/theme-context';

/** "100×6,6,5" when the weight holds, "100×6 · 95×8" when it varies. */
const fmtSession = (sets: { weightKg: number; reps: number }[], unit: Units): string => {
  const first = sets[0]?.weightKg ?? 0;
  if (sets.every((s) => s.weightKg === first)) {
    return `${fromKg(first, unit)}${unit} × ${sets.map((s) => s.reps).join(',')}`;
  }
  return sets.map((s) => `${fromKg(s.weightKg, unit)}×${s.reps}`).join(' · ');
};

/**
 * Per-exercise history: the top-set trend per week plus every logged session.
 * Reached from the live session (tap the exercise name) and from Progress.
 */
const CueList = ({ title, items }: { title: string; items: string[] }) => (
  <View className="mt-4">
    <Text className="mb-1.5 text-xs font-sans-semibold uppercase tracking-wide text-ink-400">
      {title}
    </Text>
    <View className="gap-2">
      {items.map((item, i) => (
        <View key={i} className="flex-row gap-2">
          <Text className="text-sm leading-6 text-ink-500">•</Text>
          <Text className="flex-1 text-sm leading-6 text-ink-300">
            {item.split('**').map((part, j) =>
              j % 2 === 1 ? (
                <Text key={j} className="font-sans-semibold text-ink-100">
                  {part}
                </Text>
              ) : (
                part
              ),
            )}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const ExerciseHistory = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const t = useT();
  const { locale } = useI18n();
  const { dayMonth } = useDateFormat();
  const { brand } = useTheme();
  const unit = settings.getUnits();

  const exercise = id ? getExercise(id) : null;
  const sessions = useMemo(() => (user && id ? exerciseHistory(user.id, id) : []), [user, id]);
  const weekly = useMemo(() => topSetByWeek(sessions), [sessions]);

  const chart: Chart = {
    kind: 'bars',
    max: Math.max(1, ...weekly.map((w) => w.topKg)),
    bars: weekly.map((w, i) => ({
      label: w.label,
      value: w.topKg,
      display: `${fromKg(w.topKg, unit)}${unit}`,
      color: brand,
      highlight: i === weekly.length - 1,
    })),
  };

  const dateLabel = dayMonth;
  const content = id ? (EXERCISE_CONTENT[id]?.[locale] ?? null) : null;
  const visualId = exercise ? visualIdFor(exercise) : null;

  return (
    <Screen scroll contentClassName="px-5 pb-10" header={<TopBar showBack />}>
      <ScreenTitle
        title={exercise ? exerciseDisplayName(exercise, locale) : t('exHistory.title')}
        subtitle={t('exHistory.subtitle')}
      />

      {exercise && visualId ? (
        <FadeInUp>
          <View className="mb-4">
            <ExerciseFrames
              visualId={visualId}
              accessibilityLabel={exerciseDisplayName(exercise, locale)}
            />
            <View className="mt-1.5 items-center">
              <TextLink
                label={t('exercise.illustrationCredit')}
                onPress={() => Linking.openURL('https://creativecommons.org/licenses/by-sa/4.0/')}
              />
            </View>
          </View>
        </FadeInUp>
      ) : null}

      {/* Technique cues — curated catalog exercises only. */}
      {content ? (
        <FadeInUp>
          <Card className="mb-4">
            <Text className="font-mono-medium text-xs uppercase tracking-wider text-brand">
              {t('exercise.techniqueTitle')}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-ink-200">{content.summary}</Text>
            {content.setup?.length ? (
              <CueList title={t('exercise.setup')} items={content.setup} />
            ) : null}
            {content.execution.length ? (
              <CueList title={t('exercise.execution')} items={content.execution} />
            ) : null}
            {content.mistakes.length ? (
              <CueList title={t('exercise.mistakes')} items={content.mistakes} />
            ) : null}
            {content.notes?.length ? (
              <CueList title={t('exercise.notes')} items={content.notes} />
            ) : null}
          </Card>
        </FadeInUp>
      ) : null}

      {sessions.length === 0 ? (
        <Card>
          <Text className="text-sm text-ink-400">{t('exHistory.empty')}</Text>
        </Card>
      ) : (
        <>
          {weekly.length > 1 ? (
            <FadeInUp>
              <Card>
                <Text className="mb-3 text-xs text-ink-400">{t('exHistory.topSetWeek')}</Text>
                <CalcChart chart={chart} />
              </Card>
            </FadeInUp>
          ) : null}

          <Text className="mb-2 mt-7 text-sm font-sans-semibold text-ink-200">
            {t('exHistory.sessions')}
          </Text>
          <View className="gap-2">
            {sessions.map((s, i) => (
              <FadeInUp key={s.logId} delay={Math.min(i, 6) * 40}>
                <Card className="flex-row items-center py-3">
                  <Text className="w-16 shrink-0 text-xs text-ink-400">
                    {dateLabel(s.completedAt)}
                  </Text>
                  <Text className="flex-1 font-mono text-sm text-ink-100" numberOfLines={2}>
                    {fmtSession(s.sets, unit)}
                  </Text>
                </Card>
              </FadeInUp>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
};

export default ExerciseHistory;
