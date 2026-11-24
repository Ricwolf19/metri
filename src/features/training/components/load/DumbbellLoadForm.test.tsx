import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import { DumbbellLoadForm } from './DumbbellLoadForm';

const WEIGHTS = [2.5, 5, 7.5, 10, 12.5];

const setup = async ({ typed = false, extras = [] as number[] } = {}) => {
  const onAdd = jest.fn<(weight: number) => void>();
  const onRemove = jest.fn<(weight: number) => void>();
  const onPerHandText = jest.fn<(text: string) => void>();
  await renderWithProviders(
    <DumbbellLoadForm
      unit="kg"
      perHandText="10"
      onPerHandText={onPerHandText}
      weights={WEIGHTS}
      typed={typed}
      missing={false}
      rack={{
        startText: '2.5',
        onStartText: jest.fn(),
        stepText: '2.5',
        onStepText: jest.fn(),
        jumps: [],
        onJumps: jest.fn(),
      }}
      extras={{ weights: extras, onAdd, onRemove }}
      expanded={false}
      onExpandedChange={jest.fn()}
    />,
  );
  return { onAdd, onRemove, onPerHandText };
};

describe('DumbbellLoadForm', () => {
  beforeEach(() => settings.setLocale('en'));

  // The number is one dumbbell: the form used to ask "one hand / both hands".
  it('picks one dumbbell and never asks how many hands hold it', async () => {
    const { onPerHandText } = await setup();
    expect(screen.queryByText(/hand/i)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: '12.5 kg' }));
    expect(onPerHandText).toHaveBeenCalledWith('12.5');
  });

  it('adds an odd dumbbell from its own field', async () => {
    const { onAdd } = await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Add a dumbbell' }));
    const field = screen.getByLabelText('New dumbbell');
    expect(screen.getByRole('button', { name: 'Add', disabled: true })).toBeTruthy();
    await fireEvent.changeText(field, '13');
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledWith(13);
    // Ready for the next one.
    expect(screen.getByLabelText('New dumbbell').props.value).toBe('');
  });

  it('only adds a dumbbell a rack could hold', async () => {
    const { onAdd } = await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Add a dumbbell' }));
    await fireEvent.changeText(screen.getByLabelText('New dumbbell'), '0');
    expect(screen.getByRole('button', { name: 'Add', disabled: true })).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('New dumbbell'), '300');
    expect(screen.getByRole('button', { name: 'Add', disabled: true })).toBeTruthy();
    await fireEvent(screen.getByLabelText('New dumbbell'), 'submitEditing');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('takes an added dumbbell off the rack again', async () => {
    const { onRemove } = await setup({ extras: [13] });
    await fireEvent.press(screen.getByRole('button', { name: 'Add a dumbbell' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Remove the 13 kg dumbbell' }));
    expect(onRemove).toHaveBeenCalledWith(13);
  });

  // A kettlebell's field takes any number, so it has no odd sizes to add.
  it('keeps the typed field for a kettlebell, with nothing to add to the rack', async () => {
    const { onPerHandText } = await setup({ typed: true });
    await fireEvent.changeText(screen.getByLabelText('One dumbbell'), '16');
    expect(onPerHandText).toHaveBeenCalledWith('16');
    expect(screen.queryByRole('button', { name: 'Add a dumbbell' })).toBeNull();
  });
});
