import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { renderWithProviders } from '@/test/render';

import { KEYBOARD_CLEARANCE } from './keyboard-room';
import { Screen } from './Screen';

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
