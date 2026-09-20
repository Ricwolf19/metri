import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, Text, View, type ImageSourcePropType } from 'react-native';

import { DumbbellIcon, ExpandIcon, PauseIcon, PlaySolidIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { visualIdFor, type VisualId } from '../exercise-visuals';

type Frames = readonly [ImageSourcePropType, ImageSourcePropType, ImageSourcePropType];

// Bundled statically: Metro only ships assets reachable through literal requires.
const EXERCISE_FRAMES = {
  'barbell-back-squat': [
    require('@/assets/exercises/barbell-back-squat-1.png'),
    require('@/assets/exercises/barbell-back-squat-2.png'),
    require('@/assets/exercises/barbell-back-squat-3.png'),
  ],
  'barbell-bench-press': [
    require('@/assets/exercises/barbell-bench-press-1.png'),
    require('@/assets/exercises/barbell-bench-press-2.png'),
    require('@/assets/exercises/barbell-bench-press-3.png'),
  ],
  'incline-bench-press': [
    require('@/assets/exercises/incline-bench-press-1.png'),
    require('@/assets/exercises/incline-bench-press-2.png'),
    require('@/assets/exercises/incline-bench-press-3.png'),
  ],
  'close-grip-bench-press': [
    require('@/assets/exercises/close-grip-bench-press-1.png'),
    require('@/assets/exercises/close-grip-bench-press-2.png'),
    require('@/assets/exercises/close-grip-bench-press-3.png'),
  ],
  deadlift: [
    require('@/assets/exercises/deadlift-1.png'),
    require('@/assets/exercises/deadlift-2.png'),
    require('@/assets/exercises/deadlift-3.png'),
  ],
  'sumo-deadlift': [
    require('@/assets/exercises/sumo-deadlift-1.png'),
    require('@/assets/exercises/sumo-deadlift-2.png'),
    require('@/assets/exercises/sumo-deadlift-3.png'),
  ],
  'romanian-deadlift': [
    require('@/assets/exercises/romanian-deadlift-1.png'),
    require('@/assets/exercises/romanian-deadlift-2.png'),
    require('@/assets/exercises/romanian-deadlift-3.png'),
  ],
  'overhead-press': [
    require('@/assets/exercises/overhead-press-1.png'),
    require('@/assets/exercises/overhead-press-2.png'),
    require('@/assets/exercises/overhead-press-3.png'),
  ],
  'seated-dumbbell-press': [
    require('@/assets/exercises/seated-dumbbell-press-1.png'),
    require('@/assets/exercises/seated-dumbbell-press-2.png'),
    require('@/assets/exercises/seated-dumbbell-press-3.png'),
  ],
  'lat-pulldown': [
    require('@/assets/exercises/lat-pulldown-1.png'),
    require('@/assets/exercises/lat-pulldown-2.png'),
    require('@/assets/exercises/lat-pulldown-3.png'),
  ],
  'leg-press': [
    require('@/assets/exercises/leg-press-1.png'),
    require('@/assets/exercises/leg-press-2.png'),
    require('@/assets/exercises/leg-press-3.png'),
  ],
  'leg-extension': [
    require('@/assets/exercises/leg-extension-1.png'),
    require('@/assets/exercises/leg-extension-2.png'),
    require('@/assets/exercises/leg-extension-3.png'),
  ],
  'lying-leg-curl': [
    require('@/assets/exercises/lying-leg-curl-1.png'),
    require('@/assets/exercises/lying-leg-curl-2.png'),
    require('@/assets/exercises/lying-leg-curl-3.png'),
  ],
  'barbell-curl': [
    require('@/assets/exercises/barbell-curl-1.png'),
    require('@/assets/exercises/barbell-curl-2.png'),
    require('@/assets/exercises/barbell-curl-3.png'),
  ],
  'hammer-curl': [
    require('@/assets/exercises/hammer-curl-1.png'),
    require('@/assets/exercises/hammer-curl-2.png'),
    require('@/assets/exercises/hammer-curl-3.png'),
  ],
  skullcrusher: [
    require('@/assets/exercises/skullcrusher-1.png'),
    require('@/assets/exercises/skullcrusher-2.png'),
    require('@/assets/exercises/skullcrusher-3.png'),
  ],
  'back-extension': [
    require('@/assets/exercises/back-extension-1.png'),
    require('@/assets/exercises/back-extension-2.png'),
    require('@/assets/exercises/back-extension-3.png'),
  ],
  crunch: [
    require('@/assets/exercises/crunch-1.png'),
    require('@/assets/exercises/crunch-2.png'),
    require('@/assets/exercises/crunch-3.png'),
  ],
  'standing-calf-raise': [
    require('@/assets/exercises/standing-calf-raise-1.png'),
    require('@/assets/exercises/standing-calf-raise-2.png'),
    require('@/assets/exercises/standing-calf-raise-3.png'),
  ],
  'machine-chest-press': [
    require('@/assets/exercises/machine-chest-press-1.png'),
    require('@/assets/exercises/machine-chest-press-2.png'),
    require('@/assets/exercises/machine-chest-press-3.png'),
  ],
  'dumbbell-fly': [
    require('@/assets/exercises/dumbbell-fly-1.png'),
    require('@/assets/exercises/dumbbell-fly-2.png'),
    require('@/assets/exercises/dumbbell-fly-3.png'),
  ],
  'cable-fly': [
    require('@/assets/exercises/cable-fly-1.png'),
    require('@/assets/exercises/cable-fly-2.png'),
    require('@/assets/exercises/cable-fly-3.png'),
  ],
  'lateral-raise': [
    require('@/assets/exercises/lateral-raise-1.png'),
    require('@/assets/exercises/lateral-raise-2.png'),
    require('@/assets/exercises/lateral-raise-3.png'),
  ],
  'cable-lateral-raise': [
    require('@/assets/exercises/cable-lateral-raise-1.png'),
    require('@/assets/exercises/cable-lateral-raise-2.png'),
    require('@/assets/exercises/cable-lateral-raise-3.png'),
  ],
  'rear-delt-fly': [
    require('@/assets/exercises/rear-delt-fly-1.png'),
    require('@/assets/exercises/rear-delt-fly-2.png'),
    require('@/assets/exercises/rear-delt-fly-3.png'),
  ],
  'machine-shoulder-press': [
    require('@/assets/exercises/machine-shoulder-press-1.png'),
    require('@/assets/exercises/machine-shoulder-press-2.png'),
    require('@/assets/exercises/machine-shoulder-press-3.png'),
  ],
  'machine-row': [
    require('@/assets/exercises/machine-row-1.png'),
    require('@/assets/exercises/machine-row-2.png'),
    require('@/assets/exercises/machine-row-3.png'),
  ],
  'dumbbell-row': [
    require('@/assets/exercises/dumbbell-row-1.png'),
    require('@/assets/exercises/dumbbell-row-2.png'),
    require('@/assets/exercises/dumbbell-row-3.png'),
  ],
  'seated-cable-row': [
    require('@/assets/exercises/seated-cable-row-1.png'),
    require('@/assets/exercises/seated-cable-row-2.png'),
    require('@/assets/exercises/seated-cable-row-3.png'),
  ],
  't-bar-row': [
    require('@/assets/exercises/t-bar-row-1.png'),
    require('@/assets/exercises/t-bar-row-2.png'),
    require('@/assets/exercises/t-bar-row-3.png'),
  ],
  'hack-squat': [
    require('@/assets/exercises/hack-squat-1.png'),
    require('@/assets/exercises/hack-squat-2.png'),
    require('@/assets/exercises/hack-squat-3.png'),
  ],
  'bulgarian-split-squat': [
    require('@/assets/exercises/bulgarian-split-squat-1.png'),
    require('@/assets/exercises/bulgarian-split-squat-2.png'),
    require('@/assets/exercises/bulgarian-split-squat-3.png'),
  ],
  'preacher-curl': [
    require('@/assets/exercises/preacher-curl-1.png'),
    require('@/assets/exercises/preacher-curl-2.png'),
    require('@/assets/exercises/preacher-curl-3.png'),
  ],
  'spider-curl': [
    require('@/assets/exercises/spider-curl-1.png'),
    require('@/assets/exercises/spider-curl-2.png'),
    require('@/assets/exercises/spider-curl-3.png'),
  ],
  'incline-dumbbell-curl': [
    require('@/assets/exercises/incline-dumbbell-curl-1.png'),
    require('@/assets/exercises/incline-dumbbell-curl-2.png'),
    require('@/assets/exercises/incline-dumbbell-curl-3.png'),
  ],
  'tricep-pushdown': [
    require('@/assets/exercises/tricep-pushdown-1.png'),
    require('@/assets/exercises/tricep-pushdown-2.png'),
    require('@/assets/exercises/tricep-pushdown-3.png'),
  ],
  'overhead-tricep-extension': [
    require('@/assets/exercises/overhead-tricep-extension-1.png'),
    require('@/assets/exercises/overhead-tricep-extension-2.png'),
    require('@/assets/exercises/overhead-tricep-extension-3.png'),
  ],
  'cable-overhead-extension': [
    require('@/assets/exercises/cable-overhead-extension-1.png'),
    require('@/assets/exercises/cable-overhead-extension-2.png'),
    require('@/assets/exercises/cable-overhead-extension-3.png'),
  ],
  'cable-kickback': [
    require('@/assets/exercises/cable-kickback-1.png'),
    require('@/assets/exercises/cable-kickback-2.png'),
    require('@/assets/exercises/cable-kickback-3.png'),
  ],
} satisfies Record<VisualId, Frames>;

/** A pose reads as a position, not a flicker — slow enough to actually study. */
const FRAME_MS = 1500;
const BANNER_HEIGHT = 190;

const Pill = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    hitSlop={6}
    accessibilityRole="button"
    accessibilityLabel={label}
    className="flex-row items-center gap-1.5 rounded-full bg-ink-800/90 px-2.5 py-1.5"
  >
    {icon}
  </Pressable>
);

