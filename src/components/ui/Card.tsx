import { View, type ViewProps } from 'react-native';

type Props = ViewProps & { padded?: boolean };

/** A surface — the standard raised container on the ink background. */
export const Card = ({ padded = true, className, children, ...rest }: Props) => {
  return (
    <View
      className={[
        'w-full rounded-2xl border border-ink-600 bg-ink-800',
        padded ? 'p-5' : '',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {children}
    </View>
  );
};
