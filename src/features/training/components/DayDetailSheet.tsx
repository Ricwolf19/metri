import { useLiveQuery } from '@/db/useLiveQuery';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DumbbellIcon, FlameIcon, ShareIcon } from '@/components/icons';
import { BadgeRow, IconButton, ScrollArea, Sheet, TextLink } from '@/components/ui';
import type { SkipReason, TrainingDayStatus } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { sessionShareModel, type ShareModel } from '@/features/share/models';
import { ShareSheet } from '@/features/share/ShareSheet';
import { useI18n, useT, type TFunction, type TranslationKey } from '@/i18n';
import { settings, type Units } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTodayKey } from '@/lib/useTodayKey';
import { useTheme } from '@/theme/theme-context';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';

import { adherenceDot } from '../adherence-colors';
import { isAutoMissed } from '../auto-adherence';
import { dayDisplayName, exerciseDisplayName } from '../labels';
import { dayQuery, markTrainingDay } from '../adherence.repo';
import { getDayDetail, type LoggedSet } from '../day-events';
import { getWorkoutDay } from '../programs.repo';
import { getWorkout, sessionSummary } from '../session.repo';
import { skipPlannedDay, unskipDay } from '../skip-split';
import { fromKgHalf } from '../progression';
import { DeleteSessionButton } from './DeleteSessionButton';
import { SessionTimeline } from './SessionTimeline';
import { SkipReasonChips } from './SkipReasonChips';

// Four choices render as a 2×2 grid: four ES labels no longer fit one row.
const STATUS_CHOICES: { status: TrainingDayStatus; key: TranslationKey }[] = [
  { status: 'trained', key: 'adherence.trained' },
  { status: 'rest', key: 'adherence.rest' },
  { status: 'active', key: 'adherence.active' },
  { status: 'skipped', key: 'adherence.skipped' },
];

const fmtDur = (s: number | null): string => (s ? `${Math.round(s / 60)}m` : '');
const fmtSet = (s: LoggedSet, unit: Units, t: TFunction): string => {
  const base = `${fromKgHalf(s.weightKg, unit)}×${s.reps}`;
  if (s.isFailure) return `${base} ${t('set.failureShort')}`;
  if (s.rir != null) return `${base} ${t('intensity.rir')}${s.rir}`;
  if (s.rpe != null) return `${base} ${t('intensity.rpe')}${s.rpe}`;
  return base;
};

/** Bottom sheet of everything recorded on a day (workouts with sets, adherence mark, calculations)
 * plus a share card. Future feeds (weigh-ins, measurements) plug in as rows. */
