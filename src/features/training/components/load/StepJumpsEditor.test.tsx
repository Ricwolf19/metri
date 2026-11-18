import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import type { JumpText } from '../../load-sheet';
import { StepJumpsEditor } from './StepJumpsEditor';

const setup = async (jumps: JumpText[]) => {
  const onChange = jest.fn();
  await renderWithProviders(
    <StepJumpsEditor unit="kg" jumps={jumps} onChange={onChange} addLabel="Heavier from…" />,
  );
  return onChange;
};

describe('StepJumpsEditor', () => {
  beforeEach(() => settings.setLocale('en'));

  it('adds an empty row from the link', async () => {
    const onChange = await setup([]);
    await fireEvent.press(screen.getByText('Heavier from…'));
    expect(onChange).toHaveBeenCalledWith([{ fromText: '', stepText: '' }]);
  });

  it('edits one row and leaves the others alone', async () => {
    const onChange = await setup([
      { fromText: '50', stepText: '5' },
      { fromText: '80', stepText: '10' },
    ]);
    await fireEvent.changeText(screen.getAllByDisplayValue('10')[0], '20');
    expect(onChange).toHaveBeenCalledWith([
      { fromText: '50', stepText: '5' },
      { fromText: '80', stepText: '20' },
    ]);
  });

  it('removes the row whose X was pressed', async () => {
    const onChange = await setup([
      { fromText: '50', stepText: '5' },
      { fromText: '80', stepText: '10' },
    ]);
    await fireEvent.press(screen.getAllByLabelText('Remove this step change')[0]);
    expect(onChange).toHaveBeenCalledWith([{ fromText: '80', stepText: '10' }]);
  });
});
