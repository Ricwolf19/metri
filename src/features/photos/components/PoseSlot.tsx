import { View } from 'react-native';

import { PlusIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

/**
 * A pose a check-in has no photo for: a dashed 3:4 slot with a "+", the size
 * of a `MediaThumb`. Decorative — the pressable around it names the pose and
 * what a tap does.
 */
export const PoseSlot = () => {
  const { muted } = useTheme();
  return (
    <View
      className="items-center justify-center rounded-field border border-dashed border-ink-600 px-1"
      style={{ aspectRatio: 3 / 4 }}
    >
      <PlusIcon color={muted} size={14} />
    </View>
  );
};
