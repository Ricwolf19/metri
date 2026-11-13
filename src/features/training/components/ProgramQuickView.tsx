import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { Button, ChipRow, IconButton, ScrollArea, Sheet } from '@/components/ui';
import { useI18n, useT } from '@/i18n';
import { useClockFormat } from '@/lib/useClockFormat';
import { useTheme } from '@/theme/theme-context';

import { dayDisplayName, phaseMeta, routineDisplayName, scheduleLabel } from '../labels';
import { presetDayName, presetRoutineName } from '../programs';
import type { TreeRoutine } from '../schedule';
import { splitPreview } from '../session.repo';

import { SplitExercises } from './SplitExercises';

/** Where the quick view opens: a phase, and one of its splits (null = its first). */
export type QuickViewTarget = { routineId: string; dayId: string | null };

type Nav = { routineId: string; dayId: string | null; week: number };

/** One tall stop: the body holds its height while the lifter moves around. */
const STOPS = ['88%'];

type Props = {
  programId: string;
  routines: TreeRoutine[];
  /** null = closed. */
  target: QuickViewTarget | null;
  /** The phase and week an enrolled lifter is on: that phase opens on that week. */
  current: { routineId: string; week: number } | null;
  onClose: () => void;
  /** The active copy's splits can be edited (their schedule lives in the editor). */
  onEditDay?: (dayId: string) => void;
};

const navFor = (
  routines: TreeRoutine[],
  routineId: string,
  dayId: string | null,
  current: Props['current'],
): Nav => {
  const routine = routines.find((r) => r.id === routineId) ?? routines[0];
  return {
    routineId: routine?.id ?? '',
    dayId: dayId ?? routine?.days[0]?.id ?? null,
    week: current && current.routineId === routine?.id ? current.week : 1,
  };
};

/**
 * A program at a glance, without starting or editing it: step through its
 * phases, pick a split and a week, and read what each session holds — the
 * exercises, sets, effort, rest and cues (`SplitExercises`, the same read the
 * Train tab's preview uses). Opened from a phase or a split on the program
 * screen. The body keeps one height while the lifter moves around, so the
 * sheet never resizes under the finger as splits come and go.
 */
export const ProgramQuickView = ({
  programId,
  routines,
  target,
  current,
  onClose,
  onEditDay,
}: Props) => {
  const t = useT();
  const { locale } = useI18n();
  const clock = useClockFormat();
  const { brand } = useTheme();
  const { height } = useWindowDimensions();

  // Each open starts where it was opened from (the "adjust state on prop
  // change" shape); closing keeps the last view so the fall still shows it.
  const [seen, setSeen] = useState(target);
  const [nav, setNav] = useState<Nav | null>(() =>
    target ? navFor(routines, target.routineId, target.dayId, current) : null,
  );
  if (target !== seen) {
    setSeen(target);
    if (target) setNav(navFor(routines, target.routineId, target.dayId, current));
  }

  const routineIndex = nav ? routines.findIndex((r) => r.id === nav.routineId) : -1;
  const routine = routineIndex >= 0 ? routines[routineIndex] : null;
  const day = routine?.days.find((d) => d.id === nav?.dayId) ?? null;
  const week = Math.min(nav?.week ?? 1, routine?.durationWeeks ?? 1);

  const dayId = day?.id ?? null;
  // A few indexed rows, read in render. The compiler caches it on the split,
  // the week and `routines` — and the program screen reloads that tree on every
  // return from an editor, so an edit is never read stale.
  const rows = dayId ? splitPreview(dayId, week, locale) : [];

  const goPhase = (index: number) => {
    const next = routines[index];
    if (next) setNav(navFor(routines, next.id, null, current));
  };

  const phaseName = routine
    ? routineDisplayName(
        {
          name: presetRoutineName(programId, routine.id, routine.name, locale),
          orderIndex: routine.orderIndex,
        },
        t,
      )
    : '';
  const meta = routine ? phaseMeta(routine, t) : '';
  const schedule = day ? scheduleLabel(day, t, clock) : null;

  return (
    <Sheet visible={target !== null} onClose={onClose} snapPoints={STOPS} expandable={false}>
      <View style={{ minHeight: height * 0.6, flexShrink: 1 }}>
        <View className="px-5">
          {routines.length > 1 ? (
            <View className="flex-row items-center gap-3">
              <IconButton
                icon={<ChevronLeftIcon color={brand} size={18} />}
                disabled={routineIndex <= 0}
                accessibilityLabel={t('program.prevPhase')}
                onPress={() => goPhase(routineIndex - 1)}
              />
              <Text
                className="min-w-0 flex-1 text-center font-mono-medium text-xs uppercase tracking-wider text-ink-400"
                numberOfLines={1}
                accessibilityRole="header"
              >
                {t('program.phaseOf', { n: routineIndex + 1, total: routines.length })}
              </Text>
              <IconButton
                icon={<ChevronRightIcon color={brand} size={18} />}
                disabled={routineIndex >= routines.length - 1}
                accessibilityLabel={t('program.nextPhase')}
                onPress={() => goPhase(routineIndex + 1)}
              />
            </View>
          ) : null}
          <Text className="mt-2 text-lg font-sans-bold text-ink-50">{phaseName}</Text>
          {meta ? <Text className="mt-0.5 text-xs text-ink-400">{meta}</Text> : null}

          {routine && routine.days.length ? (
            <View className="mt-4">
              <ChipRow
                items={routine.days.map((d) => ({
                  value: d.id,
                  label: dayDisplayName(
                    {
                      name: presetDayName(programId, routine.id, d.id, d.name, locale),
                      orderIndex: d.orderIndex,
                    },
                    t,
                  ),
                }))}
                value={dayId}
                onChange={(id) => setNav((n) => (n ? { ...n, dayId: id } : n))}
              />
            </View>
          ) : null}
          {routine && routine.durationWeeks > 1 ? (
            <View className="mt-2">
              <ChipRow
                items={Array.from({ length: routine.durationWeeks }, (_, i) => ({
                  value: String(i + 1),
                  label:
                    routine.rmTestWeek === i + 1
                      ? `${t('training.weekN', { n: i + 1 })} · RM`
                      : t('training.weekN', { n: i + 1 }),
                }))}
                value={String(week)}
                onChange={(w) => setNav((n) => (n ? { ...n, week: Number(w) } : n))}
              />
            </View>
          ) : null}
        </View>

        <ScrollArea inSheet className="mt-4">
          {schedule ? <Text className="mb-2 text-xs text-ink-400">{schedule}</Text> : null}
          {day ? (
            <SplitExercises rows={rows} />
          ) : (
            <Text className="text-center text-sm text-ink-400">{t('program.noSplits')}</Text>
          )}
          {onEditDay && day ? (
            <View className="mt-4">
              <Button label={t('program.editSplit')} onPress={() => onEditDay(day.id)} />
            </View>
          ) : null}
        </ScrollArea>
      </View>
    </Sheet>
  );
};
