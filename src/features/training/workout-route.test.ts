import { describe, expect, it } from 'vitest';

import { workoutScreenId } from './workout-route';

describe('workoutScreenId', () => {
  it('resolves every entry point for one workout to the same screen', () => {
    const fromTab = workoutScreenId({ id: 'w1' });
    const fromNotification = workoutScreenId({ id: 'w1', slot: 's3' });
    expect(fromTab).toBe(fromNotification);
  });

  it('keeps different workouts apart', () => {
    expect(workoutScreenId({ id: 'w1' })).not.toBe(workoutScreenId({ id: 'w2' }));
  });

  it('falls back to the default identity without an id', () => {
    expect(workoutScreenId({})).toBeUndefined();
    expect(workoutScreenId({ id: '' })).toBeUndefined();
  });
});
