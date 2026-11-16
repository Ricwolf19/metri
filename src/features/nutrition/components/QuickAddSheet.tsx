import { Text, View } from 'react-native';

import { ControlledInput, useOpenKey, useSaveForm } from '@/components/form';
import { Button, ScrollArea, Sheet } from '@/components/ui';
import { useT } from '@/i18n';

import type { Totals } from '../diary';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string, totals: Totals) => void;
};

type QuickDraft = { name: string; kcal: string; protein: string; carbs: string; fat: string };

const n = (raw: string): number => {
  const v = Number(raw.replace(',', '.'));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

/**
 * Calories typed straight in — a restaurant meal, a label, a rough guess. The
 * escape hatch that keeps a day logged when the exact food is not in the list;
 * a roughly-right entry beats a gap in the average.
 */
export const QuickAddSheet = ({ visible, onClose, onConfirm }: Props) => {
  // A fresh, empty form on every opening (what the old reset-on-close did).
  const openKey = useOpenKey(visible);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <QuickAddForm key={openKey} onConfirm={onConfirm} />
    </Sheet>
  );
};

const QuickAddForm = ({ onConfirm }: Pick<Props, 'onConfirm'>) => {
  const t = useT();
  // `create`: one entry per opening — the screen pops after the first, and a
  // second tap during the transition logged the meal twice.
  const form = useSaveForm<QuickDraft>({
    kind: 'create',
    defaultValues: { name: '', kcal: '', protein: '', carbs: '', fat: '' },
    onSave: (v) =>
      onConfirm(v.name.trim() || t('diary.quickAdd'), {
        kcal: Math.round(n(v.kcal)),
        proteinG: n(v.protein),
        carbsG: n(v.carbs),
        fatG: n(v.fat),
        fiberG: 0,
      }),
  });

  const macro = (label: string, name: 'protein' | 'carbs' | 'fat') => (
    <View className="flex-1">
      <ControlledInput
        control={form.control}
        name={name}
        label={`${label} g`}
        keyboardType="decimal-pad"
        maxLength={4}
      />
    </View>
  );

  return (
    <ScrollArea inSheet keyboardShouldPersistTaps="handled">
      <Text className="mb-1 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('diary.quickAdd')}
      </Text>
      <Text className="mb-4 text-xs leading-5 text-ink-500">{t('diary.quickAddHint')}</Text>
      <View className="gap-3">
        <ControlledInput
          control={form.control}
          name="name"
          label={t('diary.nameOptional')}
          maxLength={60}
        />
        <ControlledInput
          control={form.control}
          name="kcal"
          rules={{ validate: (v) => n(v) > 0 }}
          label={t('goal.kcal')}
          keyboardType="decimal-pad"
          maxLength={5}
        />
        <View className="flex-row gap-2">
          {macro(t('goal.protein'), 'protein')}
          {macro(t('goal.carbs'), 'carbs')}
          {macro(t('goal.fat'), 'fat')}
        </View>
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
    </ScrollArea>
  );
};
