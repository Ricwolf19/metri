import { useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { ControlledInput, useOpenKey, useSaveForm } from '@/components/form';
import { Button, HoldButton, Sheet, SheetForm, Stat } from '@/components/ui';
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

const parseGrams = (raw: string): number | null => {
  const grams = Number(raw.replace(',', '.'));
  return Number.isFinite(grams) && grams > 0 ? grams : null;
};

/** How much of it: grams in, the entry's calories and macros live. */
export const AmountSheet = ({ food, onClose, ...props }: Props) => {
  // Each opening starts on that food's prefill.
  const openKey = useOpenKey(food != null);
  return (
    <Sheet visible={food != null} onClose={onClose}>
      <AmountForm key={openKey} food={food} {...props} />
    </Sheet>
  );
};

const AmountForm = ({ food, initialGrams, onConfirm, onDelete }: Omit<Props, 'onClose'>) => {
  const t = useT();
  // `create`: the prefilled amount is a valid answer as it stands, and one entry
  // per opening — the screen pops after the first, and a second tap during the
  // transition logged the food twice.
  const form = useSaveForm<{ grams: string }>({
    kind: 'create',
    defaultValues: { grams: String(Math.round(initialGrams)) },
    onSave: ({ grams }) => {
      const amount = parseGrams(grams);
      if (!food || amount == null) return false;
      onConfirm(food, amount);
    },
  });
  const grams = parseGrams(useWatch({ control: form.control, name: 'grams' }));
  const totals = food && grams != null ? scale(food, grams) : null;

  return (
    <SheetForm>
      <Text className="text-base font-sans-semibold text-ink-50">{food?.name}</Text>
      <Text className="mb-4 mt-0.5 text-xs text-ink-500">
        {food ? t('diary.per100', { n: Math.round(food.kcal) }) : ''}
      </Text>
      <ControlledInput
        control={form.control}
        name="grams"
        rules={{ validate: (v) => parseGrams(v) != null }}
        label={t('diary.grams')}
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
          disabled={!form.canSave}
          onPress={() => form.submit()}
        />
      </View>
      {food?.source === 'custom' ? (
        <View className="mt-2">
          <HoldButton label={t('diary.deleteFood')} onComplete={() => onDelete(food)} />
        </View>
      ) : null}
    </SheetForm>
  );
};
