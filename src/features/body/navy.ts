import type { Sex } from '@/db/schema';
import { bodyFatNavy } from '@/features/calculators/math';

import type { SiteId } from './sites';

/**
 * Body fat from the tape (US Navy method), once the needed sites exist. A full
 * check-in saves it automatically (the backlog decision: computing beats manual
 * entry) — protein re-scaling with tape noise is accepted and surfaced via the
 * lean-basis notice instead of gated behind a manual step.
 */
export type NavyResult = { pct: number } | { missing: SiteId[] };

export const navyFromTape = ({
  latestCm,
  sex,
  heightCm,
}: {
  latestCm: Partial<Record<SiteId, number>>;
  sex: Sex | null;
  heightCm: number | null;
}): NavyResult | null => {
  if (!sex || !heightCm) return null;
  const needed: SiteId[] = sex === 'female' ? ['neck', 'waist', 'hips'] : ['neck', 'waist'];
  const missing = needed.filter((site) => !latestCm[site]);
  if (missing.length) return { missing };

  const pct = bodyFatNavy({
    sex,
    heightCm,
    neckCm: latestCm.neck!,
    waistCm: latestCm.waist!,
    hipCm: latestCm.hips,
  });
  return pct > 0 ? { pct } : null;
};
