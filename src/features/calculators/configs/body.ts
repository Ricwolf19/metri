import {
  type Sex,
  bmi,
  bmiCategory,
  bodyFatCategory,
  bodyFatNavy,
  ffmi,
  ffmiBand,
  healthyWeightRange,
  idealWeight,
  leanMass,
  waistToHeight,
  whtrBand,
} from '../math';
import { BF_NOTE, BMI_NOTE, C, FFMI_NOTE, SEX_OPTIONS, WHTR_NOTE, fmt, num, str } from '../_shared';
import type { CalcConfig } from '../types';
import type { TranslationKey } from '@/i18n/en';

export const bodyfat: CalcConfig = {
  id: 'bodyfat',
  fields: [
    { name: 'sex', kind: 'select', labelKey: 'calc.sex', default: 'male', options: SEX_OPTIONS },
    {
      name: 'height',
      kind: 'number',
      labelKey: 'calc.height',
      unit: 'cm',
      min: 90,
      max: 250,
      step: 1,
      default: 180,
    },
    {
      name: 'neck',
      kind: 'number',
      labelKey: 'calc.neck',
      unit: 'cm',
      min: 20,
      max: 80,
      step: 0.5,
      default: 38,
    },
    {
      name: 'waist',
      kind: 'number',
      labelKey: 'calc.waist',
      unit: 'cm',
      min: 40,
      max: 200,
      step: 0.5,
      default: 85,
    },
    {
      name: 'hip',
      kind: 'number',
      labelKey: 'calc.hip',
      unit: 'cm',
      min: 40,
      max: 200,
      step: 0.5,
      default: 95,
    },
  ],
  compute: (v) => {
    const sex = str(v, 'sex') as Sex;
    const bf = bodyFatNavy({
      sex,
      heightCm: num(v, 'height'),
      neckCm: num(v, 'neck'),
      waistCm: num(v, 'waist'),
      hipCm: num(v, 'hip'),
    });
    if (bf <= 0) return null;
    const bfSegments =
      sex === 'male'
        ? [
            { upto: 6, color: C.blue, labelKey: 'calc.bf.essential' as TranslationKey },
            { upto: 14, color: C.green, labelKey: 'calc.bf.athlete' as TranslationKey },
            { upto: 18, color: C.lime, labelKey: 'calc.bf.fitness' as TranslationKey },
            { upto: 25, color: C.yellow, labelKey: 'calc.bf.average' as TranslationKey },
            { upto: 42, color: C.red, labelKey: 'calc.bf.high' as TranslationKey },
          ]
        : [
            { upto: 14, color: C.blue, labelKey: 'calc.bf.essential' as TranslationKey },
            { upto: 21, color: C.green, labelKey: 'calc.bf.athlete' as TranslationKey },
            { upto: 25, color: C.lime, labelKey: 'calc.bf.fitness' as TranslationKey },
            { upto: 32, color: C.yellow, labelKey: 'calc.bf.average' as TranslationKey },
            { upto: 48, color: C.red, labelKey: 'calc.bf.high' as TranslationKey },
          ];
    return {
      primaryLabelKey: 'calc.result.bodyFat',
      primaryValue: fmt(bf),
      primaryUnit: '%',
      noteKey: BF_NOTE[bodyFatCategory(bf, sex)],
      chart: {
        kind: 'scale',
        value: bf,
        min: sex === 'male' ? 3 : 8,
        max: sex === 'male' ? 42 : 48,
        segments: bfSegments,
      },
    };
  },
};

