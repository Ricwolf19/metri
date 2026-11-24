import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { renderWithProviders } from '@/test/render';

import { FADE_SIZE } from './edge-fade';
import { SCREEN_GUTTER } from './gutter';
import { ScrollRow } from './ScrollRow';

type Host = { type: string; props: Record<string, unknown>; parent: Host | null };

// React Native's Jest ScrollView keeps its instance methods on the prototype:
// one mock records every row's imperative scroll.
const scrollTo = ScrollView.prototype.scrollTo as unknown as jest.Mock;

const flat = (style: unknown) =>
  (StyleSheet.flatten(style as never) ?? {}) as Record<string, unknown>;

const scroller = (): Host => {
  const [hit] = screen.container.queryAll((n) => n.type === 'RCTScrollView');
  if (!hit) throw new Error('no scroll view rendered');
  return hit as unknown as Host;
};

/** What the native row reports: its frame (bleed included) and its content. */
const measure = async (frame: number, content: number) => {
  await fireEvent(scroller() as never, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: frame, height: 44 } },
  });
  await fireEvent(scroller() as never, 'contentSizeChange', content, 44);
};

const Row = (props: { bleed?: number; focusX?: number }) => (
  <ScrollRow {...props}>
    <Text>Chip</Text>
  </ScrollRow>
);

describe('ScrollRow bleed', () => {
  beforeEach(() => {
    scrollTo.mockClear();
  });

  // Clipped at its box's padding, a strip stopped 17.5 dp short of the screen's
  // edge and the fade left bare background beyond it.
  it('reaches through the gutter on both sides and hands the room back to the items', async () => {
    await renderWithProviders(<Row bleed={SCREEN_GUTTER} />);
    const frame = scroller();
    expect(flat(frame.parent?.props.style)).toEqual({ marginHorizontal: -SCREEN_GUTTER });
    expect(flat(frame.props.contentContainerStyle)).toEqual({ paddingHorizontal: SCREEN_GUTTER });
  });

  it('puts its fade at the reached edge, not at the padding line', async () => {
    await renderWithProviders(<Row bleed={SCREEN_GUTTER} />);
    await measure(400 + 2 * SCREEN_GUTTER, 900);
    const [fade] = screen.container.queryAll((n) => flat(n.props.style).right === 0);
    expect(fade).toBeDefined();
    expect(flat(fade.props.style).width).toBe(FADE_SIZE.row);
    // A sibling of the frame inside the widened box: its edge is the box's edge.
    expect(fade.parent).toBe(scroller().parent);
  });

  it('keeps a followed item centred, counting the gutter the items start after', async () => {
    await renderWithProviders(<Row bleed={SCREEN_GUTTER} focusX={300} />);
    await measure(435, 1000);
    // The item's centre sits at 17.5 + 300 in the content; the frame is 435 wide.
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 17.5 + 300 - 435 / 2, animated: true });
  });

  it('leaves a row that spans no gutter exactly as it was', async () => {
    await renderWithProviders(<Row focusX={300} />);
    const frame = scroller();
    expect(flat(frame.parent?.props.style)).toEqual({});
    expect(flat(frame.props.contentContainerStyle)).toEqual({});
    await measure(400, 1000);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 100, animated: true });
  });
});
