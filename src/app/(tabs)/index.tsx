import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { GearIcon, PlusIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, GridTile, PressableScale, Screen } from '@/components/ui';
import { AnnouncementModal } from '@/features/announcements/AnnouncementModal';
import { useAuth } from '@/features/auth/auth-context';
import { getQuickAction, type QuickAction } from '@/features/home/quick-actions';
import { PremiumIntroModal } from '@/features/premium/PremiumIntroModal';
import { TodayAdherence } from '@/features/training/components/TodayAdherence';
import { WeekStrip } from '@/features/training/components/WeekStrip';
import { WidgetPromoBanner } from '@/features/widget/components/WidgetPromoBanner';
import { useI18n, useT } from '@/i18n';
import { settings } from '@/lib/storage';

/**
 * Home = today, nothing else: the "did you train?" check-in, the recent weeks
 * at a glance, and the user's own pinned shortcuts. Training lives in its tab —
 * an in-progress session auto-opens via the tabs layout's focus mode.
 */
const Home = () => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();

  // Pinned quick actions live in MMKV; none by default — the invite card below
  // explains how to add them. Re-read on focus so edits show on return.
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => settings.getPinnedActions() ?? []);
  useFocusEffect(
    useCallback(() => {
      setPinnedIds(settings.getPinnedActions() ?? []);
    }, []),
  );
  const pinned = pinnedIds
    .map((id) => getQuickAction(id, locale))
    .filter((a): a is QuickAction => Boolean(a));

  if (!user) return null;

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-32"
      header={<TopBar menu showFaq showBeta />}
    >
      <PremiumIntroModal />
      <AnnouncementModal />

      {/* Today's check-in + the recent weeks at a glance */}
      <FadeInUp>
        <View className="gap-3">
          <TodayAdherence />
          <WeekStrip />
        </View>
      </FadeInUp>

      <WidgetPromoBanner />

      {/* Quick access — user-curated shortcuts */}
      <View className="mb-3 mt-8 flex-row items-center justify-between">
        <Text className="text-sm font-sans-semibold text-ink-200">{t('home.quickActions')}</Text>
        {pinned.length > 0 ? (
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/home-customize')}
            accessibilityRole="button"
            accessibilityLabel={t('home.customize')}
            className="flex-row items-center"
          >
            <GearIcon color="#71717a" size={14} />
            <Text className="ml-1 text-xs font-sans-semibold text-ink-400">
              {t('home.customize')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {pinned.length === 0 ? (
        <FadeInUp>
          <PressableScale onPress={() => router.push('/home-customize')}>
            <Card className="items-center border-dashed py-6">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-ink-800">
                <PlusIcon color="#a1a1aa" size={20} />
              </View>
              <Text className="mt-3 text-center text-sm font-sans-medium text-ink-200">
                {t('home.quickEmptyTitle')}
              </Text>
              <Text className="mt-1 px-6 text-center text-xs text-ink-400">
                {t('home.quickEmptyBody')}
              </Text>
            </Card>
          </PressableScale>
        </FadeInUp>
      ) : (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {pinned.map((action) => (
            <GridTile
              key={action.id}
              tile={{
                id: action.id,
                title: action.title,
                href: action.href,
                icon: action.icon,
                isDoc: action.kind === 'doc',
              }}
            />
          ))}
        </View>
      )}
    </Screen>
  );
};

export default Home;
