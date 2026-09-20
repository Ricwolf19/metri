import { Pressable, Text, View } from 'react-native';
import { useReorderableDrag } from 'react-native-reorderable-list';

import { ChevronRightIcon, DragHandleIcon } from '@/components/icons';

type Props = {
  title: string;
  subtitle?: string;
  /** Omit in `dragOnly` mode — a row that does nothing on tap must not look tappable. */
  onPress?: () => void;
  right?: React.ReactNode;
  dragLabel: string;
  /** Reordering only: the whole row drags on touch, with no tap affordance. */
  dragOnly?: boolean;
};

// Holding anywhere on a tappable row this long starts a drag; when dragging is
// the row's only job, it starts almost immediately instead.
const DRAG_HOLD_MS = 1000;
const DRAG_ONLY_HOLD_MS = 120;

/**
 * A draggable list row. A tap opens the item; holding the row (or pressing the
 * handle at once) starts the drag. Must render as an item of a `ReorderableList`
 * (the handle reads the cell's drag context).
 *
 * In `dragOnly` mode the entire row is the handle: no chevron, no tap target —
 * every visible control does something, so nothing invites a dead press.
 */
export const ReorderRow = ({
  title,
  subtitle,
  onPress,
  right,
  dragLabel,
  dragOnly = false,
}: Props) => {
  const drag = useReorderableDrag();

  return (
    <Pressable
      onPress={dragOnly ? undefined : onPress}
      onLongPress={drag}
      delayLongPress={dragOnly ? DRAG_ONLY_HOLD_MS : DRAG_HOLD_MS}
      accessibilityRole="button"
      accessibilityLabel={dragOnly ? title : undefined}
      accessibilityHint={dragLabel}
      className="mb-2 w-full flex-row items-center rounded-card border border-ink-600 bg-ink-800 py-3 pl-1 pr-4 active:bg-ink-750"
    >
      <View className="h-11 w-11 items-center justify-center">
        {dragOnly ? (
          <DragHandleIcon color="#71717a" size={20} />
        ) : (
          <Pressable
            onPressIn={drag}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={dragLabel}
            className="h-11 w-11 items-center justify-center"
          >
            <DragHandleIcon color="#71717a" size={20} />
          </Pressable>
        )}
      </View>
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
      {dragOnly ? null : <ChevronRightIcon color="#71717a" />}
    </Pressable>
  );
};
