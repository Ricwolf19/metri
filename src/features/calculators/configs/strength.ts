import { type OneRmFormula, RM_PERCENTAGES, type Sex, dotsScore, oneRm, plateLoad } from '../math';
import { C, SEX_OPTIONS, fmt, num, str } from '../_shared';
import type { CalcConfig } from '../types';

export const onerm: CalcConfig = {
  id: 'onerm',
  fields: [
    {
      name: 'weight',
      kind: 'number',
      labelKey: 'calc.weight',
      unit: 'kg',
      min: 1,
      max: 500,
      step: 0.5,
      default: 100,
    },
    { name: 'reps', kind: 'number', labelKey: 'calc.reps', min: 1, max: 20, step: 1, default: 5 },
    {
      name: 'formula',
      kind: 'select',
      labelKey: 'calc.formula',
      default: 'epley',
      options: [
        { value: 'epley', labelKey: 'calc.formula.epley' },
        { value: 'brzycki', labelKey: 'calc.formula.brzycki' },
      ],
    },
  ],
  compute: (v) => {
    const w = num(v, 'weight');
    const reps = num(v, 'reps');
    const max = oneRm(w, reps, str(v, 'formula') as OneRmFormula);
    if (max <= 0) return null;
    const atPct = (pct: number) => Math.round(((max * pct) / 100) * 10) / 10;
    return {
      primaryLabelKey: 'calc.result.oneRm',
      primaryValue: fmt(max),
      primaryUnit: 'kg',
      rows: RM_PERCENTAGES.filter((p) => p.pct < 100).map((p) => ({
        label: `${p.pct}% · ${p.reps}`,
        value: `${fmt(atPct(p.pct))} kg`,
      })),
      chart: {
        kind: 'bars',
        max,
        bars: RM_PERCENTAGES.map((p) => ({
          label: `${p.pct}%`,
          value: (max * p.pct) / 100,
          display: `${fmt(atPct(p.pct))} kg`,
          color: C.green,
          highlight: p.pct === 100,
        })),
      },
    };
  },
};

export const plates: CalcConfig = {
  id: 'plates',
  fields: [
    {
      name: 'target',
      kind: 'number',
      labelKey: 'calc.targetWeight',
      unit: 'kg',
      min: 20,
      max: 500,
      step: 2.5,
      default: 100,
    },
    {
      name: 'bar',
      kind: 'number',
      labelKey: 'calc.barWeight',
      unit: 'kg',
      min: 5,
      max: 25,
      step: 5,
      default: 20,
    },
  ],
  compute: (v) => {
    const r = plateLoad(num(v, 'target'), num(v, 'bar'));
    if (r.perSide <= 0) return null;
    return {
      primaryLabelKey: 'calc.result.perSide',
      primaryValue: fmt(r.perSide),
      primaryUnit: 'kg',
      rows: r.plates.map((p) => ({ label: `${p.plate} kg`, value: `× ${p.count}` })),
      chart: { kind: 'barbell', plates: r.plates },
    };
  },
};

export const wilks: CalcConfig = {
  id: 'wilks',
  fields: [
    { name: 'sex', kind: 'select', labelKey: 'calc.sex', default: 'male', options: SEX_OPTIONS },
    {
      name: 'bodyweight',
      kind: 'number',
      labelKey: 'calc.weight',
      unit: 'kg',
      min: 30,
      max: 250,
      step: 0.5,
      default: 90,
    },
    {
      name: 'total',
      kind: 'number',
      labelKey: 'calc.liftTotal',
      unit: 'kg',
      min: 50,
      max: 1500,
      step: 2.5,
      default: 500,
    },
  ],
  compute: (v) => {
    const score = dotsScore(str(v, 'sex') as Sex, num(v, 'bodyweight'), num(v, 'total'));
    if (score <= 0) return null;
    return {
      primaryLabelKey: 'calc.result.dots',
      primaryValue: fmt(score),
      rows: [
        { labelKey: 'calc.liftTotal', value: `${fmt(num(v, 'total'))} kg` },
        { labelKey: 'calc.weight', value: `${fmt(num(v, 'bodyweight'))} kg` },
      ],
    };
  },
};
