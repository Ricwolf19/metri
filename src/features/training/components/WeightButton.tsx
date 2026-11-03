import { Pressable, Text } from 'react-native';

import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import { weightText } from '../set-prefill';

/**
 * A logged weight that opens its picture (`LoadPreviewSheet`): the plates,
 * the pin or the dumbbells behind the number. The other unit lives in that
 * sheet too, under the total — a tap that flipped the unit in place said less.
 */
export const WeightButton = ({
  kg,
  unit,
  onPress,
}: {
  kg: number;
  unit: Units;
  onPress?: () => void;
}) => {
  const t = useT();
  const text = `${weightText(kg, unit)} ${unit}`;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={4}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={text}
      accessibilityHint={onPress ? t('training.tapToSeeLoad') : undefined}
    >
      <Text
        className={[
          'text-sm font-sans-medium text-ink-100',
          onPress ? 'underline decoration-dotted' : '',
        ].join(' ')}
      >
        {text}
      </Text>
    </Pressable>
  );
};
