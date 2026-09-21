import type { Sex } from '@/db/schema';
import { bodyFatNavy } from '@/features/calculators/math';

import type { SiteId } from './sites';

/**
 * Body fat from the tape (US Navy method), once the needed sites exist. The
 * result is only ever OFFERED — never written on its own — because saving a new
 * body-fat value re-scales protein, and targets that shift every week with
 * tape noise are worse than a slightly stale estimate.
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
