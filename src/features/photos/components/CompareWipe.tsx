import { useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type { ProgressPhoto } from '@/db/schema';
import { useT } from '@/i18n';

import { mediaUri } from '../media';
import { AlignedPhoto } from './AlignedPhoto';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** One screen-reader step of the divider. */
const STEP = 0.1;

/**
 * Before and after in ONE frame: after underneath, before clipped to the left
 * of a divider the finger drags (a sideways drag; a vertical one fails, so the
 * screen still scrolls). Both photos are drawn at the frame's full width, so
 * they line up exactly where the divider cuts them.
 */
export const CompareWipe = ({
  before,
  after,
  width,
}: {
  before: ProgressPhoto;
  after: ProgressPhoto;
  width: number;
}) => {
  const t = useT();
  const [split, setSplit] = useState(0.5);
  const height = (width * 4) / 3;
  const to = (x: number) => setSplit(clamp01(x / width));
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onStart((e) => to(e.x))
    .onUpdate((e) => to(e.x));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e, ok) => {
      if (ok) to(e.x);
    });
  const at = split * width;

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        style={{ width, height }}
        className="overflow-hidden rounded-card"
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('compare.divider')}
        accessibilityValue={{ text: t('compare.percent', { n: Math.round(split * 100) }) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          setSplit((s) => clamp01(s + (e.nativeEvent.actionName === 'increment' ? STEP : -STEP)))
        }
      >
        <AlignedPhoto uri={mediaUri(after.uri)} image={after} align={after.align} width={width} />
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, top: 0, width: at, height }}
          className="overflow-hidden"
        >
          <AlignedPhoto
            uri={mediaUri(before.uri)}
            image={before}
            align={before.align}
            width={width}
          />
        </View>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: at - 1, top: 0, width: 2, height }}
          className="bg-brand"
        />
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: at - 14, top: height / 2 - 14 }}
          className="h-7 w-7 items-center justify-center rounded-full border-2 border-ink-950 bg-brand"
        >
          <Text
            maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            className="text-xs font-sans-bold text-ink-950"
          >
            ↔
          </Text>
        </View>
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="absolute left-2 top-2 rounded-full bg-ink-950/80 px-2 py-0.5 font-mono-medium text-[10px] uppercase tracking-wider text-brand"
        >
          {t('photos.before')}
        </Text>
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="absolute right-2 top-2 rounded-full bg-ink-950/80 px-2 py-0.5 font-mono-medium text-[10px] uppercase tracking-wider text-brand"
        >
          {t('photos.after')}
        </Text>
      </View>
    </GestureDetector>
  );
};
