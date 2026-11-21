import { useRef } from 'react';
import {
  ScrollView,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useGenericKeyboardHandler } from 'react-native-keyboard-controller';
import { runOnJS } from 'react-native-reanimated';

import { fieldRevealOffset } from './keyboard-room';
import { ScrollArea } from './ScrollArea';

/**
 * The body of a `<Sheet>` that holds a form: a `<ScrollArea inSheet>` that
 * keeps the focused field, and what follows it, above the keyboard.
 *
 * The sheet rides the keyboard and shrinks to the room left (`sheet-math.ts`),
 * so a form taller than that room scrolls — and a plain ScrollView never
 * follows focus on iOS: the quick-add's macros, the amount's Add and the plate
 * calculator's typed fields sat under the keyboard on a small phone. Once the
 * keyboard settles, the form scrolls as far down as it can while the focused
 * field keeps its label in view (`fieldRevealOffset`); a form that fits stays.
 * Positions are measured INSIDE the form, never against the window: the
 * sheet's lift is a transform the layout tree may not have caught up with.
 */
export const SheetForm = ({ children }: { children: React.ReactNode }) => {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const offset = useRef(0);
  // The scrollable height as the scroll view reports it, which counts the
  // sheet's bottom padding that the form's own box does not: short of it, the
  // furthest reveal would stop before the end with the bottom fade on the Save.
  const scrollable = useRef(0);
  const keepOffset = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
  };

  const reveal = () => {
    // A frame on, so the sheet's last keyboard frame has reached layout.
    requestAnimationFrame(() => {
      const field = TextInput.State.currentlyFocusedInput();
      const scroll = scrollRef.current;
      const frame = scroll?.getNativeScrollRef();
      const content = contentRef.current;
      if (!field || !scroll || !frame || !content) return;
      field.measureLayout(
        content,
        (_x, top) =>
          frame.measure((_sx, _sy, _sw, viewport) => {
            const y = fieldRevealOffset({
              top,
              content: scrollable.current,
              viewport,
              offset: offset.current,
            });
            if (y != null) scroll.scrollTo({ y, animated: true });
          }),
        // The focused field is not in this form: nothing to reveal.
        () => {},
      );
    });
  };

  // Every settle with the keyboard up: an opening, and a switch to a field
  // whose keyboard is taller (decimal pad → text) on Android.
  useGenericKeyboardHandler(
    {
      onEnd: (e) => {
        'worklet';
        if (e.height > 0) runOnJS(reveal)();
      },
    },
    [],
  );

  return (
    <ScrollArea
      inSheet
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={(_, h) => {
        scrollable.current = h;
      }}
      // A throttled `onScroll` misses a fling's last frame (and the reveal's
      // own animated scroll), so the ends re-read the offset too.
      onScroll={keepOffset}
      onScrollEndDrag={keepOffset}
      onMomentumScrollEnd={keepOffset}
    >
      {/* Unflattened: the focused field is measured against this box, whose
          top is the scroll content's top. */}
      <View ref={contentRef} collapsable={false}>
        {children}
      </View>
    </ScrollArea>
  );
};
