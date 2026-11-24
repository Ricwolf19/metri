import { describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/render';

import { ShareCard } from './ShareCard';

// Jest has no SVG transformer (the mark's asset imports as a plain object): the mark draws nothing here.
jest.mock('@/components/ui/BrandMark', () => ({ BrandMark: () => null }));

const card = (
  <ShareCard
    eyebrow="Workout complete"
    title="Upper A"
    subtitle="Week 3"
    highlight={{
      label: 'Top exercise',
      title: 'Barbell Bench Press',
      detail: '102.5×5 kg',
      note: 'Estimated 1RM +4.2 % vs last time',
    }}
    metrics={[
      { label: 'Duration', value: '1h 05m' },
      { label: 'Volume', value: '5400 kg' },
      { label: 'Sets', value: '18' },
      { label: 'Records', value: '2' },
    ]}
    rows={[{ name: 'Barbell Bench Press', detail: '102.5×5 kg', pr: true }]}
    footer="metri.info · open source"
  />
);

describe('ShareCard', () => {
  it('heads the session with its top exercise, why, and the four stats', async () => {
    await renderWithProviders(card);
    expect(screen.getByText('★ Top exercise')).toBeOnTheScreen();
    expect(screen.getByText('Estimated 1RM +4.2 % vs last time')).toBeOnTheScreen();
    for (const value of ['1h 05m', '5400 kg', '18', '2']) {
      expect(screen.getByText(value)).toBeOnTheScreen();
    }
  });

  it('never scales its text with the phone: it is a fixed-size image', async () => {
    await renderWithProviders(card);
    // Every text the card draws, the empty PR column aside.
    const texts = screen.getAllByText(/./);
    expect(texts.length).toBeGreaterThan(10);
    expect(texts.filter((node) => node.props.allowFontScaling !== false)).toEqual([]);
  });
});
