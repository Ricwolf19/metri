import {
  ACTIVITY_METS,
  type ActivityLevel,
  type BmrFormula,
  type Goal,
  type Sex,
  bmr,
  calorieDeficit,
  caloriesBurned,
  macros,
  proteinTarget,
  tdee,
} from '../math';
import {
  ACTIVITY_MET_OPTIONS,
  ACTIVITY_OPTIONS,
  C,
  GOAL_OPTIONS,
  SEX_OPTIONS,
  fmt,
  num,
  str,
} from '../_shared';
import type { CalcConfig } from '../types';

export const tdeeConfig: CalcConfig = {
  id: 'tdee',
  fields: [
    { name: 'sex', kind: 'select', labelKey: 'calc.sex', default: 'male', options: SEX_OPTIONS },
    { name: 'age', kind: 'number', labelKey: 'calc.age', min: 10, max: 120, step: 1, default: 30 },
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
    {
      name: 'bodyFat',
      kind: 'number',
      labelKey: 'calc.bodyFat',
      unit: '%',
      min: 0,
      max: 70,
      step: 0.5,
      default: 18,
    },
    {
      name: 'activity',
      kind: 'select',
      labelKey: 'calc.activity',
      default: 'moderate',
      options: ACTIVITY_OPTIONS,
    },
    {
      name: 'formula',
      kind: 'select',
      labelKey: 'calc.formula',
      default: 'mifflin',
      options: [
        { value: 'mifflin', labelKey: 'calc.formula.mifflin' },
        { value: 'harris', labelKey: 'calc.formula.harris' },
        { value: 'katch', labelKey: 'calc.formula.katch' },
      ],
    },
  ],
  compute: (v) => {
    const b = bmr(str(v, 'formula') as BmrFormula, {
      sex: str(v, 'sex') as Sex,
      weightKg: num(v, 'weight'),
      heightCm: num(v, 'height'),
      age: num(v, 'age'),
      bodyFatPct: num(v, 'bodyFat'),
    });
    if (b <= 0) return null;
    const maintain = tdee(b, str(v, 'activity') as ActivityLevel);
    const cut = maintain - 500;
    const bulk = maintain + 300;
    return {
      primaryLabelKey: 'calc.result.tdee',
      primaryValue: fmt(maintain),
      primaryUnit: 'kcal',
      rows: [
        { labelKey: 'calc.result.bmr', value: `${fmt(b)} kcal` },
        { labelKey: 'calc.result.cut', value: `${fmt(cut)} kcal` },
        { labelKey: 'calc.result.bulk', value: `${fmt(bulk)} kcal` },
      ],
      chart: {
        kind: 'bars',
        max: bulk,
        bars: [
          { labelKey: 'calc.result.bmr', value: b, display: fmt(b), color: C.violet },
          { labelKey: 'calc.goal.cut', value: cut, display: fmt(cut), color: C.amber },
          {
            labelKey: 'calc.goal.maintain',
            value: maintain,
            display: fmt(maintain),
            color: C.green,
            highlight: true,
          },
          { labelKey: 'calc.goal.bulk', value: bulk, display: fmt(bulk), color: C.blue },
        ],
      },
    };
  },
};

