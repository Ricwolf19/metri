import { Pressable, Text, View } from 'react-native';

import { PlusIcon, XIcon } from '@/components/icons';
import { Card } from '@/components/ui';
import type { FoodLog, Meal } from '@/db/schema';
import { useI18n, useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { sumTotals } from '../diary';
import { entryLabel } from '../foods';
import { FOODS } from '../foods.data';
import { deleteEntry } from '../food-log.repo';

type Props = { meal: Meal; entries: FoodLog[]; onAdd: () => void };

/** One meal: its running calories, what was logged, and the way to add more. */
export const MealBlock = ({ meal, entries, onAdd }: Props) => {
  const t = useT();
  const { locale } = useI18n();
  const { brand, muted } = useTheme();
  const kcal = Math.round(sumTotals(entries).kcal);

  return (
    <Card className="gap-0 py-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-sans-semibold text-ink-50">{t(`diary.meal.${meal}`)}</Text>
        <View className="flex-row items-center gap-3">
          {entries.length ? <Text className="text-xs text-ink-400">{kcal} kcal</Text> : null}
          <Pressable
            onPress={onAdd}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('diary.addTo', { meal: t(`diary.meal.${meal}`) })}
            className="h-8 w-8 items-center justify-center rounded-full border border-brand/30 bg-brand/10"
          >
            <PlusIcon color={brand} size={16} />
          </Pressable>
        </View>
      </View>

      {entries.map((e) => (
        <View key={e.id} className="mt-2 flex-row items-center border-t border-ink-700 pt-2">
          <View className="min-w-0 flex-1 pr-2">
            <Text className="text-sm text-ink-100" numberOfLines={1}>
              {entryLabel(e, FOODS, locale)}
            </Text>
            <Text className="text-[11px] text-ink-500">
              {e.grams != null ? `${Math.round(e.grams)} g · ` : ''}
              {t('diary.macroLine', {
                p: Math.round(e.proteinG),
                c: Math.round(e.carbsG),
                f: Math.round(e.fatG),
              })}
            </Text>
          </View>
          <Text className="mr-3 text-sm font-sans-semibold text-ink-200">{Math.round(e.kcal)}</Text>
          <Pressable
            hitSlop={8}
            onPress={() => deleteEntry(e.id)}
            accessibilityRole="button"
            accessibilityLabel={t('diary.remove')}
          >
            <XIcon color={muted} size={15} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
};
