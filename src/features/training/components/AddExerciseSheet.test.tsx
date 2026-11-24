import { describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import { AddExerciseSheet } from './AddExerciseSheet';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual<{ default: object }>('react-native-safe-area-context/jest/mock').default,
);
// The gesture handler's native module is not registered under Jest: its own mock
// stands in, for the build the package's `main` resolves to.
jest.mock('react-native-gesture-handler/lib/commonjs/RNGestureHandlerModule', () =>
  jest.requireActual('react-native-gesture-handler/lib/commonjs/mocks/mocks'),
);
// The library is a live query; the sheet only has to give it room.
jest.mock('./ExerciseList', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { ExerciseList: () => <Text>Library</Text> };
});

type Style = Record<string, unknown>;

const flat = (style: unknown) => (StyleSheet.flatten(style as never) ?? {}) as Style;

describe('AddExerciseSheet', () => {
  // A FlashList has no height of its own: in a sheet that hugged its content it
  // got none, and the sheet opened at a fifth of the screen — title, search and
  // muscle chips, never a single exercise.
  it('opens at its full stop and hands the list the room under its title', async () => {
    settings.setLocale('en');
    await renderWithProviders(
      <AddExerciseSheet
        visible
        onClose={jest.fn()}
        userId="u1"
        exclude={new Set()}
        onPick={jest.fn()}
      />,
    );
    const [sheet] = screen.container.queryAll(
      (n) => typeof flat(n.props.style).maxHeight === 'number',
    );
    const size = flat(sheet.props.style);
    expect(size.height).toBe(size.maxHeight);
    // The column holding the title and the list fills the sheet.
    expect(flat(screen.getByText('Library').parent?.props.style)).toMatchObject({ flex: 1 });
  });
});
