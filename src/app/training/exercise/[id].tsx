import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { ShareIcon, StarIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Card,
  DurationPicker,
  FadeInUp,
  IconButton,
  Screen,
  ScreenTitle,
  TextLink,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { BadgesEditor } from '@/features/training/components/BadgesEditor';
import { ExerciseDocButton } from '@/features/training/components/ExerciseDocButton';
import { ExerciseFrames } from '@/features/training/components/ExerciseFrames';
import { ExerciseTrendCard } from '@/features/training/components/ExerciseTrendCard';
import { MachineLoadChooser } from '@/features/training/components/MachineLoadChooser';
import { ExerciseNote } from '@/features/training/components/ExerciseNote';
import { getExercise } from '@/features/training/exercises.repo';
import { EXERCISE_CONTENT } from '@/features/training/exercise-content';
import { buildExerciseSeries } from '@/features/training/exercise-trend';
import { exerciseShareModel } from '@/features/share/models';
import { ShareSheet } from '@/features/share/ShareSheet';
import {
  getExerciseSetting,
  upsertExerciseSetting,
  type SettingPatch,
} from '@/features/training/exercise-settings.repo';
import { visualIdFor } from '@/features/training/exercise-visuals';
import { exerciseDisplayName } from '@/features/training/labels';
import {
  machineLoadKind,
  PLATE_MACHINE_SEED,
  POST_MACHINE_SEED,
  STACK_MACHINE_SEED,
  type MachineKind,
} from '@/features/training/load';
import { fromKgHalf } from '@/features/training/progression';
import { exerciseHistoryQuery, groupSessions } from '@/features/training/stats.repo';
import { useI18n, useT } from '@/i18n';
import { mmss } from '@/lib/duration';
import { settings, type Units } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTheme } from '@/theme/theme-context';

