import { Text } from 'react-native';

import type { Units } from '@/lib/storage';

import { describeLoad, type LoadDetail } from '../load';

/**
 * How the live row's number is built, as one caption: "20 + 2×(20, 2.5)",
 * "10 + 6×5", "1×(45, 25)". Text only — a swatch per plate was tried and read
 * worse than the arithmetic once a side held more than a few plates.
 */
export const LoadBreakdown = ({ load, unit }: { load: LoadDetail; unit: Units }) => (
  <Text className="text-xs text-ink-400">{describeLoad(load, unit).parts}</Text>
);
