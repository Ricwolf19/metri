import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useTheme } from '@/theme/theme-context';

/**
 * Minimal line/area trend on react-native-svg — deliberately not a charting
 * library. The app draws exactly two chart shapes (these lines and the bars in
 * `CalcChart`), both want theme tokens rather than a palette prop, and a
 * dependency here would be a native-free but upstream-bound answer to ~80
 * lines of path maths.
 */

export type TrendPoint = { label: string; value: number };

type Props = {
  points: TrendPoint[];
  height?: number;
  /** Optional horizontal reference, e.g. a goal weight. */
  goal?: number | null;
  /** Suffix for the min/max labels ("kg"). */
  unit?: string;
};

const PAD = 4;

export const TrendChart = ({ points, height = 120, goal, unit = '' }: Props) => {
  const { brand, scheme } = useTheme();
  const [width, setWidth] = useState(0);

  const values = points.map((p) => p.value);
  // Pad a flat series so a single value renders as a centred line, not a
  // divide-by-zero, and so a goal line outside the data range stays visible.
  const candidates = goal != null ? [...values, goal] : values;
  const rawMin = Math.min(...candidates);
  const rawMax = Math.max(...candidates);
  const span = rawMax - rawMin || Math.max(1, Math.abs(rawMax) * 0.1);
  const min = rawMin - span * 0.1;
  const max = rawMax + span * 0.1;

  const x = (i: number) =>
    points.length <= 1 ? width / 2 : PAD + (i / (points.length - 1)) * (width - PAD * 2);
  const y = (v: number) => PAD + (1 - (v - min) / (max - min)) * (height - PAD * 2);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ');
  const area = points.length
    ? `${line} L${x(points.length - 1)},${height} L${x(0)},${height} Z`
    : '';

  return (
    <View>
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && points.length > 0 ? (
          <Svg width={width} height={height}>
            {goal != null ? (
              <Line
                x1={PAD}
                y1={y(goal)}
                x2={width - PAD}
                y2={y(goal)}
                stroke={scheme === 'dark' ? '#52525b' : '#a1a1aa'}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ) : null}
            <Path d={area} fill={brand} fillOpacity={0.12} />
            <Path
              d={line}
              stroke={brand}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.length <= 12
              ? points.map((p, i) => (
                  <Circle key={p.label + i} cx={x(i)} cy={y(p.value)} r={2.5} fill={brand} />
                ))
              : null}
          </Svg>
        ) : null}
      </View>
      {points.length ? (
        <View className="mt-1 flex-row justify-between">
          <Text className="text-[10px] text-ink-500">{points[0].label}</Text>
          <Text className="text-[10px] text-ink-500">
            {Math.round(rawMin)}–{Math.round(rawMax)}
            {unit}
          </Text>
          <Text className="text-[10px] text-ink-500">{points[points.length - 1].label}</Text>
        </View>
      ) : null}
    </View>
  );
};
