import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { renderWithProviders } from '@/test/render';

import { ScrollArea } from './ScrollArea';
import { Sheet } from './Sheet';
import { anySheetOpen } from './sheet-open';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual<{ default: object }>('react-native-safe-area-context/jest/mock').default,
);
// The gesture handler's native module is not registered under Jest: its own
// mock stands in, for the build the package's `main` resolves to (its jestSetup
// does the same for every build).
jest.mock('react-native-gesture-handler/lib/commonjs/RNGestureHandlerModule', () =>
  jest.requireActual('react-native-gesture-handler/lib/commonjs/mocks/mocks'),
);

type Host = {
  type: string;
  props: Record<string, unknown>;
  children: (Host | string)[];
};

/** A phone with a gesture bar: 34 dp of bottom safe area under every sheet. */
const BAR = 34;
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 24, right: 0, bottom: BAR, left: 0 },
};

const open = (ui: React.ReactElement) =>
  renderWithProviders(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);

const flat = (style: unknown) =>
  (StyleSheet.flatten(style as never) ?? {}) as Record<string, unknown>;

const hosts = (match: (node: Host) => boolean): Host[] =>
  screen.container.queryAll((n) => match(n as unknown as Host)) as unknown as Host[];

/** The sheet's own surface: the one box its keyboard-aware cap sizes. */
const sheetBox = () => {
  const [box] = hosts((n) => typeof flat(n.props.style).maxHeight === 'number');
  return flat(box.props.style);
};

const scroller = () => hosts((n) => n.type === 'RCTScrollView')[0];

/** The last thing in the list's content: the room a bleed adds after the rows. */
const contentEnd = () => {
  const content = scroller().children.find((c): c is Host => typeof c !== 'string');
  const last = content?.children.at(-1);
  return typeof last === 'string' || !last ? {} : flat(last.props.style);
};

const List = ({ beforeFooter = false }: { beforeFooter?: boolean }) => (
  <ScrollArea inSheet beforeFooter={beforeFooter}>
    <Text>Last row</Text>
  </ScrollArea>
);

describe('Sheet size', () => {
  // The session's "add exercise" sheet hosts a FlashList, which has no height
  // of its own: under a cap alone it opened as its title and search, no list.
  it('gives a fill sheet its whole stop as its height', async () => {
    await open(
      <Sheet visible onClose={jest.fn()} snapPoints={['92%']} fill>
        <Text>Body</Text>
      </Sheet>,
    );
    const box = sheetBox();
    expect(box.maxHeight).toBeGreaterThan(0);
    expect(box.height).toBe(box.maxHeight);
  });

  it('only caps a content sheet, so it hugs what it holds', async () => {
    await open(
      <Sheet visible onClose={jest.fn()}>
        <Text>Body</Text>
      </Sheet>,
    );
    expect(sheetBox().height).toBeUndefined();
  });
});

describe('Sheet bottom', () => {
  afterEach(() => {
    jest.mocked(useReanimatedKeyboardAnimation).mockReturnValue({
      height: { value: 0 },
      progress: { value: 0 },
    } as never);
  });

  // Stopped at the sheet's padding, every list faded out an inset-high band
  // above the sheet's real edge, the band bare under it (Selects, the effort
  // sheet, the forms).
  it('runs its last list through the bottom safe area, the last row padded clear of the bar', async () => {
    await open(
      <Sheet visible onClose={jest.fn()}>
        <List />
      </Sheet>,
    );
    expect(sheetBox().paddingBottom).toBe(BAR);
    expect(hosts((n) => flat(n.props.style).marginBottom === -BAR)).toHaveLength(1);
    expect(contentEnd()).toEqual({ height: BAR });
  });

  it('stops a list a footer follows above the safe area, as before', async () => {
    await open(
      <Sheet visible onClose={jest.fn()}>
        <List beforeFooter />
        <Text>Footer</Text>
      </Sheet>,
    );
    expect(hosts((n) => flat(n.props.style).marginBottom === -BAR)).toHaveLength(0);
    expect(contentEnd()).not.toEqual({ height: BAR });
  });

  it('keeps the bottom fade at the keyboard once the keyboard covers the safe area', async () => {
    // The sheet tucks its bottom padding behind the keyboard: a fade left at the
    // list's own bottom would sit under the keys and the list would be cut there.
    jest.mocked(useReanimatedKeyboardAnimation).mockReturnValue({
      height: { value: -300 },
      progress: { value: 1 },
    } as never);
    await open(
      <Sheet visible onClose={jest.fn()}>
        <List />
      </Sheet>,
    );
    await fireEvent(scroller() as never, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 300 } },
    });
    await fireEvent(scroller() as never, 'contentSizeChange', 390, 900);
    const [fade] = hosts((n) => {
      const style = flat(n.props.style);
      return 'experimental_backgroundImage' in style && style.bottom === 0;
    });
    expect(flat(fade.props.style).transform).toEqual([{ translateY: -BAR }]);
  });
});

describe('Sheet and the keyboard of the screen behind it', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  // The screen behind stands back from the keyboard while this count is up: a
  // hold that never let go would leave every screen deaf to its own keyboard.
  it('holds the count until its fall ends, and lets go when unmounted mid-fall', async () => {
    jest.useFakeTimers();
    const ui = (visible: boolean) => (
      <Sheet visible={visible} onClose={() => {}}>
        <Text>Body</Text>
      </Sheet>
    );
    const { rerender, unmount } = await open(ui(true));
    expect(anySheetOpen()).toBe(true);
    await rerender(<SafeAreaProvider initialMetrics={METRICS}>{ui(false)}</SafeAreaProvider>);
    // Still falling: the sheet is on screen until the fall ends.
    expect(anySheetOpen()).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(anySheetOpen()).toBe(false);

    await rerender(<SafeAreaProvider initialMetrics={METRICS}>{ui(true)}</SafeAreaProvider>);
    await rerender(<SafeAreaProvider initialMetrics={METRICS}>{ui(false)}</SafeAreaProvider>);
    expect(anySheetOpen()).toBe(true);
    await unmount();
    expect(anySheetOpen()).toBe(false);
  });
});
