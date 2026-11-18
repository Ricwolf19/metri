import { beforeEach, describe, expect, it, vi } from 'vitest';

type Bucket = { startTime: string; result: Record<string, unknown> };

const h = vi.hoisted(() => ({
  byPeriod: vi.fn<(req: { recordType: string }) => Promise<Bucket[]>>(),
  byDuration: vi.fn<(req: { timeRangeFilter: { startTime: string } }) => Promise<Bucket[]>>(),
  captured: [] as unknown[],
}));

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('react-native-health-connect', () => ({
  aggregateGroupByPeriod: h.byPeriod,
  aggregateGroupByDuration: h.byDuration,
  SdkAvailabilityStatus: {},
}));
vi.mock('@/lib/open-external', () => ({ openExternal: () => {} }));
vi.mock('@/lib/telemetry', () => ({ captureError: (e: unknown) => h.captured.push(e) }));

const { isExpectedRefusal, readHealthDays } = await import('./health-connect');

const NOW = new Date(2026, 10, 17, 9, 30);

beforeEach(() => {
  h.captured = [];
  h.byPeriod.mockReset();
  h.byDuration.mockReset().mockResolvedValue([]);
});

describe('readHealthDays', () => {
  // One try around every read: a steps read that threw blanked energy and sleep too.
  it('keeps the other reads when one of them fails', async () => {
    h.byPeriod.mockImplementation(async ({ recordType }) => {
      if (recordType === 'Steps') throw new Error('quota');
      return [
        {
          startTime: '2026-11-17T00:00',
          result: { ACTIVE_CALORIES_TOTAL: { inKilocalories: 312 } },
        },
      ];
    });
    h.byDuration.mockResolvedValue([
      // The night of the 16th → 17th, read 18:00 to 18:00.
      {
        startTime: new Date(2026, 10, 16, 18).toISOString(),
        result: { SLEEP_DURATION_TOTAL: 25_200 },
      },
    ]);
    const days = await readHealthDays(['steps', 'activeEnergy', 'sleep'], 2, NOW);
    expect(days).toEqual([
      { day: '2026-11-16', steps: null, activeKcal: null, sleepMin: null },
      { day: '2026-11-17', steps: null, activeKcal: 312, sleepMin: 420 },
    ]);
    expect(h.captured).toHaveLength(1);
  });

  // 24 h back from a local midnight lands a day early when that day had 23 h:
  // New York springs forward on 8 Mar 2026, and the first night started on the 7th.
  it('starts the first night at 18:00 the evening before, by the calendar', async () => {
    const tz = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
      await readHealthDays(['sleep'], 2, new Date(2026, 2, 10, 9));
      expect(h.byDuration.mock.calls[0][0].timeRangeFilter.startTime).toBe(
        new Date(2026, 2, 8, 18).toISOString(),
      );
    } finally {
      if (tz === undefined) delete process.env.TZ;
      else process.env.TZ = tz;
    }
  });
});

/** The library rejects with the Kotlin exception's message and a `code`. */
const rejection = (code: string, message: string) => Object.assign(new Error(message), { code });

describe('isExpectedRefusal', () => {
  it('reads a spent quota and a revoked grant as answers, not defects', () => {
    expect(
      isExpectedRefusal(
        rejection('UNDERLYING_ERROR', 'Rate limited request quota has been exceeded.'),
      ),
    ).toBe(true);
    expect(isExpectedRefusal(rejection('PERMISSION_ERROR', 'Caller has no permission'))).toBe(true);
    expect(isExpectedRefusal(rejection('UNDERLYING_ERROR', 'Binder died'))).toBe(false);
    expect(isExpectedRefusal(new Error('quota'))).toBe(false);
  });

  it('keeps a spent quota out of telemetry', async () => {
    h.byPeriod.mockRejectedValue(
      rejection('UNDERLYING_ERROR', 'Rate limited request quota has been exceeded.'),
    );
    await readHealthDays(['steps'], 2, NOW);
    expect(h.captured).toEqual([]);
  });
});
