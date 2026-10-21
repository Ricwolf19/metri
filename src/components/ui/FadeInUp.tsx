import { type ViewProps } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

type Props = ViewProps & { delay?: number; children: React.ReactNode };

/**
 * Mount entrance — a calm fade. The stagger is capped hard so sections feel
 * like one unified appearance instead of a visible cascade. It is a native
 * layout animation (`entering`), NOT an effect that drives an opacity shared
 * value from 0: a view whose visibility depends on an effect-started animation
 * is invisible whenever that animation does not apply, and on 2026-10-20 the
 * whole Home and Train tabs sat at opacity 0 after a navigation (everything on
 * them is wrapped in this) — the same shape as the cold launch that "painted
 * nothing after the splash". An entering animation that does not run leaves
 * the view visible, which is the resting state the project rule asks for.
 */
export const FadeInUp = ({ delay = 0, children, style, ...rest }: Props) => (
  <Animated.View entering={FadeIn.duration(260).delay(Math.min(delay, 90))} style={style} {...rest}>
    {children}
  </Animated.View>
);
