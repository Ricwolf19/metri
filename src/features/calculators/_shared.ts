import type { TranslationKey } from '@/i18n/en';

import type { CalcValues, SelectOption } from './types';

export const fmt = (n: number) => n.toLocaleString('en-US');
export const num = (v: CalcValues, k: string) => Number(v[k]) || 0;
export const str = (v: CalcValues, k: string) => String(v[k] ?? '');

export const SEX_OPTIONS: SelectOption[] = [
  { value: 'male', labelKey: 'calc.male' },
  { value: 'female', labelKey: 'calc.female' },
];

export const ACTIVITY_OPTIONS: SelectOption[] = [
  { value: 'sedentary', labelKey: 'activity.sedentary' },
  { value: 'light', labelKey: 'activity.light' },
  { value: 'moderate', labelKey: 'activity.moderate' },
  { value: 'active', labelKey: 'activity.active' },
  { value: 'very_active', labelKey: 'activity.very_active' },
];

export const GOAL_OPTIONS: SelectOption[] = [
  { value: 'cut', labelKey: 'calc.goal.cut' },
  { value: 'maintain', labelKey: 'calc.goal.maintain' },
  { value: 'bulk', labelKey: 'calc.goal.bulk' },
];

export const BMI_NOTE: Record<string, TranslationKey> = {
  underweight: 'calc.bmi.underweight',
  normal: 'calc.bmi.normal',
  overweight: 'calc.bmi.overweight',
  obese: 'calc.bmi.obese',
};

export const BF_NOTE: Record<string, TranslationKey> = {
  essential: 'calc.bf.essential',
  athlete: 'calc.bf.athlete',
  fitness: 'calc.bf.fitness',
  average: 'calc.bf.average',
  high: 'calc.bf.high',
};

export const FFMI_NOTE: Record<string, TranslationKey> = {
  below: 'calc.ffmi.below',
  average: 'calc.ffmi.average',
  aboveAverage: 'calc.ffmi.aboveAverage',
  excellent: 'calc.ffmi.excellent',
  superior: 'calc.ffmi.superior',
  suspicious: 'calc.ffmi.suspicious',
};

export const WHTR_NOTE: Record<string, TranslationKey> = {
  low: 'calc.whtr.low',
  healthy: 'calc.whtr.healthy',
  increased: 'calc.whtr.increased',
  high: 'calc.whtr.high',
};

export const HR_ZONE_LABELS: Record<string, TranslationKey> = {
  z1: 'calc.hr.z1',
  z2: 'calc.hr.z2',
  z3: 'calc.hr.z3',
  z4: 'calc.hr.z4',
  z5: 'calc.hr.z5',
};

export const ACTIVITY_MET_OPTIONS: SelectOption[] = [
  { value: 'walking', labelKey: 'calc.met.walking' },
  { value: 'running', labelKey: 'calc.met.running' },
  { value: 'cycling', labelKey: 'calc.met.cycling' },
  { value: 'swimming', labelKey: 'calc.met.swimming' },
  { value: 'weightlifting', labelKey: 'calc.met.weightlifting' },
  { value: 'hiit', labelKey: 'calc.met.hiit' },
  { value: 'yoga', labelKey: 'calc.met.yoga' },
  { value: 'soccer', labelKey: 'calc.met.soccer' },
];

export const C = {
  blue: '#38bdf8',
  green: '#22c55e',
  lime: '#84cc16',
  yellow: '#eab308',
  orange: '#f97316',
  amber: '#f59e0b',
  red: '#ef4444',
  violet: '#8b5cf6',
};
