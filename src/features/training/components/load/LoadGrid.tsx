import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from 'react-native';

import { MinusIcon, PlusIcon } from '@/components/icons';
import { ScrollArea } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import {
  GRID_COLUMNS,
  gridRows,
  nearestIndex,
  rowInSight,
  windowHeight,
  windowOffset,
} from './load-grid';

/** `gap-2` between rows: 7 dp (NativeWind's rem is 14 here). */
const ROW_GAP = 7;
/** A pill's `min-h-11` floor, until the first row reports its real height. */
const ROW_HEIGHT = 44;

const PILL = 'min-h-11 flex-1 items-center justify-center rounded-full border px-1';

/** One row of the grid; `offset` is the index of its first load. Past the last load, spacers keep the columns. */
const GridRow = ({
  row,
  offset,
  unit,
  selected,
  onSelect,
  onLayout,
}: {
  row: number[];
  offset: number;
  unit: Units;
  selected: number | null;
  onSelect: (index: number) => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}) => (
  <View className="flex-row gap-2" onLayout={onLayout}>
    {Array.from({ length: GRID_COLUMNS }, (_, column) => {
      const load = row[column];
      if (load == null) return <View key={column} className="flex-1" />;
      const index = offset + column;
      const active = selected === index;
      const label = (
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          numberOfLines={1}
          adjustsFontSizeToFit
          className={[
            'text-sm font-sans-semibold tabular-nums',
            active ? 'text-brand' : 'text-ink-300',
          ].join(' ')}
        >
          {load}
        </Text>
      );
      const look = [
        PILL,
        active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
      ].join(' ');
      return (
        <Pressable
          key={column}
          onPress={() => onSelect(index)}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          accessibilityLabel={`${load} ${unit}`}
          className={look}
        >
          {label}
        </Pressable>
      );
    })}
  </View>
);

/**
 * The loads a picker offers — a stack's pins, a rack's dumbbells — one pill
 * each, selected in brand, in rows of `GRID_COLUMNS`. A single-select PICKER
 * for finding a close quantity at a glance (40 pins in a scrolling line hide
 * the one you want), not a badge strip, and it lives inside a sheet that
 * scrolls — the one strip in the app that takes several lines.
 *
 * A long one opens FOLDED: a short window that scrolls through every load,
 * opened on the two rows around the pick (`gridRows`) with half a row peeking
 * in above and below under the fades — a quick flick reaches any load without
 * laying them all out — and "Show more" for the whole grid. Whether it is
 * open is the caller's (`useGridExpanded`: kept for the session).
 */
export const LoadGrid = ({
  loads,
  unit,
  selected,
  onSelect,
  near = null,
  expanded,
  onExpandedChange,
}: {
  loads: number[];
  unit: Units;
  selected: number | null;
  onSelect: (index: number) => void;
  /** The row's number: a folded grid with nothing selected opens around the load nearest it. */
  near?: number | null;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) => {
  const t = useT();
  const { brand } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  // Where the window is scrolled, for "is the pick in sight": kept from the
  // scroll events, never state — the grid does not re-render as it scrolls.
  const offset = useRef(0);
  // Whether this window was put on the pick yet: once per fold, on its first
  // content layout (a scroll before it has a height goes nowhere).
  const placed = useRef(false);
  const [rowHeight, setRowHeight] = useState(ROW_HEIGHT);
  const [anchor] = useState(() => selected ?? nearestIndex(loads, near) ?? 0);

  const folds = gridRows(loads.length, 0) !== null;
  const folded = folds && !expanded;
  const rhythm = { rowHeight, gap: ROW_GAP };
  const viewport = windowHeight(rhythm);

  // The refs describe ONE mounted window: unfolded (Show more, or a rack edit
  // short enough not to fold) it is gone, and the next one starts afresh.
  useEffect(() => {
    if (folded) return;
    placed.current = false;
    offset.current = 0;
  }, [folded]);

  // A pick made outside the window (typed, a dumbbell just added, an edited
  // rack) scrolls it into view; one on a row in sight — a tap — leaves the
  // window still, so the pill stays under the finger.
  useEffect(() => {
    // Before its first layout the window is placed on the pick (`place`), not chased.
    if (!folded || !placed.current || selected == null || selected >= loads.length) return;
    const rhythmNow = { rowHeight, gap: ROW_GAP };
    const height = windowHeight(rhythmNow);
    if (rowInSight(Math.floor(selected / GRID_COLUMNS), offset.current, height, rhythmNow)) return;
    const rows = gridRows(loads.length, selected);
    if (!rows) return;
    const y = windowOffset(rows, rhythmNow);
    scrollRef.current?.scrollTo({ y, animated: true });
    // Where it is going: a scroll that ends where it began fires no event.
    offset.current = y;
  }, [folded, selected, loads.length, rowHeight]);

  if (!loads.length) return null;

  const place = () => {
    if (placed.current) return;
    placed.current = true;
    const rows = gridRows(loads.length, selected ?? anchor);
    if (!rows) return;
    const y = windowOffset(rows, rhythm);
    scrollRef.current?.scrollTo({ y, animated: false });
    offset.current = y;
  };
  // Every scroll event re-reads the offset: a throttled `onScroll` alone misses
  // the last frame of a fling (the reason `ScrollArea` tracks all three).
  const track = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
  };

  const grid = (
    <View className="gap-2">
      {Array.from({ length: Math.ceil(loads.length / GRID_COLUMNS) }, (_, r) => (
        <GridRow
          key={r}
          row={loads.slice(r * GRID_COLUMNS, (r + 1) * GRID_COLUMNS)}
          offset={r * GRID_COLUMNS}
          unit={unit}
          selected={selected}
          onSelect={onSelect}
          onLayout={r === 0 ? (e) => setRowHeight(e.nativeEvent.layout.height) : undefined}
        />
      ))}
    </View>
  );

  return (
    <View>
      {folded ? (
        // Nested in the sheet's own scroll: Android hands a drag here first.
        <ScrollArea
          ref={scrollRef}
          testID="load-grid-window"
          maxHeight={viewport}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          onScroll={track}
          onScrollEndDrag={track}
          onMomentumScrollEnd={track}
          onContentSizeChange={place}
        >
          {grid}
        </ScrollArea>
      ) : (
        grid
      )}
      {folds ? (
        <Pressable
          onPress={() => onExpandedChange(!expanded)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          className="mt-1 min-h-11 flex-row items-center gap-1 self-center px-3"
        >
          <Text
            maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            className="text-xs font-sans-semibold text-brand"
          >
            {expanded ? t('load.showLess') : t('load.showMore')}
          </Text>
          {expanded ? <MinusIcon color={brand} size={14} /> : <PlusIcon color={brand} size={14} />}
        </Pressable>
      ) : null}
    </View>
  );
};
