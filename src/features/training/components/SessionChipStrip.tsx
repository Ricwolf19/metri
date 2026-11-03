import { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';

import { DragHandleIcon, EditIcon, PlusIcon } from '@/components/icons';
import { ScrollRow } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT, type TranslationKey } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import type { SlotState } from '../session-order';

export type SessionChip = {
  slotId: string;
  label: string;
  state: SlotState;
  /** The lifter keeps a note on this exercise: a small pencil says so. */
  hasNote: boolean;
};

type Props = {
  /** In order: every exercise still in play, then the missed ones. */
  active: SessionChip[];
  missed: SessionChip[];
  /** The page in view: a dotted underline, the fill still says its state. */
  focused: string | null;
  /** The chip a hold picked up (dashed outline + grip) until the strip is tapped. */
  lifted: string | null;
  onPress: (slotId: string) => void;
  /** Only exercises still in play can be lifted: a missed one has no place to move to. */
  onLongPress: (slotId: string) => void;
  /** The phantom chip after the last exercise: add one to today's session. */
  onAdd?: () => void;
};

/** Fill, border and text per state: brand = done, amber = partly done, red = missed. */
const TONE: Record<SlotState, { chip: string; text: string; dot: string }> = {
  untouched: { chip: 'border-ink-700 bg-ink-800', text: 'text-ink-300', dot: 'bg-ink-100' },
  done: { chip: 'border-brand/40 bg-brand/15', text: 'text-brand', dot: 'bg-brand' },
  partial: {
    chip: 'border-amber-400/40 bg-amber-400/10',
    text: 'text-amber-300',
    dot: 'bg-amber-300',
  },
  missed: { chip: 'border-red-500/40 bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

/** Enough dots for the longest label; the row clips the rest. */
const DOTS = Array.from({ length: 60 }, (_, i) => i);

const DottedUnderline = ({ className }: { className: string }) => (
  <View
    pointerEvents="none"
    className="absolute bottom-1 left-4 right-4 flex-row gap-[3px] overflow-hidden"
  >
    {DOTS.map((i) => (
      <View key={i} className={`h-[2px] w-[2px] rounded-full ${className}`} />
    ))}
  </View>
);

type Box = { x: number; width: number };

/**
 * The live session's navigation: one chip per exercise, coloured by where it
 * stands — done, partly done, missed — whether or not it is the page in view.
 * Focus is a dotted underline, never a fill, so the exercise on screen does
 * not read as done just because it is selected. Missed exercises sit at the
 * end behind a divider; the phantom "+" chip adds an exercise to today.
 */
export const SessionChipStrip = ({
  active,
  missed,
  focused,
  lifted,
  onPress,
  onLongPress,
  onAdd,
}: Props) => {
  const t = useT();
  const { brand, muted } = useTheme();
  const [boxes, setBoxes] = useState<ReadonlyMap<string, Box>>(new Map());
  const place = (slotId: string) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setBoxes((prev) => {
      const seen = prev.get(slotId);
      if (seen && seen.x === x && seen.width === width) return prev;
      return new Map(prev).set(slotId, { x, width });
    });
  };
  const box = focused ? boxes.get(focused) : undefined;

  const chip = (item: SessionChip, canLift: boolean) => {
    const tone = TONE[item.state];
    const isFocused = item.slotId === focused;
    const isLifted = item.slotId === lifted;
    const stateLabel =
      item.state === 'untouched' ? '' : t(`training.chipState.${item.state}` as TranslationKey);
    return (
      <Pressable
        key={item.slotId}
        onPress={() => onPress(item.slotId)}
        onLongPress={canLift ? () => onLongPress(item.slotId) : undefined}
        onLayout={place(item.slotId)}
        accessibilityRole="button"
        accessibilityLabel={[item.label, stateLabel].filter(Boolean).join(', ')}
        accessibilityHint={canLift ? t('training.reorder') : undefined}
        accessibilityState={{ selected: isFocused }}
        className={[
          'shrink-0 flex-row items-center gap-1.5 rounded-full border px-4 py-2',
          tone.chip,
          isLifted ? 'border-dashed border-brand' : '',
        ].join(' ')}
      >
        {isLifted ? (
          <View className="-ml-1">
            <DragHandleIcon color={brand} size={14} />
          </View>
        ) : null}
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className={[
            'text-sm',
            isFocused ? 'font-sans-bold' : 'font-sans-semibold',
            item.state === 'untouched' && isFocused ? 'text-ink-50' : tone.text,
          ].join(' ')}
        >
          {item.label}
        </Text>
        {item.hasNote ? <EditIcon color={muted} size={11} /> : null}
        {isFocused ? <DottedUnderline className={tone.dot} /> : null}
      </Pressable>
    );
  };

  return (
    <ScrollRow focusX={box ? box.x + box.width / 2 : undefined} cues={false}>
      {active.map((item) => chip(item, true))}
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={t('training.addExercise')}
          className="shrink-0 flex-row items-center gap-1 rounded-full border border-dashed border-brand/50 px-3.5 py-2"
        >
          <PlusIcon color={brand} size={14} />
          <Text
            maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            className="text-sm font-sans-semibold text-brand"
          >
            {t('training.addExerciseShort')}
          </Text>
        </Pressable>
      ) : null}
      {missed.length ? (
        <View
          accessible
          accessibilityLabel={t('training.missedDivider')}
          className="mx-1 h-6 w-px shrink-0 bg-ink-500"
        />
      ) : null}
      {missed.map((item) => chip(item, false))}
    </ScrollRow>
  );
};
