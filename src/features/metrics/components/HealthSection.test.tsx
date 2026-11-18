import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import type { HealthState } from '@/features/health/useHealthData';
import { settings } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';

import { HealthSection } from './HealthSection';

// Jest hoists `jest.mock` above the imports: only `mock`-prefixed names may be
// captured by a factory, and only read lazily (inside the returned functions).
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  ...jest.requireActual<object>('expo-router'),
  useRouter: () => ({ push: mockPush }),
}));

// The section is a view over the hook; the native module never loads here.
const mockInstall = jest.fn();
jest.mock('@/features/health/health-connect', () => ({
  installHealthProvider: () => mockInstall(),
  openHealthSettings: jest.fn(),
}));
const mockConnect = jest.fn();
let mockState: HealthState = { phase: 'loading' };
jest.mock('@/features/health/useHealthData', () => ({
  useHealthData: () => ({ state: mockState, connect: mockConnect, disconnect: jest.fn() }),
}));

const show = async (next: HealthState) => {
  mockState = next;
  await renderWithProviders(<HealthSection />);
};

describe('HealthSection', () => {
  beforeEach(() => {
    settings.setLocale('en');
    jest.clearAllMocks();
  });

  it('asks to connect while nothing is granted', async () => {
    await show({ phase: 'off' });
    expect(screen.getByText('Bring in your steps, active energy and sleep')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Connect Health Connect'));
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('sends a phone without the provider to install it', async () => {
    await show({ phase: 'needsProvider' });
    await fireEvent.press(screen.getByText('Get Health Connect'));
    expect(mockInstall).toHaveBeenCalledTimes(1);
  });

  it('shows today, last night and the week, and names what was not shared', async () => {
    await show({
      phase: 'ready',
      granted: ['steps', 'sleep'],
      summary: {
        today: { steps: 4200, activeKcal: null },
        lastNightSleepMin: 445,
        average: { steps: 8100, activeKcal: null, sleepMin: 420 },
      },
    });
    expect(screen.getByText('4.2k')).toBeOnTheScreen();
    expect(screen.getByText('7:25')).toBeOnTheScreen();
    expect(screen.getByText('7-day average: 8.1k steps · 7:00 h sleep')).toBeOnTheScreen();
    expect(
      screen.getByText('Not shared: active energy. Allow it under Manage access.'),
    ).toBeOnTheScreen();
  });

  it('always points weight and body fat to the check-in', async () => {
    await show({ phase: 'unavailable' });
    await fireEvent.press(screen.getByText('Open check-in'));
    expect(mockPush).toHaveBeenCalledWith('/body/checkin');
  });
});
