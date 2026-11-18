import type { TFunction } from '@/i18n';

import { documentHtml, esc, note, section, statTiles } from './html';
import { PRINT } from './palette';

/**
 * "Program sheet" — a program to carry on paper: every phase, every split, the
 * exercises with their cues and rest, and per week the prescription with an
 * empty box per set to write the weight in by hand. Same page shell as the
 * body report. Strings arrive resolved (`program-sheet-data.ts`).
 */

type SheetWeek = {
  /** One line per set group ("3 × 8–10 · RIR 2"). */
  lines: string[];
  /** Sets per group — an empty box each. */
  sets: number[];
};

type SheetExercise = {
  name: string;
  rest: string | null;
  cues: string[];
  /** Index = week − 1. */
  weeks: SheetWeek[];
};

export type ProgramSheetInput = {
  lang: string;
  printedOn: string;
  name: string;
  description: string | null;
  phases: {
    name: string;
    meta: string;
    weeks: number;
    splits: { name: string; exercises: SheetExercise[] }[];
  }[];
};

/** Weeks per table: four fit a portrait page with room to write. */
const WEEKS_PER_TABLE = 4;
/** More boxes than this in one group would not fit a column; the line still says the count. */
const MAX_BOXES = 8;

const CSS = `
.sheet th:first-child, .sheet td:first-child { width: 30%; }
.sheet td { font-size: 10px; }
.sheet .rx { font-family: ui-monospace, 'Roboto Mono', Menlo, monospace; font-size: 9.5px; color: ${PRINT.ink}; }
.sheet .boxes { display: flex; flex-wrap: wrap; gap: 3px; margin: 3px 0 5px; }
.sheet .boxes span { display: inline-block; width: 26px; height: 18px; border: 1px solid ${PRINT.outline}; border-radius: 3px; }
.sheet .ex { font-weight: 600; font-size: 11px; }
.sheet .meta { color: ${PRINT.muted}; font-size: 9.5px; margin-top: 2px; }
`;

const weekCell = (week: SheetWeek | undefined): string =>
  week
    ? week.lines
        .map(
          (line, i) =>
            `<div class="rx">${esc(line)}</div><div class="boxes">${'<span></span>'.repeat(
              Math.min(MAX_BOXES, Math.max(0, week.sets[i] ?? 0)),
            )}</div>`,
        )
        .join('')
    : '';

const splitTables = (
  split: ProgramSheetInput['phases'][number]['splits'][number],
  weeks: number,
  t: TFunction,
): string => {
  const chunks: number[][] = [];
  for (let start = 1; start <= weeks; start += WEEKS_PER_TABLE) {
    chunks.push(
      Array.from({ length: Math.min(WEEKS_PER_TABLE, weeks - start + 1) }, (_, i) => start + i),
    );
  }
  return chunks
    .map(
      (chunk) =>
        `<table class="sheet"><thead><tr><th>${esc(t('print.exercise'))}</th>${chunk
          .map((w) => `<th>${esc(t('print.week', { n: w }))}</th>`)
          .join('')}</tr></thead><tbody>${split.exercises
          .map(
            (ex) =>
              `<tr><td><div class="ex">${esc(ex.name)}</div>${
                ex.rest ? `<div class="meta">${esc(t('training.rest'))} ${esc(ex.rest)}</div>` : ''
              }${ex.cues.length ? `<div class="meta">${ex.cues.map(esc).join(' · ')}</div>` : ''}</td>${chunk
                .map((w) => `<td>${weekCell(ex.weeks[w - 1])}</td>`)
                .join('')}</tr>`,
          )
          .join('')}</tbody></table>`,
    )
    .join('');
};

export const programSheetHtml = (input: ProgramSheetInput, t: TFunction): string => {
  const weeks = input.phases.reduce((n, p) => n + p.weeks, 0);
  const splits = input.phases.reduce((n, p) => n + p.splits.length, 0);
  const tiles = statTiles([
    { label: t('print.phases'), value: String(input.phases.length) },
    { label: t('print.weeks'), value: String(weeks) },
    { label: t('print.splits'), value: String(splits) },
    {
      label: t('print.exercises'),
      value: String(
        new Set(
          input.phases.flatMap((p) => p.splits.flatMap((s) => s.exercises.map((e) => e.name))),
        ).size,
      ),
    },
  ]);
  const phases = input.phases
    .map((phase) =>
      section({
        title: phase.name,
        hint: phase.meta,
        flow: true,
        html: phase.splits
          .map(
            (split) =>
              `<h3>${esc(split.name)}</h3>${
                split.exercises.length
                  ? splitTables(split, phase.weeks, t)
                  : note(t('training.empty'))
              }`,
          )
          .join(''),
      }),
    )
    .join('');
  return documentHtml({
    lang: input.lang,
    title: input.name,
    eyebrow: t('print.programEyebrow'),
    subtitle: input.description,
    printedOn: input.printedOn,
    footer: t('print.footer'),
    css: CSS,
    html: `${tiles}<p class="note" style="margin-top:12px">${esc(t('print.writeHint'))}</p>${phases}`,
  });
};
