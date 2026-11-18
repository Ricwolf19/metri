import { describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/render';

import type { ProgressShareModel } from '../share-model';
import { ProgressShareCard } from './ProgressShareCard';

// `media` binds the file system, the image manipulator and the video player at import.
jest.mock('../media', () => ({ mediaUri: (stored: string) => stored }));
// Jest has no SVG transformer (the mark's asset imports as a plain object): the mark draws nothing here.
jest.mock('@/components/ui/BrandMark', () => ({ BrandMark: () => null }));

const model: ProgressShareModel = {
  template: 'pair',
  eyebrow: 'Progress · Front',
  title: '12 Aug → 4 Nov',
  panels: [],
  chips: [
    { label: 'Weight', value: '−6.2 kg', detail: null },
    { label: 'Time', value: '84 days', detail: null },
  ],
};

const show = (look: 'frame' | 'clean') =>
  renderWithProviders(
    <ProgressShareCard
      model={model}
      format="post"
      look={look}
      showDates
      faceBand={null}
      footer="metri.info · open source"
    />,
  );

describe('ProgressShareCard', () => {
  it('frames the photos with the mark, the title and a tile per number', async () => {
    await show('frame');
    expect(screen.getByText('Metri')).toBeOnTheScreen();
    expect(screen.getByText('12 Aug → 4 Nov')).toBeOnTheScreen();
    expect(screen.getByText('−6.2 kg')).toBeOnTheScreen();
    expect(screen.getByText('metri.info · open source')).toBeOnTheScreen();
  });

  it('exports clean: no mark, no title, the numbers on one line', async () => {
    await show('clean');
    expect(screen.queryByText('Metri')).toBeNull();
    expect(screen.queryByText('12 Aug → 4 Nov')).toBeNull();
    expect(screen.queryByText('metri.info · open source')).toBeNull();
    expect(screen.getByText('−6.2 kg   ·   84 days')).toBeOnTheScreen();
  });
});
