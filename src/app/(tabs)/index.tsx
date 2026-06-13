import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { CameraIcon, ChevronRightIcon, FlameIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const Stat = ({ label, value, unit }: { label: string; value: string; unit: string }) => {
  return (
    <View className="flex-1">
      <Text className="text-xs uppercase tracking-wider text-ink-400">{label}</Text>
      <View className="mt-1 flex-row items-baseline">
        <Text className="text-2xl font-bold text-ink-50">{value}</Text>
        <Text className="ml-1 text-sm text-ink-400">{unit}</Text>
      </View>
    </View>
  );
};

const Home = () => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  const { accent } = useTheme();

  const firstName = (user?.displayName ?? user?.username ?? '').split(' ')[0];
  const hasBmr = typeof user?.bmr === 'number' && typeof user?.tdee === 'number';

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-8">
      <TopBar
        title={t('home.greeting', { name: firstName || t('home.lifter') })}
        subtitle={t('home.subtitle')}
      />

      <FadeInUp>
        {hasBmr ? (
          <Card className="mt-1">
            <View className="mb-4 flex-row items-center">
              <FlameIcon color={accent} size={18} />
              <Text className="ml-2 text-xs font-semibold uppercase tracking-wider text-accent">
                {t('home.energy')}
              </Text>
            </View>
            <View className="flex-row">
              <Stat
                label={t('home.bmr')}
                value={String(Math.round(user!.bmr!))}
                unit={t('home.kcalDay')}
              />
              <Stat
                label={t('home.tdee')}
                value={String(Math.round(user!.tdee!))}
                unit={t('home.kcalDay')}
              />
            </View>
            <Text className="mt-4 text-xs text-ink-400">
              {user?.activityLevel ? t(`activity.${user.activityLevel}`) : ''} ·{' '}
              {user?.bmrFormula === 'mifflin_st_jeor' ? 'Mifflin–St Jeor' : 'Harris–Benedict'}
            </Text>
          </Card>
        ) : (
          <Card className="mt-1">
            <Text className="text-base font-semibold text-ink-50">{t('home.noMetrics')}</Text>
            <Text className="mt-1 text-sm text-ink-400">{t('home.noMetricsBody')}</Text>
            <PressableScale
              onPress={() => router.push('/calculators/bmr')}
              className="mt-4 flex-row items-center justify-between rounded-xl bg-accentFill px-4 py-3"
            >
              <Text className="font-semibold text-ink-950">{t('home.openBmr')}</Text>
              <ChevronRightIcon color="#08090d" size={18} />
            </PressableScale>
          </Card>
        )}
      </FadeInUp>

      <Text className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wider text-ink-400">
        {t('home.quickActions')}
      </Text>
      <FadeInUp delay={80}>
        <PressableScale onPress={() => router.push('/calculators/bmr')}>
          <Card className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-base font-semibold text-ink-50">{t('home.hbTitle')}</Text>
              <Text className="mt-0.5 text-sm text-ink-400">{t('home.hbSubtitle')}</Text>
            </View>
            <ChevronRightIcon color="#566077" />
          </Card>
        </PressableScale>
      </FadeInUp>

      <FadeInUp delay={140}>
        <PressableScale onPress={() => router.push('/progress')} className="mt-3">
          <Card className="flex-row items-center">
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-lime-400/15">
              <CameraIcon color={accent} size={22} />
            </View>
            <View className="flex-1 pr-2">
              <Text className="text-base font-semibold text-ink-50">{t('home.progress')}</Text>
              <Text className="mt-0.5 text-sm text-ink-400">{t('home.progressSub')}</Text>
            </View>
            <ChevronRightIcon color="#566077" />
          </Card>
        </PressableScale>
      </FadeInUp>
    </Screen>
  );
};

export default Home;
