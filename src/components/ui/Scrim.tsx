import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-context';

type Props = {
  /** How far the content behind recedes. `full` is for a screen-blocking wait. */
  depth?: 'light' | 'medium' | 'full';
  /** Animated opacity (or any style) from the caller's own transition. */
  style?: ViewStyle | ViewStyle[] | unknown;
  children?: React.ReactNode;
};

/** Blur radius per depth, and the dim that carries the contrast. */
const INTENSITY: Record<NonNullable<Props['depth']>, number> = {
  light: 24,
  medium: 40,
  full: 70,
};
/**
 * Android gets no blur (see below), so its dim does the whole job and is
 * heavier. On iOS the frosting already separates the layers.
 */
const DIM: Record<NonNullable<Props['depth']>, { ios: string; android: string }> = {
  light: { ios: 'bg-ink-950/30', android: 'bg-ink-950/60' },
  medium: { ios: 'bg-ink-950/45', android: 'bg-ink-950/70' },
  full: { ios: 'bg-ink-950/60', android: 'bg-ink-950/85' },
};

/**
 * The one backdrop behind any overlay — dialogs, sheets, the blocking wait,
 * full-screen viewers: a frosted blur on iOS, a plain dim on Android.
 *
 * Android gets no blur on purpose: our overlays live in modals (a separate
 * native window), so its blur has nothing in reach to sample, and pointing a
 * `blurTarget` at the whole app drags the tree through a per-frame bitmap
 * capture — it stuttered and destabilised the render pass. The blur layer never
 * animates either (opacity changes make Android recompute the effect per
 * frame); only the dim carries the caller's transition.
 */
export const Scrim = ({ depth = 'medium', style, children }: Props) => {
  const { scheme } = useTheme();
  const dim = DIM[depth][Platform.OS === 'ios' ? 'ios' : 'android'];

  return (
    <View style={StyleSheet.absoluteFill}>
      {Platform.OS === 'ios' ? (
        <BlurView
          pointerEvents="none"
          // The app's surfaces are dark in both themes, so the blur stays dark:
          // a light blur over ink-950 content turns milky instead of frosted.
          tint={scheme === 'light' ? 'systemThickMaterialLight' : 'systemThickMaterialDark'}
          intensity={INTENSITY[depth]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Animated.View style={[StyleSheet.absoluteFill, style as ViewStyle]} className={dim}>
        {children}
      </Animated.View>
    </View>
  );
};
