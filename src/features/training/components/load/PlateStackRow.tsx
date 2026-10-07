import { Pressable, Text, View } from 'react-native';

import { MinusIcon, PlusIcon } from '@/components/icons';
import { ScrollRow } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type { PlateStack } from '@/features/training/load';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

/**
 * What ONE side holds, one pill per denomination with a count ("20 ×2") and
 * −/+ on the pill: with four of the same plate, four identical pills said
 * nothing a count does not, and took the whole strip.
 */
export const PlateStackRow = ({
  stack,
  unit,
  onAdd,
  onRemove,
}: {
  stack: PlateStack[];
  unit: Units;
  onAdd: (plate: number) => void;
  onRemove: (plate: number) => void;
}) => {
  const t = useT();
  const { brand } = useTheme();
  if (!stack.length) return null;
  return (
    <ScrollRow>
      {stack.map(({ plate, count }) => (
        <View
          key={plate}
          className="shrink-0 flex-row items-center rounded-full border border-brand/40 bg-brand/15 py-1 pl-3 pr-1"
        >
          <Text
            maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            className="text-sm font-sans-semibold tabular-nums text-brand"
          >
            {plate} {unit}
            {count > 1 ? ` ×${count}` : ''}
          </Text>
          <Pressable
            onPress={() => onRemove(plate)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t('load.stackRemove', { plate, unit })}
            className="ml-1.5 h-7 w-7 items-center justify-center rounded-full bg-ink-900/60"
          >
            <MinusIcon color={brand} size={14} />
          </Pressable>
          <Pressable
            onPress={() => onAdd(plate)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t('load.stackAdd', { plate, unit })}
            className="ml-1 h-7 w-7 items-center justify-center rounded-full bg-ink-900/60"
          >
            <PlusIcon color={brand} size={14} />
          </Pressable>
        </View>
      ))}
    </ScrollRow>
  );
};
