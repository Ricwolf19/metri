import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import { ActiveSetRow } from './ActiveSetRow';

jest.mock('@/lib/haptics', () => ({ haptic: jest.fn() }));

const row = (extra: Partial<React.ComponentProps<typeof ActiveSetRow>> = {}) => (
  <ActiveSetRow
    label="SET 2"
    legend="12 REPS @ RIR 2"
    draft={{ weight: '', reps: '', effort: null }}
    unit="kg"
    onChange={jest.fn()}
    onConfirm={jest.fn()}
    {...extra}
  />
);

describe('ActiveSetRow', () => {
  // The header names the target; a grey "0" or "12" in an empty field read as typed.
  it('leaves empty fields empty: no placeholder', async () => {
    settings.setLocale('en');
    await renderWithProviders(row());
    expect(screen.getByLabelText('Weight (kg)').props.placeholder).toBeUndefined();
    expect(screen.getByLabelText('Reps').props.placeholder).toBeUndefined();
  });

  it('a correction offers its delete as a hold, and the live row does not', async () => {
    settings.setLocale('en');
    const onDelete = jest.fn();
    await renderWithProviders(row({ onDelete, deleteLabel: 'Delete set 2' }));
    const del = screen.getByRole('button', { name: 'Delete set 2' });
    // A tap is not a hold: nothing is deleted.
    await fireEvent.press(del);
    expect(onDelete).not.toHaveBeenCalled();

    await renderWithProviders(row({ onSkip: jest.fn() }));
    expect(screen.queryByRole('button', { name: 'Delete set 2' })).toBeNull();
  });
});
