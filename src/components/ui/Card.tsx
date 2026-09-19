import { View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  padded?: boolean;
  /** `sunken` is the darker inset surface for code/formula blocks inside a card or screen. */
  surface?: 'raised' | 'sunken';
};

/** A surface — the standard raised container on the ink background. */
export const Card = ({
  padded = true,
  surface = 'raised',
  className,
  children,
  ...rest
}: Props) => {
  return (
    <View
      className={[
        'w-full rounded-card border border-ink-600',
        surface === 'sunken' ? 'bg-ink-850' : 'bg-ink-800',
        padded ? 'p-5' : '',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {children}
    </View>
  );
};
