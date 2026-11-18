import { describe, expect, it } from 'vitest';

import type { ProgressPose } from '@/db/schema';

import { nextTimer, poseAfterSave, recordedMs, recordingText } from './capture-flow';

describe('nextTimer', () => {
  it('cycles off → 3 → 5 → 10 → off', () => {
    expect(nextTimer(0)).toBe(3);
    expect(nextTimer(3)).toBe(5);
    expect(nextTimer(5)).toBe(10);
    expect(nextTimer(10)).toBe(0);
  });
});

describe('poseAfterSave', () => {
  const done = (...poses: ProgressPose[]) => new Set(poses);

  it('moves on in capture order', () => {
    expect(poseAfterSave(done(), 'front')).toBe('back');
    expect(poseAfterSave(done('front'), 'back')).toBe('left');
  });

  it('skips poses already in and wraps round to the ones missed', () => {
    expect(poseAfterSave(done('left', 'right'), 'back')).toBe('flex');
    expect(poseAfterSave(done('back', 'left', 'right'), 'flex')).toBe('front');
  });

  it('is null once the fifth is in, and a retake of a done pose still finds the gap', () => {
    expect(poseAfterSave(done('front', 'back', 'left', 'right'), 'flex')).toBeNull();
    expect(poseAfterSave(done('front', 'back', 'left', 'flex'), 'front')).toBe('right');
  });
});

describe('clip timing', () => {
  it('caps a clip at 15 s however late the stop lands', () => {
    expect(recordedMs(1000, 8200)).toBe(7200);
    expect(recordedMs(1000, 17_400)).toBe(15_000);
    expect(recordingText(7900)).toBe('0:07 / 0:15');
    expect(recordingText(16_000)).toBe('0:15 / 0:15');
  });
});
