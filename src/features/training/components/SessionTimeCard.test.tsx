import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react-native';

import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import type { SessionTiming } from '../session-timing';
import { SessionTimeCard } from './SessionTimeCard';

const timing = (over: Partial<SessionTiming> = {}): SessionTiming => ({
  totalSeconds: 60 * 60,
  reliable: true,
  batchedSets: 0,
  liftingSeconds: 12 * 60,
  restSeconds: 30 * 60,
  setupSeconds: 6 * 60,
  idleSeconds: 12 * 60,
  idleShare: 0.2,
  leadInSeconds: 8 * 60,
  rest: { takenSeconds: 160, plannedSeconds: 120, measured: 10, versus: 'longer' },
  longestPause: { exerciseId: 'squat', setNumber: 3, seconds: 9 * 60 },
  verdict: 'someIdle',
  ...over,
});

const nameOf = (id: string) => (id === 'squat' ? 'Back Squat' : id);

describe('SessionTimeCard', () => {
  it('names and times every part in words, never by colour alone', async () => {
    settings.setLocale('en');
    await renderWithProviders(<SessionTimeCard timing={timing()} nameOf={nameOf} />);
    expect(screen.getByText('1h 00m in total')).toBeTruthy();
    // Each legend row is one element for a screen reader: the part, its time and its share.
    expect(screen.getByLabelText('Lifting: 12m · 20 %')).toBeTruthy();
    expect(screen.getByLabelText('Rest: 30m · 50 %')).toBeTruthy();
    expect(screen.getByLabelText('Setup: 6m · 10 %')).toBeTruthy();
    expect(screen.getByLabelText('Idle: 12m · 20 %')).toBeTruthy();
    expect(screen.getByText('About 20 % of the session went unused between sets.')).toBeTruthy();
    expect(screen.getByText('Longest pause: 9m before Back Squat, set 3.')).toBeTruthy();
    expect(screen.getByText('Rests ran long: 2:40 on average against 2:00 planned.')).toBeTruthy();
  });

  it('sets logged in bursts: the total, the timed rests and why — no split, no verdict', async () => {
    settings.setLocale('en');
    await renderWithProviders(
      <SessionTimeCard
        timing={timing({
          reliable: false,
          batchedSets: 6,
          verdict: null,
          longestPause: null,
          rest: { takenSeconds: 125, plannedSeconds: 120, measured: 4, versus: 'onPlan' },
        })}
        nameOf={nameOf}
      />,
    );
    expect(screen.getByText('1h 00m in total')).toBeTruthy();
    expect(screen.getByText(/logged seconds apart/)).toBeTruthy();
    expect(screen.queryByLabelText(/^Idle:/)).toBeNull();
    expect(screen.queryByText(/went unused/)).toBeNull();
    expect(screen.queryByText(/Longest pause/)).toBeNull();
    expect(screen.getByText('Rests matched the plan: 2:05 on average, 2:00 planned.')).toBeTruthy();
  });

  it('without a timed rest it says what the plan rests and that none was timed', async () => {
    settings.setLocale('en');
    await renderWithProviders(
      <SessionTimeCard
        timing={timing({
          rest: { takenSeconds: null, plannedSeconds: 150, measured: 0, versus: null },
        })}
        nameOf={nameOf}
      />,
    );
    expect(
      screen.getByText('Planned rest averages 2:30; none was timed this session.'),
    ).toBeTruthy();
  });
});
