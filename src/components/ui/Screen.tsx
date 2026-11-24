import { remapProps } from 'nativewind';
import { useEffect, useState } from 'react';
import { View, type ViewProps } from 'react-native';
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { KEYBOARD_CLEARANCE, liftedFooterHeight } from './keyboard-room';
import { makePullHoldController } from './pull-hold-controller';
import { useLocalScrollVisibility, useScrollVisibility } from './scroll-visibility';
import { useSheetOwnsKeyboard } from './useSheetOwnsKeyboard';

// NativeWind only maps `contentContainerClassName` on RN's own scroll views; on
// this third-party one the prop would reach the native side as a raw string.
remapProps(KeyboardAwareScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

/** Content clearance under the floating pill: offset 2 + pill 52–58 + gap; pill bottom = insets.top + HEADER_PILL_BOTTOM.
 * Scroll screens keep it tight so content slides under the pill; static screens (list editors,
 * own scroll views) cannot, so they get the full gap. */
const HEADER_CLEARANCE = 66;
const HEADER_CLEARANCE_STATIC = HEADER_CLEARANCE + 12;
/** Bottom edge of the floating pill (toasts anchor to it). */
export const HEADER_PILL_BOTTOM = 60;

type Props = ViewProps & {
  scroll?: boolean;
  edges?: readonly Edge[];
  contentClassName?: string;
  /** Navbar. On tab screens (inside the scroll-visibility provider) it renders
   * as a floating pill that hides on scroll-down; elsewhere it stays fixed. */
  header?: React.ReactNode;
  /** Sticky bottom slot (e.g. a Continue button) rendered outside the scroll. It
   * rides the keyboard, so a form's Save stays in reach while a field is typed in. */
  footer?: React.ReactNode;
  /** Scroll screens only: fires after a drag held at the very top for `HOLD_MS`. @see AGENTS.md "Spotlight" */
  onPullHold?: () => void;
};

/**
 * Standard screen frame: safe-area aware, dark background, optional scroll +
 * keyboard handling. Use it as the outer wrapper for every screen.
 *
 * Keyboard behavior comes from react-native-keyboard-controller (identical on
 * iOS/Android, animated on the UI thread): scrollable screens auto-scroll the
 * focused input above the keyboard with `KEYBOARD_CLEARANCE` under it (its
 * hint, then the next field or the Save); fixed screens pad instead. The
 * footer rides the keyboard and both modes keep the field clear of it too.
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
  onPullHold,
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

  // Hold-at-top: the controller (and its stable scroll handlers) is built once;
  // the fire handler is re-pointed in an effect, so a re-render changes nothing
  // the native scroll view is given.
  const pullProgress = useSharedValue(0);
  const [pull] = useState(() => makePullHoldController(pullProgress, vis.onScroll));
  useEffect(() => {
    pull.configure(onPullHold);
  }, [pull, onPullHold]);
  const pullBarAnim = useAnimatedStyle(() => ({
    opacity: pullProgress.value > 0 ? 1 : 0,
    transform: [{ scaleX: pullProgress.value }],
  }));

  const headerAnim = useAnimatedStyle(() => {
    const v = shown.value;
    return {
      opacity: v,
      transform: [{ translateY: interpolate(v, [0, 1], [-(insets.top + 80), 0]) }],
    };
  }, [shown, insets.top]);

  const clearance = floating ? (
    <View style={{ height: scroll ? HEADER_CLEARANCE : HEADER_CLEARANCE_STATIC }} />
  ) : null;

  // The footer's height over the keyboard once it has ridden up: a focused
  // field has to clear it as well as the keyboard.
  const padsBottom = edges.includes('bottom');
  const [footerHeight, setFooterHeight] = useState(0);
  const footerLift = footer ? liftedFooterHeight(footerHeight, insets.bottom, padsBottom) : 0;
  // Under an open sheet the keyboard is the sheet's: nothing here pads,
  // scrolls or lifts for it (`useSheetOwnsKeyboard`).
  const standBack = useSheetOwnsKeyboard();

  const body = scroll ? (
    <KeyboardAwareScrollView
      enabled={!standBack}
      bottomOffset={KEYBOARD_CLEARANCE + footerLift}
      // Room to scroll that far: the keyboard's own inset alone cannot lift the
      // LAST field of a page clear by more than the padding under it.
      extraKeyboardSpace={KEYBOARD_CLEARANCE}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      // Android 12+'s stretch overscroll catches the next touch while it
      // relaxes: a sideways swipe on a strip right after a vertical drag went
      // to the page and the strip never moved. The hold-at-top still fires:
      // it reads the drag events, and Android reports no negative offset.
      overScrollMode="never"
      contentContainerClassName={contentClassName}
      onScroll={pull.onScroll}
      onScrollBeginDrag={pull.onScrollBeginDrag}
      onScrollEndDrag={pull.onScrollEndDrag}
      scrollEventThrottle={16}
    >
      {clearance}
      {children}
    </KeyboardAwareScrollView>
  ) : (
    // A positive offset raises the line the content pads to: the footer's top.
    <KeyboardAvoidingView
      enabled={!standBack}
      behavior="padding"
      keyboardVerticalOffset={footerLift}
      className="flex-1"
    >
      {clearance}
      <View className={['flex-1', contentClassName ?? ''].join(' ')}>{children}</View>
    </KeyboardAvoidingView>
  );

  // Always clears the home indicator, whichever edges the screen asked for.
  // Open, it sits on the keyboard: `opened` tucks the home-indicator room
  // (the SafeAreaView's padding or the footer's own) behind the keyboard.
  const footerNode = footer ? (
    <KeyboardStickyView enabled={!standBack} offset={{ opened: insets.bottom }}>
      <View
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        className="border-t border-ink-800 bg-ink-900 px-5 pt-3"
        style={{ paddingBottom: (padsBottom ? 0 : insets.bottom) + 16 }}
      >
        {footer}
      </View>
    </KeyboardStickyView>
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
          <View className="overflow-hidden rounded-full border border-ink-700/60 bg-ink-850/95">
            {header}
          </View>
          {/* The hold's progress, a hairline under the pill: fills over HOLD_MS, nothing at rest. */}
          {onPullHold ? (
            <Animated.View
              pointerEvents="none"
              className="mt-1 h-0.5 rounded-full bg-brand"
              style={pullBarAnim}
            />
          ) : null}
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
