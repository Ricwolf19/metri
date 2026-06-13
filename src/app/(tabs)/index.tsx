import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon, FlameIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';

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

  const firstName = (user?.displayName ?? user?.username ?? '').split(' ')[0];
  const hasBmr = typeof user?.bmr === 'number' && typeof user?.tdee === 'number';

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-8">
      <TopBar
        title={t('home.greeting', { name: firstName || t('home.lifter') })}
        subtitle={t('home.subtitle')}
      />

      {hasBmr ? (
        <Card className="mt-1">
          <View className="mb-4 flex-row items-center">
            <FlameIcon color="#bef82b" size={18} />
            <Text className="ml-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
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
          <Pressable
            onPress={() => router.push('/calculators/bmr')}
            className="mt-4 flex-row items-center justify-between rounded-xl bg-lime-400 px-4 py-3"
          >
            <Text className="font-semibold text-ink-950">{t('home.openBmr')}</Text>
            <ChevronRightIcon color="#08090d" size={18} />
          </Pressable>
        </Card>
      )}

      <Text className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wider text-ink-400">
        {t('home.quickActions')}
      </Text>
      <Pressable onPress={() => router.push('/calculators/bmr')}>
        <Card className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold text-ink-50">{t('home.hbTitle')}</Text>
            <Text className="mt-0.5 text-sm text-ink-400">{t('home.hbSubtitle')}</Text>
          </View>
          <ChevronRightIcon color="#566077" />
        </Card>
      </Pressable>
    </Screen>
  );
};

export default Home;
