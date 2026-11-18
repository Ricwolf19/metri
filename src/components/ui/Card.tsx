import { View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  padded?: boolean;
  /** `sunken` is the darker inset surface for code/formula blocks inside a card or screen. */
  surface?: 'raised' | 'sunken';
};

const EDGE = 'border-ink-600';
const FILL = { raised: 'bg-ink-800', sunken: 'bg-ink-850' } as const;

/**
 * One card drawn as slices: the edge, the raised fill and the card's own side
 * padding, for a virtualized list whose rows ARE the card (a list that scrolls
 * cannot sit inside a `Card`). The caller adds the top/bottom rounding.
 */
export const CARD_SLICE = `${EDGE} ${FILL.raised} px-5`;

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
        `w-full rounded-card border ${EDGE}`,
        FILL[surface],
        padded ? 'p-5' : '',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {children}
    </View>
  );
};
