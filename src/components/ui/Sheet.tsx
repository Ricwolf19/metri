import {
  BottomSheetBackdrop,
  BottomSheetModal,
  useBottomSheetTimingConfigs,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { Easing } from 'react-native-reanimated';

import { THEME_VARS } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** A `<ScrollArea inSheet>` (or any flex view). Plain ScrollViews do not receive the drag. */
  children: React.ReactNode;
  /** Fixed stops (e.g. `['55%', '92%']`). Omitted = size to content, capped at 92% of the window. */
  snapPoints?: string[];
  /** Tapping the handle toggles between the first and the last snap point. */
  expandable?: boolean;
};

const MAX_DYNAMIC = 0.92;

/**
 * The one bottom-sheet primitive, on @gorhom/bottom-sheet: scrim fade + timing rise (no spring),
 * drag down to close, safe-area aware, and gesture-friendly scrolling via `ScrollArea inSheet`.
 * Motion rules: AGENTS.md#conventions.
 */
export const Sheet = ({ visible, onClose, children, snapPoints, expandable }: Props) => {
  const ref = useRef<BottomSheetModal>(null);
  const { scheme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [index, setIndex] = useState(-1);
  const timing = useBottomSheetTimingConfigs({ duration: 200, easing: Easing.out(Easing.cubic) });
  const rgb = (token: string) => `rgb(${THEME_VARS[scheme][token]})`;

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  // Android back closes the sheet instead of popping the screen behind it.
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      ref.current?.dismiss();
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

  const last = (snapPoints?.length ?? 1) - 1;
  const toggle = () => {
    if (!expandable || !snapPoints) return;
    if (index >= last) ref.current?.snapToIndex(0);
    else ref.current?.expand();
  };
  const renderHandle = useCallback(
    () => (
      <Pressable
        onPress={expandable ? toggle : undefined}
        accessibilityRole={expandable ? 'button' : undefined}
        hitSlop={10}
        className="items-center pb-3 pt-3"
      >
        <View className="h-1 w-10 rounded-full bg-ink-600" />
      </Pressable>
    ),
    // toggle reads the latest index via state; re-create when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandable, index, last],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      maxDynamicContentSize={windowHeight * MAX_DYNAMIC}
      enablePanDownToClose
      onDismiss={onClose}
      onChange={setIndex}
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      animationConfigs={timing}
      backgroundStyle={{
        backgroundColor: rgb('--ink-900'),
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderColor: rgb('--ink-700'),
      }}
    >
      {children}
    </BottomSheetModal>
  );
};
