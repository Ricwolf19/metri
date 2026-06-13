import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Input, Screen, SegmentedControl, type Segment } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { kgToLb, lbToKg } from '@/features/bmr/calc';
import { calculateBmi, classifyBmi, idealWeightRange } from '@/features/idealweight/calc';
import { useT } from '@/i18n';
import { settings, type Units } from '@/lib/storage';

const UNIT_SEGMENTS: Segment<Units>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const IdealWeightCalculator = () => {
  const { user } = useAuth();
  const t = useT();

  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user.heightCm) : '');
  const [unit, setUnit] = useState<Units>(settings.getUnits());
  const [weight, setWeight] = useState(() => {
    if (!user?.weightKg) return '';
    const w = unit === 'lb' ? kgToLb(user.weightKg) : user.weightKg;
    return String(Math.round(w * 10) / 10);
  });

  const heightNum = Number(heightCm);
  const range = useMemo(() => idealWeightRange(heightNum), [heightNum]);
  const weightKg = unit === 'lb' ? lbToKg(Number(weight)) : Number(weight);
  const bmi = useMemo(
    () => (weight !== '' && weightKg > 0 ? calculateBmi(weightKg, heightNum) : null),
    [weight, weightKg, heightNum],
  );

  const onUnitChange = (next: Units) => {
    if (next === unit || weight === '') return setUnit(next);
    const current = Number(weight);
    const kg = unit === 'lb' ? lbToKg(current) : current;
    setWeight(String(Math.round((next === 'lb' ? kgToLb(kg) : kg) * 10) / 10));
    setUnit(next);
  };

  const toDisplay = (kg: number) => Math.round((unit === 'lb' ? kgToLb(kg) : kg) * 10) / 10;

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar
        title={t('ideal.title')}
        subtitle={t('ideal.subtitle')}
        showBack
        showAvatar={false}
        docId="calc-ideal-weight"
      />

      <View
        className={[
          'rounded-2xl p-5',
          range ? 'bg-accentFill' : 'border border-dashed border-ink-600 bg-ink-800',
        ].join(' ')}
      >
        {range ? (
          <View className="items-center">
            <Text className="text-xs uppercase tracking-wider text-ink-950/60">
              {t('ideal.range')}
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-extrabold text-ink-950">
                {toDisplay(range.minKg)}–{toDisplay(range.maxKg)}
              </Text>
              <Text className="ml-1 text-base font-semibold text-ink-950/70">{unit}</Text>
            </View>
            {bmi !== null ? (
              <Text className="mt-1 text-sm font-semibold text-ink-950/70">
                {t('ideal.bmi')}: {bmi} · {t(`bmi.${classifyBmi(bmi)}`)}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text className="text-center text-sm text-ink-400">{t('ideal.prompt')}</Text>
        )}
      </View>

      <View className="mt-6 gap-5">
        <Input
          label={t('bmr.heightCm')}
          value={heightCm}
          onChangeText={setHeightCm}
          keyboardType="decimal-pad"
          placeholder="178"
          maxLength={5}
        />

        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              {t('ideal.weight')}
            </Text>
            <View className="w-28">
              <SegmentedControl segments={UNIT_SEGMENTS} value={unit} onChange={onUnitChange} />
            </View>
          </View>
          <Input
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder={unit === 'kg' ? '75' : '165'}
            maxLength={6}
          />
        </View>

        <Card padded className="bg-ink-850">
          <Text className="text-xs leading-5 text-ink-400">{t('ideal.explainer')}</Text>
        </Card>
      </View>
    </Screen>
  );
};

export default IdealWeightCalculator;
