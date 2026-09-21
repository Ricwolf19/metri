import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Input, ScrollArea, Sheet } from '@/components/ui';
import { useT } from '@/i18n';

import type { Totals } from '../diary';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string, totals: Totals) => void;
};

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
  const t = useT();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const reset = () => {
    setName('');
    setKcal('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <ScrollArea inSheet keyboardShouldPersistTaps="handled">
        <Text className="mb-1 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('diary.quickAdd')}
        </Text>
        <Text className="mb-4 text-xs leading-5 text-ink-500">{t('diary.quickAddHint')}</Text>
        <View className="gap-3">
          <Input
            label={t('diary.nameOptional')}
            value={name}
            onChangeText={setName}
            maxLength={60}
          />
          <Input
            label={t('goal.kcal')}
            value={kcal}
            onChangeText={setKcal}
            keyboardType="decimal-pad"
            maxLength={5}
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                label={`${t('goal.protein')} g`}
                value={protein}
                onChangeText={setProtein}
                keyboardType="decimal-pad"
                maxLength={4}
              />
            </View>
            <View className="flex-1">
              <Input
                label={`${t('goal.carbs')} g`}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="decimal-pad"
                maxLength={4}
              />
            </View>
            <View className="flex-1">
              <Input
                label={`${t('goal.fat')} g`}
                value={fat}
                onChangeText={setFat}
                keyboardType="decimal-pad"
                maxLength={4}
              />
            </View>
          </View>
        </View>
        <View className="mt-5">
          <Button
            label={t('diary.add')}
            variant="brand"
            fullWidth
            disabled={n(kcal) <= 0}
            onPress={() => {
              onConfirm(name.trim() || t('diary.quickAdd'), {
                kcal: Math.round(n(kcal)),
                proteinG: n(protein),
                carbsG: n(carbs),
                fatG: n(fat),
                fiberG: 0,
              });
              reset();
            }}
          />
        </View>
      </ScrollArea>
    </Sheet>
  );
};
