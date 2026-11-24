import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { SCREEN_GUTTER } from '@/components/ui';
import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import { SessionChipStrip, type SessionChip } from './SessionChipStrip';

jest.mock('@/lib/haptics', () => ({ haptic: jest.fn() }));

const chip = (slotId: string, label: string, shortLabel: string): SessionChip => ({
  slotId,
  label,
  shortLabel,
  state: 'untouched',
  hasNote: false,
});

const CHIPS = [
  chip('a', '1. Barbell Bench Press', '1. BB Bench'),
  chip('b', '2. Incline Dumbbell Press', '2. Incl. DB Press'),
];

type StripProps = { focused: string | null; lifted?: string | null; onPress?: () => void };

const Strip = ({ focused, lifted = null, onPress = jest.fn() }: StripProps) => (
  <SessionChipStrip
    active={CHIPS}
    missed={[]}
    focused={focused}
    lifted={lifted}
    onPress={onPress}
    onLongPress={jest.fn()}
  />
);

/** The screen's side of the contract: a tap pages to the chip, so focus follows it. */
const Paging = () => {
  const [focused, setFocused] = useState<string | null>('a');
  return (
    <SessionChipStrip
      active={CHIPS}
      missed={[]}
      focused={focused}
      lifted={null}
      onPress={setFocused}
      onLongPress={jest.fn()}
    />
  );
};

/** The strip's outer box: the scroll view's parent. */
const stripBox = () => {
  const [frame] = screen.container.queryAll((n) => n.type === 'RCTScrollView');
  return StyleSheet.flatten(frame.parent?.props.style) ?? {};
};

describe('SessionChipStrip', () => {
  beforeEach(() => settings.setLocale('en'));

  it('spells out the chip in view on a tap and shortens it on the next', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Strip focused="a" onPress={onPress} />);
    expect(screen.getByText('1. BB Bench')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('1. BB Bench'));
    expect(screen.getByText('1. Barbell Bench Press')).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledWith('a');

    await fireEvent.press(screen.getByText('1. Barbell Bench Press'));
    expect(screen.getByText('1. BB Bench')).toBeOnTheScreen();
  });

  it('only focuses a chip that is not in view: the name waits for the second tap', async () => {
    await renderWithProviders(<Paging />);

    await fireEvent.press(screen.getByText('2. Incl. DB Press'));
    expect(screen.getByText('2. Incl. DB Press')).toBeOnTheScreen();
    expect(screen.queryByText('2. Incline Dumbbell Press')).toBeNull();

    await fireEvent.press(screen.getByText('2. Incl. DB Press'));
    expect(screen.getByText('2. Incline Dumbbell Press')).toBeOnTheScreen();
  });

  it('shortens the spelled-out chip when a tap moves the focus', async () => {
    await renderWithProviders(<Paging />);
    await fireEvent.press(screen.getByText('1. BB Bench'));
    expect(screen.getByText('1. Barbell Bench Press')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('2. Incl. DB Press'));
    expect(screen.getByText('1. BB Bench')).toBeOnTheScreen();
    expect(screen.getByText('2. Incl. DB Press')).toBeOnTheScreen();
  });

  it('shortens it when the screen pages on by itself, and keeps it short on the way back', async () => {
    const { rerender } = await renderWithProviders(<Strip focused="a" />);
    await fireEvent.press(screen.getByText('1. BB Bench'));
    expect(screen.getByText('1. Barbell Bench Press')).toBeOnTheScreen();

    // A logged set pages to the next exercise.
    await rerender(<Strip focused="b" />);
    expect(screen.getByText('1. BB Bench')).toBeOnTheScreen();

    await rerender(<Strip focused="a" />);
    expect(screen.getByText('1. BB Bench')).toBeOnTheScreen();
  });

  it('keeps names short while a chip is lifted for reordering', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Strip focused="a" lifted="b" onPress={onPress} />);
    await fireEvent.press(screen.getByText('1. BB Bench'));
    expect(screen.queryByText('1. Barbell Bench Press')).toBeNull();
    // The screen still hears the tap: it puts the lifted chip down.
    expect(onPress).toHaveBeenCalledWith('a');
  });

  it('always gives screen readers the full name', async () => {
    await renderWithProviders(<Strip focused="a" />);
    expect(screen.getByRole('button', { name: '1. Barbell Bench Press' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '2. Incline Dumbbell Press' })).toBeOnTheScreen();
  });

  // Clipped at the screen's px-5, the chips stopped 17.5 dp short of its edge and
  // the fade left a band of bare background beyond them.
  it("runs out to the screen's edges, through its padding", async () => {
    await renderWithProviders(<Strip focused="a" />);
    expect(stripBox()).toEqual({ marginHorizontal: -SCREEN_GUTTER });
  });

  it('stays in its own box while a chip is lifted: Prev and Next sit beside it', async () => {
    await renderWithProviders(<Strip focused="a" lifted="b" />);
    expect(stripBox()).toEqual({});
  });
});
