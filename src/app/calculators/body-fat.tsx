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
import type { Sex } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { calculateBodyFatNavy, classifyBodyFat } from '@/features/bodyfat/calc';
import { useT } from '@/i18n';

const BodyFatCalculator = () => {
  const { user, updateMyProfile } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const t = useT();

  const [sex, setSex] = useState<Sex>(user?.sex ?? 'male');
  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user.heightCm) : '');
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');

  const sexSegments: Segment<Sex>[] = [
    { value: 'male', label: t('bmr.male') },
    { value: 'female', label: t('bmr.female') },
  ];

  const result = useMemo(
    () =>
      calculateBodyFatNavy({
        sex,
        heightCm: Number(heightCm),
        neckCm: Number(neck),
        waistCm: Number(waist),
        hipCm: sex === 'female' ? Number(hip) : undefined,
      }),
    [sex, heightCm, neck, waist, hip],
  );

  const onSave = () => {
    if (result === null || !user) return toast.error(t('bmr.fillValid'));
    updateMyProfile({ bodyFatPct: result });
    toast.success(t('bodyfat.savedToast'));
    router.back();
  };

  return (
    <Screen scroll contentClassName="px-5 pb-10">
      <TopBar
        title={t('bodyfat.title')}
        subtitle={t('bodyfat.subtitle')}
        showBack
        showAvatar={false}
        docId="calc-body-fat"
      />

      <View
        className={[
          'rounded-2xl p-5',
          result !== null ? 'bg-accentFill' : 'border border-dashed border-ink-600 bg-ink-800',
        ].join(' ')}
      >
        {result !== null ? (
          <View className="items-center">
            <Text className="text-xs uppercase tracking-wider text-ink-950/60">
              {t('bodyfat.result')}
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-4xl font-extrabold text-ink-950">{result}</Text>
              <Text className="ml-1 text-base font-semibold text-ink-950/70">%</Text>
            </View>
            <Text className="mt-1 text-sm font-semibold text-ink-950/70">
              {t(`bf.${classifyBodyFat(sex, result)}`)}
            </Text>
          </View>
        ) : (
          <Text className="text-center text-sm text-ink-400">{t('bodyfat.prompt')}</Text>
        )}
      </View>

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
              label={t('bmr.heightCm')}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
              placeholder="178"
              maxLength={5}
            />
          </View>
          <View className="flex-1">
            <Input
              label={t('bodyfat.neck')}
              value={neck}
              onChangeText={setNeck}
              keyboardType="decimal-pad"
              placeholder="38"
              maxLength={5}
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label={t('bodyfat.waist')}
              value={waist}
              onChangeText={setWaist}
              keyboardType="decimal-pad"
              placeholder="84"
              maxLength={5}
            />
          </View>
          {sex === 'female' ? (
            <View className="flex-1">
              <Input
                label={t('bodyfat.hip')}
                value={hip}
                onChangeText={setHip}
                keyboardType="decimal-pad"
                placeholder="96"
                maxLength={5}
              />
            </View>
          ) : (
            <View className="flex-1" />
          )}
        </View>

        <Card padded className="bg-ink-850">
          <Text className="text-xs leading-5 text-ink-400">{t('bodyfat.explainer')}</Text>
        </Card>

        <Button label={t('bodyfat.save')} onPress={onSave} disabled={result === null} />
      </View>
    </Screen>
  );
};

export default BodyFatCalculator;
