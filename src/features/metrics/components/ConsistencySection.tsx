import { SectionLabel } from '@/components/ui';
import { TrainingCalendar } from '@/features/training/components/TrainingCalendar';
import { useT } from '@/i18n';

import type { MetricsSectionProps } from '../sections';

/** The month grid of trained / rest / missed days. */
export const ConsistencySection = ({ headerRight }: MetricsSectionProps) => {
  const t = useT();
  return (
    <>
      <SectionLabel label={t('adherence.section')} right={headerRight} className="mt-0" />
      <TrainingCalendar />
    </>
  );
};
