import { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { ScrollRow, TIGHT_GUTTER } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type { ProgressPose } from '@/db/schema';
import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-context';

import { POSES, poseLabelKey } from '../checkins';

/**
 * The camera's walk through the five poses: one chip each, in capture order.
 * The pose being taken is lime; one already in this check-in carries a check
 * (a shape, not only a colour) and can be tapped to retake it.
 */
export const CapturePoseStrip = ({
  current,
  done,
  onPick,
  disabled,
}: {
  current: ProgressPose;
  done: ReadonlySet<ProgressPose>;
  onPick: (pose: ProgressPose) => void;
  disabled: boolean;
}) => {
  const t = useT();
  const { brandContrast } = useTheme();
  // Where each chip sits, so the strip keeps the pose being taken in view.
  const [centres, setCentres] = useState<Partial<Record<ProgressPose, number>>>({});
  const place = (pose: ProgressPose) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    const centre = x + width / 2;
    setCentres((prev) => (prev[pose] === centre ? prev : { ...prev, [pose]: centre }));
  };
  return (
    // The camera screen gives it a px-4 bar of its own, edge to edge.
    <ScrollRow focusX={centres[current]} bleed={TIGHT_GUTTER}>
      {POSES.map((pose) => {
        const isCurrent = pose === current;
        const isDone = done.has(pose);
        const label = t(poseLabelKey(pose));
        return (
          <Pressable
            key={pose}
            onLayout={place(pose)}
            disabled={disabled}
            onPress={() => {
              if (isCurrent) return;
              haptic('tick');
              onPick(pose);
            }}
            accessibilityRole="button"
            accessibilityLabel={isDone ? t('capture.poseTaken', { pose: label }) : label}
            accessibilityState={{ selected: isCurrent, disabled }}
            className={[
              'min-h-11 shrink-0 flex-row items-center gap-1.5 rounded-full border px-4 py-2',
              isCurrent ? 'border-brand bg-brand/15' : 'border-ink-700 bg-ink-800',
              disabled ? 'opacity-50' : '',
            ].join(' ')}
          >
            {isDone ? (
              <View className="h-4 w-4 items-center justify-center rounded-full bg-brand">
                <CheckIcon color={brandContrast} size={11} strokeWidth={3} />
              </View>
            ) : null}
            <Text
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              numberOfLines={1}
              className={[
                'text-sm',
                isCurrent ? 'font-sans-bold text-brand' : 'font-sans-semibold text-ink-200',
              ].join(' ')}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollRow>
  );
};
