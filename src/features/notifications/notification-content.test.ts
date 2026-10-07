import { describe, expect, it } from 'vitest';

import type { ActiveRest } from '@/features/training/rest-state';
import type { ActiveSession } from '@/features/training/session-state';

import { notificationContent, notificationMode, workoutUrl } from './notification-content';

const session: ActiveSession = {
  workoutId: 'w1',
  startedAt: 1_000,
  title: 'Training in progress',
  next: {
    slotId: 'slot-b',
    exerciseName: 'Bench press',
    setLabel: 'Set 3/4',
    targetLabel: 'Target: 8–10 reps @ RIR 2',
    weightLabel: '80 kg',
  },
  doneLabel: 'All planned sets done',
};

const rest: ActiveRest = {
  workoutId: 'w1',
  slotId: 'slot-b',
  startedAt: 5_000,
  endsAt: 95_000,
  copy: {
    restingTitle: 'Resting',
    overTitle: 'Rest over',
    skipLabel: 'Skip',
    readyLabel: 'Ready',
    plus30Label: '+30 s',
    plus60Label: '+1 min',
  },
};

describe('notificationMode', () => {
  it('is training with no rest, rest while the clock has not reached the end, then over', () => {
    expect(notificationMode(null, 50_000)).toBe('training');
    expect(notificationMode(rest, 50_000)).toBe('rest');
    expect(notificationMode(rest, 95_000)).toBe('restOver');
  });
});

describe('notificationContent', () => {
  it('training: next set under the session clock, no actions, never re-alerts', () => {
    const c = notificationContent(session, null, 'training');
    expect(c).toMatchObject({
      mode: 'training',
      title: 'Training in progress',
      body: 'Bench press · Set 3/4',
      lines: ['Bench press · Set 3/4', 'Target: 8–10 reps @ RIR 2 · 80 kg'],
      chronometer: { direction: 'up', timestamp: 1_000 },
      actions: [],
      alertOnce: true,
    });
  });

  it('rest: same next set, countdown to the end, three actions', () => {
    const c = notificationContent(session, rest, 'rest');
    expect(c).toMatchObject({
      mode: 'rest',
      title: 'Resting',
      lines: ['Bench press · Set 3/4', 'Target: 8–10 reps @ RIR 2 · 80 kg'],
      chronometer: { direction: 'down', timestamp: 95_000 },
      alertOnce: true,
    });
    expect(c?.actions.map((a) => [a.id, a.title])).toEqual([
      ['rest-skip', 'Skip'],
      ['rest-plus-30', '+30 s'],
      ['rest-plus-60', '+1 min'],
    ]);
  });

  it('rest over: Ready + 30 s, counts the overrun, and this redraw alerts', () => {
    const c = notificationContent(session, rest, 'restOver');
    expect(c).toMatchObject({
      mode: 'restOver',
      title: 'Rest over',
      chronometer: { direction: 'up', timestamp: 95_000 },
      alertOnce: false,
    });
    expect(c?.actions.map((a) => [a.id, a.title])).toEqual([
      ['rest-skip', 'Ready'],
      ['rest-plus-30', '+30 s'],
    ]);
  });

  it('deep-links to the next set’s card', () => {
    expect(notificationContent(session, null, 'training')?.url).toBe(workoutUrl('w1', 'slot-b'));
    expect(workoutUrl('w1')).toBe('metri://training/workout/w1');
  });

  it('says the plan is done once nothing is next', () => {
    const c = notificationContent({ ...session, next: null }, null, 'training');
    expect(c?.lines).toEqual(['All planned sets done']);
    expect(c?.body).toBe('All planned sets done');
  });

  it('draws a record from an older build (no `next`) as title and clock only', () => {
    const legacy = { workoutId: 'w1', startedAt: 1_000, title: 'Training in progress' };
    const c = notificationContent(legacy, null, 'training');
    expect(c).toMatchObject({ lines: [], body: '', chronometer: { direction: 'up' } });
  });

  it('falls back to the rest alone for the trigger when no session is recorded', () => {
    const c = notificationContent(null, rest, 'restOver');
    expect(c).toMatchObject({ title: 'Rest over', lines: [], url: workoutUrl('w1', 'slot-b') });
    expect(notificationContent(null, null, 'training')).toBeNull();
  });

  it('shows the training face when asked for a rest face without a rest', () => {
    expect(notificationContent(session, null, 'rest')?.mode).toBe('training');
  });
});
