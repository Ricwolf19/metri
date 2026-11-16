import type { TranslationKey } from '@/i18n/en';

export type CalcId =
  | 'onerm'
  | 'tdee'
  | 'macros'
  | 'bodyfat'
  | 'bmi'
  | 'ffmi'
  | 'water'
  | 'plates'
  | 'idealweight'
  | 'deficit'
  | 'protein'
  | 'leanmass'
  | 'heartrate'
  | 'whtr'
  | 'wilks'
  | 'calsburned';

export type SelectOption = { value: string; labelKey: TranslationKey };

/** A field that only feeds the result while a sibling select holds one of
 * `values` (body fat in TDEE is Katch-McArdle only). Otherwise it renders
 * disabled, with `reasonKey` saying why. Mirrors metri.info's calculators. */
export type FieldCondition = {
  field: string;
  values: string[];
  reasonKey?: TranslationKey;
};

export type CalcField = (
  | {
      name: string;
      kind: 'number';
      labelKey: TranslationKey;
      unit?: string;
      min?: number;
      max?: number;
      step?: number;
      default: number;
    }
  | {
      name: string;
      kind: 'select';
      labelKey: TranslationKey;
      options: SelectOption[];
      default: string;
    }
) & { usedWhen?: FieldCondition };

/** Whether `field` feeds the result for these values (see `FieldCondition`). */
export const fieldInUse = (field: { usedWhen?: FieldCondition }, values: CalcValues): boolean =>
  !field.usedWhen || field.usedWhen.values.includes(String(values[field.usedWhen.field]));

type ResultRow = {
  label?: string;
  labelKey?: TranslationKey;
  value: string;
};

/** Visual for the result panel (see CalcChart). */
export type CalcChart =
  | {
      kind: 'scale';
      value: number;
      min: number;
      max: number;
      segments: { upto: number; color: string; labelKey: TranslationKey }[];
    }
  | {
      kind: 'split';
      segments: { labelKey: TranslationKey; value: number; color: string }[];
    }
  | {
      kind: 'bars';
      max: number;
      bars: {
        labelKey?: TranslationKey;
        label?: string;
        value: number;
        display: string;
        color: string;
        highlight?: boolean;
      }[];
    }
  | {
      kind: 'ring';
      value: number;
      goal: number;
      centerValue: string;
      centerUnit?: string;
      color: string;
    }
  | {
      kind: 'barbell';
      plates: { plate: number; count: number }[];
    };

type CalcResult = {
  primaryLabelKey: TranslationKey;
  primaryValue: string;
  primaryUnit?: string;
  rows?: ResultRow[];
  noteKey?: TranslationKey;
  chart?: CalcChart;
} | null;

export type CalcValues = Record<string, number | string>;

export type CalcConfig = {
  id: CalcId;
  fields: CalcField[];
  compute: (v: CalcValues) => CalcResult;
};