export const DayDetailSheet = ({
  date,
  onClose,
}: {
  /** 'YYYY-MM-DD' or null when closed. */
  date: string | null;
  onClose: () => void;
}) => {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const theme = useTheme();
  const { brand, muted } = theme;
  const { dateKey } = useDateFormat();
  const today = useTodayKey();
  const unit = settings.getEquipmentUnits();
  const setLabel = (x: LoggedSet) => fmtSet(x, unit, t);
  // Deps are load-bearing: the sheet mounts closed (date null) and is reopened
  // for many dates; without them the query stayed on '' and a mark never showed.
  const { data: adherenceRows } = useLiveQuery(dayQuery(user?.id ?? '', date ?? ''), [
    user?.id,
    date,
  ]);
  const adherence = adherenceRows[0] ?? null;

  const detail = useMemo(() => (user && date ? getDayDetail(user.id, date) : null), [user, date]);
  const displayName = (ex: { exerciseId: string; name: string }) =>
    exerciseDisplayName({ id: ex.exerciseId, name: ex.name }, locale);
  const splitName = (w: { dayName: string; dayOrder: number | null }) =>
    w.dayOrder != null ? dayDisplayName({ name: w.dayName, orderIndex: w.dayOrder }, t) : w.dayName;
  // The detail is a one-shot read, so a deleted session is hidden here rather
  // than waiting for a re-read the sheet has no signal to make.
  const [deleted, setDeleted] = useState<ReadonlySet<string>>(new Set());
  // Sessions switched from the by-exercise list to the chronological timeline.
  const [timelines, setTimelines] = useState<ReadonlySet<string>>(new Set());
  const toggleTimeline = (logId: string) =>
    setTimelines((prev) => {
      const next = new Set(prev);
      if (!next.delete(logId)) next.add(logId);
      return next;
    });
  // The card is kept after closing, so the share sheet plays its fall with it
  // (a model cleared on close emptied the sheet mid-fall).
  const [shareModel, setShareModel] = useState<ShareModel | null>(null);
  const [sharing, setSharing] = useState(false);
  const [marking, setMarking] = useState(false);
  // The status picked, waiting for its reason.
  const [pendingStatus, setPendingStatus] = useState<TrainingDayStatus | null>(null);

  // Manual marking works for any past-or-today date, enrollment or not.
  const markable = !!user && !!date && date <= today;
  // A legacy skip that resolved a planned split carries a `skipped` log: it is
  // the undo handle, deleted below, and it must go before the day is re-marked.
  const skippedLogId =
    adherence?.status === 'skipped' && adherence.workoutLogId ? adherence.workoutLogId : null;
  // The split the mark stood for: a missed one is carried over, not lost.
  const markedSplit =
    adherence?.status === 'skipped' && adherence.workoutDayId
      ? getWorkoutDay(adherence.workoutDayId)
      : null;
  const skippedSplit = skippedLogId ? markedSplit : null;
  // A red day changes only with a reason — whatever it becomes, the lifter says
  // why the schedule's verdict was wrong — and a miss always asks for one.
  const changingMissed = adherence?.status === 'skipped';
  const mark = (status: TrainingDayStatus, skipReason?: SkipReason) => {
    if (!user || !date) return;
    if ((status === 'skipped' || changingMissed) && !skipReason) {
      setPendingStatus(status);
      return;
    }
    if (status === 'skipped') skipPlannedDay(user.id, date, skipReason ?? null);
    else {
      if (skippedLogId) unskipDay(user.id, date);
      markTrainingDay(user.id, { date, status, skipReason: skipReason ?? null });
    }
    setMarking(false);
    setPendingStatus(null);
  };

  const workouts = (detail?.workouts ?? []).filter((w) => !deleted.has(w.logId));
  const empty = !adherence && !workouts.length && !detail?.tdeeComputed;
  const title = date ? dateKey(date) : '';

  // Sharing a past session draws the same card as finishing one.
  const shareSession = (logId: string, name: string) => {
    const week = getWorkout(logId)?.weekNumber;
    setShareModel(
      sessionShareModel({
        summary: sessionSummary(logId, locale),
        splitName: name,
        programLine: week != null ? t('training.weekN', { n: week }) : null,
        unit,
        t,
      }),
    );
    setSharing(true);
  };

  return (
    <Sheet visible={date !== null} onClose={onClose} snapPoints={['75%', '100%']} expandable>
      <ScrollArea inSheet>
        <Text className="text-lg font-sans-bold text-ink-50">{title}</Text>

        {/* The mark as a summary — what the day was and why — with "Change" as
         * the only way back to the choices. Re-offering "Mark this day" under
         * an answered day read as if nothing had been saved. */}
        {adherence ? (
          <View className="mt-2 flex-row items-center gap-2.5">
            <View
              style={{ backgroundColor: adherenceDot(theme, adherence.status) }}
              className="h-2.5 w-2.5 rounded-full"
            />
            <Text className="min-w-0 flex-1 text-sm text-ink-200">
              {t(`adherence.logged.${adherence.status}` as TranslationKey)}
              {adherence.skipReason
                ? ` · ${t(`reason.${adherence.skipReason}` as TranslationKey)}`
                : ''}
            </Text>
            {markable && !marking ? (
              <TextLink label={t('dayDetail.changeMark')} onPress={() => setMarking(true)} />
            ) : null}
          </View>
        ) : null}
        {isAutoMissed(adherence ?? undefined) ? (
          <Text className="mt-1.5 text-xs text-ink-400">{t('dayDetail.autoMissed')}</Text>
        ) : null}
        {markedSplit && !skippedLogId ? (
          <Text className="mt-1.5 text-xs text-ink-400">
            {t('dayDetail.carriedOver', { split: dayDisplayName(markedSplit, t) })}
          </Text>
        ) : null}

        <View className="mt-2">
          {skippedLogId ? (
            <View className="mb-3 flex-row items-center gap-3 rounded-card border border-ink-700 bg-ink-850 p-4">
              <View className="flex-1">
                <Text className="text-sm font-sans-semibold text-ink-50">
                  {t('dayDetail.skippedSplit', {
                    split: skippedSplit ? dayDisplayName(skippedSplit, t) : t('editor.splits'),
                  })}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-400">{t('dayDetail.skippedHint')}</Text>
              </View>
              <DeleteSessionButton logId={skippedLogId} compact />
            </View>
          ) : null}
          {workouts.map((w) => (
            <View key={w.logId} className="mb-3 rounded-card border border-ink-700 bg-ink-850 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-field bg-ink-800">
                  <DumbbellIcon color={brand} size={18} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-sans-semibold text-ink-50">{splitName(w)}</Text>
                  <Text className="mt-0.5 text-xs text-ink-400">
                    {t('dayDetail.setsLine', {
                      count: w.setCount,
                      volume: fromKgHalf(w.volumeKg, unit),
                      unit,
                    })}
                    {w.durationSeconds ? ` · ${fmtDur(w.durationSeconds)}` : ''}
                  </Text>
                </View>
                {w.exercises.length ? (
                  <IconButton
                    icon={<ShareIcon color={muted} size={16} />}
                    onPress={() => shareSession(w.logId, splitName(w))}
                    accessibilityLabel={t('share.session')}
                  />
                ) : null}
                <DeleteSessionButton
                  logId={w.logId}
                  compact
                  onDeleted={() => setDeleted((prev) => new Set(prev).add(w.logId))}
                />
              </View>
              {w.exercises.length ? (
                <Pressable
                  onPress={() => toggleTimeline(w.logId)}
                  hitSlop={6}
                  accessibilityRole="button"
                  className="mt-3 self-start"
                >
                  <Text
                    className="font-mono-medium text-xs uppercase tracking-wider text-accent"
                    maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                  >
                    {t(timelines.has(w.logId) ? 'dayDetail.byExercise' : 'dayDetail.timeline')}
                  </Text>
                </Pressable>
              ) : null}
              {w.exercises.length && timelines.has(w.logId) ? (
                <SessionTimeline
                  exercises={w.exercises.map((ex) => ({ ...ex, name: displayName(ex) }))}
                  formatSet={setLabel}
                />
              ) : w.exercises.length ? (
                <View className="mt-3 gap-2 border-t border-ink-800 pt-3">
                  {w.exercises.map((ex) => (
                    <View key={ex.exerciseId}>
                      <Text className="text-sm font-sans-medium text-ink-100">
                        {displayName(ex)}
                      </Text>
                      <View className="mt-1">
                        <BadgeRow
                          mono
                          items={ex.sets.map((s) => ({
                            value: String(s.setNumber),
                            label: setLabel(s),
                          }))}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}

          {detail?.tdeeComputed ? (
            <View className="flex-row items-center gap-3 py-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-field bg-ink-800">
                <FlameIcon color={brand} size={18} />
              </View>
              <Text className="text-sm font-sans-semibold text-ink-50">{t('dayDetail.tdee')}</Text>
            </View>
          ) : null}

          {empty ? (
            <Text className="mt-4 text-center text-sm text-ink-400">{t('dayDetail.empty')}</Text>
          ) : null}

          {/* Manual adherence mark — useful with no enrollment or to fix a day. An
           * answered day shows its summary above and opens the choices from "Change". */}
          {markable ? (
            marking ? (
              pendingStatus ? (
                <View>
                  {changingMissed ? (
                    <Text className="mt-4 text-sm text-ink-300">{t('dayDetail.changeReason')}</Text>
                  ) : null}
                  <SkipReasonChips onPick={(r) => mark(pendingStatus, r)} />
                </View>
              ) : (
                <View className="mt-4 flex-row flex-wrap gap-2">
                  {STATUS_CHOICES.map((c) => (
                    <Pressable
                      key={c.status}
                      onPress={() => mark(c.status)}
                      accessibilityRole="button"
                      className="basis-[47%] grow items-center rounded-field border border-ink-700 bg-ink-800 py-2.5"
                    >
                      <Text numberOfLines={1} className="text-sm font-sans-medium text-ink-200">
                        {t(c.key)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )
            ) : adherence ? null : (
              <Pressable
                onPress={() => setMarking(true)}
                accessibilityRole="button"
                className="mt-4 items-center rounded-field border border-ink-700 bg-ink-800 py-2.5"
              >
                <Text className="text-sm font-sans-semibold text-ink-200">
                  {t('adherence.markDay')}
                </Text>
              </Pressable>
            )
          ) : null}
        </View>
      </ScrollArea>
      <ShareSheet visible={sharing} onClose={() => setSharing(false)} model={shareModel} />
    </Sheet>
  );
};
