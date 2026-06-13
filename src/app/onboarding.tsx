import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  BrandLogo,
  Button,
  Input,
  Screen,
  SegmentedControl,
  useToast,
  type Segment,
} from '@/components/ui';
import type { ActivityLevel, Sex } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { ACTIVITY_LEVELS } from '@/features/bmr/calc';
import { LOCALES, useI18n } from '@/i18n';
import { settings, type Units } from '@/lib/storage';
import { ThemeSelect } from '@/theme/ThemeSelect';

const Onboarding = () => {
  const { t, locale, setLocale } = useI18n();
  const { finishOnboarding } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [units, setUnits] = useState<Units>(settings.getUnits());
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');

  const localeSegments: Segment<'en' | 'es'>[] = LOCALES.map((l) => ({
    value: l.value,
    label: t(l.key),
  }));
  const unitSegments: Segment<Units>[] = [
    { value: 'kg', label: 'kg / cm' },
    { value: 'lb', label: 'lb / cm' },
  ];
  const sexSegments: Segment<Sex>[] = [
    { value: 'male', label: t('bmr.male') },
    { value: 'female', label: t('bmr.female') },
  ];
  const activitySegments: Segment<ActivityLevel>[] = ACTIVITY_LEVELS.map((key) => ({
    value: key,
    label: t(`activity.${key}`),
  }));

  const persist = (withMetrics: boolean) => {
    settings.setUnits(units);
    const ageN = Number(age);
    const heightN = Number(heightCm);
    const weightN = Number(weight);
    const hasMetrics =
      withMetrics && ageN > 0 && heightN > 0 && weightN > 0 && Number.isFinite(weightN);

    finishOnboarding(
      hasMetrics
        ? {
            sex,
            age: ageN,
            heightCm: heightN,
            weightKg: units === 'lb' ? Math.round((weightN / 2.2046) * 10) / 10 : weightN,
            activityLevel: activity,
          }
        : {},
    );
    toast.success(t('onb.savedToast'));
    router.replace('/(tabs)');
  };

  return (
    <Screen scroll contentClassName="grow px-6 py-10">
      <View className="items-center">
        <BrandLogo width={140} />
      </View>

      <Text className="mt-6 text-center text-2xl font-bold text-ink-50">{t('onb.welcome')}</Text>
      <Text className="mb-8 mt-1 text-center text-sm text-ink-400">{t('onb.subtitle')}</Text>

      <View className="gap-6">
        <SegmentedControl
          label={t('onb.language')}
          segments={localeSegments}
          value={locale}
          onChange={setLocale}
        />
        <SegmentedControl
          label={t('onb.units')}
          segments={unitSegments}
          value={units}
          onChange={setUnits}
        />
        <View>
          <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-300">
            {t('theme.title')}
          </Text>
          <ThemeSelect />
        </View>

        <View className="h-px bg-ink-700" />

        <View>
          <Text className="text-base font-semibold text-ink-50">{t('onb.aboutYou')}</Text>
          <Text className="mt-0.5 text-xs text-ink-400">{t('onb.aboutYouHint')}</Text>
        </View>

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
              placeholder="28"
              maxLength={3}
            />
          </View>
          <View className="flex-1">
            <Input
              label={t('bmr.heightCm')}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
              placeholder="175"
              maxLength={5}
            />
          </View>
        </View>

        <Input
          label={`${t('bmr.weight')} (${units})`}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder={units === 'kg' ? '72' : '160'}
          maxLength={6}
        />

        <SegmentedControl
          label={t('bmr.activity')}
          segments={activitySegments}
          value={activity}
          onChange={setActivity}
        />

        <View className="mt-2 gap-3">
          <Button label={t('onb.finish')} onPress={() => persist(true)} />
          <Button label={t('common.skip')} variant="ghost" onPress={() => persist(false)} />
        </View>
      </View>
    </Screen>
  );
};

export default Onboarding;
