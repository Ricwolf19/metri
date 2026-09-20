import { forwardRef } from 'react';
import { Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { BrandMark } from './BrandMark';

type ShareMetric = { label: string; value: string };
type ShareBar = { label: string; value: number };

type Props = {
  /** Small lime uppercase line above the title (e.g. "Training day"). */
  eyebrow: string;
  title: string;
  subtitle?: string;
  metrics?: ShareMetric[];
  /** Optional mini bar chart (values are relative). */
  bars?: ShareBar[];
  lines?: string[];
  footer: string;
};

const WIDTH = 340;
const CHART_H = 64;

/** Brand share card (twin of metri.info's OG card). Always dark — it is an image, not a themed surface.
 * Render it, then capture with `useShareCard`. */
export const ShareCard = forwardRef<View, Props>(function ShareCard(
  { eyebrow, title, subtitle, metrics = [], bars = [], lines = [], footer },
  ref,
) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const gap = 6;
  const barW = bars.length ? (WIDTH - 48 - gap * (bars.length - 1)) / bars.length : 0;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: WIDTH, backgroundColor: '#09090b' }}
      className="overflow-hidden rounded-card border border-ink-700 p-6"
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -120,
          top: -160,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: 'rgba(190,248,43,0.14)',
        }}
      />

      <View className="flex-row items-center gap-2.5">
        <BrandMark size={28} />
        <Text style={{ color: '#fafafa' }} className="text-base font-sans-bold tracking-wide">
          Metri
        </Text>
      </View>

      <Text
        style={{ color: '#bef82b' }}
        className="mt-6 font-mono-medium text-[11px] uppercase tracking-[3px]"
      >
        {eyebrow}
      </Text>
      <Text style={{ color: '#fafafa' }} className="mt-2 text-[26px] leading-8 font-sans-bold">
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: '#a1a1aa' }} className="mt-1.5 text-sm leading-5">
          {subtitle}
        </Text>
      ) : null}

      {metrics.length ? (
        <View className="mt-5 flex-row gap-2">
          {metrics.map((m) => (
            <View
              key={m.label}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
              className="flex-1 rounded-field border px-3 py-2.5"
            >
              <Text style={{ color: '#fafafa' }} className="text-lg font-sans-bold">
                {m.value}
              </Text>
              <Text
                style={{ color: '#71717a' }}
                className="mt-0.5 font-mono-medium text-[10px] uppercase tracking-wider"
              >
                {m.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {bars.length ? (
        <View className="mt-5">
          <Svg width={WIDTH - 48} height={CHART_H}>
            {bars.map((b, i) => {
              const h = Math.max(3, (b.value / max) * CHART_H);
              return (
                <Rect
                  key={`${i}-${b.label}`}
                  x={i * (barW + gap)}
                  y={CHART_H - h}
                  width={barW}
                  height={h}
                  rx={3}
                  fill={i === bars.length - 1 ? '#bef82b' : 'rgba(190,248,43,0.35)'}
                />
              );
            })}
          </Svg>
          <View className="mt-1.5 flex-row">
            {bars.map((b, i) => (
              <Text
                key={`${i}-${b.label}`}
                numberOfLines={1}
                style={{ color: '#71717a', width: barW + gap }}
                className="text-center font-mono-medium text-[9px] uppercase"
              >
                {b.label}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {lines.length ? (
        <View className="mt-5 gap-1">
          {lines.map((line, i) => (
            <Text
              key={`${i}-${line}`}
              numberOfLines={1}
              style={{ color: '#d4d4d8' }}
              className="text-xs"
            >
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={{ color: '#71717a' }} className="mt-6 text-xs">
        {footer}
      </Text>
    </View>
  );
});
