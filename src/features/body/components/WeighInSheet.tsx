import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Input, ScrollArea, Sheet, useToast } from '@/components/ui';
import { lbToKg } from '@/features/bmr/calc';
import { fromKg } from '@/features/training/progression';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';

import { saveBodyMetric } from '../body-metrics.repo';
import { isWaterJump } from '../weekly';

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  date: string;
  /** Yesterday's (or the last) reading — prefill, and the water-jump reference. */
  previousKg: number | null;
};

/** Today's weigh-in: one number, saved. The quick path the daily habit needs. */
export const WeighInSheet = ({ visible, onClose, userId, date, previousKg }: Props) => {
  const t = useT();
  const toast = useToast();
  const units = settings.getUnits();
  const [value, setValue] = useState('');

  const typed = Number(value.replace(',', '.'));
  const valid = value !== '' && Number.isFinite(typed) && typed > 0;
  const kg = valid ? (units === 'lb' ? lbToKg(typed) : typed) : null;

  const save = () => {
    if (kg == null) return;
    saveBodyMetric(userId, date, { weightKg: Math.round(kg * 100) / 100 });
    toast.success(t('body.weighInSaved'));
    setValue('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollArea inSheet keyboardShouldPersistTaps="handled">
        <Text className="mb-1 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('body.weighIn')}
        </Text>
        <Text className="mb-4 text-xs leading-5 text-ink-500">{t('body.weighInHint')}</Text>
        <Input
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder={previousKg != null ? String(fromKg(previousKg, units)) : units}
          maxLength={6}
          autoFocus
        />
        {kg != null && isWaterJump(previousKg, kg) ? (
          <Text className="mt-3 text-xs leading-5 text-ink-300">{t('body.waterNote')}</Text>
        ) : null}
        <View className="mt-4">
          <Button label={t('editor.save')} variant="brand" fullWidth onPress={save} />
        </View>
      </ScrollArea>
    </Sheet>
  );
};
