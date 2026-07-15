import { Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import type { CalcChart as Chart } from '../types';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Standard Olympic kg plate colours, with a neutral fallback. */
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

type Size = 'sm' | 'md' | 'lg';
const DIM: Record<Size, number> = { sm: 96, md: 132, lg: 168 };

export const CalcChart = ({ chart, size = 'md' }: { chart: Chart; size?: Size }) => {
  const t = useT();
  const { scheme } = useTheme();
  const track = scheme === 'dark' ? '#27272a' : '#e4e4e7';
  const dim = DIM[size];

  if (chart.kind === 'bars') {
    return (
      <View className="w-full gap-2.5">
        {chart.bars.map((b, i) => (
          <View key={i} className="flex-row items-center gap-3">
            <Text numberOfLines={1} className="w-16 shrink-0 text-xs text-ink-300">
              {b.labelKey ? t(b.labelKey) : b.label}
            </Text>
            <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-700">
              <View
                style={{
                  width: `${clamp((b.value / (chart.max || 1)) * 100, 0, 100)}%`,
                  backgroundColor: b.color,
                  opacity: b.highlight ? 1 : 0.5,
                  height: '100%',
                  borderRadius: 9999,
                }}
              />
            </View>
            <Text
              numberOfLines={1}
              className="w-16 shrink-0 text-right font-mono text-xs text-ink-100"
            >
              {b.display}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (chart.kind === 'ring') {
    const R = 52;
    const CIRC = 2 * Math.PI * R;
    const frac = clamp(chart.value / (chart.goal || 1), 0, 1);
    return (
      <View className="items-center">
        <View style={{ width: dim, height: dim }}>
          <Svg viewBox="0 0 120 120" width={dim} height={dim}>
            <G rotation={-90} origin="60, 60">
              <Circle cx={60} cy={60} r={R} fill="none" stroke={track} strokeWidth={10} />
              <Circle
                cx={60}
                cy={60}
                r={R}
                fill="none"
                stroke={chart.color}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${frac * CIRC} ${CIRC}`}
              />
            </G>
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="font-mono-medium text-2xl text-ink-50">{chart.centerValue}</Text>
            {chart.centerUnit ? (
              <Text className="text-xs text-ink-400">{chart.centerUnit}</Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  if (chart.kind === 'barbell') {
    const stack = chart.plates.flatMap((p) => Array.from({ length: p.count }, () => p.plate));
    return (
      <View className="w-full flex-row flex-wrap items-center justify-center gap-y-1 overflow-hidden rounded-card border border-ink-700 bg-ink-900/40 px-2 py-4">
        <View style={{ height: 6, width: 36, borderRadius: 2, backgroundColor: '#71717a' }} />
        {stack.length === 0 ? (
          <View style={{ height: 6, width: 64, backgroundColor: '#52525b' }} />
        ) : (
          stack.map((p, i) => (
            <View
              key={i}
              style={{
                height: plateHeight(p),
                width: 9,
                marginHorizontal: 1.5,
                borderRadius: 2,
                backgroundColor: plateColor(p),
              }}
            />
          ))
        )}
        <View style={{ height: 10, width: 8, borderRadius: 2, backgroundColor: '#71717a' }} />
      </View>
    );
  }

  if (chart.kind === 'split') {
    const total = chart.segments.reduce((s, x) => s + x.value, 0) || 1;
    return (
      <View className="mt-1 w-full">
        <View className="h-3 w-full flex-row overflow-hidden rounded-full">
          {chart.segments.map((s) => (
            <View
              key={s.labelKey}
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            />
          ))}
        </View>
        <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
          {chart.segments.map((s) => (
            <View key={s.labelKey} className="flex-row items-center gap-1.5">
              <View
                style={{ height: 10, width: 10, borderRadius: 9999, backgroundColor: s.color }}
              />
              <Text className="text-xs text-ink-300">
                {t(s.labelKey)} · {Math.round((s.value / total) * 100)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // scale — banded gauge + spectrum bar + marker
  const { value, min, max, segments } = chart;
  const active = segments.find((s) => value < s.upto) ?? segments[segments.length - 1];
  const markerPct = clamp(((value - min) / (max - min || 1)) * 100, 0, 100);
  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const ARC = 0.75;
  const frac = clamp((value - min) / (max - min || 1), 0, 1);
  return (
    <View className="w-full items-center">
      <View style={{ width: dim, height: dim }}>
        <Svg viewBox="0 0 120 120" width={dim} height={dim}>
          <G rotation={135} origin="60, 60">
            <Circle
              cx={60}
              cy={60}
              r={R}
              fill="none"
              stroke={track}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${ARC * CIRC} ${CIRC}`}
            />
            <Circle
              cx={60}
              cy={60}
              r={R}
              fill="none"
              stroke={active.color}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${ARC * CIRC * frac} ${CIRC}`}
            />
          </G>
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="font-mono-medium text-2xl text-ink-50">{value}</Text>
        </View>
      </View>
      <Text className="mt-1 text-xs font-sans-medium" style={{ color: active.color }}>
        {t(active.labelKey)}
      </Text>

      <View className="mt-3 w-full">
        <View className="relative">
          <View className="h-2 w-full flex-row overflow-hidden rounded-full">
            {segments.map((s, i) => {
              const prev = i === 0 ? min : segments[i - 1].upto;
              return (
                <View
                  key={s.labelKey}
                  style={{
                    width: `${((s.upto - prev) / (max - min || 1)) * 100}%`,
                    backgroundColor: s.color,
                  }}
                />
              );
            })}
          </View>
          {/* value marker */}
          <View
            className="absolute bg-ink-50"
            style={{
              left: `${markerPct}%`,
              top: -3,
              marginLeft: -1,
              width: 2,
              height: 14,
              borderRadius: 1,
            }}
          />
        </View>
        <View className="mt-1 flex-row justify-between">
          <Text className="font-mono text-[10px] text-ink-400">{min}</Text>
          <Text className="font-mono text-[10px] text-ink-400">{max}</Text>
        </View>
      </View>
    </View>
  );
};
