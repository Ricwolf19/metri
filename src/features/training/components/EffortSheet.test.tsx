import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import type { EffortMode } from '@/db/schema';
import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import type { Effort } from '../workout-drafts';
import { EffortSheet } from './EffortSheet';

// The sheet's surface (a Modal driven by gestures and the keyboard) is not under
// test here, only what it offers: it renders its children while visible.
jest.mock('@/components/ui/Sheet', () => ({
  PICKER_STOPS: [],
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));

const open = async (mode: EffortMode) => {
  settings.setLocale('en');
  const onPick = jest.fn<(effort: Effort) => void>();
  await renderWithProviders(
    <EffortSheet visible mode={mode} onPick={onPick} onClose={jest.fn()} />,
  );
  return onPick;
};

describe('EffortSheet', () => {
  // Foundations asks a beginner in plain words: four bands, each saying what it
  // means in reps left, stored on the professional columns.
  it('simple mode offers the four bands and stores each on the RIR columns', async () => {
    const onPick = await open('simple');
    expect(screen.queryByText('in reserve')).toBeNull();
    await fireEvent.press(screen.getByText('Not one more rep'));
    await fireEvent.press(screen.getByText('1–2 reps left'));
    await fireEvent.press(screen.getByText('3–4 reps left'));
    await fireEvent.press(screen.getByText('5 or more left'));
    expect(onPick.mock.calls.map(([e]) => e)).toEqual([
      { rir: 0, failure: true },
      { rir: 1, failure: false },
      { rir: 3, failure: false },
      { rir: 5, failure: false },
    ]);
  });

  it('professional mode offers failure, RIR 1–4 and 5+, with no way to clear', async () => {
    const onPick = await open('rir');
    expect(screen.getAllByText('in reserve')).toHaveLength(4);
    expect(screen.queryByText('No effort for this set')).toBeNull();
    await fireEvent.press(screen.getByText('5+'));
    expect(onPick).toHaveBeenCalledWith({ rir: 5, failure: false });
  });

  // Effort is optional in free mode, so a pick can be taken back.
  it('free mode offers the professional scale and a way to log no effort', async () => {
    const onPick = await open('free');
    expect(screen.getAllByText('in reserve')).toHaveLength(4);
    await fireEvent.press(screen.getByText('No effort for this set'));
    expect(onPick).toHaveBeenCalledWith({ rir: null, failure: false });
  });
});
