import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon, FlameIcon, GearIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  DEFAULT_PINNED_ACTIONS,
  getQuickAction,
  type QuickAction,
} from '@/features/home/quick-actions';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
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

const QuickActionCard = ({ action }: { action: QuickAction }) => {
  const router = useRouter();
  const t = useT();
  const { accent } = useTheme();
  const Icon = action.icon;
  return (
    <PressableScale onPress={() => router.push(action.href)}>
      <Card className="flex-row items-center">
        <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-lime-400/15">
          <Icon color={accent} size={22} />
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-base font-semibold text-ink-50">{t(action.titleKey)}</Text>
          <Text className="mt-0.5 text-sm text-ink-400">{t(action.subKey)}</Text>
        </View>
        <ChevronRightIcon color="#566077" />
      </Card>
    </PressableScale>
  );
};

const Home = () => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  const { accent } = useTheme();

  const firstName = (user?.displayName ?? user?.username ?? '').split(' ')[0];
  const hasBmr = typeof user?.bmr === 'number' && typeof user?.tdee === 'number';

  // Pinned quick actions live in MMKV; re-read whenever Home regains focus so
  // edits made on the customize screen show immediately on return.
  const [pinnedIds, setPinnedIds] = useState<string[]>(
    () => settings.getPinnedActions() ?? DEFAULT_PINNED_ACTIONS,
  );
  useFocusEffect(
    useCallback(() => {
      setPinnedIds(settings.getPinnedActions() ?? DEFAULT_PINNED_ACTIONS);
    }, []),
  );
  const pinned = pinnedIds.map(getQuickAction).filter((a): a is QuickAction => Boolean(a));

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

      <View className="mb-2 mt-8 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          {t('home.quickActions')}
        </Text>
        <Pressable
          hitSlop={8}
          onPress={() => router.push('/home-customize')}
          accessibilityRole="button"
          accessibilityLabel={t('home.customize')}
          className="flex-row items-center"
        >
          <GearIcon color="#566077" size={14} />
          <Text className="ml-1 text-xs font-semibold text-ink-400">{t('home.customize')}</Text>
        </Pressable>
      </View>

      {pinned.length === 0 ? (
        <FadeInUp>
          <PressableScale onPress={() => router.push('/home-customize')}>
            <Card className="items-center py-6">
              <Text className="text-center text-sm text-ink-400">{t('home.noPinned')}</Text>
            </Card>
          </PressableScale>
        </FadeInUp>
      ) : (
        <View className="gap-3">
          {pinned.map((action, i) => (
            <FadeInUp key={action.id} delay={i * 70}>
              <QuickActionCard action={action} />
            </FadeInUp>
          ))}
        </View>
      )}
    </Screen>
  );
};

export default Home;
