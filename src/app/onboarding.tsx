import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ControlledInput, ControlledSegmentedControl, useSaveForm } from '@/components/form';
import {
  BrandLogo,
  Button,
  Screen,
  SegmentedControl,
  useToast,
  type Segment,
} from '@/components/ui';
import type { ActivityLevel, Sex } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { quizUrl } from '@/features/beta/links';
import { ACTIVITY_LEVELS, lbToKg } from '@/features/bmr/calc';
import { LOCALES, useI18n } from '@/i18n';
import { settings, type Units } from '@/lib/storage';
import { openExternal } from '@/lib/open-external';

/** Preferences → about you → the optional knowledge check. */
const STEPS = 3;

type AboutYou = {
  sex: Sex;
  age: string;
  heightCm: string;
  weight: string;
  activity: ActivityLevel;
};

const Onboarding = () => {
  const { t, locale, setLocale } = useI18n();
  const { finishOnboarding } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [units, setUnits] = useState<Units>(settings.getUnits());
  const [step, setStep] = useState(0);

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

  // Saved when "about you" is left, so the quiz step runs as an onboarded user
  // and quitting the app there never replays the form.
  const persist = (about: AboutYou, withMetrics: boolean) => {
    settings.setUnits(units);
    const ageN = Number(about.age);
    const heightN = Number(about.heightCm);
    const weightN = Number(about.weight);
    const hasMetrics =
      withMetrics && ageN > 0 && heightN > 0 && weightN > 0 && Number.isFinite(weightN);

    finishOnboarding(
      hasMetrics
        ? {
            sex: about.sex,
            age: ageN,
            heightCm: heightN,
            weightKg: units === 'lb' ? Math.round(lbToKg(weightN) * 10) / 10 : weightN,
            activityLevel: about.activity,
          }
        : {},
    );
    toast.success(t('onb.savedToast'));
    setStep(2);
  };
  // `create`: Finish and Skip share one gate, so the profile is written once.
  const about = useSaveForm<AboutYou>({
    kind: 'create',
    defaultValues: { sex: 'male', age: '', heightCm: '', weight: '', activity: 'moderate' },
    onSave: (values) => persist(values, true),
  });

  return (
    <Screen scroll contentClassName="grow px-6 py-10">
      <View className="items-center">
        <BrandLogo width={140} />
      </View>

      <Text className="mt-6 text-center text-2xl font-sans-bold text-ink-50">
        {t('onb.welcome')}
      </Text>
      <Text className="mt-1 text-center text-sm text-ink-400">{t('onb.subtitle')}</Text>
      <Text className="mb-8 mt-3 text-center font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('onb.step', { n: step + 1, total: STEPS })}
      </Text>

      {step === 0 ? (
        <View className="gap-6">
          <SegmentedControl
            label={t('onb.language')}
            segments={localeSegments}
            value={locale}
            onChange={(next) => {
              if (next !== locale) setLocale(next);
            }}
          />
          <SegmentedControl
            label={t('onb.units')}
            segments={unitSegments}
            value={units}
            onChange={setUnits}
          />
          <Button variant="brand" label={t('onb.next')} onPress={() => setStep(1)} />
        </View>
      ) : step === 1 ? (
        <View className="gap-6">
          <View>
            <Text className="text-base font-sans-semibold text-ink-50">{t('onb.aboutYou')}</Text>
            <Text className="mt-0.5 text-xs text-ink-400">{t('onb.aboutYouHint')}</Text>
          </View>

          <ControlledSegmentedControl
            control={about.control}
            name="sex"
            label={t('bmr.sex')}
            segments={sexSegments}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <ControlledInput
                control={about.control}
                name="age"
                label={t('bmr.age')}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View className="flex-1">
              <ControlledInput
                control={about.control}
                name="heightCm"
                label={t('bmr.heightCm')}
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
          </View>

          <ControlledInput
            control={about.control}
            name="weight"
            label={`${t('bmr.weight')} (${units})`}
            keyboardType="decimal-pad"
            maxLength={6}
          />

          <ControlledSegmentedControl
            control={about.control}
            name="activity"
            label={t('bmr.activity')}
            segments={activitySegments}
          />

          <View className="mt-2 gap-3">
            <Button variant="brand" label={t('onb.finish')} onPress={() => about.submit()} />
            <Button
              label={t('common.skip')}
              variant="ghost"
              onPress={() => about.submit((values) => persist(values, false))}
            />
            <Button label={t('onb.back')} variant="ghost" onPress={() => setStep(0)} />
          </View>
        </View>
      ) : (
        <View className="gap-6">
          <View>
            <Text className="text-base font-sans-semibold text-ink-50">{t('onb.quizTitle')}</Text>
            <Text className="mt-1 text-sm leading-6 text-ink-400">{t('onb.quizBody')}</Text>
          </View>
          <View className="gap-3">
            <Button
              variant="brand"
              label={t('onb.quizStart')}
              onPress={() => {
                // The check lives on the website; the app is done setting up either way.
                openExternal(quizUrl(locale));
                router.replace('/(tabs)');
              }}
            />
            <Button
              label={t('onb.quizLater')}
              variant="ghost"
              onPress={() => router.replace('/(tabs)')}
            />
          </View>
        </View>
      )}
    </Screen>
  );
};

export default Onboarding;
