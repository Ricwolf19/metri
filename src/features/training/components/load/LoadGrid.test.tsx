import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import { LoadGrid } from './LoadGrid';

// 2.5 … 75 kg: thirty dumbbells, six rows of five.
const RACK = Array.from({ length: 30 }, (_, i) => (i + 1) * 2.5);

/** The grid as the sheet holds it: the pick and the open state live above it. */
const Picker = ({ loads = RACK, pick }: { loads?: number[]; pick: number | null }) => {
  const [selected, setSelected] = useState(pick);
  const [expanded, setExpanded] = useState(false);
  return (
    <LoadGrid
      loads={loads}
      unit="kg"
      selected={selected}
      onSelect={setSelected}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  );
};

const pill = (kg: number) => screen.queryByRole('button', { name: `${kg} kg` });
const scrollTo = ScrollView.prototype.scrollTo as jest.Mock;
/** The folded window, laid out: the first content layout puts it on the pick. */
const layOut = async () => {
  await fireEvent(screen.getByTestId('load-grid-window'), 'contentSizeChange', 300, 306);
};
/** The window as the lifter left it, scrolled to `y` (51 dp a row: 44 and a 7 dp gap). */
const scrollWindow = async (y: number) => {
  await fireEvent.scroll(screen.getByTestId('load-grid-window'), {
    nativeEvent: {
      contentOffset: { x: 0, y },
      layoutMeasurement: { width: 300, height: 153 },
      contentSize: { width: 300, height: 306 },
    },
  });
};

describe('LoadGrid', () => {
  beforeEach(() => {
    settings.setLocale('en');
    scrollTo.mockClear();
  });

  it('folds a long grid into a window that scrolls through every load', async () => {
    await renderWithProviders(<Picker pick={12} />);
    expect(screen.getByTestId('load-grid-window')).toBeTruthy();
    // Every load is there to flick to and pick: none is drawn dead under a fade.
    expect(pill(2.5)).toBeTruthy();
    expect(pill(75)).toBeTruthy();
    expect(screen.getByRole('button', { name: '32.5 kg', selected: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Show more', expanded: false })).toBeTruthy();
  });

  it('opens on the rows around the pick, half the row before peeking in', async () => {
    // 32.5 kg is index 12: rows 2–3 in view, scrolled to 102 − 22 − 7.
    await renderWithProviders(<Picker pick={12} />);
    await layOut();
    expect(scrollTo).toHaveBeenCalledWith({ y: 73, animated: false });
  });

  it('opens on the load nearest the number when nothing is picked', async () => {
    await renderWithProviders(
      <LoadGrid
        loads={RACK}
        unit="kg"
        selected={null}
        near={61}
        onSelect={() => {}}
        expanded={false}
        onExpandedChange={() => {}}
      />,
    );
    await layOut();
    // 60 kg (index 23) sits in rows 4–5: 204 − 29.
    expect(scrollTo).toHaveBeenCalledWith({ y: 175, animated: false });
  });

  it('keeps the window still when a pill in sight is tapped', async () => {
    await renderWithProviders(<Picker pick={12} />);
    await layOut();
    await scrollWindow(73);
    scrollTo.mockClear();
    await fireEvent.press(screen.getByRole('button', { name: '50 kg' }));
    expect(screen.getByRole('button', { name: '50 kg', selected: true })).toBeTruthy();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('follows a pick made outside the window', async () => {
    const grid = (selected: number) => (
      <LoadGrid
        loads={RACK}
        unit="kg"
        selected={selected}
        onSelect={() => {}}
        expanded={false}
        onExpandedChange={() => {}}
      />
    );
    const { rerender } = await renderWithProviders(grid(12));
    await layOut();
    await scrollWindow(73);
    scrollTo.mockClear();
    // 72.5 kg (index 28, row 5) is out of sight: the window scrolls to rows 4–5.
    await rerender(grid(28));
    expect(scrollTo).toHaveBeenCalledWith({ y: 175, animated: true });
  });

  it('lays every load out behind Show more and folds back onto the pick', async () => {
    await renderWithProviders(<Picker pick={12} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.queryByTestId('load-grid-window')).toBeNull();
    expect(pill(2.5)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: '70 kg' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Show less', expanded: true }));
    await layOut();
    // Folded again on the new pick (index 27, rows 4–5).
    expect(screen.getByRole('button', { name: '70 kg', selected: true })).toBeTruthy();
    expect(scrollTo).toHaveBeenCalledWith({ y: 175, animated: false });
  });

  it('draws a short grid whole, with nothing to show more of', async () => {
    await renderWithProviders(<Picker loads={RACK.slice(0, 15)} pick={null} />);
    expect(screen.queryByTestId('load-grid-window')).toBeNull();
    expect(pill(2.5)).toBeTruthy();
    expect(pill(37.5)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull();
  });
});
