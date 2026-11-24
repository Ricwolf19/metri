import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import { renderWithProviders } from '@/test/render';

import { ScrollArea } from './ScrollArea';

type Host = { type: string; props: Record<string, unknown>; parent: Host | null };

const scroller = (): Host => {
  const [hit] = screen.container.queryAll((n) => n.type === 'RCTScrollView');
  if (!hit) throw new Error('no scroll view rendered');
  return hit as unknown as Host;
};

describe('ScrollArea', () => {
  // Android 12+'s stretch overscroll catches the next touch while it relaxes:
  // a sideways swipe on a strip inside, right after a drag of the list, went to
  // the list and the strip never moved.
  it('never stretches past its ends', async () => {
    await renderWithProviders(
      <ScrollArea maxHeight={200}>
        <Text>Row</Text>
      </ScrollArea>,
    );
    expect(scroller().props.overScrollMode).toBe('never');
  });

  it('outside a sheet keeps its cap and reaches through nothing', async () => {
    await renderWithProviders(
      <ScrollArea maxHeight={200} inSheet={false}>
        <Text>Row</Text>
      </ScrollArea>,
    );
    // The scroll view sits in the fades' anchor box, inside the capped one.
    expect(StyleSheet.flatten(scroller().parent?.parent?.props.style as never)).toEqual({
      maxHeight: 200,
    });
  });

  it('in a sheet that is not there to say how far, reaches through nothing', async () => {
    await renderWithProviders(
      <ScrollArea inSheet>
        <Text>Row</Text>
      </ScrollArea>,
    );
    expect(StyleSheet.flatten(scroller().parent?.parent?.props.style as never)).toEqual({
      flexShrink: 1,
    });
  });
});
