import { forwardRef } from 'react';
import { Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { BrandMark } from '../BrandMark';
import { SHARE } from './palette';
import { ShareSparkline } from './ShareSparkline';

type ShareMetric = { label: string; value: string };
type ShareBar = { label: string; value: number };
/** One exercise line: a short code, what was done, a star when it was a record. */
type ShareRow = { name: string; detail: string; pr?: boolean };

export type ShareCardProps = {
  /** Small lime uppercase line above the title (e.g. "Training day"). */
  eyebrow: string;
  title: string;
  subtitle?: string;
  metrics?: ShareMetric[];
  /** Optional mini bar chart (values are relative). */
  bars?: ShareBar[];
  /** A trend as a bare line (e.g. e1RM over the last sessions). */
  spark?: number[];
  /** Exercise rows: the name truncates, the result column stays aligned on the right. */
  rows?: ShareRow[];
  lines?: string[];
  footer: string;
};

const WIDTH = 340;
const INNER = WIDTH - 48;
const CHART_H = 64;

/** Brand share card (twin of metri.info's OG card). Always dark — it is an image, not a themed surface.
 * Render it, then capture with `useShareCard`. */
export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { eyebrow, title, subtitle, metrics = [], bars = [], spark = [], rows = [], lines = [], footer },
  ref,
) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const gap = 6;
  const barW = bars.length ? (INNER - gap * (bars.length - 1)) / bars.length : 0;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: WIDTH, backgroundColor: SHARE.bg }}
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
          backgroundColor: SHARE.glow,
        }}
      />

      <View className="flex-row items-center gap-2.5">
        <BrandMark size={28} />
        <Text style={{ color: SHARE.ink }} className="text-base font-sans-bold tracking-wide">
          Metri
        </Text>
      </View>

      <Text
        style={{ color: SHARE.brand }}
        className="mt-6 font-mono-medium text-[11px] uppercase tracking-[3px]"
      >
        {eyebrow}
      </Text>
      <Text style={{ color: SHARE.ink }} className="mt-2 text-[26px] leading-8 font-sans-bold">
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: SHARE.muted }} className="mt-1.5 text-sm leading-5">
          {subtitle}
        </Text>
      ) : null}

      {metrics.length ? (
        <View className="mt-5 flex-row gap-2">
          {metrics.map((m) => (
            <View
              key={m.label}
              style={{ backgroundColor: SHARE.tile, borderColor: SHARE.tileBorder }}
              className="flex-1 rounded-field border px-3 py-2.5"
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={{ color: SHARE.ink }}
                className="text-lg font-sans-bold"
              >
                {m.value}
              </Text>
              <Text
                style={{ color: SHARE.dim }}
                className="mt-0.5 font-mono-medium text-[10px] uppercase tracking-wider"
              >
                {m.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {spark.length > 1 ? (
        <View className="mt-5">
          <ShareSparkline values={spark} width={INNER} />
        </View>
      ) : null}

      {bars.length ? (
        <View className="mt-5">
          <Svg width={INNER} height={CHART_H}>
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
                  fill={i === bars.length - 1 ? SHARE.brand : SHARE.brandSoft}
                />
              );
            })}
          </Svg>
          <View className="mt-1.5 flex-row">
            {bars.map((b, i) => (
              <Text
                key={`${i}-${b.label}`}
                numberOfLines={1}
                style={{ color: SHARE.dim, width: barW + gap }}
                className="text-center font-mono-medium text-[9px] uppercase"
              >
                {b.label}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {rows.length ? (
        <View className="mt-5 gap-1.5">
          {rows.map((r, i) => (
            <View key={`${i}-${r.name}`} className="flex-row items-center">
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ color: SHARE.line }}
                className="min-w-0 flex-1 pr-3 text-xs"
              >
                {r.name}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: SHARE.ink, width: 92 }}
                className="text-right font-mono text-xs"
              >
                {r.detail}
              </Text>
              <Text style={{ color: SHARE.brand, width: 16 }} className="text-right text-xs">
                {r.pr ? '★' : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {lines.length ? (
        <View className="mt-5 gap-1">
          {lines.map((line, i) => (
            <Text
              key={`${i}-${line}`}
              numberOfLines={1}
              style={{ color: SHARE.line }}
              className="text-xs"
            >
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={{ color: SHARE.dim }} className="mt-6 text-xs">
        {footer}
      </Text>
    </View>
  );
});
