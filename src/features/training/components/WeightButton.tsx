import { Pressable, Text } from 'react-native';

import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import { weightText } from '../set-prefill';

/** The number as the rows draw it; a dotted underline says a tap opens its picture. */
export const WeightText = ({
  kg,
  unit,
  tappable,
}: {
  kg: number;
  unit: Units;
  tappable: boolean;
}) => (
  <Text
    className={[
      'text-sm font-sans-medium text-ink-100',
      tappable ? 'underline decoration-dotted' : '',
    ].join(' ')}
  >
    {`${weightText(kg, unit)} ${unit}`}
  </Text>
);

/** 40 dp tall plus the slop: a 44 dp target that still fits a 44 dp row. */
const SLOP = { top: 2, bottom: 2, left: 6, right: 6 };

/**
 * A logged weight that opens its picture (`LoadPreviewSheet`): the plates,
 * the pin or the dumbbells behind the number. The other unit lives in that
 * sheet too, under the total — a tap that flipped the unit in place said less.
 * Inside an element a screen reader reads as one (a logged set row), pass
 * `accessible={false}`: that element offers the picture as an action instead.
 */
export const WeightButton = ({
  kg,
  unit,
  onPress,
  accessible = true,
}: {
  kg: number;
  unit: Units;
  onPress?: () => void;
  accessible?: boolean;
}) => {
  const t = useT();
  const announce = accessible && !!onPress;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={SLOP}
      accessible={accessible}
      importantForAccessibility={accessible ? 'auto' : 'no-hide-descendants'}
      accessibilityRole={announce ? 'button' : undefined}
      accessibilityLabel={accessible ? `${weightText(kg, unit)} ${unit}` : undefined}
      accessibilityHint={announce ? t('training.tapToSeeLoad') : undefined}
      className="min-h-10 justify-center"
    >
      <WeightText kg={kg} unit={unit} tappable={!!onPress} />
    </Pressable>
  );
};
