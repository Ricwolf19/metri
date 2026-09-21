import { Text, View } from 'react-native';

import { Card, EmptyState, Stat } from '@/components/ui';
import { fromKg } from '@/features/training/progression';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';

import { verdictFor, type CalendarRow } from '../calendar';
import { LEVERS, leverKey } from '../interpret';

/**
 * This week against the plan. When the week is behind, the levers come BEFORE
 * any talk of food — movement, training, sleep and stress are pulled first.
 */
export const WeightVsTargetCard = ({ row }: { row: CalendarRow | null }) => {
  const t = useT();
  const units = settings.getUnits();

  if (!row || row.actualKg == null) return <EmptyState hint={t('goal.emptyWeek')} />;

  const verdict = verdictFor(row);
  return (
    <Card>
      <View className="flex-row">
        <Stat label={t('goal.planned')} value={String(fromKg(row.targetKg, units))} unit={units} />
        <Stat
          label={t('body.weekAverage')}
          value={String(fromKg(row.actualKg, units))}
          unit={units}
        />
      </View>
      <Text className="mt-4 text-sm leading-6 text-ink-200">
        {verdict ? t(`goal.verdict.${verdict}`) : t('goal.verdict.thin')}
      </Text>
      {verdict === 'push' ? (
        <View className="mt-3 gap-1.5">
          <Text className="font-mono-medium text-[10px] uppercase tracking-wider text-ink-500">
            {t('goal.leversTitle')}
          </Text>
          {LEVERS.map((lever) => (
            <Text key={lever} className="text-xs leading-5 text-ink-400">
              · {t(leverKey(lever))}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
};
