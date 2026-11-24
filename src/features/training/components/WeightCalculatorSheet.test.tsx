import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import { dumbbellRack } from '../dumbbell-rack';
import { clearSessionDrafts, readGridExpanded } from '../workout-drafts';
import { WeightCalculatorSheet } from './WeightCalculatorSheet';

// The sheet's surface (a Modal driven by gestures and the keyboard) is not under
// test here, only the form inside it.
jest.mock('@/components/ui/Sheet', () => ({
  PICKER_STOPS: [],
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock('@/components/ui/SheetForm', () => ({
  SheetForm: ({ children }: { children: React.ReactNode }) => children,
}));
// The form reports failures through telemetry, whose Sentry import starts a
// timer at load that keeps the Jest worker alive after the run.
jest.mock('@/lib/telemetry', () => ({ captureError: jest.fn() }));

type Props = ComponentProps<typeof WeightCalculatorSheet>;
type Apply = Parameters<Props['onApply']>[0];

const LOG = 'log-sheet';

const open = async (props: Partial<Props> = {}) => {
  const onApply = jest.fn<(result: Apply) => void>();
  const onClose = jest.fn();
  const view = await renderWithProviders(
    <WeightCalculatorSheet
      visible
      onClose={onClose}
      unit="kg"
      initialWeight="20"
      initialLoad={null}
      equipment="dumbbell"
      hands={2}
      onApply={onApply}
      {...props}
    />,
  );
  return { onApply, onClose, ...view };
};

describe('WeightCalculatorSheet', () => {
  beforeEach(() => {
    settings.setLocale('en');
    settings.setDumbbellRack('kg', null);
  });
  // Unmount first: clearing the store re-renders a sheet still subscribed to it.
  afterEach(async () => {
    await cleanup();
    clearSessionDrafts(LOG);
  });

  // The sheet used to sum both hands ("Total lifted 40 kg") and ask how many
  // hands held one: the number is ONE dumbbell, and so is what it shows.
  it('presents the dumbbell itself, never a doubled total, and asks nothing about hands', async () => {
    await open();
    expect(screen.getByText('Weight per dumbbell')).toBeTruthy();
    expect(screen.getByText('Each dumbbell')).toBeTruthy();
    expect(screen.getByText('20 kg')).toBeTruthy();
    expect(screen.getByText('= 44.1 lb')).toBeTruthy();
    expect(screen.queryByText('40 kg')).toBeNull();
    expect(screen.queryByText(/hand/i)).toBeNull();
  });

  it("applies one dumbbell counted by the exercise's hands", async () => {
    const { onApply } = await open();
    await fireEvent.press(screen.getByRole('button', { name: '22.5 kg' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Apply' }));
    const load = { kind: 'dumbbell', perHandKg: 22.5, hands: 2 };
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({ row: { weightText: '22.5', load }, save: load }),
    );
  });

  it('names a single dumbbell as one, and logs it once', async () => {
    const { onApply } = await open({ hands: 1 });
    expect(screen.getByText('One dumbbell')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: '25 kg' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Apply' }));
    const load = { kind: 'dumbbell', perHandKg: 25, hands: 1 };
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({ row: { weightText: '25', load }, save: load }),
    );
  });

  it('keeps the rack open for the rest of the session once shown in full', async () => {
    const first = await open({ workoutLogId: LOG });
    await fireEvent.press(screen.getByRole('button', { name: 'Show more' }));
    expect(readGridExpanded(LOG, 'rack')).toBe(true);
    await first.unmount();
    // The next open of the session, on any dumbbell exercise, starts in full.
    const second = await open({ workoutLogId: LOG, initialWeight: '10' });
    expect(screen.getByRole('button', { name: 'Show less', expanded: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: '100 kg' })).toBeTruthy();
    await second.unmount();
    // Outside a session nothing is kept: it opens folded.
    await open();
    expect(screen.getByRole('button', { name: 'Show more', expanded: false })).toBeTruthy();
  });

  it("folds a stack's pins too, remembered apart from the rack", async () => {
    const stack = { kind: 'machine' as const, baseKg: 5, incrementKg: 5, steps: 3 };
    await open({ equipment: 'cable', initialLoad: stack, workoutLogId: LOG });
    expect(screen.getByRole('button', { name: '20 kg', selected: true })).toBeTruthy();
    // Folded: a short window that scrolls through every pin.
    expect(screen.getByTestId('load-grid-window')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.queryByTestId('load-grid-window')).toBeNull();
    expect(screen.getByRole('button', { name: '150 kg' })).toBeTruthy();
    expect(readGridExpanded(LOG, 'pins')).toBe(true);
    expect(readGridExpanded(LOG, 'rack')).toBe(false);
  });

  it('adds an odd dumbbell to the rack at once and picks it, kept even when cancelled', async () => {
    const { onApply, onClose } = await open();
    await fireEvent.press(screen.getByRole('button', { name: 'Add a dumbbell' }));
    await fireEvent.changeText(screen.getByLabelText('New dumbbell'), '13');
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    expect(dumbbellRack('kg').extras).toEqual([13]);
    expect(screen.getByRole('button', { name: '13 kg', selected: true })).toBeTruthy();
    // The summary follows the pick (13 kg = 28.7 lb).
    expect(screen.getByText('= 28.7 lb')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
    expect(dumbbellRack('kg').extras).toEqual([13]);
  });

  it('drops the pick with the odd dumbbell it was, so Apply cannot log one the rack lost', async () => {
    await open();
    await fireEvent.press(screen.getByRole('button', { name: 'Add a dumbbell' }));
    await fireEvent.changeText(screen.getByLabelText('New dumbbell'), '13');
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('button', { name: '13 kg', selected: true })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Remove the 13 kg dumbbell' }));
    expect(dumbbellRack('kg').extras ?? []).toEqual([]);
    expect(screen.getByRole('button', { name: 'Apply' }).props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});