export const bmiConfig: CalcConfig = {
  id: 'bmi',
  fields: [
    {
      name: 'height',
      kind: 'number',
      labelKey: 'calc.height',
      unit: 'cm',
      min: 90,
      max: 250,
      step: 1,
      default: 180,
    },
    {
      name: 'weight',
      kind: 'number',
      labelKey: 'calc.weight',
      unit: 'kg',
      min: 25,
      max: 350,
      step: 0.5,
      default: 80,
    },
  ],
  compute: (v) => {
    const value = bmi(num(v, 'weight'), num(v, 'height'));
    if (value <= 0) return null;
    const range = healthyWeightRange(num(v, 'height'));
    return {
      primaryLabelKey: 'calc.result.bmi',
      primaryValue: fmt(value),
      noteKey: BMI_NOTE[bmiCategory(value)],
      rows: [
        { labelKey: 'calc.result.healthyRange', value: `${fmt(range.min)}–${fmt(range.max)} kg` },
      ],
      chart: {
        kind: 'scale',
        value,
        min: 15,
        max: 40,
        segments: [
          { upto: 18.5, color: C.blue, labelKey: 'calc.bmi.underweight' },
          { upto: 25, color: C.green, labelKey: 'calc.bmi.normal' },
          { upto: 30, color: C.yellow, labelKey: 'calc.bmi.overweight' },
          { upto: 40, color: C.red, labelKey: 'calc.bmi.obese' },
        ],
      },
    };
  },
};

export const ffmiConfig: CalcConfig = {
  id: 'ffmi',
  fields: [
    {
      name: 'weight',
      kind: 'number',
      labelKey: 'calc.weight',
      unit: 'kg',
      min: 25,
      max: 350,
      step: 0.5,
      default: 80,
    },
    {
      name: 'height',
      kind: 'number',
      labelKey: 'calc.height',
      unit: 'cm',
      min: 90,
      max: 250,
      step: 1,
      default: 180,
    },
    {
      name: 'bodyFat',
      kind: 'number',
      labelKey: 'calc.bodyFat',
      unit: '%',
      min: 1,
      max: 60,
      step: 0.5,
      default: 15,
    },
  ],
  compute: (v) => {
    const r = ffmi({
      weightKg: num(v, 'weight'),
      heightCm: num(v, 'height'),
      bodyFatPct: num(v, 'bodyFat'),
    });
    if (r.normalized <= 0) return null;
    return {
      primaryLabelKey: 'calc.result.ffmi',
      primaryValue: fmt(r.normalized),
      noteKey: FFMI_NOTE[ffmiBand(r.normalized)],
      rows: [{ labelKey: 'calc.result.ffmiRaw', value: fmt(r.raw) }],
      chart: {
        kind: 'scale',
        value: r.normalized,
        min: 16,
        max: 30,
        segments: [
          { upto: 18, color: C.red, labelKey: 'calc.ffmi.below' },
          { upto: 20, color: C.orange, labelKey: 'calc.ffmi.average' },
          { upto: 22, color: C.yellow, labelKey: 'calc.ffmi.aboveAverage' },
          { upto: 23, color: C.lime, labelKey: 'calc.ffmi.excellent' },
          { upto: 26, color: C.green, labelKey: 'calc.ffmi.superior' },
          { upto: 30, color: C.violet, labelKey: 'calc.ffmi.suspicious' },
        ],
      },
    };
  },
};

export const idealweight: CalcConfig = {
  id: 'idealweight',
  fields: [
    { name: 'sex', kind: 'select', labelKey: 'calc.sex', default: 'male', options: SEX_OPTIONS },
    {
      name: 'height',
      kind: 'number',
      labelKey: 'calc.height',
      unit: 'cm',
      min: 90,
      max: 250,
      step: 1,
      default: 180,
    },
  ],
  compute: (v) => {
    const sex = str(v, 'sex') as Sex;
    const heightCm = num(v, 'height');
    const iw = idealWeight(sex, heightCm);
    if (iw.devine <= 0) return null;
    const range = healthyWeightRange(heightCm);
    return {
      primaryLabelKey: 'calc.result.idealWeight',
      primaryValue: fmt(iw.devine),
      primaryUnit: 'kg',
      rows: [
        { labelKey: 'calc.result.robinson', value: `${fmt(iw.robinson)} kg` },
        { labelKey: 'calc.result.healthyRange', value: `${fmt(range.min)}–${fmt(range.max)} kg` },
      ],
      chart: {
        kind: 'bars',
        max: Math.max(iw.devine, iw.robinson, range.max),
        bars: [
          {
            labelKey: 'calc.result.devine',
            value: iw.devine,
            display: `${fmt(iw.devine)} kg`,
            color: C.green,
            highlight: true,
          },
          {
            labelKey: 'calc.result.robinson',
            value: iw.robinson,
            display: `${fmt(iw.robinson)} kg`,
            color: C.blue,
          },
          {
            labelKey: 'calc.result.healthyRange',
            value: range.max,
            display: `${fmt(range.min)}–${fmt(range.max)} kg`,
            color: C.lime,
          },
        ],
      },
    };
  },
};

