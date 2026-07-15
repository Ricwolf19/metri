import { HR_ZONES, type ActivityLevel, heartRateZones, hydration } from '../math';
import { ACTIVITY_OPTIONS, C, HR_ZONE_LABELS, fmt, num, str } from '../_shared';
import type { CalcConfig } from '../types';

export const water: CalcConfig = {
  id: 'water',
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
      name: 'activity',
      kind: 'select',
      labelKey: 'calc.activity',
      default: 'moderate',
      options: ACTIVITY_OPTIONS,
    },
  ],
  compute: (v) => {
    const h = hydration(num(v, 'weight'), str(v, 'activity') as ActivityLevel);
    if (h.ml <= 0) return null;
    return {
      primaryLabelKey: 'calc.result.water',
      primaryValue: fmt(h.liters),
      primaryUnit: 'L',
      rows: [
        { labelKey: 'calc.result.milliliters', value: `${fmt(h.ml)} ml` },
        { labelKey: 'calc.result.cups', value: fmt(h.cups) },
      ],
      chart: {
        kind: 'ring',
        value: h.liters,
        goal: 4,
        centerValue: fmt(h.liters),
        centerUnit: 'L',
        color: C.blue,
      },
    };
  },
};

export const heartrate: CalcConfig = {
  id: 'heartrate',
  fields: [
    { name: 'age', kind: 'number', labelKey: 'calc.age', min: 10, max: 120, step: 1, default: 30 },
    {
      name: 'resting',
      kind: 'number',
      labelKey: 'calc.restingHr',
      unit: 'bpm',
      min: 30,
      max: 120,
      step: 1,
      default: 60,
    },
  ],
  compute: (v) => {
    const r = heartRateZones(num(v, 'age'), num(v, 'resting'));
    if (r.maxHr <= 0) return null;
    return {
      primaryLabelKey: 'calc.result.maxHr',
      primaryValue: fmt(r.maxHr),
      primaryUnit: 'bpm',
      rows: r.zones.map((z) => ({
        labelKey: HR_ZONE_LABELS[z.id],
        value: `${fmt(z.lo)}–${fmt(z.hi)} bpm`,
      })),
      chart: {
        kind: 'bars',
        max: r.maxHr,
        bars: r.zones.map((z, i) => ({
          labelKey: HR_ZONE_LABELS[z.id],
          value: z.hi,
          display: `${fmt(z.lo)}–${fmt(z.hi)}`,
          color: [C.blue, C.green, C.lime, C.orange, C.red][i],
          highlight: i === HR_ZONES.length - 1,
        })),
      },
    };
  },
};
