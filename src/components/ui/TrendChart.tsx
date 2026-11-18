import {
  Circle,
  DashPathEffect,
  Line as SkiaLine,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { useT } from '@/i18n';
import { tokenHex } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';

import { axisValues, paddedDomain, seriesExtent, xDomain } from './chart-math';
import { ChartReadout } from './ChartReadout';
import { CONTROL_FONT_SCALE } from './typography';
import { useChartScrub } from './useChartScrub';

/**
 * A trend over time in four layers, told apart by MARK rather than by hue so
 * it reads without colour vision:
 *
 *   points   muted dots, no line   — the raw readings (noise)
 *   line     solid brand stroke    — the smoothed signal, the thing to judge
 *   target   dashed neutral stroke — where the plan says it should be
 *   markers  hollow brand rings    — events on the line (a record)
 *
 * One measure, one axis. Drawn by victory-native on Skia; every WORD is React
 * Native text (the readout above, the axis values beside, the dates under),
 * so it follows the reader's font size the way canvas text never would.
 * Touch reads it: a tap picks the nearest point of the line (or of the
 * readings, when there is no line yet), a sideways drag scrubs, and the
 * readout names the value and when. At rest it reads the latest point.
 */

export type TrendPoint = { x: number; y: number };

type Series = 'line' | 'points';

type Props = {
  /** Raw readings. `x` is any monotonic position (e.g. day index). */
  points?: readonly TrendPoint[];
  /** The smoothed series, drawn as the hero line. */
  line?: readonly TrendPoint[];
  /** Planned values, drawn dashed. */
  target?: readonly TrendPoint[];
  /** Points on the line worth a mark of their own (a PR), drawn as hollow rings. */
  markers?: readonly TrendPoint[];
  /** Legend labels — a legend renders for every series that has data. */
  labels: { points?: string; line?: string; target?: string; markers?: string };
  /** Shown under the plot, left and right (e.g. first and last date). */
  xLabels?: [string, string];
  /** When a point is, for the readout ("12 Nov", "week of 3 Nov"). */
  formatX?: (x: number, series: Series) => string;
  unit?: string;
  /** How a value reads; one decimal by default. */
  yFormat?: (value: number) => string;
  height?: number;
};

const DOMAIN_PADDING = { left: 8, right: 8, top: 10, bottom: 10 };

const LegendItem = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View className="flex-row items-center gap-1.5">
    {children}
    <Text
      numberOfLines={1}
      maxFontSizeMultiplier={CONTROL_FONT_SCALE}
      className="text-[11px] text-ink-400"
    >
      {label}
    </Text>
  </View>
);

const AxisValue = ({ value }: { value: string }) => (
  <Text
    numberOfLines={1}
    maxFontSizeMultiplier={CONTROL_FONT_SCALE}
    className="text-right font-mono text-[10px] text-ink-500"
  >
    {value}
  </Text>
);

const sortByX = (series: readonly TrendPoint[]) => [...series].sort((a, b) => a.x - b.x);

