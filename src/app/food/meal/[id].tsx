import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Screen,
  SectionLabel,
  SegmentedControl,
  Stat,
  useToast,
  type Segment,
} from '@/components/ui';
import type { Meal } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { MEALS } from '@/features/nutrition/diary';
import { addMealEntries } from '@/features/nutrition/food-log.repo';
import { mealById, mealIngredients, mealName, mealTotals } from '@/features/nutrition/meals';
import { useI18n, useT } from '@/i18n';
import { useTodayKey } from '@/lib/useTodayKey';
import { useTheme } from '@/theme/theme-context';

/** A meal idea: what is in it, what it adds up to, and one tap to log it. */
const MealDetail = () => {
  const { id, slot } = useLocalSearchParams<{ id: string; slot?: string }>();
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const today = useTodayKey();
  const { muted } = useTheme();

  const meal = mealById(String(id));
  const [target, setTarget] = useState<Meal>(
    MEALS.includes(slot as Meal) ? (slot as Meal) : (meal?.slots[0] ?? 'lunch'),
  );

  if (!meal || !user) {
    return (
      <Screen contentClassName="px-5" header={<TopBar showBack showAvatar={false} />}>
        <Text className="mt-8 text-sm text-ink-400">{t('food.notFound')}</Text>
      </Screen>
    );
  }

  const items = mealIngredients(meal);
  const totals = mealTotals(meal);
  const slotSegments: Segment<Meal>[] = MEALS.map((m) => ({
    value: m,
    label: t(`diary.meal.${m}`),
  }));

  const logIt = () => {
    addMealEntries(user.id, {
      date: today,
      meal: target,
      items: items.map((i) => ({
        foodId: i.food.id,
        name: locale === 'es' ? i.food.es : i.food.en,
        grams: i.grams,
        ...i.totals,
      })),
    });
    toast.success(t('food.mealLogged'));
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
          title={mealName(meal, locale)}
          subtitle={t('food.mealIdea')}
        />
      }
      footer={<Button label={t('food.logMeal')} variant="brand" fullWidth onPress={logIt} />}
    >
      <SectionLabel label={t('food.totals')} className="mt-2" />
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

      <SectionLabel label={t('food.ingredients')} />
      <Card className="gap-0 py-1">
        {items.map((i, index) => (
          <Pressable
            key={i.food.id}
            onPress={() => router.push({ pathname: '/food/[id]', params: { id: i.food.id } })}
            accessibilityRole="button"
            className={[
              'flex-row items-center py-3',
              index > 0 ? 'border-t border-ink-700' : '',
            ].join(' ')}
          >
            <View className="min-w-0 flex-1 pr-2">
              <Text className="text-sm text-ink-100" numberOfLines={1}>
                {locale === 'es' ? i.food.es : i.food.en}
              </Text>
              <Text className="text-[11px] text-ink-500">
                {i.grams} g · {i.totals.kcal} kcal
              </Text>
            </View>
            <ChevronRightIcon color={muted} size={16} />
          </Pressable>
        ))}
      </Card>

      <SectionLabel label={t('food.logAs')} />
      <SegmentedControl value={target} segments={slotSegments} onChange={setTarget} />
    </Screen>
  );
};

export default MealDetail;
