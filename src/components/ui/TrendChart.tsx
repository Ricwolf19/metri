import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { THEME_VARS } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';

/**
 * A trend over time in three layers, told apart by MARK rather than by hue so
 * it reads without colour vision:
 *
 *   points   muted dots, no line   — the raw readings (noise)
 *   line     solid brand stroke    — the smoothed signal, the thing to judge
 *   target   dashed neutral stroke — where the plan says it should be
 *
 * One measure, one axis. Deliberately not a charting library: the app draws
 * exactly this and the bars in `CalcChart`, and both want theme tokens.
 */

export type TrendPoint = { x: number; y: number };

type Props = {
  /** Raw readings. `x` is any monotonic position (e.g. day index). */
  points?: readonly TrendPoint[];
  /** The smoothed series, drawn as the hero line. */
  line?: readonly TrendPoint[];
  /** Planned values, drawn dashed. */
  target?: readonly TrendPoint[];
  /** Legend labels — a legend renders for every series that has data. */
  labels: { points?: string; line?: string; target?: string };
  /** Shown under the plot, left and right (e.g. first and last date). */
  xLabels?: [string, string];
  unit?: string;
  height?: number;
};

const PAD_X = 8;
const PAD_Y = 10;

const LegendItem = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View className="mr-4 flex-row items-center gap-1.5">
    {children}
    <Text className="text-[11px] text-ink-400">{label}</Text>
  </View>
);

export const TrendChart = ({
  points = [],
  line = [],
  target = [],
  labels,
  xLabels,
  unit = '',
  height = 132,
}: Props) => {
  const { brand, scheme } = useTheme();
  const [width, setWidth] = useState(0);
  const ink = (token: string) => `rgb(${THEME_VARS[scheme][token]})`;
  const surface = ink('--ink-800'); // the raised Card this chart sits on

  const all = [...points, ...line, ...target];
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xSpan = Math.max(...xs) - xMin || 1;
  const yLo = Math.min(...ys);
  const yHi = Math.max(...ys);
  // Pad a flat series so a single value sits mid-plot instead of dividing by zero.
  const ySpan = yHi - yLo || Math.max(1, Math.abs(yHi) * 0.02);
  const yMin = yLo - ySpan * 0.12;
  const yMax = yHi + ySpan * 0.12;

  const px = (x: number) => PAD_X + ((x - xMin) / xSpan) * (width - PAD_X * 2);
  const py = (y: number) => PAD_Y + (1 - (y - yMin) / (yMax - yMin)) * (height - PAD_Y * 2);
  const pathOf = (series: readonly TrendPoint[]) =>
    series.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.x)},${py(p.y)}`).join(' ');

  return (
    <View>
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && all.length > 0 ? (
          <Svg width={width} height={height}>
            {target.length > 1 ? (
              <Path
                d={pathOf(target)}
                stroke={ink('--ink-400')}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                fill="none"
              />
            ) : null}
            {points.map((p, i) => (
              <Circle key={`p${i}`} cx={px(p.x)} cy={py(p.y)} r={2.5} fill={ink('--ink-500')} />
            ))}
            {line.length > 1 ? (
              <Path
                d={pathOf(line)}
                stroke={brand}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {/* Surface-ringed markers: the ring keeps a marker legible where it
                overlaps a dot or the target line. */}
            {line.map((p, i) => (
              <Circle
                key={`l${i}`}
                cx={px(p.x)}
                cy={py(p.y)}
                r={4}
                fill={brand}
                stroke={surface}
                strokeWidth={2}
              />
            ))}
          </Svg>
        ) : null}
      </View>

      <View className="mt-1 flex-row items-center justify-between">
        <Text className="text-[10px] text-ink-500">{xLabels?.[0] ?? ''}</Text>
        {all.length > 0 ? (
          <Text className="text-[10px] text-ink-500">
            {Math.round(yLo * 10) / 10}–{Math.round(yHi * 10) / 10}
            {unit}
          </Text>
        ) : null}
        <Text className="text-[10px] text-ink-500">{xLabels?.[1] ?? ''}</Text>
      </View>

      <View className="mt-2 flex-row flex-wrap">
        {line.length > 0 && labels.line ? (
          <LegendItem label={labels.line}>
            <View className="h-0.5 w-4 rounded-full bg-brand" />
          </LegendItem>
        ) : null}
        {points.length > 0 && labels.points ? (
          <LegendItem label={labels.points}>
            <View className="h-1.5 w-1.5 rounded-full bg-ink-500" />
          </LegendItem>
        ) : null}
        {target.length > 1 && labels.target ? (
          <LegendItem label={labels.target}>
            <Svg width={16} height={4}>
              <Line
                x1={0}
                y1={2}
                x2={16}
                y2={2}
                stroke={ink('--ink-400')}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            </Svg>
          </LegendItem>
        ) : null}
      </View>
    </View>
  );
};
