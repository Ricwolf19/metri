import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { renderWithProviders } from '@/test/render';

import { KEYBOARD_CLEARANCE } from './keyboard-room';
import { Screen } from './Screen';
import { holdSheetOpen } from './sheet-open';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual<{ default: object }>('react-native-safe-area-context/jest/mock').default,
);

type Node = { props: Record<string, unknown>; children?: (Node | string)[] | null };

// keyboard-controller's own Jest mock renders its views as plain RN ones, so
// the props Screen hands them reach the host tree and can be read back.
const hostWith = (prop: string): Record<string, unknown> => {
  const walk = (node: Node | string | null): Node | null => {
    if (!node || typeof node === 'string') return null;
    if (prop in node.props) return node;
    for (const child of node.children ?? []) {
      const hit = walk(child);
      if (hit) return hit;
    }
    return null;
  };
  const hit = walk(screen.toJSON() as Node | null);
  if (!hit) throw new Error(`no host view carries ${prop}`);
  return hit.props;
};

// Layout does not bubble: it lands on the footer's own box, the label's parent.
const footerLayout = async (height: number) => {
  const box = screen.getByText('Save').parent;
  if (!box) throw new Error('the footer label has no box');
  await fireEvent(box, 'layout', { nativeEvent: { layout: { height } } });
};

describe('Screen keyboard room', () => {
  it('keeps room under a focused field on a scroll screen, and the scroll to reach it', async () => {
    await renderWithProviders(
      <Screen scroll>
        <Text>Body</Text>
      </Screen>,
    );
    const scroll = hostWith('bottomOffset');
    // 24 hid the Save row under the exercise note's field.
    expect(scroll.bottomOffset).toBe(KEYBOARD_CLEARANCE);
    expect(scroll.extraKeyboardSpace).toBe(KEYBOARD_CLEARANCE);
  });

  it('keeps a focused field clear of the footer riding the keyboard', async () => {
    await renderWithProviders(
      <Screen scroll footer={<Text>Save</Text>}>
        <Text>Body</Text>
      </Screen>,
    );
    await footerLayout(76);
    expect(hostWith('bottomOffset').bottomOffset).toBe(KEYBOARD_CLEARANCE + 76);
  });

  // Android 12+'s stretch overscroll catches the next touch while it relaxes:
  // a sideways swipe on a strip right after a vertical drag went to the page.
  it('never stretches a scroll screen past its ends', async () => {
    await renderWithProviders(
      <Screen scroll>
        <Text>Body</Text>
      </Screen>,
    );
    expect(hostWith('overScrollMode').overScrollMode).toBe('never');
  });

  // keyboard-controller reports a keyboard opened inside a Modal to every
  // listener: the page behind a sheet padded and scrolled for the sheet's field.
  it('stands back from the keyboard while a sheet is up, and takes it back after', async () => {
    await renderWithProviders(
      <Screen scroll footer={<Text>Save</Text>}>
        <Text>Body</Text>
      </Screen>,
    );
    expect(hostWith('bottomOffset').enabled).toBe(true);
    let release = () => {};
    await act(async () => {
      release = holdSheetOpen();
    });
    expect(hostWith('bottomOffset').enabled).toBe(false);
    // The footer stays put too: it does not ride a keyboard that is not its own.
    expect(hostWith('offset').enabled).toBe(false);
    await act(async () => release());
    expect(hostWith('bottomOffset').enabled).toBe(true);
  });

  it('mounted under a sheet whose keyboard is still up, leaves that keyboard to the sheet', async () => {
    // The spotlight closes its sheet and pushes a screen in one tap, its search keyboard up.
    const keyboard = useKeyboardState as unknown as jest.Mock<
      (select?: (s: object) => unknown) => unknown
    >;
    const original = keyboard.getMockImplementation();
    keyboard.mockImplementation((select) => (select ? select({ isVisible: true }) : {}));
    const release = holdSheetOpen();
    try {
      await renderWithProviders(
        <Screen scroll footer={<Text>Save</Text>}>
          <Text>Body</Text>
        </Screen>,
      );
      expect(hostWith('bottomOffset').enabled).toBe(false);
      expect(hostWith('offset').enabled).toBe(false);
    } finally {
      // The release re-renders the screen (the store emits): inside act.
      await act(async () => release());
      if (original) keyboard.mockImplementation(original);
    }
  });

  it('pads a static screen to the top of its footer', async () => {
    await renderWithProviders(
      <Screen footer={<Text>Save</Text>}>
        <View />
      </Screen>,
    );
    await footerLayout(76);
    expect(hostWith('keyboardVerticalOffset').keyboardVerticalOffset).toBe(76);
  });
});
