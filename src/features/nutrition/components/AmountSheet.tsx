import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, HoldButton, Input, ScrollArea, Sheet, Stat } from '@/components/ui';
import { useT } from '@/i18n';

import { scale } from '../diary';
import type { Food } from '../foods';

type Props = {
  food: Food | null;
  /** Prefill: what was logged last time, else the food's typical serving. */
  initialGrams: number;
  onClose: () => void;
  onConfirm: (food: Food, grams: number) => void;
  /** Offered for the user's own foods only; past entries keep their snapshot. */
  onDelete: (food: Food) => void;
};

/** How much of it: grams in, the entry's calories and macros live. */
export const AmountSheet = ({ food, initialGrams, onClose, onConfirm, onDelete }: Props) => {
  const t = useT();
  const [typed, setTyped] = useState<string | null>(null);

  const raw = typed ?? String(Math.round(initialGrams));
  const grams = Number(raw.replace(',', '.'));
  const valid = Number.isFinite(grams) && grams > 0;
  const totals = food && valid ? scale(food, grams) : null;

  const close = () => {
    setTyped(null);
    onClose();
  };

  return (
    <Sheet visible={food != null} onClose={close}>
      <ScrollArea inSheet keyboardShouldPersistTaps="handled">
        <Text className="text-base font-sans-semibold text-ink-50">{food?.name}</Text>
        <Text className="mb-4 mt-0.5 text-xs text-ink-500">
          {food ? t('diary.per100', { n: Math.round(food.kcal) }) : ''}
        </Text>
        <Input
          label={t('diary.grams')}
          value={raw}
          onChangeText={setTyped}
          keyboardType="decimal-pad"
          maxLength={6}
          selectTextOnFocus
        />
        <Text className="mt-1 text-[11px] leading-4 text-ink-500">{t('diary.rawHint')}</Text>

        <View className="mt-4 flex-row">
          <Stat label={t('goal.kcal')} value={totals ? String(totals.kcal) : '—'} />
          <Stat label={t('goal.protein')} value={totals ? String(totals.proteinG) : '—'} unit="g" />
        </View>
        <View className="mt-3 flex-row">
          <Stat label={t('goal.carbs')} value={totals ? String(totals.carbsG) : '—'} unit="g" />
          <Stat label={t('goal.fat')} value={totals ? String(totals.fatG) : '—'} unit="g" />
        </View>

        <View className="mt-5">
          <Button
            label={t('diary.add')}
            variant="brand"
            fullWidth
            disabled={!valid}
            onPress={() => {
              if (!food || !valid) return;
              onConfirm(food, grams);
              setTyped(null);
            }}
          />
        </View>
        {food?.source === 'custom' ? (
          <View className="mt-2">
            <HoldButton label={t('diary.deleteFood')} onComplete={() => onDelete(food)} />
          </View>
        ) : null}
      </ScrollArea>
    </Sheet>
  );
};
