import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ChevronRightIcon, PlusIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, PressableScale, Screen, SectionLabel } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { warmupCopy } from '@/features/training/warmup-content';
import { warmupsQuery } from '@/features/training/warmups.repo';
import { useI18n, useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

/**
 * Warm-up and mobility routines — the work around the session. Shipped routines
 * follow RAMP (raise, activate, mobilise, then ramp into the load); a user's
 * own sit beside them and can say whatever they need.
 */
const Warmups = () => {
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const { brand, muted } = useTheme();
  const userId = user?.id ?? '';
  const { data: routines } = useLiveQuery(warmupsQuery(userId), [userId]);

  if (!user) return <Redirect href="/" />;

  const rows = routines.map((r) => ({ row: r, copy: warmupCopy(r, locale) }));
  const groups = [
    { kind: 'warmup' as const, label: t('warmup.sectionWarmup') },
    { kind: 'mobility' as const, label: t('warmup.sectionMobility') },
  ];

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={
        <TopBar showBack showAvatar={false} title={t('warmup.title')} subtitle={t('warmup.sub')} />
      }
    >
      <Card className="mb-2 border-brand/25 bg-brand/5">
        <Text className="text-sm leading-6 text-ink-200">{t('warmup.why')}</Text>
      </Card>

      {groups.map((group) => {
        const list = rows.filter((r) => r.row.kind === group.kind);
        if (!list.length) return null;
        return (
          <View key={group.kind}>
            <SectionLabel label={group.label} />
            <View className="gap-2">
              {list.map(({ row, copy }, i) => (
                <FadeInUp key={row.id} delay={Math.min(i, 5) * 40}>
                  <PressableScale
                    onPress={() =>
                      router.push({ pathname: '/training/warmup/[id]', params: { id: row.id } })
                    }
                  >
                    <Card className="flex-row items-center">
                      <View className="flex-1 pr-3">
                        <Text className="text-base font-sans-semibold text-ink-50">
                          {copy.name}
                        </Text>
                        <Text className="mt-0.5 text-xs leading-5 text-ink-400" numberOfLines={2}>
                          {copy.description}
                        </Text>
                        <Text className="mt-1 font-mono-medium text-[11px] uppercase tracking-wider text-ink-500">
                          {t('warmup.stepCount', { count: copy.steps.length })}
                        </Text>
                      </View>
                      <ChevronRightIcon color={muted} size={18} />
                    </Card>
                  </PressableScale>
                </FadeInUp>
              ))}
            </View>
          </View>
        );
      })}

      <PressableScale className="mt-6" onPress={() => router.push('/training/warmup/new')}>
        <Card className="flex-row items-center border-brand/30 bg-brand/10">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
            <PlusIcon color={brand} size={22} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-base font-sans-semibold text-ink-50">{t('warmup.create')}</Text>
            <Text className="mt-0.5 text-sm text-ink-400">{t('warmup.createSub')}</Text>
          </View>
          <ChevronRightIcon color={brand} />
        </Card>
      </PressableScale>
    </Screen>
  );
};

export default Warmups;
