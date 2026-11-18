import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

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

const setup = async (lifted: string | null = null) => {
  const onPress = jest.fn();
  await renderWithProviders(
    <SessionChipStrip
      active={[
        chip('a', '1. Barbell Bench Press', '1. BB Bench'),
        chip('b', '2. Incline Dumbbell Press', '2. Incl. DB Press'),
      ]}
      missed={[]}
      focused="a"
      lifted={lifted}
      onPress={onPress}
      onLongPress={jest.fn()}
    />,
  );
  return onPress;
};

describe('SessionChipStrip', () => {
  beforeEach(() => settings.setLocale('en'));

  it('shows the short names, spells one out on a tap and shortens it on the next', async () => {
    const onPress = await setup();
    expect(screen.getByText('1. BB Bench')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('1. BB Bench'));
    expect(screen.getByText('1. Barbell Bench Press')).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledWith('a');

    await fireEvent.press(screen.getByText('1. Barbell Bench Press'));
    expect(screen.getByText('1. BB Bench')).toBeOnTheScreen();
  });

  it('spells out only the chip last tapped', async () => {
    await setup();
    await fireEvent.press(screen.getByText('1. BB Bench'));
    await fireEvent.press(screen.getByText('2. Incl. DB Press'));
    expect(screen.getByText('1. BB Bench')).toBeOnTheScreen();
    expect(screen.getByText('2. Incline Dumbbell Press')).toBeOnTheScreen();
  });

  it('keeps names short while a chip is lifted for reordering', async () => {
    await setup('b');
    await fireEvent.press(screen.getByText('1. BB Bench'));
    expect(screen.queryByText('1. Barbell Bench Press')).toBeNull();
  });
});
