import { remapProps } from 'nativewind';
import { View, type ViewProps } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

// NativeWind only maps `contentContainerClassName` on RN's own scroll views; on
// this third-party one the prop would reach the native side as a raw string.
remapProps(KeyboardAwareScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

type Props = ViewProps & {
  scroll?: boolean;
  edges?: readonly Edge[];
  contentClassName?: string;
  /** Navbar. Rendered OUTSIDE the scroll area so it stays put while the content
   * (including `<ScreenTitle>`) scrolls under it. */
  header?: React.ReactNode;
};

/**
 * Standard screen frame: safe-area aware, dark background, optional scroll +
 * keyboard handling. Use it as the outer wrapper for every screen.
 *
 * Keyboard behavior comes from react-native-keyboard-controller (identical on
 * iOS/Android, animated on the UI thread): scrollable screens auto-scroll the
 * focused input above the keyboard; fixed screens pad instead.
 *
 * Pass the navbar via `header` (fixed) and the page title as a `<ScreenTitle>`
 * inside the content — the large-title pattern.
 */
export const Screen = ({
  scroll = false,
  edges = ['top', 'bottom'],
  className,
  contentClassName,
  header,
  children,
  ...rest
}: Props) => {
  return (
    <SafeAreaView
      edges={edges}
      className={['flex-1 bg-ink-900', className ?? ''].join(' ')}
      {...rest}
    >
      {header}
      {scroll ? (
        <KeyboardAwareScrollView
          bottomOffset={24}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName={contentClassName}
        >
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <View className={['flex-1', contentClassName ?? ''].join(' ')}>{children}</View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};