/** "100×6,6,5" when the weight holds, "100×6 · 95×8" when it varies. */
const fmtSession = (sets: { weightKg: number; reps: number }[], unit: Units): string => {
  const first = sets[0]?.weightKg ?? 0;
  if (sets.every((s) => s.weightKg === first)) {
    return `${fromKgHalf(first, unit)}${unit} × ${sets.map((s) => s.reps).join(',')}`;
  }
  return sets.map((s) => `${fromKgHalf(s.weightKg, unit)}×${s.reps}`).join(' · ');
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
  const { id, view } = useLocalSearchParams<{ id: string; view?: string }>();
  // From Metrics the question is "what did I do" — sessions first, the guide a tap away.
  const historyFirst = view === 'history';
  const { user } = useAuth();
  const t = useT();
  const { locale } = useI18n();
  const { dayMonth } = useDateFormat();
  const { brand, muted } = useTheme();
  const unit = settings.getUnits();

  const exercise = id ? getExercise(id) : null;
  // Live, with deps: a screen mounted before auth resolves must not stay bound
  // to an empty user (AGENTS.md), and a set deleted elsewhere re-renders here.
  const { data: rows } = useLiveQuery(exerciseHistoryQuery(user?.id ?? '', id ?? ''), [
    user?.id,
    id,
  ]);
  const sessions = useMemo(() => groupSessions(rows), [rows]);
  const points = useMemo(() => buildExerciseSeries(sessions), [sessions]);
  const prLogIds = useMemo(
    () => new Set(points.filter((p) => p.isPr).map((p) => p.logId)),
    [points],
  );
  const [setting, setSetting] = useState(() =>
    user && id ? getExerciseSetting(user.id, id) : null,
  );
  const [restOpen, setRestOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const dateLabel = dayMonth;
  const content = id ? (EXERCISE_CONTENT[id]?.[locale] ?? null) : null;
  const visualId = exercise ? visualIdFor(exercise) : null;

  const saveSetting = (patch: SettingPatch) => {
    if (!user || !id) return;
    upsertExerciseSetting(user.id, id, patch);
    setSetting(getExerciseSetting(user.id, id));
  };
  // A machine's loading (plates vs pin stack) is chosen on the session card the
  // first time; this is where it can be changed later. Switching kinds resets
  // the saved config — the next session's sheet asks for the new base/pins.
  const machineKind = exercise?.equipment === 'machine' ? machineLoadKind(setting?.load) : null;
  const chooseMachineKind = (kind: MachineKind) =>
    saveSetting({
      load:
        kind === 'plates'
          ? PLATE_MACHINE_SEED
          : kind === 'post'
            ? POST_MACHINE_SEED
            : STACK_MACHINE_SEED,
    });

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          right={
            exercise && points.length ? (
              <IconButton
                icon={<ShareIcon color={muted} size={18} />}
                onPress={() => setSharing(true)}
                accessibilityLabel={t('share.exercise')}
              />
            ) : undefined
          }
        />
      }
    >
      <ScreenTitle
        title={exercise ? exerciseDisplayName(exercise, locale) : t('exHistory.title')}
        subtitle={t('exHistory.subtitle')}
      />

      {historyFirst && exercise ? (
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-sm font-sans-semibold text-ink-200">{t('exHistory.sessions')}</Text>
          <ExerciseDocButton exerciseId={exercise.id} />
        </View>
      ) : null}

      {!historyFirst && exercise && visualId ? (
        <FadeInUp>
          <View className="mb-4">
            <ExerciseFrames
              visualId={visualId}
              accessibilityLabel={exerciseDisplayName(exercise, locale)}
            />
            <View className="mt-1.5 items-center">
              <TextLink
                center
                label={t('exercise.illustrationCredit')}
                onPress={() => Linking.openURL('https://creativecommons.org/licenses/by-sa/4.0/')}
              />
            </View>
          </View>
        </FadeInUp>
      ) : null}

      {/* Per-user defaults, applied whenever this exercise joins a split. */}
      {!historyFirst && exercise && user ? (
        <FadeInUp>
          <Card className="mb-4">
            <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
              {t('exercise.defaultsTitle')}
            </Text>
            <Text className="mt-1 text-xs text-ink-500">{t('exercise.defaultsHint')}</Text>

            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-sm text-ink-200">{t('editor.rest')}</Text>
              <Pressable
                onPress={() => setRestOpen((v) => !v)}
                accessibilityRole="button"
                className="rounded-field border border-ink-700 bg-ink-800 px-4 py-2"
              >
                <Text className="font-mono text-base text-ink-50">
                  {setting?.restSeconds != null ? mmss(setting.restSeconds) : '—'}
                </Text>
              </Pressable>
            </View>
            {restOpen ? (
              <View className="mt-3">
                <DurationPicker
                  seconds={setting?.restSeconds ?? 120}
                  onChange={(s) => saveSetting({ restSeconds: Math.max(5, s) })}
                />
              </View>
            ) : null}

            <Text className="mb-2 mt-4 text-sm text-ink-200">{t('editor.badges')}</Text>
            <BadgesEditor
              value={setting?.badges ?? []}
              onChange={(badges) => saveSetting({ badges: badges.length ? badges : null })}
            />

            {exercise.equipment === 'machine' ? (
              <View className="mt-4">
                <MachineLoadChooser value={machineKind} onChange={chooseMachineKind} />
              </View>
            ) : null}
          </Card>
        </FadeInUp>
      ) : null}

      {/* The lifter's own note — surfaces on this exercise in every session. */}
      {exercise && user ? (
        <FadeInUp>
          <Card className="mb-4">
            <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
              {t('exNote.title')}
            </Text>
            <Text className="mb-3 mt-1 text-xs text-ink-500">{t('exNote.hint')}</Text>
            <ExerciseNote userId={user.id} exerciseId={exercise.id} />
          </Card>
        </FadeInUp>
      ) : null}

      {/* Technique cues — curated catalog exercises only. */}
      {!historyFirst && content ? (
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
          {points.length > 1 ? (
            <FadeInUp>
              <ExerciseTrendCard points={points} unit={unit} />
            </FadeInUp>
          ) : null}

          {historyFirst ? null : (
            <Text className="mb-2 mt-7 text-sm font-sans-semibold text-ink-200">
              {t('exHistory.sessions')}
            </Text>
          )}
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
                  {/* The star is the same record the finish modal announced. */}
                  {prLogIds.has(s.logId) ? (
                    <View className="ml-2 shrink-0" accessibilityLabel={t('exHistory.legendPr')}>
                      <StarIcon color={brand} size={14} />
                    </View>
                  ) : null}
                </Card>
              </FadeInUp>
            ))}
          </View>
        </>
      )}
      {exercise ? (
        <ShareSheet
          visible={sharing}
          onClose={() => setSharing(false)}
          model={exerciseShareModel({
            name: exerciseDisplayName(exercise, locale),
            points,
            unit,
            formatDate: (at) => dayMonth(new Date(at)),
            t,
          })}
        />
      ) : null}
    </Screen>
  );
};

export default ExerciseHistory;