/**
 * Flip-book player for an exercise's three pose frames, in movement order.
 * White line art on a constant-dark plate so it reads in both themes; pause to
 * hold a pose, expand for a full-screen look.
 */
export const ExerciseFrames = ({
  visualId,
  accessibilityLabel,
  height = BANNER_HEIGHT,
  autoplay = true,
}: {
  visualId: VisualId;
  accessibilityLabel: string;
  height?: number;
  /** Off in a live session: a still pose is the quick reminder, and a looping
   * animation per card is render work the phone should spend on inputs. */
  autoplay?: boolean;
}) => {
  const t = useT();
  const { brand, muted } = useTheme();
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(!autoplay);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setFrame((f) => (f + 1) % 3), FRAME_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const frames = EXERCISE_FRAMES[visualId];

  return (
    <View style={{ height }} className="overflow-hidden rounded-card bg-ink-950">
      <Image
        source={frames[frame]}
        style={{ flex: 1, width: '100%' }}
        resizeMode="contain"
        accessibilityLabel={accessibilityLabel}
      />

      <View className="absolute inset-x-0 bottom-0 flex-row items-center justify-between px-2 pb-2">
        <Pill
          label={paused ? t('training.artPlay') : t('training.artPause')}
          onPress={() => setPaused((p) => !p)}
          icon={
            paused ? (
              <PlaySolidIcon color={brand} size={14} />
            ) : (
              <PauseIcon color={muted} size={14} />
            )
          }
        />
        <View className="flex-row gap-1.5">
          {frames.map((_, i) => (
            <View
              key={i}
              className={['h-1.5 w-1.5 rounded-full', i === frame ? 'bg-brand' : 'bg-ink-700'].join(
                ' ',
              )}
            />
          ))}
        </View>
        <Pill
          label={t('training.artExpand')}
          onPress={() => setExpanded(true)}
          icon={<ExpandIcon color={muted} size={14} />}
        />
      </View>

      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={() => setExpanded(false)}
      >
        <Pressable
          onPress={() => setExpanded(false)}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          className="flex-1 items-center justify-center bg-ink-950/95 px-4"
        >
          <Image
            source={frames[frame]}
            style={{ width: '100%', height: '70%' }}
            resizeMode="contain"
          />
          <Text className="mt-4 text-center text-base font-sans-semibold text-ink-100">
            {accessibilityLabel}
          </Text>
          <Text className="mt-1 text-xs text-ink-500">{t('training.artClose')}</Text>
        </Pressable>
      </Modal>
    </View>
  );
};
/** Static first-pose thumbnail for list rows; generic dumbbell when unmatched. */
export const ExerciseThumb = ({
  exercise,
  size = 44,
}: {
  exercise: { id: string; name: string };
  size?: number;
}) => {
  const { muted } = useTheme();
  const visualId = visualIdFor(exercise);

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center overflow-hidden rounded-field bg-ink-950"
    >
      {visualId ? (
        <Image
          source={EXERCISE_FRAMES[visualId][0]}
          style={{ width: size - 6, height: size - 6 }}
          resizeMode="contain"
        />
      ) : (
        <DumbbellIcon color={muted} size={Math.round(size * 0.45)} />
      )}
    </View>
  );
};
