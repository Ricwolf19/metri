import { describe, expect, it, vi } from 'vitest';

import { bodyFront } from 'react-native-body-highlighter/dist/assets/bodyFront';

import { HIDDEN_REGIONS } from '@/features/training/body-regions';
import type { MuscleBalance } from '@/features/training/muscle-load';
import { MUSCLE_HEADS } from '@/features/training/muscles';
import type { TFunction } from '@/i18n';

import {
  BALANCE_PRINT_FILL,
  bodyReportHtml,
  weightChartHtml,
  type BodyReportInput,
} from './body-report';
import { figureSvg } from './figure';
import { esc } from './html';
import { programSheetHtml, type ProgramSheetInput } from './program-sheet';

vi.mock('expo-print', () => ({}));
vi.mock('expo-sharing', () => ({}));
vi.mock('expo-file-system/legacy', () => ({}));
const { pdfFileName } = await import('./pdf');

/** Keys come back as themselves, so a test can find what was asked for. */
const t: TFunction = (key, vars) => (vars ? `${key}(${Object.values(vars).join(',')})` : key);

const balance = (over: Partial<Record<MuscleBalance['head'], MuscleBalance['status']>>) =>
  MUSCLE_HEADS.map((head) => ({
    head,
    sets: over[head] ? 12 : 0,
    status: over[head] ?? 'untrained',
  })) satisfies MuscleBalance[];

const report = (over: Partial<BodyReportInput> = {}): BodyReportInput => ({
  lang: 'en',
  printedOn: 'Printed on 17 Nov 2026',
  weightUnit: 'kg',
  lengthUnit: 'cm',
  weekAverage: 82.4,
  weekDelta: -0.4,
  keySite: { label: 'Waist', delta: -1.2 },
  bodyFatPct: null,
  weight: {
    span: 20,
    points: [
      { day: 0, value: 83 },
      { day: 10, value: 82.6 },
      { day: 20, value: 82.1 },
    ],
    weekly: [
      { day: 3, value: 82.9 },
      { day: 17, value: 82.3 },
    ],
    fromLabel: '28 Oct',
    toLabel: '17 Nov',
  },
  needMore: 0,
  tape: [
    { label: 'Waist', key: true, when: '15 Nov', value: 84, previous: 85.2, delta: -1.2 },
    { label: 'Chest', key: false, when: '15 Nov', value: 102, previous: null, delta: null },
  ],
  map: {
    sex: 'male',
    windowDays: 30,
    sets: 48,
    balance: balance({ chest: 'optimal', quads: 'low' }),
    headName: (h) => `muscle.${h}`,
  },
  ...over,
});

describe('esc', () => {
  it('neutralises markup and quotes', () => {
    expect(esc(`<img src=x onerror="a('b')">&`)).toBe(
      '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;',
    );
  });
});

describe('bodyReportHtml', () => {
  it('lays out the web page: tiles, weight, tape, map', () => {
    const html = bodyReportHtml(report(), t);
    expect(html).toContain('print.bodyTitle');
    expect(html).toContain('Printed on 17 Nov 2026');
    // Four tiles; body fat unknown reads as a dash, the deltas carry their sign.
    expect(html.match(/class="tile"/g)).toHaveLength(4 + 1); // + the map's working-sets tile
    expect(html).toContain('—');
    expect(html).toContain('-0.4');
    expect(html).toContain('print.keySite');
    expect(html).toContain('print.sectionMapHint(30)');
    // The status is said in words, not only in colour.
    expect(html).toContain('stats.legendOptimal');
    expect(html).toContain('stats.legendLow');
  });

  it('says so when there is nothing to draw', () => {
    const html = bodyReportHtml(
      report({ weight: null, tape: [], map: { ...report().map, balance: balance({}), sets: 0 } }),
      t,
    );
    expect(html).toContain('print.noWeight');
    expect(html).toContain('print.noTape');
    expect(html).toContain('print.noSets');
  });

  it('asks for more weigh-ins when the week is thin', () => {
    expect(bodyReportHtml(report({ needMore: 2 }), t)).toContain('body.needMore(2)');
  });
});

describe('weightChartHtml', () => {
  // SVG text scales with the drawing; the guide values must be HTML.
  it('draws dots and the weekly line, with the guides as HTML text', () => {
    const html = weightChartHtml(report().weight!, '3 readings');
    expect(html.match(/<circle/g)).toHaveLength(3);
    expect(html).toMatch(/<path d="M[\d.]+,[\d.]+ L[\d.]+,[\d.]+"/);
    expect(html).not.toContain('<text');
    expect(html).toContain('>82.1</span>');
    expect(html).toContain('>83.0</span>');
  });
});

describe('figureSvg', () => {
  it('fills a region from the map and never draws the hidden ones', () => {
    const svg = figureSvg({
      sex: 'male',
      side: 'front',
      fills: new Map([['chest', BALANCE_PRINT_FILL.optimal]]),
      label: 'Front',
    });
    expect(svg).toContain(`fill="${BALANCE_PRINT_FILL.optimal}"`);
    expect(svg).toContain('viewBox="0 0 724 1448"');
    // `head`, `hair`, `feet`… are figure regions no exercise trains: one group per other region.
    const drawn = bodyFront.filter((p) => p.slug && !HIDDEN_REGIONS.includes(p.slug));
    expect(svg.match(/<g /g)).toHaveLength(drawn.length);
    expect(drawn.length).toBeLessThan(bodyFront.length);
    expect(svg).toContain(`fill="${BALANCE_PRINT_FILL.untrained}"`);
  });
});

describe('programSheetHtml', () => {
  const sheet = (weeks: number): ProgramSheetInput => ({
    lang: 'en',
    printedOn: 'Printed on today',
    name: 'My <b>plan</b>',
    description: null,
    phases: [
      {
        name: 'Phase 1',
        meta: `${weeks} weeks`,
        weeks,
        splits: [
          {
            name: 'Push',
            exercises: [
              {
                name: 'Bench press',
                rest: '3:00',
                cues: ['Pausa'],
                weeks: Array.from({ length: weeks }, () => ({
                  lines: ['Top set · 1 × 5', 'Back-off · 12 × 8'],
                  sets: [1, 12],
                })),
              },
            ],
          },
        ],
      },
    ],
  });

  it('splits a long phase into tables of four weeks', () => {
    const html = programSheetHtml(sheet(6), t);
    expect(html.match(/<table/g)).toHaveLength(2);
    expect(html).toContain('print.week(5)');
    expect(html).not.toContain('print.week(7)');
  });

  it('gives each set a box to write in, within reason', () => {
    const html = programSheetHtml(sheet(1), t);
    // 1 box for the top set, 12 back-off sets capped at 8.
    expect(html.match(/<span><\/span>/g)).toHaveLength(9);
    expect(html).toContain('training.rest');
  });

  it('escapes what the lifter typed', () => {
    const html = programSheetHtml(sheet(1), t);
    expect(html).toContain('My &lt;b&gt;plan&lt;/b&gt;');
    expect(html).not.toContain('<b>plan</b>');
  });
});

describe('pdfFileName', () => {
  it('slugs the title and dates the file', () => {
    expect(pdfFileName('Fuerza básica: Fase 1', new Date(2026, 10, 17))).toBe(
      'metri-fuerza-basica-fase-1-2026-11-17.pdf',
    );
    expect(pdfFileName('***', new Date(2026, 10, 17))).toBe('metri-document-2026-11-17.pdf');
  });
});
