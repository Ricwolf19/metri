import { forwardRef, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';

import { BrandMark } from '@/components/ui';
import { SHARE } from '@/components/ui/share/palette';

import { FORMAT_RATIO, panelGrid, type ProgressShareModel, type ShareFormat } from '../share-model';
import { ShareCardPanel } from './ShareCardPanel';

/** The card's width in dp; captured at 1080 px, so ×3 on the way out. */
export const CARD_WIDTH = 360;
const GAP = 8;

export type ShareStyle = 'frame' | 'clean';

type Props = {
  model: ProgressShareModel;
  format: ShareFormat;
  /** `frame`: the metri mark, title, stat tiles and footer. `clean`: the photos alone. */
  look: ShareStyle;
  /** Clean cards only: the frame always labels its photos. */
  showDates: boolean;
  /** Fraction of every photo blurred from the top, or null. */
  faceBand: number | null;
  footer: string;
};

/**
 * A progress card: 1–4 photos of one pose in the metri frame (the dark share
 * palette, a lime hairline, mono uppercase labels, stat tiles — the session
 * card's family) or clean (the photos, optional dates, a line of numbers, no
 * mark). A fixed-size image, not a themed surface: the palette is `SHARE` and
 * no text scales with the OS font. Built on the device; it leaves only through
 * the share sheet the lifter opens.
 */
export const ProgressShareCard = forwardRef<View, Props>(function ProgressShareCard(
  { model, format, look, showDates, faceBand, footer },
  ref,
) {
  const [area, setArea] = useState({ width: 0, height: 0 });
  const onArea = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };
  const grid = panelGrid(model.panels.length, area, GAP);
  const frame = look === 'frame';
  const numbers = model.chips.map((c) => c.value).join('   ·   ');

  const photos = (
    <View onLayout={onArea} className="flex-1 items-center justify-center">
      {grid.width > 0 ? (
        <View
          style={{ width: grid.cols * grid.width + (grid.cols - 1) * GAP, gap: GAP }}
          className="flex-row flex-wrap"
        >
          {model.panels.map((panel) => (
            <ShareCardPanel
              key={panel.mediaId}
              panel={panel}
              width={grid.width}
              showLabel={frame || showDates}
              blurTop={faceBand}
            />
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: CARD_WIDTH,
        height: CARD_WIDTH * FORMAT_RATIO[format],
        backgroundColor: SHARE.bg,
      }}
      className={`overflow-hidden ${frame ? 'p-5' : 'p-2'}`}
    >
      {frame ? (
        <>
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
          <View className="flex-row items-center gap-2">
            <BrandMark size={22} />
            <Text
              allowFontScaling={false}
              style={{ color: SHARE.ink }}
              className="text-sm font-sans-bold tracking-wide"
            >
              Metri
            </Text>
          </View>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{ color: SHARE.brand }}
            className="mt-4 font-mono-medium text-[10px] uppercase tracking-[3px]"
          >
            {model.eyebrow}
          </Text>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{ color: SHARE.ink }}
            className="mt-1 text-[22px] leading-7 font-sans-bold"
          >
            {model.title}
          </Text>
          <View style={{ backgroundColor: SHARE.brandSoft, height: 1 }} className="mb-3 mt-3" />
        </>
      ) : null}

      {photos}

      {frame && model.chips.length ? (
        <View className="mt-3 flex-row gap-2">
          {model.chips.map((chip) => (
            <View
              key={chip.label}
              style={{ backgroundColor: SHARE.tile, borderColor: SHARE.tileBorder }}
              className="min-w-0 flex-1 rounded-field border px-2.5 py-2"
            >
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={{ color: SHARE.ink }}
                className="text-base font-sans-bold"
              >
                {chip.value}
              </Text>
              {chip.detail ? (
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  style={{ color: SHARE.muted }}
                  className="font-mono text-[9px]"
                >
                  {chip.detail}
                </Text>
              ) : null}
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={{ color: SHARE.dim }}
                className="mt-0.5 font-mono-medium text-[9px] uppercase tracking-wider"
              >
                {chip.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {!frame && numbers ? (
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={{ color: SHARE.line }}
          className="mt-2 text-center font-mono-medium text-[11px]"
        >
          {numbers}
        </Text>
      ) : null}

      {frame ? (
        <View className="mt-3 flex-row items-center gap-2">
          <View style={{ backgroundColor: SHARE.brand, height: 1, width: 16 }} />
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{ color: SHARE.dim }}
            className="min-w-0 flex-1 text-[11px]"
          >
            {footer}
          </Text>
        </View>
      ) : null}
    </View>
  );
});
