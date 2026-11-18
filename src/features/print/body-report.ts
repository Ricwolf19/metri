import { regionFills } from '@/features/training/body-regions';
import type { BalanceStatus, MuscleBalance } from '@/features/training/muscle-load';
import type { TFunction, TranslationKey } from '@/i18n';

import { figureSvg } from './figure';
import { documentHtml, esc, note, section, statTiles } from './html';
import { PRINT } from './palette';

/**
 * "Body & training report" — the app's own copy of metri.info's body page in
 * print: the week's average, how it moved, the key tape site and body fat as
 * tiles; the weight trend (daily dots, weekly line); the tape; and the muscle
 * map over the last 30 days. Every number arrives computed and in the
 * lifter's units (`body-report-data.ts`); this only lays them out.
 */

export type BodyReportInput = {
  lang: string;
  printedOn: string;
  weightUnit: string;
  lengthUnit: string;
  weekAverage: number | null;
  weekDelta: number | null;
  keySite: { label: string; delta: number | null };
  bodyFatPct: number | null;
  /** Days counted from the first week's start; `weekly` sits mid-week. Null: no weigh-ins. */
  weight: {
    span: number;
    points: readonly { day: number; value: number }[];
    weekly: readonly { day: number; value: number }[];
    fromLabel: string;
    toLabel: string;
  } | null;
  /** Weigh-ins still missing this week for a solid average (0 = enough). */
  needMore: number;
  tape: readonly {
    label: string;
    key: boolean;
    when: string;
    value: number;
    previous: number | null;
    delta: number | null;
  }[];
  map: {
    sex: 'male' | 'female';
    windowDays: number;
    sets: number;
    balance: readonly MuscleBalance[];
    headName: (head: MuscleBalance['head']) => string;
  };
};

const signed = (n: number): string => (n > 0 ? `+${n}` : String(n));

export const BALANCE_PRINT_FILL: Record<BalanceStatus, string> = {
  untrained: PRINT.untrained,
  low: PRINT.under,
  optimal: PRINT.brand,
  high: PRINT.over,
};

const STATUS_KEY: Record<BalanceStatus, TranslationKey> = {
  untrained: 'stats.legendUntrained',
  low: 'stats.legendLow',
  optimal: 'stats.legendOptimal',
  high: 'stats.legendHigh',
};

const W = 600;
const H = 180;
const PAD_X = 8;
const PAD_Y = 14;

/**
 * The weight trend, the web chart's drawing: dots for the days, the line for
 * the weeks, three dashed guides. The guide values are HTML laid over the SVG
 * (a percentage of the box's height IS a y in the drawing), so they print at
 * text size rather than scaling with the figure.
 */
export const weightChartHtml = (
  weight: NonNullable<BodyReportInput['weight']>,
  readings: string,
): string => {
  const values = [...weight.points, ...weight.weekly].map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const range = Math.max(1, hi - lo);
  const span = Math.max(1, weight.span);
  const x = (day: number) => PAD_X + (Math.max(0, Math.min(span, day)) / span) * (W - PAD_X * 2);
  const y = (v: number) => H - PAD_Y - ((v - lo) / range) * (H - PAD_Y * 2);
  const guides = [lo, (lo + hi) / 2, hi];
  const line = weight.weekly
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' ');
  const svg = `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto">${guides
    .map(
      (v) =>
        `<line x1="${PAD_X}" x2="${W - PAD_X}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="${PRINT.rule}" stroke-dasharray="2 4"/>`,
    )
    .join('')}${weight.points
    .map(
      (p) =>
        `<circle cx="${x(p.day).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="2.5" fill="${PRINT.dot}"/>`,
    )
    .join('')}${
    line
      ? `<path d="${line}" fill="none" stroke="${PRINT.brand}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
      : ''
  }</svg>`;
  const labels = guides
    .map(
      (v, i) =>
        // Above its guide, except the top one: there is no room left above it.
        `<span class="mono" style="position:absolute;right:6px;top:${((y(v) / H) * 100).toFixed(1)}%;font-size:9px;color:${PRINT.faint};${i === 2 ? 'padding-top:1px' : 'transform:translateY(-100%);padding-bottom:1px'}">${v.toFixed(1)}</span>`,
    )
    .join('');
  return `<div style="position:relative">${svg}${labels}</div><div class="axis"><span>${esc(
    weight.fromLabel,
  )}</span><span>${esc(readings)}</span><span>${esc(weight.toLabel)}</span></div>`;
};

