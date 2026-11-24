import { useLiveQuery } from '@/db/useLiveQuery';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import {
  Button,
  CARD_SLICE,
  EmptyState,
  Input,
  Screen,
  SectionLabel,
  useToast,
} from '@/components/ui';
import type { Meal } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { AmountSheet } from '@/features/nutrition/components/AmountSheet';
import { QuickAddSheet } from '@/features/nutrition/components/QuickAddSheet';
import { MEALS, scale } from '@/features/nutrition/diary';
import {
  addEntry,
  customFoodsQuery,
  deleteCustomFood,
  recentFoodIds,
} from '@/features/nutrition/food-log.repo';
import { fromCatalog, fromCustom, searchFoods, type Food } from '@/features/nutrition/foods';
import { FOODS } from '@/features/nutrition/foods.data';
import { useI18n, useT } from '@/i18n';
import { useTodayKey } from '@/lib/useTodayKey';

/** The list virtualizes now, so a broad word can show a long page of matches. */
const MAX_RESULTS = 100;

/** Row `index` of `count` as one slice of a card (`CARD_SLICE`, so the rows sit
 * exactly where a `Card` would put them): the first rounds the top, the last the
 * bottom, and each after the first draws the hairline above it. */
const cardSlice = (index: number, count: number): string =>
  [
    `border-x ${CARD_SLICE}`,
    index === 0 ? 'rounded-t-card border-t pt-1' : '',
    index === count - 1 ? 'rounded-b-card border-b pb-1' : '',
  ].join(' ');

/** Pick what was eaten: recents first, search across the catalogue and the
 * user's own foods, or type the calories straight in. The search field stays
 * put; everything under it is one virtualized list (the catalogue runs to the
 * thousands). */
const AddFood = () => {
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const today = useTodayKey();
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const meal: Meal = MEALS.includes(params.meal as Meal) ? (params.meal as Meal) : 'snack';
  const date = typeof params.date === 'string' ? params.date : today;
  const userId = user?.id ?? '';

  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<{ food: Food; grams: number } | null>(null);
  const [quick, setQuick] = useState(false);

  const { data: custom } = useLiveQuery(customFoodsQuery(userId), [userId]);
  const foods = useMemo<Food[]>(
    () => [...custom.map(fromCustom), ...FOODS.map((f) => fromCatalog(f, locale))],
    [custom, locale],
  );
  const recents = useMemo(() => {
    const byId = new Map(foods.map((f) => [f.id, f]));
    return recentFoodIds(userId).flatMap((r) => {
      const food = byId.get(r.foodId);
      return food ? [{ food, grams: r.grams }] : [];
    });
  }, [foods, userId]);

  if (!user) return null;

  const results = searchFoods(foods, query).slice(0, MAX_RESULTS);
  const searching = query.trim().length > 0;
  const rows = searching
    ? results.map((food) => ({ food, grams: food.servingG }))
    : recents.map((r) => ({ food: r.food, grams: r.grams }));

  const log = (
    name: string,
    foodId: string | null,
    grams: number | null,
    totals: ReturnType<typeof scale>,
  ) => {
    addEntry(userId, { date, meal, foodId, name, grams, ...totals });
    toast.success(t('diary.added'));
    router.back();
  };

  const renderRow = (food: Food, grams: number, index: number) => (
    <View className={cardSlice(index, rows.length)}>
      <Pressable
        onPress={() => setPicked({ food, grams })}
        onLongPress={
          food.source === 'catalog'
            ? () => router.push({ pathname: '/food/[id]', params: { id: food.id } })
            : undefined
        }
        accessibilityRole="button"
        className={['flex-row items-center py-3', index > 0 ? 'border-t border-ink-700' : ''].join(
          ' ',
        )}
      >
        <View className="min-w-0 flex-1 pr-3">
          <Text className="text-sm text-ink-100" numberOfLines={2}>
            {food.name}
          </Text>
          <Text className="text-[11px] text-ink-500" numberOfLines={1}>
            {food.source === 'custom' ? `${t('diary.mine')} · ` : ''}
            {t('diary.per100', { n: Math.round(food.kcal) })}
          </Text>
        </View>
        <Text className="shrink-0 text-xs text-ink-400">
          {t('diary.macroLine', {
            p: Math.round(food.proteinG),
            c: Math.round(food.carbsG),
            f: Math.round(food.fatG),
          })}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Screen
      contentClassName="px-5"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('diary.addTitle')}
          subtitle={t(`diary.meal.${meal}`)}
        />
      }
    >
      <View className="mt-2">
        <Input
          value={query}
          onChangeText={setQuery}
          search={t('diary.searchPlaceholder')}
          autoCorrect={false}
          maxLength={40}
        />
      </View>

      <FlashList
        data={rows}
        keyExtractor={(r) => r.food.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Button
                  label={t('diary.quickAdd')}
                  variant="secondary"
                  onPress={() => setQuick(true)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label={t('diary.newFood')}
                  variant="secondary"
                  onPress={() => router.push('/food/new')}
                />
              </View>
            </View>
            <View className="mt-2">
              <Button
                label={t('food.openIdeas')}
                variant="ghost"
                onPress={() => router.push('/food/ideas')}
              />
            </View>
            <SectionLabel label={searching ? t('diary.results') : t('diary.recent')} />
          </>
        }
        ListEmptyComponent={
          <EmptyState hint={searching ? t('diary.noResults') : t('diary.noRecent')} />
        }
        ListFooterComponent={
          <Text className="mt-6 text-center text-[11px] leading-4 text-ink-600">
            {t('diary.dataCredit')}
          </Text>
        }
        renderItem={({ item, index }) => renderRow(item.food, item.grams, index)}
      />

      <AmountSheet
        food={picked?.food ?? null}
        initialGrams={picked?.grams ?? 100}
        onClose={() => setPicked(null)}
        onConfirm={(food, grams) => log(food.name, food.id, grams, scale(food, grams))}
        onDelete={(food) => {
          deleteCustomFood(food.id);
          setPicked(null);
          toast.info(t('diary.foodDeleted'));
        }}
      />
      <QuickAddSheet
        visible={quick}
        onClose={() => setQuick(false)}
        onConfirm={(name, totals) => log(name, null, null, totals)}
      />
    </Screen>
  );
};

export default AddFood;
