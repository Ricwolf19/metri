import { Line as SkiaLine, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';

import { tokenHex } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';

import { labelStride, showsLabel } from './chart-math';
import { ChartReadout } from './ChartReadout';
import { CONTROL_FONT_SCALE } from './typography';
import { useChartScrub } from './useChartScrub';

export type BarDatum = {
  /** Under the bar, short ("3 Nov", "Jun"). */
  label: string;
  value: number;
  /** The value as the readout prints it ("12.4k"). */
  display: string;
  /** What the readout names when this bar is picked; `label` by default. */
  caption?: string;
};

type Props = {
  bars: readonly BarDatum[];
  /** Beside the readout's value ("kg"). */
  unit?: string;
  /** Names the chart for screen readers ("Weekly volume"). */
  title: string;
  height?: number;
};

/** A label narrower than this would collide with its neighbour's. */
const MIN_LABEL_WIDTH = 44;
const MAX_BAR_WIDTH = 28;
const DIM = 0.4;

/**
 * Bars over time, the current one (the last) lit: weekly volume, sessions a
 * month. Tap a bar — or drag across them — to read it in the line above; a
 * second tap on it goes back to the current one. Labels sit under their bars
 * as React Native text in one cell per bar, and thin out (counted back from
 * the current bar, which always keeps its label) when the chart is too narrow
 * for all of them, so they never overlap into a smudge.
 */
export const BarChart = ({ bars, unit, title, height = 120 }: Props) => {
  const { brand } = useTheme();
  const baseline = tokenHex('--ink-600');
  const [width, setWidth] = useState(0);
  const scrub = useChartScrub(
    bars.map((_, i) => i),
    bars.map((b) => b.value),
  );

  const lit = scrub.selected ?? bars.length - 1;
  const active = bars[lit];
  const cell = bars.length ? width / bars.length : 0;
  const stride = labelStride(bars.length, width, MIN_LABEL_WIDTH);
  const data = bars.map((b, i) => ({ x: i, y: b.value }));
  const max = Math.max(1, ...bars.map((b) => b.value));
  const summary = `${title}: ${bars.map((b) => `${b.caption ?? b.label} ${b.display}`).join(', ')}`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <ChartReadout
        value={active?.display ?? '—'}
        unit={active ? unit : undefined}
        caption={active ? (active.caption ?? active.label) : undefined}
      />
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && bars.length > 0 ? (
          <CartesianChart
            data={data}
            xKey="x"
            yKeys={['y']}
            domain={{ x: [0, Math.max(1, bars.length - 1)], y: [0, max] }}
            // Half a cell on each side puts bar i at the centre of label cell i.
            domainPadding={{ left: cell / 2, right: cell / 2, top: 8 }}
            customGestures={scrub.gesture}
            onScaleChange={(xScale) => scrub.onScale(xScale)}
          >
            {({ points, chartBounds }) => {
              const barWidth = Math.min(MAX_BAR_WIDTH, cell * 0.56);
              const corners = { topLeft: 4, topRight: 4 };
              return (
                <>
                  <SkiaLine
                    p1={vec(chartBounds.left, chartBounds.bottom - 0.5)}
                    p2={vec(chartBounds.right, chartBounds.bottom - 0.5)}
                    color={baseline}
                    strokeWidth={1}
                  />
                  <Bar
                    points={points.y.filter((_, i) => i !== lit)}
                    chartBounds={chartBounds}
                    barWidth={barWidth}
                    roundedCorners={corners}
                    color={brand}
                    opacity={DIM}
                  />
                  {points.y[lit] ? (
                    <Bar
                      points={[points.y[lit]]}
                      chartBounds={chartBounds}
                      barWidth={barWidth}
                      roundedCorners={corners}
                      color={brand}
                    />
                  ) : null}
                </>
              );
            }}
          </CartesianChart>
        ) : null}
      </View>
      <View className="mt-1.5 flex-row">
        {bars.map((b, i) => (
          <Text
            key={`${b.label}-${i}`}
            numberOfLines={1}
            maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            className={[
              'flex-1 text-center text-[10px]',
              i === lit ? 'text-ink-200' : 'text-ink-500',
            ].join(' ')}
          >
            {showsLabel(i, bars.length, stride) ? b.label : ''}
          </Text>
        ))}
      </View>
    </View>
  );
};
