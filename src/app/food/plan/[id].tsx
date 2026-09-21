import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, Screen, SectionLabel, Stat, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { addMealEntries } from '@/features/nutrition/food-log.repo';
import { mealIngredients, mealName, mealTotals } from '@/features/nutrition/meals';
import {
  planById,
  planDescription,
  planMeals,
  planName,
  planTotals,
} from '@/features/nutrition/plans';
import { useI18n, useT } from '@/i18n';
import { useTodayKey } from '@/lib/useTodayKey';
import { useTheme } from '@/theme/theme-context';

/** A day plan: its meals, what the day adds up to, and one tap to log all of it. */
const PlanDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const today = useTodayKey();
  const { muted } = useTheme();

  const plan = planById(String(id));
  if (!plan || !user) {
    return (
      <Screen contentClassName="px-5" header={<TopBar showBack showAvatar={false} />}>
        <Text className="mt-8 text-sm text-ink-400">{t('food.notFound')}</Text>
      </Screen>
    );
  }

  const meals = planMeals(plan);
  const totals = planTotals(plan);

  const logDay = () => {
    for (const { slot, meal } of meals) {
      addMealEntries(user.id, {
        date: today,
        meal: slot,
        items: mealIngredients(meal).map((i) => ({
          foodId: i.food.id,
          name: locale === 'es' ? i.food.es : i.food.en,
          grams: i.grams,
          ...i.totals,
        })),
      });
    }
    toast.success(t('food.planLogged'));
    router.back();
  };

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={planName(plan, locale)}
          subtitle={t('food.planSubtitle')}
        />
      }
      footer={<Button label={t('food.logPlan')} variant="brand" fullWidth onPress={logDay} />}
    >
      <Card className="mt-2">
        <Text className="text-sm leading-6 text-ink-300">{planDescription(plan, locale)}</Text>
      </Card>

      <SectionLabel label={t('food.dayTotals')} />
      <Card>
        <View className="flex-row">
          <Stat label={t('goal.kcal')} value={String(totals.kcal)} />
          <Stat label={t('goal.protein')} value={String(Math.round(totals.proteinG))} unit="g" />
        </View>
        <View className="mt-4 flex-row">
          <Stat label={t('goal.carbs')} value={String(Math.round(totals.carbsG))} unit="g" />
          <Stat label={t('goal.fat')} value={String(Math.round(totals.fatG))} unit="g" />
        </View>
        <Text className="mt-4 text-xs leading-5 text-ink-500">{t('food.exampleNote')}</Text>
      </Card>

      <SectionLabel label={t('food.theDay')} />
      <Card className="gap-0 py-1">
        {meals.map(({ slot, meal }, i) => {
          const mt = mealTotals(meal);
          return (
            <Pressable
              key={`${slot}-${meal.id}`}
              onPress={() =>
                router.push({ pathname: '/food/meal/[id]', params: { id: meal.id, slot } })
              }
              accessibilityRole="button"
              className={[
                'flex-row items-center py-3',
                i > 0 ? 'border-t border-ink-700' : '',
              ].join(' ')}
            >
              <View className="min-w-0 flex-1 pr-2">
                <Text className="font-mono-medium text-[10px] uppercase tracking-wider text-ink-500">
                  {t(`diary.meal.${slot}`)}
                </Text>
                <Text className="mt-0.5 text-sm text-ink-100" numberOfLines={1}>
                  {mealName(meal, locale)}
                </Text>
                <Text className="text-[11px] text-ink-500">{mt.kcal} kcal</Text>
              </View>
              <ChevronRightIcon color={muted} size={16} />
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
};

export default PlanDetail;