export const leanmass: CalcConfig = {
  id: 'leanmass',
  fields: [
    { name: 'sex', kind: 'select', labelKey: 'calc.sex', default: 'male', options: SEX_OPTIONS },
    {
      name: 'weight',
      kind: 'number',
      labelKey: 'calc.weight',
      unit: 'kg',
      min: 25,
      max: 350,
      step: 0.5,
      default: 80,
    },
    {
      name: 'height',
      kind: 'number',
      labelKey: 'calc.height',
      unit: 'cm',
      min: 90,
      max: 250,
      step: 1,
      default: 180,
    },
    {
      name: 'bodyFat',
      kind: 'number',
      labelKey: 'calc.bodyFat',
      unit: '%',
      min: 1,
      max: 60,
      step: 0.5,
      default: 18,
    },
  ],
  compute: (v) => {
    const r = leanMass({
      sex: str(v, 'sex') as Sex,
      weightKg: num(v, 'weight'),
      heightCm: num(v, 'height'),
      bodyFatPct: num(v, 'bodyFat'),
    });
    if (r.boer <= 0) return null;
    return {
      primaryLabelKey: 'calc.result.leanMass',
      primaryValue: fmt(r.boer),
      primaryUnit: 'kg',
      rows: [
        { labelKey: 'calc.result.lbmFromBf', value: `${fmt(r.fromBf)} kg` },
        { labelKey: 'calc.result.fatMass', value: `${fmt(r.fatMass)} kg` },
      ],
      chart: {
        kind: 'split',
        segments: [
          { labelKey: 'calc.result.leanMass', value: r.fromBf, color: C.green },
          { labelKey: 'calc.result.fatMass', value: r.fatMass, color: C.amber },
        ],
      },
    };
  },
};

export const whtr: CalcConfig = {
  id: 'whtr',
  fields: [
    {
      name: 'waist',
      kind: 'number',
      labelKey: 'calc.waist',
      unit: 'cm',
      min: 40,
      max: 200,
      step: 0.5,
      default: 85,
    },
    {
      name: 'height',
      kind: 'number',
      labelKey: 'calc.height',
      unit: 'cm',
      min: 90,
      max: 250,
      step: 1,
      default: 180,
    },
  ],
  compute: (v) => {
    const ratio = waistToHeight(num(v, 'waist'), num(v, 'height'));
    if (ratio <= 0) return null;
    return {
      primaryLabelKey: 'calc.result.whtr',
      primaryValue: ratio.toFixed(2),
      noteKey: WHTR_NOTE[whtrBand(ratio)],
      chart: {
        kind: 'scale',
        value: ratio,
        min: 0.3,
        max: 0.7,
        segments: [
          { upto: 0.4, color: C.blue, labelKey: 'calc.whtr.low' },
          { upto: 0.5, color: C.green, labelKey: 'calc.whtr.healthy' },
          { upto: 0.6, color: C.yellow, labelKey: 'calc.whtr.increased' },
          { upto: 0.7, color: C.red, labelKey: 'calc.whtr.high' },
        ],
      },
    };
  },
};