export const macrosConfig: CalcConfig = {
  id: 'macros',
  fields: [
    {
      name: 'calories',
      kind: 'number',
      labelKey: 'calc.calories',
      unit: 'kcal',
      min: 800,
      max: 6000,
      step: 10,
      default: 2500,
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
    {
      name: 'goal',
      kind: 'select',
      labelKey: 'calc.goalLabel',
      default: 'maintain',
      options: GOAL_OPTIONS,
    },
  ],
  compute: (v) => {
    const cals = num(v, 'calories');
    if (cals <= 0) return null;
    const m = macros(cals, num(v, 'weight'), str(v, 'goal') as Goal);
    return {
      primaryLabelKey: 'calc.calories',
      primaryValue: fmt(cals),
      primaryUnit: 'kcal',
      rows: [
        { labelKey: 'calc.result.protein', value: `${fmt(m.protein)} g` },
        { labelKey: 'calc.result.carbs', value: `${fmt(m.carbs)} g` },
        { labelKey: 'calc.result.fat', value: `${fmt(m.fat)} g` },
      ],
      chart: {
        kind: 'split',
        segments: [
          { labelKey: 'calc.result.protein', value: m.protein * 4, color: C.green },
          { labelKey: 'calc.result.carbs', value: m.carbs * 4, color: C.blue },
          { labelKey: 'calc.result.fat', value: m.fat * 9, color: C.amber },
        ],
      },
    };
  },
};

export const deficit: CalcConfig = {
  id: 'deficit',
  fields: [
    {
      name: 'current',
      kind: 'number',
      labelKey: 'calc.currentWeight',
      unit: 'kg',
      min: 25,
      max: 350,
      step: 0.5,
      default: 90,
    },
    {
      name: 'goal',
      kind: 'number',
      labelKey: 'calc.goalWeight',
      unit: 'kg',
      min: 25,
      max: 350,
      step: 0.5,
      default: 80,
    },
    {
      name: 'rate',
      kind: 'number',
      labelKey: 'calc.weeklyRate',
      unit: 'kg',
      min: 0.1,
      max: 1.5,
      step: 0.1,
      default: 0.5,
    },
  ],
  compute: (v) => {
    const r = calorieDeficit(num(v, 'current'), num(v, 'goal'), num(v, 'rate'));
    if (r.toChange <= 0) return null;
    return {
      primaryLabelKey:
        r.direction === 'lose' ? 'calc.result.dailyDeficit' : 'calc.result.dailySurplus',
      primaryValue: fmt(r.dailyKcal),
      primaryUnit: 'kcal',
      noteKey: r.direction === 'lose' ? 'calc.deficit.lose' : 'calc.deficit.gain',
      rows: [
        {
          labelKey: r.direction === 'lose' ? 'calc.result.toLose' : 'calc.result.toGain',
          value: `${fmt(r.toChange)} kg`,
        },
        { labelKey: 'calc.result.weeksToGoal', value: fmt(r.weeks) },
        { labelKey: 'calc.result.monthsToGoal', value: fmt(r.months) },
      ],
    };
  },
};

export const protein: CalcConfig = {
  id: 'protein',
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
      name: 'goal',
      kind: 'select',
      labelKey: 'calc.goalLabel',
      default: 'maintain',
      options: GOAL_OPTIONS,
    },
  ],
  compute: (v) => {
    const r = proteinTarget(num(v, 'weight'), str(v, 'goal') as Goal);
    if (r.grams <= 0) return null;
    return {
      primaryLabelKey: 'calc.result.protein',
      primaryValue: fmt(r.grams),
      primaryUnit: 'g',
      rows: [
        { labelKey: 'calc.result.proteinKcal', value: `${fmt(r.kcal)} kcal` },
        { labelKey: 'calc.result.perMeal', value: `${fmt(r.perMeal)} g` },
      ],
    };
  },
};

export const calsburned: CalcConfig = {
  id: 'calsburned',
  fields: [
    {
      name: 'activity',
      kind: 'select',
      labelKey: 'calc.activity',
      default: 'running',
      options: ACTIVITY_MET_OPTIONS,
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
    {
      name: 'minutes',
      kind: 'number',
      labelKey: 'calc.minutes',
      unit: 'min',
      min: 1,
      max: 480,
      step: 1,
      default: 30,
    },
  ],
  compute: (v) => {
    const met = ACTIVITY_METS[str(v, 'activity')] ?? 0;
    const r = caloriesBurned(met, num(v, 'weight'), num(v, 'minutes'));
    if (r.total <= 0) return null;
    return {
      primaryLabelKey: 'calc.result.caloriesBurned',
      primaryValue: fmt(r.total),
      primaryUnit: 'kcal',
      rows: [{ labelKey: 'calc.result.perHour', value: `${fmt(r.perHour)} kcal` }],
    };
  },
};
