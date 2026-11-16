import { Text, View } from 'react-native';

import { Button, Card, useDialog, useToast } from '@/components/ui';
import type { BodyGoal } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';

import { refreshGoalTargets } from '../body-goals.repo';
import { refreshedTargets } from '../targets';

/**
 * Offers to re-plan a running phase once the maintenance estimate it was
 * planned on has moved — a re-run TDEE, or a check-in that refreshed it. A
 * phase freezes those inputs on purpose, so this asks and never applies
 * itself; nothing renders while the change is under one adjustment step.
 */
export const TargetsRefreshCard = ({
  goal,
  weightKg,
}: {
  goal: BodyGoal;
  weightKg: number | null;
}) => {
  const t = useT();
  const dialog = useDialog();
  const toast = useToast();
  const { user } = useAuth();
  if (!user || user.tdee == null) return null;
  const tdee = user.tdee;
  const next = refreshedTargets(goal, {
    tdee,
    bmr: user.bmr,
    sex: user.sex ?? null,
    weightKg,
    bodyFatPct: user.bodyFatPct,
  });
  if (!next) return null;

  const onRefresh = () =>
    dialog.confirm({
      title: t('goal.refreshTitle'),
      message: t('goal.refreshDetail', {
        kcal: next.kcal,
        protein: next.proteinG,
        carbs: next.carbsG,
        fat: next.fatG,
      }),
      confirmLabel: t('goal.refreshCta'),
      onConfirm: () => {
        refreshGoalTargets(goal.id, next, { tdee, bodyFatPct: user.bodyFatPct });
        toast.success(t('goal.refreshed'));
      },
    });

  return (
    <Card className="mt-3 border-amber-500/40">
      <Text className="text-sm font-sans-semibold text-ink-50">{t('goal.refreshTitle')}</Text>
      <Text className="mt-1 text-sm leading-6 text-ink-300">
        {goal.tdeeAtStart != null
          ? t('goal.refreshBody', {
              from: Math.round(goal.tdeeAtStart),
              to: Math.round(tdee),
              now: Math.round(goal.targetKcal),
              kcal: next.kcal,
            })
          : t('goal.refreshBodyNew', { to: Math.round(tdee), kcal: next.kcal })}
      </Text>
      <View className="mt-3">
        <Button size="sm" fullWidth={false} label={t('goal.refreshCta')} onPress={onRefresh} />
      </View>
    </Card>
  );
};
