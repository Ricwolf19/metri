import type { Units } from '@/lib/storage';

const CM_PER_IN = 2.54;

export type LengthUnit = 'cm' | 'in';

/**
 * Length follows the weight setting rather than getting its own: a lifter who
 * thinks in pounds measures in inches. One preference, no mismatched pair.
 */
export const lengthUnitFor = (units: Units): LengthUnit => (units === 'lb' ? 'in' : 'cm');

/** Stored centimetres → the user's unit, 1 decimal (display only). */
export const fromCm = (cm: number, units: Units): number =>
  Math.round((units === 'lb' ? cm / CM_PER_IN : cm) * 10) / 10;

/** A typed value in the user's unit → centimetres for storage. */
export const toCm = (value: number, units: Units): number =>
  Math.round((units === 'lb' ? value * CM_PER_IN : value) * 10) / 10;
