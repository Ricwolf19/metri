import { FlashList } from '@shopify/flash-list';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CompareIcon, PlusIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { ChipRow, EmptyState, Screen, ScreenTitle, type ChipItem } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { dateFromKey } from '@/features/training/dates';
import { LockGate } from '@/features/app-lock/LockGate';
import { useAuth } from '@/features/auth/auth-context';
import {
  commonestPose,
  comparable,
  filterTimeline,
  poseLabelKey,
  POSES,
  type TimelineFilter,
} from '@/features/photos/checkins';
import { CheckinCard } from '@/features/photos/components/CheckinCard';
import { ProgressEmpty } from '@/features/photos/components/ProgressEmpty';
import { useProgressLog, type ProgressEntry } from '@/features/photos/useProgressLog';
import { useT } from '@/i18n';
import { useDateFormat } from '@/lib/useDateFormat';
import { useUnits } from '@/lib/useUnits';
import { useTheme } from '@/theme/theme-context';

/** One row of the virtualized timeline: a month heading, or a check-in under it. */
type Item =
  { kind: 'month'; key: string; title: string } | { kind: 'checkin'; entry: ProgressEntry };

/**
 * The progress timeline: every photo check-in, newest first under month
 * headings, narrowed by pose or to the clips. It grows a card a week for
 * years, so the list virtualizes and IS the scroller (AGENTS "Long lists");
 * the title, the filter and the compare action ride as its header.
 */
const ProgressContent = () => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  const { brand, brandContrast } = useTheme();
  const { monthYear } = useDateFormat();
  const { units } = useUnits();
  const { entries, keySite } = useProgressLog(user?.id ?? '', user?.sex ?? null);
  const [filter, setFilter] = useState<TimelineFilter>('all');

  if (!user) return <Redirect href="/" />;

  const shown = filterTimeline(entries, filter);
  const items: Item[] = [];
  let lastMonth = '';
  for (const entry of shown) {
    const key = entry.checkin.date.slice(0, 7);
    if (key !== lastMonth) {
      items.push({ kind: 'month', key, title: monthYear(dateFromKey(`${key}-01`)) });
      lastMonth = key;
    }
    items.push({ kind: 'checkin', entry });
  }

  const canCompare = comparable(entries, commonestPose(entries)).length >= 2;
  const filters: ChipItem<TimelineFilter>[] = [
    { value: 'all', label: t('common.all') },
    ...POSES.map((pose) => ({ value: pose, label: t(poseLabelKey(pose)) })),
    { value: 'video', label: t('photos.filterClips') },
  ];

  const capture = (params: { checkin?: string; pose?: string } = {}) =>
    router.push({ pathname: '/progress/capture', params });

  const addButton = (
    <Pressable
      hitSlop={8}
      onPress={() => capture()}
      accessibilityRole="button"
      accessibilityLabel={t('photos.newCheckin')}
      className="min-h-11 min-w-11 items-center justify-center rounded-full bg-brand"
    >
      <PlusIcon color={brandContrast} size={20} strokeWidth={2.5} />
    </Pressable>
  );

  const header = (
    <View className="pb-2">
      <ScreenTitle title={t('photos.title')} subtitle={t('photos.subtitle')} />
      {entries.length ? (
        <>
          <ChipRow items={filters} value={filter} onChange={setFilter} />
          {canCompare ? (
            <Pressable
              onPress={() => router.push('/progress/compare')}
              accessibilityRole="button"
              className="mt-3 min-h-11 flex-row items-center justify-center gap-2 rounded-field border border-brand/30 bg-brand/10 px-4"
            >
              <CompareIcon color={brand} size={18} />
              <Text
                maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                numberOfLines={1}
                className="shrink text-sm font-sans-semibold text-brand"
              >
                {t('photos.compare')}
              </Text>
            </Pressable>
          ) : (
            <Text className="mt-3 text-xs leading-5 text-ink-500">{t('photos.needTwo')}</Text>
          )}
        </>
      ) : null}
    </View>
  );

  return (
    <Screen
      edges={['top']}
      contentClassName="px-5"
      header={<TopBar showBack showAvatar={false} right={addButton} />}
    >
      <FlashList
        data={items}
        keyExtractor={(item) => (item.kind === 'month' ? `m:${item.key}` : item.entry.checkin.id)}
        getItemType={(item) => (item.kind === 'month' ? 'month' : `checkin:${filter}`)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={header}
        ListEmptyComponent={
          entries.length ? (
            <EmptyState hint={t('photos.filterEmpty')} />
          ) : (
            <ProgressEmpty onStart={() => capture()} />
          )
        }
        renderItem={({ item }) =>
          item.kind === 'month' ? (
            <Text
              accessibilityRole="header"
              className="mb-2 mt-4 font-mono-medium text-xs uppercase tracking-wider text-ink-400"
            >
              {item.title}
            </Text>
          ) : (
            <CheckinCard
              entry={item.entry}
              filter={filter}
              keySite={keySite}
              units={units}
              onOpen={(id) => router.push({ pathname: '/progress/checkin/[id]', params: { id } })}
              onOpenMedia={(id) => router.push({ pathname: '/progress/[id]', params: { id } })}
              onAddPose={(checkin, pose) => capture({ checkin, pose })}
            />
          )
        }
      />
    </Screen>
  );
};

/** Behind the private-section lock when the lifter turned it on (`features/app-lock`). */
const Progress = () => (
  <LockGate section="photos">
    <ProgressContent />
  </LockGate>
);

export default Progress;
