import { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';

import {
  CheckIcon,
  DragHandleIcon,
  EditIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from '@/components/icons';
import { ScrollRow } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT, type TranslationKey } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-context';

import type { SlotState } from '../session-order';

export type SessionChip = {
  slotId: string;
  /** The full name: always read to screen readers, shown on a second tap of the chip in view. */
  label: string;
  /** What the chip shows by default (`exerciseShortName`), so a strip fits a phone. */
  shortLabel: string;
  state: SlotState;
  /** The lifter keeps a note on this exercise: a small pencil says so. */
  hasNote: boolean;
};

type Props = {
  /** In order: every exercise still in play, then the missed ones. */
  active: SessionChip[];
  missed: SessionChip[];
  /** The page in view: a dotted border around the chip, the fill still says its state. */
  focused: string | null;
  /** The chip a hold picked up (dashed outline + grip) until the strip is tapped. */
  lifted: string | null;
  /** Every chip tap, name toggle or not: the screen pages there, or puts a lifted chip down. */
  onPress: (slotId: string) => void;
  /** Only exercises still in play can be lifted: a missed one has no place to move to. */
  onLongPress: (slotId: string) => void;
  /** The phantom chip after the last exercise: add one to today's session. */
  onAdd?: () => void;
};

/** Fill, border, focus border and text per state: brand = done, amber = partly done, red = missed. */
const TONE: Record<SlotState, { fill: string; border: string; focus: string; text: string }> = {
  untouched: {
    fill: 'bg-ink-800',
    border: 'border-ink-700',
    focus: 'border-ink-100',
    text: 'text-ink-300',
  },
  done: {
    fill: 'bg-brand/15',
    border: 'border-brand/40',
    focus: 'border-brand',
    text: 'text-brand',
  },
  partial: {
    fill: 'bg-amber-400/10',
    border: 'border-amber-400/40',
    focus: 'border-amber-300',
    text: 'text-amber-300',
  },
  missed: {
    fill: 'bg-red-500/10',
    border: 'border-red-500/40',
    focus: 'border-red-400',
    text: 'text-red-400',
  },
};

/**
 * Colour alone does not tell done from partly done under red-green colour
 * blindness (the brand and amber fills nearly merge), so every state that is
 * not "not begun" also carries a shape: a check, the dash of an indeterminate
 * checkbox, a cross. Drawn dark on a disc of the state's colour.
 */
const GLYPH: Record<Exclude<SlotState, 'untouched'>, { disc: string; Icon: typeof CheckIcon }> = {
  done: { disc: 'bg-brand', Icon: CheckIcon },
  partial: { disc: 'bg-amber-300', Icon: MinusIcon },
  missed: { disc: 'bg-red-400', Icon: XIcon },
};

/**
 * The focus border is 1 dp wider: the padding gives it back, so the strip
 * never shifts. Both boxes are at least 44 dp tall (a thumb mid-set).
 */
const FOCUS_BOX = 'min-h-11 border-2 border-dotted px-[15px] py-[7px]';
const PLAIN_BOX = 'min-h-11 border px-4 py-2';

type Box = { x: number; width: number };

/**
 * The live session's navigation: one chip per exercise, coloured by where it
 * stands — done, partly done, missed — whether or not it is the page in view,
 * and marked with that state's glyph so the colour is never the only signal.
 * Focus is a dotted border around the chip, never a fill, so the exercise on
 * screen does not read as done just because it is selected. Missed exercises sit at the
 * end behind a divider; the phantom "+" chip adds an exercise to today. Chips show the
 * short name. A tap on another chip only moves the focus there; a tap on the chip
 * already in view spells it out in full, and the next one shortens it again. Focus
 * moving on — a tap, or the screen paging after a logged set — shortens it too, so
 * the full name never arrives in the same moment as the jump. Screen readers always
 * hear the full name. The strip's edges fade wherever more chips sit off screen.
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
  const { brand, brandContrast, muted } = useTheme();
  const [boxes, setBoxes] = useState<ReadonlyMap<string, Box>>(new Map());
  // ONE chip spelled out at a time, and only the one in view: the strip stays a
  // strip of short names. A focus that moves drops it — derived during render
  // (the "adjust state on prop change" shape), never an effect, so the new
  // page never draws one frame with the old chip still spelled out.
  const [expanded, setExpanded] = useState<string | null>(null);
  const [seenFocus, setSeenFocus] = useState(focused);
  if (focused !== seenFocus) {
    setSeenFocus(focused);
    setExpanded(null);
  }
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
    const glyph = item.state === 'untouched' ? null : GLYPH[item.state];
    return (
      <Pressable
        key={item.slotId}
        onPress={() => {
          // A tap while a chip is lifted only puts it down; one on another chip
          // only focuses it. The name answers a tap on the chip already in view.
          if (lifted) haptic('tick');
          else if (isFocused) setExpanded((open) => (open === item.slotId ? null : item.slotId));
          onPress(item.slotId);
        }}
        onLongPress={
          canLift
            ? () => {
                haptic('lift');
                onLongPress(item.slotId);
              }
            : undefined
        }
        onLayout={place(item.slotId)}
        accessibilityRole="button"
        accessibilityLabel={[item.label, stateLabel].filter(Boolean).join(', ')}
        accessibilityHint={canLift ? t('training.reorder') : undefined}
        accessibilityState={{ selected: isFocused }}
        // A screen reader cannot hold: lifting is offered as a named action.
        accessibilityActions={
          canLift ? [{ name: 'longpress', label: t('training.moveAction') }] : undefined
        }
        onAccessibilityAction={
          canLift
            ? (e) => {
                if (e.nativeEvent.actionName === 'longpress') onLongPress(item.slotId);
              }
            : undefined
        }
        className={[
          'shrink-0 flex-row items-center gap-1.5 rounded-full',
          tone.fill,
          isLifted
            ? `${PLAIN_BOX} border-dashed border-brand`
            : isFocused
              ? `${FOCUS_BOX} ${tone.focus}`
              : `${PLAIN_BOX} ${tone.border}`,
        ].join(' ')}
      >
        {isLifted ? (
          <View className="-ml-1">
            <DragHandleIcon color={brand} size={14} />
          </View>
        ) : null}
        {glyph ? (
          <View className={`h-4 w-4 items-center justify-center rounded-full ${glyph.disc}`}>
            <glyph.Icon color={brandContrast} size={11} strokeWidth={3} />
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
          {expanded === item.slotId ? item.label : item.shortLabel}
        </Text>
        {item.hasNote ? <EditIcon color={muted} size={11} /> : null}
      </Pressable>
    );
  };

  return (
    <ScrollRow focusX={box ? box.x + box.width / 2 : undefined}>
      {active.map((item) => chip(item, true))}
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={t('training.addExercise')}
          className="min-h-11 shrink-0 flex-row items-center gap-1 rounded-full border border-dashed border-brand/50 px-3.5 py-2"
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
