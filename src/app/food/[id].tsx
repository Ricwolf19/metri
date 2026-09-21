import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Button, Card, Screen, SectionLabel, Stat, TextLink } from '@/components/ui';
import { CalcChart } from '@/features/calculators/components/CalcChart';
import type { CalcChart as Chart } from '@/features/calculators/types';
import { scale } from '@/features/nutrition/diary';
import { fromCatalog } from '@/features/nutrition/foods';
import { FOODS } from '@/features/nutrition/foods.data';
import { MEAL_SEEDS, mealName } from '@/features/nutrition/meals';
import { C } from '@/features/calculators/_shared';
import { useI18n, useT } from '@/i18n';

/**
 * A food's card: what 100 g holds, what a typical serving holds, where its
 * energy comes from, and which meal ideas use it. Reached from the add screen
 * and from the knowledge base.
 */
const FoodDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();

  const food = useMemo(() => {
    const raw = FOODS.find((f) => f.id === id);
    return raw ? { raw, view: fromCatalog(raw, locale) } : null;
  }, [id, locale]);
  const [grams, setGrams] = useState(food?.raw.servingG ?? 100);

  const usedIn = useMemo(
    () => MEAL_SEEDS.filter((m) => m.ingredients.some((i) => i.foodId === id)),
    [id],
  );

  if (!food) {
    return (
      <Screen contentClassName="px-5" header={<TopBar showBack showAvatar={false} />}>
        <Text className="mt-8 text-sm text-ink-400">{t('food.notFound')}</Text>
      </Screen>
    );
  }

  const { view } = food;
  const portion = scale(view, grams);
  const kcalFrom = {
    protein: view.proteinG * 4,
    carbs: view.carbsG * 4,
    fat: view.fatG * 9,
  };
  const chart: Chart = {
    kind: 'split',
    segments: [
      { labelKey: 'calc.result.protein', value: kcalFrom.protein, color: C.lime },
      { labelKey: 'calc.result.carbs', value: kcalFrom.carbs, color: C.blue },
      { labelKey: 'calc.result.fat', value: kcalFrom.fat, color: C.amber },
    ],
  };

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-10"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={view.name}
          subtitle={t(`food.category.${food.raw.category}`)}
        />
      }
    >
      <SectionLabel label={t('food.per100')} className="mt-2" />
      <Card>
        <View className="flex-row">
          <Stat label={t('goal.kcal')} value={String(Math.round(view.kcal))} />
          <Stat label={t('goal.protein')} value={String(view.proteinG)} unit="g" />
        </View>
        <View className="mt-4 flex-row">
          <Stat label={t('goal.carbs')} value={String(view.carbsG)} unit="g" />
          <Stat label={t('goal.fat')} value={String(view.fatG)} unit="g" />
        </View>
        <View className="mt-4 flex-row">
          <Stat label={t('diary.fiber')} value={String(view.fiberG)} unit="g" />
          <View className="flex-1" />
        </View>
      </Card>

      <SectionLabel label={t('food.energySplit')} hint={t('food.energySplitHint')} />
      <Card>
        <CalcChart chart={chart} />
      </Card>

      <SectionLabel label={t('food.portion')} />
      <Card>
        <View className="flex-row flex-wrap gap-2">
          {[50, 100, food.raw.servingG, 200]
            .filter((g, i, arr) => g > 0 && arr.indexOf(g) === i)
            .map((g) => (
              <Button
                key={g}
                label={`${g} g`}
                variant={g === grams ? 'brand' : 'secondary'}
                onPress={() => setGrams(g)}
              />
            ))}
        </View>
        {/* Two rows of two: four columns leave ~67dp each, and the Spanish
            labels clip (see Stat's own note). */}
        <View className="mt-4 flex-row">
          <Stat label={t('goal.kcal')} value={String(portion.kcal)} />
          <Stat label={t('goal.protein')} value={String(portion.proteinG)} unit="g" />
        </View>
        <View className="mt-3 flex-row">
          <Stat label={t('goal.carbs')} value={String(portion.carbsG)} unit="g" />
          <Stat label={t('goal.fat')} value={String(portion.fatG)} unit="g" />
        </View>
      </Card>

      {usedIn.length ? (
        <>
          <SectionLabel label={t('food.usedIn')} />
          <Card className="gap-0 py-1">
            {usedIn.map((m, i) => (
              <TextLink
                key={m.id}
                label={mealName(m, locale)}
                onPress={() => router.push({ pathname: '/food/meal/[id]', params: { id: m.id } })}
                className={i > 0 ? 'mt-3' : ''}
              />
            ))}
          </Card>
        </>
      ) : null}

      <Text className="mt-6 text-center text-[11px] leading-4 text-ink-600">
        {t('diary.dataCredit')}
      </Text>
    </Screen>
  );
};

export default FoodDetail;
