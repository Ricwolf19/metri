import { View, type ViewProps } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type Props = ViewProps & {
  scroll?: boolean;
  edges?: readonly Edge[];
  contentClassName?: string;
};

/**
 * Standard screen frame: safe-area aware, dark background, optional scroll +
 * keyboard handling. Use it as the outer wrapper for every screen.
 *
 * Keyboard behavior comes from react-native-keyboard-controller (identical on
 * iOS/Android, animated on the UI thread): scrollable screens auto-scroll the
 * focused input above the keyboard; fixed screens pad instead.
 */
export const Screen = ({
  scroll = false,
  edges = ['top', 'bottom'],
  className,
  contentClassName,
  children,
  ...rest
}: Props) => {
  return (
    <SafeAreaView
      edges={edges}
      className={['flex-1 bg-ink-900', className ?? ''].join(' ')}
      {...rest}
    >
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
