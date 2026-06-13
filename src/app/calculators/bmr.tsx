import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Input,
  Screen,
  SegmentedControl,
  useToast,
  type Segment,
} from '@/components/ui';
import type { ActivityLevel, Sex } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { saveBmr } from '@/features/auth/users.repo';
import { ActivityPicker } from '@/features/bmr/components/ActivityPicker';
import {
  calculateBmr,
  formatKcal,
  FORMULAS,
  isValidBmrInput,
  kgToLb,
  lbToKg,
  type BmrFormula,
} from '@/features/bmr/calc';
import { useT } from '@/i18n';
import { settings, type Units } from '@/lib/storage';

const UNIT_SEGMENTS: Segment<Units>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const ResultStat = ({ label, unit, value }: { label: string; unit: string; value: string }) => {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xs uppercase tracking-wider text-ink-950/60">{label}</Text>
      <Text className="mt-1 text-3xl font-extrabold text-ink-950">{value}</Text>
      <Text className="text-xs font-medium text-ink-950/70">{unit}</Text>
    </View>
  );
};

const BmrCalculator = () => {
  const { user, reload } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const t = useT();

  const sexSegments: Segment<Sex>[] = [
    { value: 'male', label: t('bmr.male') },
    { value: 'female', label: t('bmr.female') },
  ];

  // Katch–McArdle needs lean body mass, so it only appears once body fat is saved.
  const hasBodyFat = typeof user?.bodyFatPct === 'number';
  const formulaSegments: Segment<BmrFormula>[] = (Object.keys(FORMULAS) as BmrFormula[])
    .filter((key) => key !== 'katch_mcardle' || hasBodyFat)
    .map((key) => ({ value: key, label: FORMULAS[key].label }));

  const [sex, setSex] = useState<Sex>(user?.sex ?? 'male');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user.heightCm) : '');
  const [unit, setUnit] = useState<Units>(settings.getUnits());
  const [weight, setWeight] = useState(() => {
    if (!user?.weightKg) return '';
    const w = unit === 'lb' ? kgToLb(user.weightKg) : user.weightKg;
    return String(Math.round(w * 10) / 10);
  });
  const [activity, setActivity] = useState<ActivityLevel>(user?.activityLevel ?? 'moderate');
  const [formula, setFormula] = useState<BmrFormula>('harris_benedict');

  const ageNum = Number(age);
  const heightNum = Number(heightCm);
  const weightKg = unit === 'lb' ? lbToKg(Number(weight)) : Number(weight);

  const valid =
    age !== '' &&
    heightCm !== '' &&
    weight !== '' &&
    isValidBmrInput({ age: ageNum, heightCm: heightNum, weightKg });

  const result = useMemo(() => {
    if (!valid) return null;
    return calculateBmr({
      sex,
      age: ageNum,
      heightCm: heightNum,
      weightKg,
      activityLevel: activity,
      formula,
      bodyFatPct: user?.bodyFatPct ?? undefined,
    });
  }, [valid, sex, ageNum, heightNum, weightKg, activity, formula, user?.bodyFatPct]);

  const onUnitChange = (next: Units) => {
    if (next === unit || weight === '') {
      setUnit(next);
      return;
    }
    // Convert the displayed number between units so the underlying mass stays put.
    const current = Number(weight);
    const kg = unit === 'lb' ? lbToKg(current) : current;
    const display = next === 'lb' ? kgToLb(kg) : kg;
    setWeight(String(Math.round(display * 10) / 10));
    setUnit(next);
  };

  const onSave = () => {
    if (!result || !user) {
      toast.error(t('bmr.fillValid'));
      return;
    }
    settings.setUnits(unit);
    saveBmr(user.id, {
      bmr: result.bmr,
      tdee: result.tdee,
      bmrFormula: result.formula,
      sex,
      age: ageNum,
      heightCm: heightNum,
      weightKg: Math.round(weightKg * 10) / 10,
      activityLevel: activity,
    });
    reload();
    toast.success(t('bmr.savedToast'));
    router.back();
  };

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar
        title={t('bmr.title')}
        subtitle={t('bmr.subtitle')}
        showBack
        showAvatar={false}
        docId="calc-bmr"
      />

      {/* Live result */}
      <View
        className={[
          'rounded-2xl p-5',
          result ? 'bg-accentFill' : 'border border-dashed border-ink-600 bg-ink-800',
        ].join(' ')}
      >
        {result ? (
          <View className="flex-row">
            <ResultStat
              label={t('home.bmr')}
              unit={t('home.kcalDay')}
              value={formatKcal(result.bmr)}
            />
            <View className="mx-2 w-px bg-ink-950/15" />
            <ResultStat
              label={t('home.tdee')}
              unit={t('home.kcalDay')}
              value={formatKcal(result.tdee)}
            />
          </View>
        ) : (
          <Text className="text-center text-sm text-ink-400">{t('bmr.prompt')}</Text>
        )}
      </View>

      {/* Inputs */}
      <View className="mt-6 gap-5">
        <SegmentedControl
          label={t('bmr.sex')}
          segments={sexSegments}
          value={sex}
          onChange={setSex}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label={t('bmr.age')}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="25"
              maxLength={3}
            />
          </View>
          <View className="flex-1">
            <Input
              label={t('bmr.heightCm')}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
              placeholder="178"
              maxLength={5}
            />
          </View>
        </View>

        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              {t('bmr.weight')}
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

        <View>
          <SegmentedControl
            label={t('bmr.formula')}
            segments={formulaSegments}
            value={formula}
            onChange={setFormula}
          />
          {!hasBodyFat ? (
            <Text className="mt-1.5 text-xs text-ink-400">{t('bmr.katchHint')}</Text>
          ) : null}
        </View>

        <Card padded className="bg-ink-850">
          <Text className="text-xs leading-5 text-ink-400">{t('bmr.explainer')}</Text>
        </Card>

        <Button label={t('bmr.save')} onPress={onSave} disabled={!result} />
      </View>
    </Screen>
  );
};

export default BmrCalculator;
