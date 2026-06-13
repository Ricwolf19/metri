import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Input, Screen, SegmentedControl, type Segment } from '@/components/ui';
import { kgToLb, lbToKg } from '@/features/bmr/calc';
import {
  calculateOneRm,
  ONERM_FORMULAS,
  PERCENTAGES,
  type OneRmFormula,
} from '@/features/onerm/calc';
import { useT } from '@/i18n';
import { settings, type Units } from '@/lib/storage';

const UNIT_SEGMENTS: Segment<Units>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const FORMULA_LABEL: Record<OneRmFormula, string> = { epley: 'Epley', brzycki: 'Brzycki' };

const OneRepMaxCalculator = () => {
  const t = useT();

  const [unit, setUnit] = useState<Units>(settings.getUnits());
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [formula, setFormula] = useState<OneRmFormula>('epley');

  const weightNum = Number(weight);
  const repsNum = Number(reps);
  const valid = weight !== '' && reps !== '' && weightNum > 0 && repsNum > 0;

  const oneRm = useMemo(
    () => (valid ? calculateOneRm(weightNum, repsNum, formula) : 0),
    [valid, weightNum, repsNum, formula],
  );

  const onUnitChange = (next: Units) => {
    if (next === unit || weight === '') return setUnit(next);
    const current = Number(weight);
    const kg = unit === 'lb' ? lbToKg(current) : current;
    setWeight(String(Math.round((next === 'lb' ? kgToLb(kg) : kg) * 10) / 10));
    setUnit(next);
  };

  const formulaSegments: Segment<OneRmFormula>[] = ONERM_FORMULAS.map((f) => ({
    value: f,
    label: FORMULA_LABEL[f],
  }));

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar title={t('onerm.title')} subtitle={t('onerm.subtitle')} showBack showAvatar={false} />

      {/* Live result */}
      <View
        className={[
          'rounded-2xl p-5',
          oneRm ? 'bg-accentFill' : 'border border-dashed border-ink-600 bg-ink-800',
        ].join(' ')}
      >
        {oneRm ? (
          <View className="items-center">
            <Text className="text-xs uppercase tracking-wider text-ink-950/60">
              {t('onerm.estimated')}
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-4xl font-extrabold text-ink-950">{oneRm}</Text>
              <Text className="ml-1 text-base font-semibold text-ink-950/70">{unit}</Text>
            </View>
          </View>
        ) : (
          <Text className="text-center text-sm text-ink-400">{t('onerm.prompt')}</Text>
        )}
      </View>

      {/* Inputs */}
      <View className="mt-6 gap-5">
        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              {t('onerm.weight')}
            </Text>
            <View className="w-28">
              <SegmentedControl segments={UNIT_SEGMENTS} value={unit} onChange={onUnitChange} />
            </View>
          </View>
          <Input
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder={unit === 'kg' ? '100' : '225'}
            maxLength={6}
          />
        </View>

        <Input
          label={t('onerm.reps')}
          value={reps}
          onChangeText={setReps}
          keyboardType="number-pad"
          placeholder="5"
          maxLength={2}
        />

        <SegmentedControl
          label={t('onerm.formula')}
          segments={formulaSegments}
          value={formula}
          onChange={setFormula}
        />

        {/* Training percentages */}
        {oneRm ? (
          <View>
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-300">
              {t('onerm.percentages')}
            </Text>
            <Card padded={false} className="overflow-hidden">
              {PERCENTAGES.map((row, i) => (
                <View
                  key={row.pct}
                  className={[
                    'flex-row items-center justify-between px-4 py-2.5',
                    i > 0 ? 'border-t border-ink-700' : '',
                  ].join(' ')}
                >
                  <Text className="w-12 text-sm font-semibold text-accent">{row.pct}%</Text>
                  <Text className="flex-1 text-sm font-medium text-ink-100">
                    {Math.round((oneRm * row.pct) / 100)} {unit}
                  </Text>
                  <Text className="text-xs text-ink-400">
                    {row.reps === 1
                      ? t('onerm.reps_one')
                      : t('onerm.reps_other', { reps: row.reps })}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <Card padded className="bg-ink-850">
          <Text className="text-xs leading-5 text-ink-400">{t('onerm.explainer')}</Text>
        </Card>
      </View>
    </Screen>
  );
};

export default OneRepMaxCalculator;
