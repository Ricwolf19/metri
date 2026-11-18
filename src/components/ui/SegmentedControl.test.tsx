import { describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/render';

import { SegmentedControl } from './SegmentedControl';

jest.mock('@/lib/haptics', () => ({ haptic: jest.fn() }));

const segments = [
  { value: 'photo' as const, label: 'Photo' },
  { value: 'video' as const, label: 'Clip' },
];

/** The nearest host view above a segment that says whether it may collapse. */
const trackOf = (label: string) => {
  let node = screen.getByRole('button', { name: label }).parent;
  while (node && node.props.collapsable === undefined) node = node.parent;
  return node;
};

describe('SegmentedControl', () => {
  // The progress camera crashed ("The specified child already has a parent")
  // when this track's dimming flipped in the same commit as the Retake/Use swap:
  // an opacity of 1 lets Fabric re-host the segments in the track's parent.
  it('keeps its track a view of its own whether dimmed or not', async () => {
    for (const disabled of [true, false]) {
      await renderWithProviders(
        <SegmentedControl
          segments={segments}
          value="photo"
          onChange={jest.fn()}
          disabled={disabled}
        />,
      );
      expect(trackOf('Photo')?.props.collapsable).toBe(false);
      expect(trackOf('Clip')).toBe(trackOf('Photo'));
    }
  });
});
