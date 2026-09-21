import { Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { useT } from '@/i18n';

import { progress, type Totals } from '../diary';

type Targets = { kcal: number; proteinG: number; carbsG: number; fatG: number } | null;

const Bar = ({ label, value, target }: { label: string; value: number; target: number | null }) => (
  <View className="flex-1">
    <View className="flex-row items-baseline justify-between">
      <Text className="font-mono-medium text-[10px] uppercase tracking-wider text-ink-400">
        {label}
      </Text>
      <Text className="text-[11px] text-ink-300">
        {Math.round(value)}
        {target ? ` / ${Math.round(target)}` : ''} g
      </Text>
    </View>
    <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700">
      <View
        className="h-full rounded-full bg-brand"
        style={{ width: `${progress(value, target) * 100}%` }}
      />
    </View>
  </View>
);

/**
 * The day so far against the phase's targets. Deliberately no red: going over
 * on one day is not a failure, and the number that gets judged is the weekly
 * average. With no phase set the totals still show, just without targets.
 */
export const DayTotalsCard = ({ totals, targets }: { totals: Totals; targets: Targets }) => {
  const t = useT();
  const left = targets ? Math.round(targets.kcal - totals.kcal) : null;

  return (
    <Card>
      <View className="flex-row items-baseline justify-between">
        <View className="flex-row items-baseline">
          <Text className="text-3xl font-sans-bold text-ink-50">{Math.round(totals.kcal)}</Text>
          <Text className="ml-1.5 text-sm text-ink-400">
            {targets ? `/ ${Math.round(targets.kcal)} kcal` : 'kcal'}
          </Text>
        </View>
        {left != null ? (
          <Text className="text-xs text-ink-400">
            {left >= 0 ? t('diary.left', { n: left }) : t('diary.over', { n: -left })}
          </Text>
        ) : null}
      </View>
      <View className="mt-3 h-2 overflow-hidden rounded-full bg-ink-700">
        <View
          className="h-full rounded-full bg-brand"
          style={{ width: `${progress(totals.kcal, targets?.kcal) * 100}%` }}
        />
      </View>
      <View className="mt-4 flex-row gap-4">
        <Bar label={t('goal.protein')} value={totals.proteinG} target={targets?.proteinG ?? null} />
        <Bar label={t('goal.carbs')} value={totals.carbsG} target={targets?.carbsG ?? null} />
        <Bar label={t('goal.fat')} value={totals.fatG} target={targets?.fatG ?? null} />
      </View>
    </Card>
  );
};
