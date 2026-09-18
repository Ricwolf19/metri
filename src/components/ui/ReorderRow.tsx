import { Pressable, Text, View } from 'react-native';
import { useReorderableDrag } from 'react-native-reorderable-list';

import { ChevronRightIcon, DragHandleIcon } from '@/components/icons';

type Props = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  right?: React.ReactNode;
  dragLabel: string;
};

// Holding anywhere on the row this long starts a drag.
const DRAG_HOLD_MS = 1000;

/**
 * A draggable list row. A tap opens the item; holding the row (or pressing the
 * handle at once) starts the drag. Must render as an item of a `ReorderableList`
 * (the handle reads the cell's drag context).
 */
export const ReorderRow = ({ title, subtitle, onPress, right, dragLabel }: Props) => {
  const drag = useReorderableDrag();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={drag}
      delayLongPress={DRAG_HOLD_MS}
      accessibilityRole="button"
      accessibilityHint={dragLabel}
      className="mb-2 w-full flex-row items-center rounded-card border border-ink-600 bg-ink-800 py-3 pl-1 pr-4 active:bg-ink-750"
    >
      <Pressable
        onPressIn={drag}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={dragLabel}
        className="h-11 w-11 items-center justify-center"
      >
        <DragHandleIcon color="#71717a" size={20} />
      </Pressable>
      <View className="flex-1 pr-2">
        <Text className="text-base font-sans-semibold text-ink-50" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-ink-400" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      <ChevronRightIcon color="#71717a" />
    </Pressable>
  );
};
