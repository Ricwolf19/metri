import {
  dayDisplayName,
  phaseMeta,
  routineDisplayName,
  setGroupLine,
} from '@/features/training/labels';
import { badgeLabel } from '@/features/training/programs/badge-copy';
import { presetDayName, presetProgramCopy, presetRoutineName } from '@/features/training/programs';
import { getProgram, getProgramTree } from '@/features/training/programs.repo';
import { splitPreview } from '@/features/training/session.repo';
import { formatRest } from '@/features/training/session-timeline';
import type { Locale, TFunction } from '@/i18n';

import type { ProgramSheetInput } from './program-sheet';

/**
 * The program sheet's content, read the way the program screen and the quick
 * view read it: the tree the screen shows (template, or the enrolled copy),
 * preset copy resolved in the app's language, and each week through
 * `splitPreview` — the same expansion a session opens — so paper and phone
 * never disagree. Synchronous: run it behind the blocking overlay.
 */
export const programSheetInput = (args: {
  programId: string;
  userProgramId: string | null;
  locale: Locale;
  t: TFunction;
  printedOn: string;
}): ProgramSheetInput | null => {
  const { programId, locale, t } = args;
  const program = getProgram(programId);
  if (!program) return null;
  const tree = getProgramTree(programId, args.userProgramId);
  const preset = presetProgramCopy(program.id, locale);
  return {
    lang: locale,
    printedOn: args.printedOn,
    name: preset?.name ?? program.name,
    description: preset?.description ?? program.description ?? null,
    phases: tree.routines.map((routine) => ({
      name: routineDisplayName(
        {
          name: presetRoutineName(program.id, routine.id, routine.name, locale),
          orderIndex: routine.orderIndex,
        },
        t,
      ),
      meta: phaseMeta(routine, t),
      weeks: routine.durationWeeks,
      splits: routine.days.map((day) => {
        const byWeek = Array.from({ length: routine.durationWeeks }, (_, w) =>
          splitPreview(day.id, w + 1, locale),
        );
        return {
          name: dayDisplayName(
            {
              name: presetDayName(program.id, routine.id, day.id, day.name, locale),
              orderIndex: day.orderIndex,
            },
            t,
          ),
          exercises: (byWeek[0] ?? []).map((row, i) => ({
            name: row.name,
            rest: row.restSeconds ? formatRest(row.restSeconds) : null,
            cues: row.badges.map((b) => badgeLabel(b, locale)),
            weeks: byWeek.map((rows) => {
              const groups = rows[i]?.groups ?? [];
              const multi = groups.length > 1;
              return {
                lines: groups.map((g, gi) =>
                  setGroupLine(
                    g,
                    multi ? (gi === 0 ? t('training.topSet') : t('training.backOff')) : null,
                    t,
                  ),
                ),
                sets: groups.map((g) => g.sets),
              };
            }),
          })),
        };
      }),
    })),
  };
};
