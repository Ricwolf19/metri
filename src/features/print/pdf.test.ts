import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ print: vi.fn(async () => {}), captureError: vi.fn() }));
vi.mock('expo-print', () => ({ printAsync: mocks.print }));
vi.mock('expo-file-system/legacy', () => ({}));
vi.mock('@/lib/telemetry', () => ({ captureError: mocks.captureError }));

const { printDocument } = await import('./pdf');

describe('printDocument', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads a closed dialog as an answer', async () => {
    mocks.print.mockRejectedValueOnce(new Error('Printing did not complete'));
    expect(await printDocument('<p/>')).toBe('dismissed');
    mocks.print.mockRejectedValueOnce(new Error('Printer picker has been cancelled'));
    expect(await printDocument('<p/>')).toBe('dismissed');
    expect(mocks.captureError).not.toHaveBeenCalled();
  });

  it('reports a print that could not happen', async () => {
    mocks.print.mockRejectedValueOnce(new Error('PdfNotRendered'));
    expect(await printDocument('<p/>')).toBe('failed');
    expect(mocks.captureError).toHaveBeenCalledTimes(1);
    expect(await printDocument('<p/>')).toBe('printed');
  });
});
