import { View } from 'react-native';

import { useTheme } from '@/theme/theme-context';

export type PlateStack = { plate: number; count: number };

/**
 * Olympic kg plate colours (IWF), the one place the app paints by denomination:
 * the colour IS the plate's identity on a real rack, so it is data, not theme.
 * Anything off the standard (lb plates, odd sizes) falls back to neutral.
 */
const PLATE_COLORS: Record<number, string> = {
  25: '#ef4444',
  20: '#3b82f6',
  15: '#eab308',
  10: '#22c55e',
  5: '#e5e7eb',
  2.5: '#f97316',
  1.25: '#a1a1aa',
};
const plateColor = (p: number) => PLATE_COLORS[p] ?? '#a1a1aa';
const plateHeight = (p: number) => 22 + (Math.min(p, 25) / 25) * 42;

const Plate = ({ plate }: { plate: number }) => (
  <View
    style={{
      height: plateHeight(plate),
      width: 9,
      marginHorizontal: 1.5,
      borderRadius: 2,
      backgroundColor: plateColor(plate),
    }}
  />
);

/**
 * A bar seen from the side: both sleeves loaded the same, largest plate
 * innermost. `mirror` draws the full bar (the session's weight sheet); off, it
 * draws one sleeve for the compact calculator card. No bar (a plate-loaded
 * machine) drops the shaft and keeps the sleeves.
 */
export const BarGraphic = ({
  plates,
  bar = true,
  mirror = true,
}: {
  plates: PlateStack[];
  bar?: boolean;
  mirror?: boolean;
}) => {
  const { muted } = useTheme();
  const loaded = plates.flatMap((p) => Array.from({ length: p.count }, () => p.plate));
  const inner = loaded.map((p, i) => <Plate key={`l${i}`} plate={p} />);
  const outer = [...loaded].reverse().map((p, i) => <Plate key={`r${i}`} plate={p} />);
  const sleeve = <View style={{ height: 6, width: 28, borderRadius: 2, backgroundColor: muted }} />;
  const collar = <View style={{ height: 10, width: 6, borderRadius: 2, backgroundColor: muted }} />;
  return (
    <View className="w-full flex-row items-center justify-center overflow-hidden rounded-card border border-ink-700 bg-ink-900/40 px-2 py-4">
      {mirror ? (
        <>
          {sleeve}
          {outer}
          {collar}
        </>
      ) : null}
      <View
        style={{
          height: bar ? 6 : 2,
          width: mirror ? 72 : 36,
          borderRadius: 2,
          backgroundColor: muted,
          opacity: bar ? 1 : 0.35,
        }}
      />
      {collar}
      {inner}
      {sleeve}
    </View>
  );
};
