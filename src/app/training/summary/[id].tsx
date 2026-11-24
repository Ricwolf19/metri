import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { CheckIcon, ShareIcon, SparksIcon, StarIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  BlockingOverlay,
  Button,
  Card,
  Deferred,
  Screen,
  SectionLabel,
  Stat,
} from '@/components/ui';
import { useLiveQuery } from '@/db/useLiveQuery';
import { useAuth } from '@/features/auth/auth-context';
import { LeaveTo } from '@/features/photos/components/LeaveTo';
import { sessionShareModel } from '@/features/share/models';
import { ShareSheet } from '@/features/share/ShareSheet';
import { SessionTimeCard } from '@/features/training/components/SessionTimeCard';
import { SummaryExerciseSets } from '@/features/training/components/SummaryExerciseSets';
import { SummaryVsLast } from '@/features/training/components/SummaryVsLast';
import { effortModeFor } from '@/features/training/effort-mode';
import { enrollmentQuery } from '@/features/training/enroll';
import { dayDisplayName } from '@/features/training/labels';
import { getWorkoutDay } from '@/features/training/programs.repo';
import { fromKgHalf } from '@/features/training/progression';
import { durationText } from '@/features/training/session-report';
import { sessionReport } from '@/features/training/session-report.repo';
import {
  activeWorkoutQuery,
  reopenWorkout,
  setLogsQuery,
  workoutQuery,
} from '@/features/training/session.repo';
import { setText, topExerciseNote } from '@/features/training/summary-copy';
import { useI18n, useT } from '@/i18n';
import { useBlockingTask } from '@/lib/useBlockingTask';
import { useDateFormat } from '@/lib/useDateFormat';
import { useEquipmentUnits } from '@/lib/useUnits';
import { useTheme } from '@/theme/theme-context';

/**
 * What a finished session added up to — reached on its own when the last
 * planned set settles (`finished=1`, which also offers "Back to session"), or
 * read later from a day's sessions. Owner-scoped: the route is deep-linkable.
 * Everything on it is computed by `sessionReport` from the live rows.
 */
