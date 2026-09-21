import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DumbbellIcon, FlameIcon } from '@/components/icons';
import { BadgeRow, Button, ScrollArea, Sheet, ShareCard, useToast } from '@/components/ui';
import type { SkipReason, TrainingDayStatus } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { useI18n, useT, type TFunction, type TranslationKey } from '@/i18n';
import { settings, type Units } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTodayKey } from '@/lib/useTodayKey';
import { useShareCard } from '@/lib/useShareCard';
import { useTheme } from '@/theme/theme-context';

import { adherenceDot } from '../adherence-colors';
import { dayDisplayName, exerciseDisplayName } from '../labels';
import { dayQuery, markTrainingDay } from '../adherence.repo';
import { getDayDetail, type LoggedSet } from '../day-events';
import { fromKg } from '../progression';
import { SkipReasonChips } from './SkipReasonChips';

const STATUS_CHOICES: { status: TrainingDayStatus; key: TranslationKey }[] = [
  { status: 'trained', key: 'adherence.trained' },
  { status: 'rest', key: 'adherence.rest' },
  { status: 'skipped', key: 'adherence.skipped' },
];

const fmtDur = (s: number | null): string => (s ? `${Math.round(s / 60)}m` : '');
const fmtSet = (s: LoggedSet, unit: Units, t: TFunction): string => {
  const base = `${fromKg(s.weightKg, unit)}×${s.reps}`;
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
  const toast = useToast();
  const { user } = useAuth();
  const theme = useTheme();
  const { brand } = theme;
  const { dateKey } = useDateFormat();
  const today = useTodayKey();
  const unit = settings.getUnits();
  const setLabel = (x: LoggedSet) => fmtSet(x, unit, t);
  const { ref, share, busy } = useShareCard(t('dayDetail.share'));
  const { data: adherenceRows } = useLiveQuery(dayQuery(user?.id ?? '', date ?? ''));
  const adherence = adherenceRows[0] ?? null;

  const detail = useMemo(() => (user && date ? getDayDetail(user.id, date) : null), [user, date]);
  const displayName = (ex: { exerciseId: string; name: string }) =>
    exerciseDisplayName({ id: ex.exerciseId, name: ex.name }, locale);
  const splitName = (w: { dayName: string; dayOrder: number | null }) =>
    w.dayOrder != null ? dayDisplayName({ name: w.dayName, orderIndex: w.dayOrder }, t) : w.dayName;
  const [marking, setMarking] = useState(false);
  const [askingReason, setAskingReason] = useState(false);

  // Manual marking works for any past-or-today date, enrollment or not.
  const markable = !!user && !!date && date <= today;
  const mark = (status: TrainingDayStatus, skipReason?: SkipReason) => {
    if (!user || !date) return;
    if (status === 'skipped' && !skipReason) {
      setAskingReason(true);
      return;
    }
    markTrainingDay(user.id, { date, status, skipReason: skipReason ?? null });
    setMarking(false);
    setAskingReason(false);
  };

  const workouts = detail?.workouts ?? [];
  const totalSets = workouts.reduce((n, w) => n + w.setCount, 0);
  const totalVolume = workouts.reduce((n, w) => n + w.volumeKg, 0);
  const totalDuration = workouts.reduce((n, w) => n + (w.durationSeconds ?? 0), 0);
  const empty = !adherence && !workouts.length && !detail?.tdeeComputed;
  const title = date ? dateKey(date) : '';

  const onShare = async () => {
    if (!(await share())) toast.error(t('dayDetail.shareFailed'));
  };

  return (
    <Sheet visible={date !== null} onClose={onClose} snapPoints={['75%', '100%']} expandable>
      <ScrollArea inSheet>
        <Text className="text-lg font-sans-bold text-ink-50">{title}</Text>

        {adherence ? (
          <View className="mt-2 flex-row items-center gap-2.5">
            <View
              style={{ backgroundColor: adherenceDot(theme, adherence.status) }}
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
                      volume: fromKg(w.volumeKg, unit),
                      unit,
                    })}
                    {w.durationSeconds ? ` · ${fmtDur(w.durationSeconds)}` : ''}
                  </Text>
                </View>
              </View>
              {w.exercises.length ? (
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

          {workouts.length ? (
            <View className="mt-2 items-center">
              <ShareCard
                ref={ref}
                eyebrow={t('share.trainingDay')}
                title={workouts.map((w) => splitName(w)).join(' + ')}
                subtitle={title}
                metrics={[
                  { label: t('share.volume'), value: `${fromKg(totalVolume, unit)} ${unit}` },
                  { label: t('share.sets'), value: `${totalSets}` },
                  { label: t('share.duration'), value: fmtDur(totalDuration) || '—' },
                ]}
                bars={workouts
                  .flatMap((w) => w.exercises)
                  .slice(0, 8)
                  .map((ex) => ({
                    label: displayName(ex).slice(0, 6),
                    value: ex.sets.reduce((n, s) => n + s.weightKg * s.reps, 0),
                  }))}
                lines={workouts
                  .flatMap((w) => w.exercises)
                  .slice(0, 6)
                  .map((ex) => `${displayName(ex)} · ${ex.sets.map(setLabel).join(', ')}`)}
                footer={t('share.footer')}
              />
              <View className="mt-3 w-full">
                <Button
                  variant="brand"
                  label={t('dayDetail.share')}
                  loading={busy}
                  onPress={() => void onShare()}
                />
              </View>
            </View>
          ) : null}

          {/* Manual adherence mark — useful with no enrollment or to fix a day. */}
          {markable ? (
            marking ? (
              askingReason ? (
                <SkipReasonChips onPick={(r) => mark('skipped', r)} />
              ) : (
                <View className="mt-4 flex-row gap-2">
                  {STATUS_CHOICES.map((c) => (
                    <Pressable
                      key={c.status}
                      onPress={() => mark(c.status)}
                      accessibilityRole="button"
                      className="flex-1 items-center rounded-field border border-ink-700 bg-ink-800 py-2.5"
                    >
                      <Text className="text-sm font-sans-medium text-ink-200">{t(c.key)}</Text>
                    </Pressable>
                  ))}
                </View>
              )
            ) : (
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
    </Sheet>
  );
};
