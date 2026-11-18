import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  available: vi.fn(async () => true),
  share: vi.fn(async (_uri: string, _options: unknown) => {}),
  captureError: vi.fn(),
}));
vi.mock('expo-sharing', () => ({
  isAvailableAsync: mocks.available,
  shareAsync: mocks.share,
}));
vi.mock('./telemetry', () => ({ captureError: mocks.captureError }));

const { shareFailed, shareFile } = await import('./share-file');

describe('shareFile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hands the file over with its type', async () => {
    expect(await shareFile('file:///c/a.pdf', 'pdf', 'Title')).toBe('shared');
    expect(mocks.share).toHaveBeenCalledWith('file:///c/a.pdf', {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Title',
    });
  });

  it('types a clip by its file', async () => {
    await shareFile('file:///c/a.mov', 'video', 'Clip');
    expect(mocks.share.mock.calls[0][1]).toMatchObject({ mimeType: 'video/quicktime' });
  });

  it('reads a dismissed sheet as an answer, never a failure or a report', async () => {
    mocks.share.mockRejectedValueOnce(new Error('User did cancel'));
    const outcome = await shareFile('file:///c/a.png', 'png', 'Card');
    expect(outcome).toBe('dismissed');
    expect(shareFailed(outcome)).toBe(false);
    expect(mocks.captureError).not.toHaveBeenCalled();
  });

  it('reports a real failure, and a phone that cannot share', async () => {
    mocks.share.mockRejectedValueOnce(new Error('boom'));
    expect(await shareFile('file:///c/a.png', 'png', 'Card')).toBe('failed');
    expect(mocks.captureError).toHaveBeenCalledTimes(1);
    mocks.available.mockResolvedValueOnce(false);
    const outcome = await shareFile('file:///c/a.png', 'png', 'Card');
    expect(outcome).toBe('unavailable');
    expect(shareFailed(outcome)).toBe(true);
    expect(shareFailed(null)).toBe(false);
  });
});
