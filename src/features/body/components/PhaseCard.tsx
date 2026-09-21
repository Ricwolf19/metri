import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, Card, HoldButton, Stat, useToast } from '@/components/ui';
import type { BodyGoal } from '@/db/schema';
import { fromKg } from '@/features/training/progression';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';

import { endGoal } from '../body-goals.repo';

type Props = { goal: BodyGoal; currentWeek: number };

/** The running phase: what it is, how fast, how far in — and the targets it set. */
export const PhaseCard = ({ goal, currentWeek }: Props) => {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const units = settings.getUnits();
  const week = Math.min(goal.durationWeeks, currentWeek + 1);

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-sans-bold text-ink-50">{t(`goal.phase.${goal.phase}`)}</Text>
        <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('goal.weekOf', { n: week, total: goal.durationWeeks })}
        </Text>
      </View>
      {goal.rateKgPerWeek !== 0 ? (
        <Text className="mt-1 text-sm text-ink-400">
          {t(goal.rateKgPerWeek < 0 ? 'goal.losing' : 'goal.gaining', {
            n: fromKg(Math.abs(goal.rateKgPerWeek), units),
            unit: units,
          })}
        </Text>
      ) : (
        <Text className="mt-1 text-sm text-ink-400">{t('goal.holding')}</Text>
      )}

      <View className="mt-5 flex-row">
        <Stat label={t('goal.kcal')} value={String(Math.round(goal.targetKcal))} />
        <Stat label={t('goal.protein')} value={String(Math.round(goal.proteinG))} unit="g" />
      </View>
      <View className="mt-4 flex-row">
        <Stat label={t('goal.carbs')} value={String(Math.round(goal.carbsG))} unit="g" />
        <Stat label={t('goal.fat')} value={String(Math.round(goal.fatG))} unit="g" />
      </View>
      <Text className="mt-4 text-xs leading-5 text-ink-500">{t('goal.carbsLever')}</Text>

      <View className="mt-5 gap-2">
        <Button
          label={t('goal.openCalendar')}
          variant="secondary"
          onPress={() => router.push('/body/calendar')}
        />
        <HoldButton
          label={t('goal.end')}
          onComplete={() => {
            endGoal(goal.id);
            toast.info(t('goal.ended'));
          }}
        />
      </View>
    </Card>
  );
};
