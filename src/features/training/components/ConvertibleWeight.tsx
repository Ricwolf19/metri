import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import { weightText } from '../set-prefill';

const OTHER_UNIT = (unit: Units): Units => (unit === 'kg' ? 'lb' : 'kg');

/**
 * A kg value the lifter can tap to see in the other unit: shows the value
 * converted, one tap restores the app unit. Local to each row, so the rest of
 * the screen stays in the app unit.
 */
export const ConvertibleWeight = ({ kg, unit }: { kg: number; unit: Units }) => {
  const t = useT();
  const [override, setOverride] = useState<Units | null>(null);
  const shown = override ?? unit;
  const text = `${weightText(kg, shown)} ${shown}`;
  return (
    <Pressable
      onPress={() => setOverride((prev) => (prev ? null : OTHER_UNIT(unit)))}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint={t('training.tapToConvert')}
    >
      <Text className="text-sm font-sans-medium text-ink-100">{text}</Text>
    </Pressable>
  );
};
