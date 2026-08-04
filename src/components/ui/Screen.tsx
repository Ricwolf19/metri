import { remapProps } from 'nativewind';
import { View, type ViewProps } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { useLocalScrollVisibility, useScrollVisibility } from './scroll-visibility';

// NativeWind only maps `contentContainerClassName` on RN's own scroll views; on
// this third-party one the prop would reach the native side as a raw string.
remapProps(KeyboardAwareScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

/** Space the content reserves under the floating header pill: pill offset (2)
 * + pill height (~58) + breathing gap. Exported so overlays (toasts) can
 * position themselves below the header zone. */
export const HEADER_CLEARANCE = 72;

type Props = ViewProps & {
  scroll?: boolean;
  edges?: readonly Edge[];
  contentClassName?: string;
  /** Navbar. On tab screens (inside the scroll-visibility provider) it renders
   * as a floating pill that hides on scroll-down; elsewhere it stays fixed. */
  header?: React.ReactNode;
  /** Sticky bottom slot (e.g. a Continue button) rendered outside the scroll. */
  footer?: React.ReactNode;
};

/**
 * Standard screen frame: safe-area aware, dark background, optional scroll +
 * keyboard handling. Use it as the outer wrapper for every screen.
 *
 * Keyboard behavior comes from react-native-keyboard-controller (identical on
 * iOS/Android, animated on the UI thread): scrollable screens auto-scroll the
 * focused input above the keyboard; fixed screens pad instead.
 *
 * Pass the navbar via `header` (fixed or floating) and the page title as a
 * `<ScreenTitle>` inside the content — the large-title pattern.
 */
export const Screen = ({
  scroll = false,
  edges = ['top', 'bottom'],
  className,
  contentClassName,
  header,
  footer,
  children,
  ...rest
}: Props) => {
  // Every header floats and hides on scroll: tab screens share the shell's
  // controller (header + tab bar move together); stack screens get a local one.
  const shared = useScrollVisibility();
  const local = useLocalScrollVisibility();
  const vis = shared ?? local;
  const insets = useSafeAreaInsets();
  const shown = vis.shown;
  const floating = !!header;

  const headerAnim = useAnimatedStyle(() => {
    const v = shown.value;
    return {
      opacity: v,
      transform: [{ translateY: interpolate(v, [0, 1], [-(insets.top + 80), 0]) }],
    };
  }, [shown, insets.top]);

  const clearance = floating ? <View style={{ height: HEADER_CLEARANCE }} /> : null;

  const body = scroll ? (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerClassName={contentClassName}
      onScroll={vis.onScroll}
      scrollEventThrottle={16}
    >
      {clearance}
      {children}
    </KeyboardAwareScrollView>
  ) : (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      {clearance}
      <View className={['flex-1', contentClassName ?? ''].join(' ')}>{children}</View>
    </KeyboardAvoidingView>
  );

  const footerNode = footer ? (
    <View className="border-t border-ink-800 bg-ink-900 px-5 pb-2 pt-3">{footer}</View>
  ) : null;

  if (floating) {
    return (
      <View className={['flex-1 bg-ink-900', className ?? ''].join(' ')} {...rest}>
        <SafeAreaView edges={edges} className="flex-1">
          {body}
          {footerNode}
        </SafeAreaView>
        <Animated.View
          pointerEvents="box-none"
          style={[
            {
              position: 'absolute',
              left: 16,
              right: 16,
              top: insets.top + 2,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 12,
            },
            headerAnim,
          ]}
        >
          <View className="overflow-hidden rounded-[26px] border border-ink-700/60 bg-ink-850/95">
            {header}
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={edges}
      className={['flex-1 bg-ink-900', className ?? ''].join(' ')}
      {...rest}
    >
      {header}
      {body}
      {footerNode}
    </SafeAreaView>
  );
};
