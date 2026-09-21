import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, Screen, SectionLabel, SegmentedControl, type Segment } from '@/components/ui';
import { mealTotals, mealName, MEAL_SEEDS, type MealSeed } from '@/features/nutrition/meals';
import {
  planDescription,
  planMeals,
  planName,
  planTotals,
  PLAN_SEEDS,
} from '@/features/nutrition/plans';
import { useI18n, useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

type Filter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'vegan';

/**
 * Meal ideas and day plans. Worked examples: they show what a balanced plate
 * and a balanced day look like, and log in one tap — the amounts are then the
 * lifter's to adjust.
 */
const FoodIdeas = () => {
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const { muted } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');

  const segments: Segment<Filter>[] = [
    { value: 'all', label: t('common.all') },
    { value: 'breakfast', label: t('diary.meal.breakfast') },
    { value: 'lunch', label: t('diary.meal.lunch') },
    { value: 'dinner', label: t('diary.meal.dinner') },
    { value: 'vegan', label: t('food.vegan') },
  ];

  const meals = MEAL_SEEDS.filter((m) =>
    filter === 'all' ? true : filter === 'vegan' ? m.vegan : m.slots.includes(filter),
  );

  const renderMeal = (meal: MealSeed, index: number) => {
    const totals = mealTotals(meal);
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/food/meal/[id]', params: { id: meal.id } })}
        accessibilityRole="button"
        className={['flex-row items-center py-3', index > 0 ? 'border-t border-ink-700' : ''].join(
          ' ',
        )}
      >
        <View className="min-w-0 flex-1 pr-2">
          <Text className="text-sm text-ink-100" numberOfLines={1}>
            {mealName(meal, locale)}
          </Text>
          <Text className="text-[11px] text-ink-500">
            {totals.kcal} kcal ·{' '}
            {t('diary.macroLine', {
              p: Math.round(totals.proteinG),
              c: Math.round(totals.carbsG),
              f: Math.round(totals.fatG),
            })}
          </Text>
        </View>
        <ChevronRightIcon color={muted} size={16} />
      </Pressable>
    );
  };

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('food.ideasTitle')}
          subtitle={t('food.ideasSubtitle')}
        />
      }
    >
      <SectionLabel label={t('food.plans')} hint={t('food.plansHint')} className="mt-2" />
      <View className="gap-3">
        {PLAN_SEEDS.map((plan) => {
          const totals = planTotals(plan);
          return (
            <Pressable
              key={plan.id}
              onPress={() => router.push({ pathname: '/food/plan/[id]', params: { id: plan.id } })}
              accessibilityRole="button"
            >
              <Card>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-sans-semibold text-ink-50">
                    {planName(plan, locale)}
                  </Text>
                  <Text className="font-mono-medium text-xs text-ink-400">{totals.kcal} kcal</Text>
                </View>
                <Text className="mt-1 text-sm leading-6 text-ink-400" numberOfLines={3}>
                  {planDescription(plan, locale)}
                </Text>
                <Text className="mt-2 text-[11px] text-ink-500">
                  {t('food.planMeals', { n: planMeals(plan).length })}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel label={t('food.meals')} hint={t('food.mealsHint')} />
      <View className="mb-3">
        <SegmentedControl value={filter} segments={segments} onChange={setFilter} />
      </View>
      <Card className="gap-0 py-1">{meals.map((meal, i) => renderMeal(meal, i))}</Card>
    </Screen>
  );
};

export default FoodIdeas;
