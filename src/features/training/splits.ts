/**
 * Split scaffolds — the day templates offered when building a routine. "Split"
 * = how many training days per rotation (3/4/5); each entry seeds an empty,
 * renamable day with sensible focus muscles. Exercises are added by the user.
 */

export type SplitSize = 3 | 4 | 5;
export type SplitDaySeed = { name: string; focusMuscles: string[] };

export const SPLIT_SIZES: SplitSize[] = [3, 4, 5];

export const SPLIT_SCAFFOLDS: Record<SplitSize, SplitDaySeed[]> = {
  3: [
    { name: 'Push', focusMuscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Pull', focusMuscles: ['back', 'biceps'] },
    { name: 'Legs', focusMuscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  ],
  4: [
    { name: 'Upper A', focusMuscles: ['chest', 'back', 'shoulders'] },
    { name: 'Lower A', focusMuscles: ['quads', 'glutes', 'calves'] },
    { name: 'Upper B', focusMuscles: ['back', 'shoulders', 'arms'] },
    { name: 'Lower B', focusMuscles: ['hamstrings', 'glutes', 'calves'] },
  ],
  5: [
    { name: 'Push', focusMuscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Pull', focusMuscles: ['back', 'biceps'] },
    { name: 'Legs', focusMuscles: ['quads', 'hamstrings', 'glutes'] },
    { name: 'Upper', focusMuscles: ['chest', 'back', 'shoulders'] },
    { name: 'Lower', focusMuscles: ['quads', 'hamstrings', 'calves'] },
  ],
};
