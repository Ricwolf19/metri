import { forwardRef } from 'react';
import { Text, View } from 'react-native';

import { BrandMark } from '../BrandMark';
import { SHARE } from './palette';

type ShareMetric = { label: string; value: string };
/** One exercise line: the full name, what was done, a star when it was a record. */
type ShareRow = { name: string; detail: string; pr?: boolean };
/** The headline under the title: the session's top exercise and why it is the top one. */
type ShareHighlight = { label: string; title: string; detail?: string; note?: string };

export type ShareCardProps = {
  /** Small lime uppercase line above the title (e.g. "Training day"). */
  eyebrow: string;
  title: string;
  subtitle?: string;
  highlight?: ShareHighlight;
  /** Stat tiles: up to three share a row; four go two by two. */
  metrics?: ShareMetric[];
  /** Exercise rows: the name truncates, the result column stays aligned on the right. */
  rows?: ShareRow[];
  lines?: string[];
  footer: string;
};

const WIDTH = 340;

/** Rows of stat tiles: never four to a row — a value then has ~60 px. */
const tileRows = (metrics: ShareMetric[]): ShareMetric[][] => {
  const perRow = metrics.length > 3 ? 2 : metrics.length;
  const rows: ShareMetric[][] = [];
  for (let i = 0; i < metrics.length; i += perRow) rows.push(metrics.slice(i, i + perRow));
  return rows;
};

/**
 * Brand share card (twin of metri.info's OG card). Always dark — it is an
 * image, not a themed surface. Render it, then capture with `useShareCard`.
 * Every text is `allowFontScaling={false}`: a fixed-size PNG must not overflow
 * because the phone's font is set large.
 */
export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { eyebrow, title, subtitle, highlight, metrics = [], rows = [], lines = [], footer },
  ref,
) {
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
        <Text
          allowFontScaling={false}
          style={{ color: SHARE.ink }}
          className="text-base font-sans-bold tracking-wide"
        >
          Metri
        </Text>
      </View>

      <Text
        allowFontScaling={false}
        style={{ color: SHARE.brand }}
        className="mt-6 font-mono-medium text-[11px] uppercase tracking-[3px]"
      >
        {eyebrow}
      </Text>
      <Text
        allowFontScaling={false}
        style={{ color: SHARE.ink }}
        className="mt-2 text-[26px] leading-8 font-sans-bold"
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          allowFontScaling={false}
          style={{ color: SHARE.muted }}
          className="mt-1.5 text-sm leading-5"
        >
          {subtitle}
        </Text>
      ) : null}

      {highlight ? (
        <View
          style={{ borderColor: SHARE.brandSoft, backgroundColor: SHARE.tile }}
          className="mt-5 rounded-field border px-3.5 py-3"
        >
          <Text
            allowFontScaling={false}
            style={{ color: SHARE.brand }}
            className="font-mono-medium text-[10px] uppercase tracking-[2px]"
          >
            ★ {highlight.label}
          </Text>
          <View className="mt-1.5 flex-row items-baseline">
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ color: SHARE.ink }}
              className="min-w-0 flex-1 pr-3 text-base font-sans-bold"
            >
              {highlight.title}
            </Text>
            {highlight.detail ? (
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={{ color: SHARE.ink }}
                className="shrink-0 font-mono-medium text-sm"
              >
                {highlight.detail}
              </Text>
            ) : null}
          </View>
          {highlight.note ? (
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{ color: SHARE.line }}
              className="mt-1 text-xs"
            >
              {highlight.note}
            </Text>
          ) : null}
        </View>
      ) : null}

      {metrics.length ? (
        <View className="mt-5 gap-2">
          {tileRows(metrics).map((row) => (
            <View key={row.map((m) => m.label).join('|')} className="flex-row gap-2">
              {row.map((m) => (
                <View
                  key={m.label}
                  style={{ backgroundColor: SHARE.tile, borderColor: SHARE.tileBorder }}
                  className="flex-1 rounded-field border px-3 py-2.5"
                >
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    style={{ color: SHARE.ink }}
                    className="text-lg font-sans-bold"
                  >
                    {m.value}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={{ color: SHARE.dim }}
                    className="mt-0.5 font-mono-medium text-[10px] uppercase tracking-wider"
                  >
                    {m.label}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {rows.length ? (
        <View className="mt-5 gap-1.5">
          {rows.map((r, i) => (
            <View key={`${i}-${r.name}`} className="flex-row items-center">
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ color: SHARE.line }}
                className="min-w-0 flex-1 pr-3 text-xs"
              >
                {r.name}
              </Text>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={{ color: SHARE.ink, width: 92 }}
                className="text-right font-mono text-xs"
              >
                {r.detail}
              </Text>
              <Text
                allowFontScaling={false}
                style={{ color: SHARE.brand, width: 16 }}
                className="text-right text-xs"
              >
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
              allowFontScaling={false}
              numberOfLines={1}
              style={{ color: SHARE.line }}
              className="text-xs"
            >
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      <Text allowFontScaling={false} style={{ color: SHARE.dim }} className="mt-6 text-xs">
        {footer}
      </Text>
    </View>
  );
});
