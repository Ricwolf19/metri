import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Input, Screen, SegmentedControl, type Segment } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { kgToLb, lbToKg } from '@/features/bmr/calc';
import { calculateFfmi, classifyFfmi } from '@/features/ffmi/calc';
import { FfmiGauge } from '@/features/ffmi/components/FfmiGauge';
import { FfmiScale } from '@/features/ffmi/components/FfmiScale';
import { useT } from '@/i18n';
import { settings, type Units } from '@/lib/storage';

const UNIT_SEGMENTS: Segment<Units>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const ResultRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row items-center justify-between py-1.5">
    <Text className="text-sm text-ink-400">{label}</Text>
    <Text className="text-sm font-semibold text-ink-100">{value}</Text>
  </View>
);

const FfmiCalculator = () => {
  const { user } = useAuth();
  const t = useT();

  const [unit, setUnit] = useState<Units>(settings.getUnits());
  const [height, setHeight] = useState(user?.heightCm ? String(Math.round(user.heightCm)) : '');
  const [weight, setWeight] = useState(() => {
    if (!user?.weightKg) return '';
    const w = unit === 'lb' ? kgToLb(user.weightKg) : user.weightKg;
    return String(Math.round(w * 10) / 10);
  });
  const [bodyFat, setBodyFat] = useState(
    typeof user?.bodyFatPct === 'number' ? String(user.bodyFatPct) : '',
  );

  const heightCm = Number(height);
  const weightKg = unit === 'lb' ? lbToKg(Number(weight)) : Number(weight);
  const bodyFatPct = Number(bodyFat);
  const valid = height !== '' && weight !== '' && bodyFat !== '';

  const result = useMemo(
    () => (valid ? calculateFfmi({ heightCm, weightKg, bodyFatPct }) : null),
    [valid, heightCm, weightKg, bodyFatPct],
  );

  const band = result ? classifyFfmi(result.ffmi) : null;

  const onUnitChange = (next: Units) => {
    if (next === unit || weight === '') return setUnit(next);
    const current = Number(weight);
    const kg = unit === 'lb' ? lbToKg(current) : current;
    setWeight(String(Math.round((next === 'lb' ? kgToLb(kg) : kg) * 10) / 10));
    setUnit(next);
  };

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar
        title={t('ffmi.title')}
        subtitle={t('ffmi.subtitle')}
        showBack
        showAvatar={false}
        docId="calc-ffmi"
      />

      {/* Gauge + result */}
      <Card className="items-center">
        <FfmiGauge value={result?.ffmi ?? null} color={band?.color ?? '#3a4356'}>
          <Text className="text-5xl font-extrabold text-ink-50">
            {result ? result.ffmi.toFixed(1) : '—'}
          </Text>
          <Text className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
            FFMI
          </Text>
          {band ? (
            <Text className="mt-1 text-sm font-semibold" style={{ color: band.color }}>
              {t(`ffmi.class.${band.key}`)}
            </Text>
          ) : null}
        </FfmiGauge>

        <View className="mt-4 w-full">
          <FfmiScale value={result?.ffmi ?? null} />
        </View>

        {result ? (
          <View className="mt-5 w-full border-t border-ink-700 pt-3">
            <ResultRow label={t('ffmi.normalized')} value={result.normalizedFfmi.toFixed(1)} />
            <ResultRow
              label={t('ffmi.fatFreeMass')}
              value={
                unit === 'lb'
                  ? `${kgToLb(result.fatFreeMassKg).toFixed(1)} lb`
                  : `${result.fatFreeMassKg.toFixed(1)} kg`
              }
            />
          </View>
        ) : (
          <Text className="mt-4 text-center text-sm text-ink-400">{t('ffmi.prompt')}</Text>
        )}
      </Card>

      {/* Inputs */}
      <View className="mt-6 gap-5">
        <Input
          label={t('ffmi.height')}
          value={height}
          onChangeText={setHeight}
          keyboardType="number-pad"
          placeholder="178"
          maxLength={3}
        />

        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              {t('ffmi.weight')}
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

        <Input
          label={t('ffmi.bodyFat')}
          value={bodyFat}
          onChangeText={setBodyFat}
          keyboardType="decimal-pad"
          placeholder="15"
          maxLength={4}
          hint={t('ffmi.bodyFatHint')}
        />
      </View>
    </Screen>
  );
};

export default FfmiCalculator;
