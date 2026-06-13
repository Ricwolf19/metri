import { ScrollView, View, type ViewProps } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type Props = ViewProps & {
  scroll?: boolean;
  edges?: readonly Edge[];
  contentClassName?: string;
};

/**
 * Standard screen frame: safe-area aware, dark background, optional scroll +
 * keyboard avoidance. Use it as the outer wrapper for every screen.
 */
export const Screen = ({
  scroll = false,
  edges = ['top', 'bottom'],
  className,
  contentClassName,
  children,
  ...rest
}: Props) => {
  const Body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerClassName={contentClassName}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={['flex-1', contentClassName ?? ''].join(' ')}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges}
      className={['flex-1 bg-ink-900', className ?? ''].join(' ')}
      {...rest}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {Body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
