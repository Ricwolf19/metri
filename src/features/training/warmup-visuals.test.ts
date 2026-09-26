import { describe, expect, it } from 'vitest';

import { WARMUP_COPY } from './warmup-content';
import { warmupVisualFor } from './warmup-visuals';

describe('warmupVisualFor', () => {
  it('resolves a step in either language to the same demo', () => {
    expect(warmupVisualFor('Glute bridge')).toBe('glute-bridge');
    expect(warmupVisualFor('Puente de glúteo')).toBe('glute-bridge');
    expect(warmupVisualFor('  puente de gluteo ')).toBe('glute-bridge');
  });

  it('leaves steps with no faithful demo text-only', () => {
    expect(warmupVisualFor('90/90 hip switch')).toBeNull();
    expect(warmupVisualFor('Something the lifter invented')).toBeNull();
  });

  // The EN/ES copies pair by position — if one drifts, the ES demo would
  // silently land on the wrong step.
  it('pairs every EN step with an ES step that resolves to the same demo', () => {
    for (const [id, en] of Object.entries(WARMUP_COPY.en)) {
      const es = WARMUP_COPY.es[id as keyof typeof WARMUP_COPY.es];
      expect(es.steps).toHaveLength(en.steps.length);
      en.steps.forEach((step, i) => {
        expect(warmupVisualFor(es.steps[i].name)).toBe(warmupVisualFor(step.name));
      });
    }
  });

  it('gives most shipped steps a demo', () => {
    const steps = Object.values(WARMUP_COPY.en).flatMap((r) => r.steps);
    const covered = steps.filter((s) => warmupVisualFor(s.name)).length;
    expect(covered / steps.length).toBeGreaterThan(0.5);
  });
});