export const TrendChart = ({
  points = [],
  line = [],
  target = [],
  markers = [],
  labels,
  xLabels,
  formatX,
  unit = '',
  yFormat = (v) => String(Math.round(v * 10) / 10),
  height = 132,
}: Props) => {
  const t = useT();
  const { brand } = useTheme();
  const ink500 = tokenHex('--ink-500');
  const ink400 = tokenHex('--ink-400');
  const grid = tokenHex('--ink-700');
  const surface = tokenHex('--ink-800'); // the raised Card this chart sits on

  // The series a finger reads: the signal when there is one, else the readings.
  const series: Series = line.length ? 'line' : 'points';
  const data = sortByX(series === 'line' ? line : points);
  const scrub = useChartScrub(
    data.map((p) => p.x),
    data.map((p) => p.y),
  );
  const [axis, setAxis] = useState<[number, number, number] | null>(null);

  const all = [...points, ...line, ...target, ...markers];
  const active = scrub.selected != null ? data[scrub.selected] : data[data.length - 1];
  const seriesLabel = series === 'line' ? labels.line : labels.points;
  const extent = seriesExtent(data.map((p) => p.y));
  const summary = extent
    ? t('chart.summary', {
        series: seriesLabel ?? '',
        first: `${yFormat(extent.first)} ${unit}`.trim(),
        last: `${yFormat(extent.last)} ${unit}`.trim(),
        min: `${yFormat(extent.min)} ${unit}`.trim(),
        max: `${yFormat(extent.max)} ${unit}`.trim(),
      })
    : t('chart.empty');

  const when = active && formatX ? formatX(active.x, series) : null;
  const caption = [seriesLabel, when].filter(Boolean).join(' · ');

  const pathThrough = (
    pts: readonly TrendPoint[],
    toX: (v: number) => number,
    toY: (v: number) => number,
  ) => {
    const path = Skia.Path.Make();
    pts.forEach((p, i) =>
      i === 0 ? path.moveTo(toX(p.x), toY(p.y)) : path.lineTo(toX(p.x), toY(p.y)),
    );
    return path;
  };
  const dotsPath = (
    pts: readonly TrendPoint[],
    toX: (v: number) => number,
    toY: (v: number) => number,
    r: number,
  ) => {
    const path = Skia.Path.Make();
    pts.forEach((p) => path.addCircle(toX(p.x), toY(p.y), r));
    return path;
  };

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <ChartReadout
        value={active ? yFormat(active.y) : '—'}
        unit={active ? unit : undefined}
        caption={caption}
      />
      <View className="flex-row">
        <View className="min-w-0 flex-1">
          <View style={{ height }}>
            {all.length > 0 ? (
              <CartesianChart
                data={data}
                xKey="x"
                yKeys={['y']}
                domain={{ x: xDomain(all.map((p) => p.x)), y: paddedDomain(all.map((p) => p.y)) }}
                domainPadding={DOMAIN_PADDING}
                customGestures={scrub.gesture}
                onScaleChange={(xScale, yScale) => {
                  scrub.onScale(xScale);
                  const next = axisValues(yScale.domain());
                  setAxis((prev) => (prev && prev.every((v, i) => v === next[i]) ? prev : next));
                }}
              >
                {({ xScale, yScale, points: plotted, chartBounds }) => {
                  const { left, right, top, bottom } = chartBounds;
                  const pick = active ? { x: xScale(active.x), y: yScale(active.y) } : null;
                  return (
                    <>
                      {[top + 0.5, (top + bottom) / 2, bottom - 0.5].map((y) => (
                        <SkiaLine
                          key={y}
                          p1={vec(left, y)}
                          p2={vec(right, y)}
                          color={grid}
                          strokeWidth={1}
                        >
                          <DashPathEffect intervals={[2, 4]} />
                        </SkiaLine>
                      ))}
                      {target.length > 1 ? (
                        <Path
                          path={pathThrough(sortByX(target), xScale, yScale)}
                          style="stroke"
                          strokeWidth={1.5}
                          color={ink400}
                        >
                          <DashPathEffect intervals={[5, 5]} />
                        </Path>
                      ) : null}
                      {points.length ? (
                        <Path path={dotsPath(points, xScale, yScale, 2.5)} color={ink500} />
                      ) : null}
                      {line.length > 1 ? (
                        <Line
                          points={plotted.y}
                          color={brand}
                          strokeWidth={2}
                          strokeCap="round"
                          strokeJoin="round"
                        />
                      ) : null}
                      {/* Surface-ringed line dots: the ring keeps one legible where
                          it overlaps a reading or the target line. */}
                      {line.length ? (
                        <>
                          <Path path={dotsPath(line, xScale, yScale, 5)} color={surface} />
                          <Path path={dotsPath(line, xScale, yScale, 3)} color={brand} />
                        </>
                      ) : null}
                      {/* A ring, not a bigger dot: the mark differs even in greyscale. */}
                      {markers.map((m, i) => (
                        <Circle
                          key={`m${i}`}
                          cx={xScale(m.x)}
                          cy={yScale(m.y)}
                          r={7}
                          style="stroke"
                          strokeWidth={2}
                          color={brand}
                        />
                      ))}
                      {pick && scrub.selected != null ? (
                        <>
                          <SkiaLine
                            p1={vec(pick.x, top)}
                            p2={vec(pick.x, bottom)}
                            color={ink500}
                            strokeWidth={1}
                          />
                          <Circle cx={pick.x} cy={pick.y} r={6} color={surface} />
                          <Circle
                            cx={pick.x}
                            cy={pick.y}
                            r={4.5}
                            color={series === 'line' ? brand : ink400}
                          />
                        </>
                      ) : null}
                    </>
                  );
                }}
              </CartesianChart>
            ) : null}
          </View>
          {xLabels ? (
            <View className="mt-1 flex-row justify-between gap-3">
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                className="shrink text-[10px] text-ink-500"
              >
                {xLabels[0]}
              </Text>
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                className="shrink text-right text-[10px] text-ink-500"
              >
                {xLabels[1]}
              </Text>
            </View>
          ) : null}
        </View>
        {axis ? (
          <View className="ml-2 justify-between" style={{ height }}>
            {axis.map((v, i) => (
              <AxisValue key={i} value={yFormat(v)} />
            ))}
          </View>
        ) : null}
      </View>

      <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1.5">
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
        {markers.length > 0 && labels.markers ? (
          <LegendItem label={labels.markers}>
            <View className="h-3 w-3 rounded-full border-2 border-brand" />
          </LegendItem>
        ) : null}
        {target.length > 1 && labels.target ? (
          <LegendItem label={labels.target}>
            <View className="flex-row gap-0.5">
              <View className="h-0.5 w-1.5 bg-ink-400" />
              <View className="h-0.5 w-1.5 bg-ink-400" />
            </View>
          </LegendItem>
        ) : null}
      </View>
    </View>
  );
};
