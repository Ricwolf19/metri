import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  size?: 'sm' | 'base';
  /** Centers the link in its row instead of hugging the left edge. */
  center?: boolean;
  className?: string;
};

/** Inline tappable text (lime + underline): the one look for "this is knowledge you can open". */
export const TextLink = ({ label, onPress, size = 'sm', center, className }: Props) => (
  <Pressable
    onPress={onPress}
    hitSlop={6}
    accessibilityRole="link"
    className={[center ? 'self-center' : 'self-start', className ?? ''].join(' ')}
  >
    <Text
      className={[
        'font-sans-medium text-accent underline',
        size === 'sm' ? 'text-xs leading-4' : 'text-sm leading-5',
      ].join(' ')}
    >
      {label}
    </Text>
  </Pressable>
);
