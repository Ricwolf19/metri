import { Platform, Pressable, Text, View, type AccessibilityActionEvent } from 'react-native';
import { useReorderableDrag } from 'react-native-reorderable-list';

import { ChevronRightIcon, DragHandleIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

type Props = {
  title: string;
  subtitle?: string;
  /** Omit in `dragOnly` mode — a row that does nothing on tap must not look tappable. */
  onPress?: () => void;
  right?: React.ReactNode;
  dragLabel: string;
  /** Reordering only: the whole row drags on touch, with no tap affordance. */
  dragOnly?: boolean;
  /**
   * The screen-reader way to reorder (a drag is not one): "Move up" / "Move
   * down" actions on the row. Omit at the ends of the list.
   */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

/**
 * The screen-reader move actions for row `index` of `count`, wired to the
 * list's own reorder — the ends of the list get only the move they can make.
 */
export const moveActions = (
  index: number,
  count: number,
  move: (from: number, to: number) => void,
): Pick<Props, 'onMoveUp' | 'onMoveDown'> => ({
  onMoveUp: index > 0 ? () => move(index, index - 1) : undefined,
  onMoveDown: index < count - 1 ? () => move(index, index + 1) : undefined,
});

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
 *
 * To a screen reader the TEXT block is the row's element — opening it,
 * reading title and subtitle, and reordering through move up / move down
 * actions (a drag is not something a screen reader can perform). The row
 * itself only routes touches: as an accessible Pressable it swallowed the
 * controls in `right` (a switch, a doc button) on iOS, and the drag handle is
 * hidden for the same reason.
 */
export const ReorderRow = ({
  title,
  subtitle,
  onPress,
  right,
  dragLabel,
  dragOnly = false,
  onMoveUp,
  onMoveDown,
}: Props) => {
  const t = useT();
  const { muted } = useTheme();
  const drag = useReorderableDrag();

  const opens = !dragOnly && !!onPress;
  const actions = [
    // Android's double-tap is ACTION_CLICK; iOS's goes to `onAccessibilityTap`.
    ...(opens && Platform.OS === 'android' ? [{ name: 'activate' }] : []),
    ...(onMoveUp ? [{ name: 'moveUp', label: t('common.moveUp') }] : []),
    ...(onMoveDown ? [{ name: 'moveDown', label: t('common.moveDown') }] : []),
  ];
  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    const name = e.nativeEvent.actionName;
    if (name === 'activate' && opens) onPress?.();
    if (name === 'moveUp') onMoveUp?.();
    if (name === 'moveDown') onMoveDown?.();
  };

  return (
    <Pressable
      onPress={dragOnly ? undefined : onPress}
      onLongPress={drag}
      delayLongPress={dragOnly ? DRAG_ONLY_HOLD_MS : DRAG_HOLD_MS}
      accessible={false}
      className="mb-2 w-full flex-row items-center rounded-card border border-ink-600 bg-ink-800 py-3 pl-1 pr-4 active:bg-ink-750"
    >
      <View className="h-11 w-11 items-center justify-center">
        {dragOnly ? (
          <DragHandleIcon color={muted} size={20} />
        ) : (
          <Pressable
            onPressIn={drag}
            hitSlop={10}
            accessible={false}
            importantForAccessibility="no"
            className="h-11 w-11 items-center justify-center"
          >
            <DragHandleIcon color={muted} size={20} />
          </Pressable>
        )}
      </View>
      <View
        className="flex-1 pr-2"
        accessible
        accessibilityRole={opens ? 'button' : 'text'}
        accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        accessibilityHint={dragLabel}
        accessibilityActions={actions}
        onAccessibilityAction={onAccessibilityAction}
        onAccessibilityTap={opens ? onPress : undefined}
      >
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
      {dragOnly ? null : <ChevronRightIcon color={muted} />}
    </Pressable>
  );
};
