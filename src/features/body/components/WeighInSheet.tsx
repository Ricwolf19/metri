import { useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { ControlledInput, useOpenKey, useSaveForm } from '@/components/form';
import { Button, Sheet, SheetForm, useToast } from '@/components/ui';
import { lbToKg } from '@/features/bmr/calc';
import { UnitSuffix } from '@/features/training/components/UnitSuffix';
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

const parseWeight = (raw: string): number | null => {
  const n = Number(raw.replace(',', '.'));
  return raw !== '' && Number.isFinite(n) && n > 0 ? n : null;
};

/** Today's weigh-in: one number, saved. The quick path the daily habit needs. */
export const WeighInSheet = ({ visible, ...props }: Props) => {
  const openKey = useOpenKey(visible);
  return (
    <Sheet visible={visible} onClose={props.onClose}>
      <WeighInForm key={openKey} {...props} />
    </Sheet>
  );
};

const WeighInForm = ({ onClose, userId, date, previousKg }: Omit<Props, 'visible'>) => {
  const t = useT();
  const toast = useToast();
  const units = settings.getUnits();
  const toKg = (typed: number) => (units === 'lb' ? lbToKg(typed) : typed);

  // `create`: one reading per opening, however fast Save is tapped.
  const form = useSaveForm<{ weight: string }>({
    kind: 'create',
    defaultValues: { weight: '' },
    onSave: ({ weight }) => {
      const typed = parseWeight(weight);
      if (typed == null) return false;
      saveBodyMetric(userId, date, { weightKg: Math.round(toKg(typed) * 100) / 100 });
      toast.success(t('body.weighInSaved'));
      onClose();
    },
  });
  const typed = parseWeight(useWatch({ control: form.control, name: 'weight' }));
  const kg = typed != null ? toKg(typed) : null;

  return (
    <SheetForm>
      <Text className="mb-1 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('body.weighIn')}
      </Text>
      <Text className="mb-4 text-xs leading-5 text-ink-500">{t('body.weighInHint')}</Text>
      <ControlledInput
        control={form.control}
        name="weight"
        rules={{ validate: (v) => parseWeight(v) != null }}
        // The title above is its visible name; the unit rides inside the box.
        accessibilityLabel={`${t('body.weighIn')} (${units})`}
        rightSlot={<UnitSuffix label={units} />}
        hint={
          previousKg != null
            ? t('body.lastWeighIn', { value: String(fromKg(previousKg, units)), unit: units })
            : undefined
        }
        keyboardType="decimal-pad"
        maxLength={6}
        autoFocus
      />
      {kg != null && isWaterJump(previousKg, kg) ? (
        <Text className="mt-3 text-xs leading-5 text-ink-300">{t('body.waterNote')}</Text>
      ) : null}
      <View className="mt-4">
        <Button
          label={t('editor.save')}
          variant="brand"
          fullWidth
          disabled={!form.canSave}
          onPress={() => form.submit()}
        />
      </View>
    </SheetForm>
  );
};