const tapeHtml = (input: BodyReportInput, t: TFunction): string => {
  if (!input.tape.length) return note(t('print.noTape'));
  const unit = input.lengthUnit;
  return `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px">${input.tape
    .map(
      (row) =>
        `<div class="card" style="display:flex;gap:10px;align-items:center;padding:8px 12px;${
          row.key ? `border-color:${PRINT.brand};background:${PRINT.tint}` : ''
        }"><div style="flex:1;min-width:0"><div style="font-weight:600">${esc(row.label)}${
          row.key
            ? ` <span class="mono" style="font-size:8px;letter-spacing:0.06em;text-transform:uppercase;color:${PRINT.brandText};border:1px solid ${PRINT.brand};border-radius:99px;padding:0 5px">${esc(t('print.keySite'))}</span>`
            : ''
        }</div><div class="mono" style="font-size:9px;color:${PRINT.muted}">${esc(row.when)}${
          row.previous != null
            ? ` · ${esc(t('print.previous', { value: `${row.previous} ${unit}` }))}`
            : ''
        }</div></div><div style="text-align:right"><div class="mono" style="font-size:15px;font-weight:700">${row.value}<span class="unit">${esc(unit)}</span></div>${
          row.delta != null
            ? `<div class="mono" style="font-size:9px;color:${PRINT.muted}">${esc(signed(row.delta))} ${esc(unit)}</div>`
            : ''
        }</div></div>`,
    )
    .join('')}</div>`;
};

const mapHtml = (input: BodyReportInput, t: TFunction): string => {
  const { map } = input;
  const fills = regionFills(
    new Map(
      map.balance.map((b) => [b.head, { color: BALANCE_PRINT_FILL[b.status], weight: b.sets }]),
    ),
  );
  const figure = (side: 'front' | 'back', label: string) =>
    `<figure style="margin:0;flex:1;text-align:center"><div style="height:250px">${figureSvg({
      sex: map.sex,
      side,
      fills,
      label,
    })}</div><figcaption class="mono" style="font-size:9px;color:${PRINT.muted};margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">${esc(label)}</figcaption></figure>`;
  const legend = `<div class="legend">${(['untrained', 'low', 'optimal', 'high'] as const)
    .map(
      (s) =>
        `<span><i style="background:${BALANCE_PRINT_FILL[s]}"></i>${esc(t(STATUS_KEY[s]))}</span>`,
    )
    .join('')}</div>`;
  const trained = map.balance
    .filter((b) => b.status !== 'untrained')
    .sort((a, b) => b.sets - a.sets);
  const untrained = map.balance.filter((b) => b.status === 'untrained');
  const table = trained.length
    ? `<table><thead><tr><th>${esc(t('print.muscle'))}</th><th>${esc(t('print.perWeek'))}</th><th>${esc(
        t('print.status'),
      )}</th></tr></thead><tbody>${trained
        .map(
          (b) =>
            // The status is said in words too: colour alone is not a signal.
            `<tr><td><i style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:${BALANCE_PRINT_FILL[b.status]}"></i>${esc(
              map.headName(b.head),
            )}</td><td class="mono">${b.sets}</td><td>${esc(t(STATUS_KEY[b.status]))}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : note(t('print.noSets'));
  const rest = untrained.length
    ? note(
        `${t('stats.legendUntrained')}: ${untrained.map((b) => map.headName(b.head)).join(', ')}`,
      )
    : '';
  return `<div class="card"><div style="display:flex;gap:16px;align-items:flex-start"><div style="width:44%;display:flex;gap:6px">${figure(
    'front',
    t('stats.front'),
  )}${figure('back', t('stats.back'))}</div><div style="flex:1;min-width:0">${statTiles([
    { label: t('print.workingSets'), value: String(map.sets) },
  ])}<div style="margin-top:10px">${table}</div>${rest}</div></div>${legend}</div>`;
};

export const bodyReportHtml = (input: BodyReportInput, t: TFunction): string => {
  const { weightUnit: wu, lengthUnit: lu } = input;
  const tiles = statTiles([
    {
      label: t('body.weekAverage'),
      value: input.weekAverage != null ? String(input.weekAverage) : '—',
      unit: input.weekAverage != null ? wu : undefined,
    },
    {
      label: t('body.vsLastWeek'),
      value: input.weekDelta != null ? signed(input.weekDelta) : '—',
      unit: input.weekDelta != null ? wu : undefined,
    },
    {
      label: input.keySite.label,
      value: input.keySite.delta != null ? signed(input.keySite.delta) : '—',
      unit: input.keySite.delta != null ? lu : undefined,
    },
    {
      label: t('print.bodyFat'),
      value: input.bodyFatPct != null ? input.bodyFatPct.toFixed(1) : '—',
      unit: input.bodyFatPct != null ? '%' : undefined,
    },
  ]);
  const weight = input.weight
    ? `<div class="card">${weightChartHtml(
        input.weight,
        t('print.readings', { n: input.weight.points.length }),
      )}${input.needMore > 0 ? note(t('body.needMore', { n: input.needMore })) : ''}</div>`
    : note(t('print.noWeight'));
  return documentHtml({
    lang: input.lang,
    title: t('print.bodyTitle'),
    eyebrow: t('print.bodyEyebrow'),
    subtitle: t('print.bodySubtitle'),
    printedOn: input.printedOn,
    footer: t('print.footer'),
    html: [
      tiles,
      section({
        title: t('print.sectionWeight'),
        hint: t('print.sectionWeightHint'),
        html: weight,
      }),
      section({
        title: t('print.sectionTape'),
        hint: t('print.sectionTapeHint'),
        html: tapeHtml(input, t),
      }),
      section({
        title: t('print.sectionMap'),
        hint: t('print.sectionMapHint', { days: input.map.windowDays }),
        html: mapHtml(input, t),
      }),
    ].join(''),
  });
};
