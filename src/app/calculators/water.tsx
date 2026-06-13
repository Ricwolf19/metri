import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Input, Screen, SegmentedControl, type Segment } from '@/components/ui';
import type { ActivityLevel } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { kgToLb, lbToKg } from '@/features/bmr/calc';
import { ActivityPicker } from '@/features/bmr/components/ActivityPicker';
import { calculateWater } from '@/features/hydration/calc';
import { useT } from '@/i18n';
import { settings, type Units } from '@/lib/storage';

const UNIT_SEGMENTS: Segment<Units>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const WaterCalculator = () => {
  const { user } = useAuth();
  const t = useT();

  const [unit, setUnit] = useState<Units>(settings.getUnits());
  const [weight, setWeight] = useState(() => {
    if (!user?.weightKg) return '';
    const w = unit === 'lb' ? kgToLb(user.weightKg) : user.weightKg;
    return String(Math.round(w * 10) / 10);
  });
  const [activity, setActivity] = useState<ActivityLevel>(user?.activityLevel ?? 'moderate');

  const weightKg = unit === 'lb' ? lbToKg(Number(weight)) : Number(weight);
  const result = useMemo(
    () =>
      weight !== '' && weightKg > 0 ? calculateWater({ weightKg, activityLevel: activity }) : null,
    [weight, weightKg, activity],
  );

  const onUnitChange = (next: Units) => {
    if (next === unit || weight === '') return setUnit(next);
    const current = Number(weight);
    const kg = unit === 'lb' ? lbToKg(current) : current;
    setWeight(String(Math.round((next === 'lb' ? kgToLb(kg) : kg) * 10) / 10));
    setUnit(next);
  };

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar title={t('water.title')} subtitle={t('water.subtitle')} showBack showAvatar={false} />

      <View
        className={[
          'rounded-2xl p-5',
          result ? 'bg-accentFill' : 'border border-dashed border-ink-600 bg-ink-800',
        ].join(' ')}
      >
        {result ? (
          <View className="items-center">
            <Text className="text-xs uppercase tracking-wider text-ink-950/60">
              {t('water.result')}
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-4xl font-extrabold text-ink-950">{result.liters}</Text>
              <Text className="ml-1 text-base font-semibold text-ink-950/70">L</Text>
            </View>
            <Text className="mt-1 text-sm font-semibold text-ink-950/70">
              {t('water.cups', { cups: result.cups })}
            </Text>
          </View>
        ) : (
          <Text className="text-center text-sm text-ink-400">{t('water.prompt')}</Text>
        )}
      </View>

      <View className="mt-6 gap-5">
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

        <View>
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-300">
            {t('bmr.activity')}
          </Text>
          <ActivityPicker value={activity} onChange={setActivity} />
        </View>

        <Card padded className="bg-ink-850">
          <Text className="text-xs leading-5 text-ink-400">{t('water.explainer')}</Text>
        </Card>
      </View>
    </Screen>
  );
};

export default WaterCalculator;
