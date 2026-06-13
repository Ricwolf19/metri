import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Input, Screen, SegmentedControl, type Segment } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { formatKcal, kgToLb, lbToKg } from '@/features/bmr/calc';
import { calculateMacros, GOALS, type Goal } from '@/features/macros/calc';
import { useT } from '@/i18n';
import { settings, type Units } from '@/lib/storage';

const UNIT_SEGMENTS: Segment<Units>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const MacroTile = ({ label, grams }: { label: string; grams: number }) => (
  <View className="flex-1 items-center px-1">
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      style={{ textAlign: 'center' }}
      className="text-xs uppercase tracking-wider text-ink-950/60"
    >
      {label}
    </Text>
    <View className="mt-1 flex-row items-baseline">
      <Text className="text-2xl font-extrabold text-ink-950">{grams}</Text>
      <Text className="ml-0.5 text-sm font-semibold text-ink-950/70">g</Text>
    </View>
  </View>
);

const MacrosCalculator = () => {
  const { user } = useAuth();
  const t = useT();

  const [goal, setGoal] = useState<Goal>('maintain');
  const [tdee, setTdee] = useState(user?.tdee ? String(Math.round(user.tdee)) : '');
  const [unit, setUnit] = useState<Units>(settings.getUnits());
  const [weight, setWeight] = useState(() => {
    if (!user?.weightKg) return '';
    const w = unit === 'lb' ? kgToLb(user.weightKg) : user.weightKg;
    return String(Math.round(w * 10) / 10);
  });

  const tdeeNum = Number(tdee);
  const weightKg = unit === 'lb' ? lbToKg(Number(weight)) : Number(weight);
  const valid = tdee !== '' && weight !== '' && tdeeNum > 0 && weightKg > 0;

  const result = useMemo(
    () => (valid ? calculateMacros({ tdee: tdeeNum, goal, weightKg }) : null),
    [valid, tdeeNum, goal, weightKg],
  );

  const onUnitChange = (next: Units) => {
    if (next === unit || weight === '') return setUnit(next);
    const current = Number(weight);
    const kg = unit === 'lb' ? lbToKg(current) : current;
    setWeight(String(Math.round((next === 'lb' ? kgToLb(kg) : kg) * 10) / 10));
    setUnit(next);
  };

  const goalSegments: Segment<Goal>[] = GOALS.map((g) => ({ value: g, label: t(`macros.${g}`) }));

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar
        title={t('macros.title')}
        subtitle={t('macros.subtitle')}
        showBack
        showAvatar={false}
        docId="calc-macros"
      />

      {/* Live result */}
      <View
        className={[
          'rounded-2xl p-5',
          result ? 'bg-accentFill' : 'border border-dashed border-ink-600 bg-ink-800',
        ].join(' ')}
      >
        {result ? (
          <>
            <View className="items-center">
              <Text className="text-xs uppercase tracking-wider text-ink-950/60">
                {t('macros.calories')}
              </Text>
              <Text className="text-4xl font-extrabold text-ink-950">
                {formatKcal(result.calories)}
              </Text>
            </View>
            <View className="mt-4 flex-row">
              <MacroTile label={t('macros.protein')} grams={result.proteinG} />
              <View className="w-px bg-ink-950/15" />
              <MacroTile label={t('macros.carbs')} grams={result.carbsG} />
              <View className="w-px bg-ink-950/15" />
              <MacroTile label={t('macros.fat')} grams={result.fatG} />
            </View>
          </>
        ) : (
          <Text className="text-center text-sm text-ink-400">{t('macros.prompt')}</Text>
        )}
      </View>

      {/* Inputs */}
      <View className="mt-6 gap-5">
        <SegmentedControl
          label={t('macros.goal')}
          segments={goalSegments}
          value={goal}
          onChange={setGoal}
        />

        <Input
          label={t('macros.tdee')}
          value={tdee}
          onChangeText={setTdee}
          keyboardType="number-pad"
          placeholder="2400"
          maxLength={5}
          hint={t('macros.tdeeHint')}
        />

        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              {t('macros.weight')}
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
          <Text className="text-xs leading-5 text-ink-400">{t('macros.explainer')}</Text>
        </Card>
      </View>
    </Screen>
  );
};

export default MacrosCalculator;
