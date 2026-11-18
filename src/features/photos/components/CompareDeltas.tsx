import { Card, Stat } from '@/components/ui';
import { siteLabelKey, type SiteId } from '@/features/body/sites';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import { deltaSiteText, deltaWeightText } from '../format';
import type { CompareDelta } from '../stats';

/**
 * What changed between the two ends of a comparison, read from the body log:
 * days between, the weekly-average weight, the key tape site. Three to a row
 * (the `Stat` rule); a side with no reading shows a dash, never a zero.
 */
export const CompareDeltas = ({
  delta,
  keySite,
  units,
}: {
  delta: CompareDelta;
  keySite: SiteId;
  units: Units;
}) => {
  const t = useT();
  return (
    <Card className="flex-row gap-3">
      <Stat label={t('compare.days')} value={`${delta.days}`} />
      <Stat label={t('compare.weight')} value={deltaWeightText(delta.kg, units) ?? '—'} />
      <Stat label={t(siteLabelKey(keySite))} value={deltaSiteText(delta.cm, units) ?? '—'} />
    </Card>
  );
};
