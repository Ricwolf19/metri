import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import type { SetLog } from '@/db/schema';
import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import { LoggedRow } from './SetRows';

const logged = (patch: Partial<SetLog> = {}): SetLog => ({
  id: 'set-2',
  workoutLogId: 'log-1',
  exerciseId: 'bench',
  setNumber: 2,
  weightKg: 60,
  reps: 8,
  rpe: null,
  rir: 2,
  isWarmup: false,
  isFailure: false,
  notes: null,
  restBeforeSeconds: null,
  load: null,
  createdAt: new Date(0),
  updatedAt: null,
  ...patch,
});

describe('LoggedRow', () => {
  it('reopens the set from the pencil only, never from a tap on the row', async () => {
    settings.setLocale('en');
    const onEdit = jest.fn();
    await renderWithProviders(
      <LoggedRow
        label="2"
        logged={logged()}
        unit="kg"
        effortMode="rir"

        onEdit={onEdit}
      />,
    );
    // The set summary is read, not pressed: the check disc beside it does nothing.
    expect(screen.queryByRole('button', { name: /Set 2: 60 kg/ })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Edit set 2' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    // The delete lives in the correction now, not one hold away on every row.
    expect(screen.queryByRole('button', { name: 'Delete set 2' })).toBeNull();
  });

  // A failure set is stored with RIR 0: the row read "× 8 · RIR 0 · Failure".
  it('writes the effort in the plan notation, failure without its stored RIR 0', async () => {
    settings.setLocale('en');
    await renderWithProviders(
      <LoggedRow
        label="2"
        logged={logged({ rir: 0, isFailure: true })}
        unit="kg"
        effortMode="rir"
      />,
    );
    expect(screen.getByText(/× 8 @ Failure/)).toBeTruthy();
    expect(screen.queryByText(/RIR 0/)).toBeNull();
  });

  it('a reserve reads "@ RIR n"', async () => {
    settings.setLocale('en');
    await renderWithProviders(
      <LoggedRow label="2" logged={logged({ rir: 2 })} unit="kg" effortMode="rir" />,
    );
    expect(screen.getByText(/× 8 @ RIR 2/)).toBeTruthy();
  });

  // Foundations logs effort in plain words: the row reads the band it was picked
  // as, and a set logged on the RIR scale reads as its band too.
  it.each([
    [{ rir: 1 }, 'Hard'],
    [{ rir: 2 }, 'Hard'],
    [{ rir: 3 }, 'Moderate'],
    [{ rir: 5 }, 'Easy'],
    [{ rir: 0, isFailure: true }, 'Failure'],
  ])('simple mode reads %o as "@ %s"', async (patch, word) => {
    settings.setLocale('en');
    await renderWithProviders(
      <LoggedRow label="2" logged={logged(patch)} unit="kg" effortMode="simple" />,
    );
    expect(screen.getByText(new RegExp(`× 8 @ ${word}`))).toBeTruthy();
    expect(screen.queryByText(/RIR/)).toBeNull();
  });

  // Free mode only lifts the requirement: what was logged reads on the RIR scale.
  it('free mode keeps the professional notation', async () => {
    settings.setLocale('en');
    await renderWithProviders(
      <LoggedRow label="2" logged={logged({ rir: 3 })} unit="kg" effortMode="free" />,
    );
    expect(screen.getByText(/× 8 @ RIR 3/)).toBeTruthy();
  });
});