const SessionSummaryScreen = () => {
  const { id, finished } = useLocalSearchParams<{ id: string; finished?: string }>();
  const logId = typeof id === 'string' ? id : '';
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { brand, brandContrast } = useTheme();
  const { date } = useDateFormat();
  const { units: unit } = useEquipmentUnits();
  const blocking = useBlockingTask<'reopening'>();
  const [sharing, setSharing] = useState(false);

  // Deps are load-bearing (AGENTS.md): each query is bound to its arguments.
  const { data: logRows } = useLiveQuery(workoutQuery(logId), [logId]);
  const { data: sets } = useLiveQuery(setLogsQuery(logId), [logId]);
  const log = logRows[0] ?? null;
  const userProgramId = log?.userProgramId ?? '';
  const { data: enrollmentRows } = useLiveQuery(enrollmentQuery(userId, userProgramId), [
    userId,
    userProgramId,
  ]);
  const { data: actives } = useLiveQuery(activeWorkoutQuery(userId), [userId]);

  // The report re-reads whenever the rows it is built from change (a synced
  // set, a correction made after reopening). Only the owner's session is read.
  const owned = !!log && log.userId === userId;
  const signature = JSON.stringify([
    owned,
    log?.status,
    log?.durationSeconds,
    log?.updatedAt?.getTime(),
    sets.map((s) => [s.id, s.weightKg, s.reps, s.rir, s.isFailure, s.isWarmup]),
  ]);
  const report = useMemo(
    () => (owned ? sessionReport(logId, userId, locale) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logId, userId, locale, signature],
  );

  if (!user || !log || log.userId !== user.id) return <LeaveTo href="/training" />;
  // Not finished (reopened elsewhere, a deep link into a live one): nothing to sum up.
  // While "Back to session" runs, the log reopens a frame before this screen is replaced.
  if (log.status !== 'completed' && blocking.busy === null) return <LeaveTo href="/training" />;
  if (!report) return null;

  const day = getWorkoutDay(log.workoutDayId);
  const splitName = day ? dayDisplayName(day, t) : t('training.workout');
  const weekLine = t('training.weekN', { n: log.weekNumber });
  const enrollment = enrollmentRows[0] ?? null;
  const effortMode = effortModeFor(enrollment?.programId, enrollment?.effortMode);
  const { summary } = report;
  const prs = summary.exercises.filter((e) => e.isPr);
  const logged = report.exercises.filter((e) => e.sets.length);
  const fromFinish = finished === '1';
  // Back to the session only right after finishing it, and never over another open one.
  const canReopen = fromFinish && !!log.completedAt && !actives.some((a) => a.id !== log.id);
  const nameOf = (exerciseId: string) =>
    report.exercises.find((e) => e.exerciseId === exerciseId)?.name ?? exerciseId;

  // From a finish the Train tab is where the session came from: `dismissTo` goes
  // back down to it (a replace stacked a second one) and `settling` holds the
  // wait while it re-reads. Read later, this screen goes back where it was opened.
  const leave = () => {
    if (fromFinish || !router.canGoBack()) {
      router.dismissTo({ pathname: '/training', params: { settling: '1' } });
    } else router.back();
  };
  const reopen = () =>
    blocking.start(
      'reopening',
      () => {
        // Nested to nested: the session takes this screen's place. Refused (another
        // session opened meanwhile, from sync), it is never replaced into a closed
        // log: the workout screen would bounce to a tab and stack a second one.
        if (reopenWorkout(log.id, user.id)) {
          router.replace({ pathname: '/training/workout/[id]', params: { id: log.id } });
        } else {
          router.dismissTo({ pathname: '/training', params: { settling: '1' } });
        }
      },
      { keep: true },
    );

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-8"
      header={
        <TopBar
          showBack
          onBack={leave}
          showAvatar={false}
          title={t('training.summaryScreen')}
          subtitle={splitName}
        />
      }
      footer={
        <View className="flex-row gap-3">
          {canReopen ? (
            <View className="flex-1">
              <Button
                variant="ghost"
                label={t('training.summaryBack')}
                accessibilityHint={t('training.summaryBackHint')}
                onPress={reopen}
              />
            </View>
          ) : null}
          <View className="flex-1">
            <Button variant="secondary" label={t('common.done')} onPress={leave} />
          </View>
        </View>
      }
    >
      <View className="items-center pt-3">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand">
          <CheckIcon color={brandContrast} size={28} />
        </View>
        <Text
          accessibilityRole="header"
          className="mt-4 text-center text-2xl font-sans-bold text-ink-50"
        >
          {t('training.summaryTitle')}
        </Text>
        <Text className="mt-1 text-center text-sm text-ink-300">
          {splitName} · {weekLine}
        </Text>
        {log.completedAt ? (
          <Text className="mt-0.5 text-center text-xs text-ink-400">{date(log.completedAt)}</Text>
        ) : null}
      </View>

      {/* Two by two: four stats in one row leave ~70 dp a column. */}
      <Card className="mt-6 gap-4">
        <View className="flex-row">
          <Stat
            label={t('training.summaryDuration')}
            value={durationText(report.durationSeconds)}
          />
          <Stat
            label={t('training.summaryVolume')}
            value={String(fromKgHalf(report.volumeKg, unit))}
            unit={unit}
          />
        </View>
        <View className="flex-row">
          <Stat
            label={t('training.summarySets')}
            value={
              report.setsPlanned
                ? `${report.setsDone}/${report.setsPlanned}`
                : String(report.setsDone)
            }
          />
          <Stat label={t('training.summaryPrCount')} value={String(prs.length)} />
        </View>
        {report.missedSets > 0 ? (
          <Text className="text-sm font-sans-semibold text-red-400">
            {t('training.missedSets')}: {report.missedSets}
          </Text>
        ) : null}
      </Card>

      {summary.top ? (
        <View className="mt-3 rounded-card border border-brand/30 bg-brand/10 p-5">
          <View className="flex-row items-center gap-2">
            <SparksIcon color={brand} size={16} />
            <Text className="font-mono-medium text-xs uppercase tracking-wider text-accent">
              {t('training.summaryTop')}
            </Text>
          </View>
          <Text numberOfLines={2} className="mt-2 text-lg font-sans-bold text-ink-50">
            {summary.top.name}
          </Text>
          <Text className="mt-0.5 text-sm text-ink-200">
            {setText({ weightKg: summary.top.topKg, reps: summary.top.topReps }, unit)}
          </Text>
          <Text className="mt-1 text-sm font-sans-medium text-accent">
            {topExerciseNote(summary.top, unit, t)}
          </Text>
        </View>
      ) : null}

      {/* The one brand action here: the card, built on the phone and handed to the OS sheet. */}
      {logged.length ? (
        <Card className="mt-3">
          <Text className="text-base font-sans-semibold text-ink-50">
            {t('training.summaryShareTitle')}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-ink-400">
            {t('training.summaryShareBody')}
          </Text>
          <View className="mt-4">
            <Button
              variant="brand"
              size="xl"
              label={t('share.session')}
              leftIcon={<ShareIcon color={brandContrast} size={18} />}
              onPress={() => setSharing(true)}
            />
          </View>
        </Card>
      ) : null}

      {prs.length ? (
        <>
          <SectionLabel label={t('training.summaryPrs')} />
          <Card className="gap-3">
            {prs.map((p) => (
              <View key={p.exerciseId} className="flex-row items-center gap-3">
                <StarIcon color={brand} size={14} />
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={2} className="text-sm font-sans-medium text-ink-100">
                    {p.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-ink-400">
                    {setText({ weightKg: p.topKg, reps: p.topReps }, unit)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Deferred>
        <SectionLabel
          label={t('training.summaryVsLast')}
          hint={
            report.vsLast
              ? t('training.summaryVsLastHint', {
                  when: [
                    t('training.weekN', { n: report.vsLast.weekNumber }),
                    report.vsLast.finishedAt ? date(report.vsLast.finishedAt) : null,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                })
              : undefined
          }
        />
        <SummaryVsLast report={report} unit={unit} />
      </Deferred>

      {report.timing ? (
        <Deferred order={1}>
          <SectionLabel label={t('training.timeTitle')} hint={t('training.timeHint')} />
          <SessionTimeCard timing={report.timing} nameOf={nameOf} />
        </Deferred>
      ) : null}

      {report.exercises.length ? (
        <Deferred order={2}>
          <SectionLabel label={t('training.summaryExercises')} />
          <SummaryExerciseSets exercises={report.exercises} unit={unit} mode={effortMode} />
        </Deferred>
      ) : null}

      <ShareSheet
        visible={sharing}
        onClose={() => setSharing(false)}
        model={sessionShareModel({ summary, splitName, programLine: weekLine, unit, t })}
      />
      <BlockingOverlay
        visible={blocking.busy !== null}
        onShow={blocking.onShow}
        label={t('training.startingWorkout')}
      />
    </Screen>
  );
};

export default SessionSummaryScreen;
