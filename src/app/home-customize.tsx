import { useState } from 'react';
import { Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { GridTile, Screen, ScreenTitle } from '@/components/ui';
import { TOPICS } from '@/features/explore/topics';
import { getQuickActions, type QuickAction } from '@/features/home/quick-actions';
import { useI18n, useT } from '@/i18n';
import { settings } from '@/lib/storage';

const PinBadge = ({ active }: { active: boolean }) => (
  <View
    className={[
      'h-5 w-5 items-center justify-center rounded-full',
      active ? 'bg-brand' : 'border border-ink-600 bg-ink-800',
    ].join(' ')}
  >
    {active ? <CheckIcon color="#08090d" size={12} /> : null}
  </View>
);

/**
 * Quick-access picker: the full catalogue (every calculator + guide + extras),
 * sectioned by the same themes as Explore. Tapping a tile toggles its pin; the
 * pinned order follows the catalogue so Home stays predictably grouped.
 */
const HomeCustomize = () => {
  const t = useT();
  const { locale } = useI18n();
  const [pinned, setPinned] = useState<string[]>(() => settings.getPinnedActions() ?? []);

  const catalogue = getQuickActions(locale);

  const toggle = (id: string) => {
    const next = pinned.includes(id)
      ? pinned.filter((p) => p !== id)
      : catalogue.filter((a) => a.id === id || pinned.includes(a.id)).map((a) => a.id);
    setPinned(next);
    settings.setPinnedActions(next);
  };

  const tileFor = (action: QuickAction) => ({
    id: action.id,
    title: action.title,
    href: action.href,
    icon: action.icon,
    isDoc: action.kind === 'doc',
    badge: <PinBadge active={pinned.includes(action.id)} />,
    onPress: () => toggle(action.id),
  });

  // Same sectioning as Explore: a topic owns its calc ids + doc categories;
  // whatever no topic claims (photos, …) lands in a trailing bucket.
  const claimed = new Set<string>();
  const sections = TOPICS.map((topic) => {
    const calcIds = new Set(topic.calcs.map((c) => `calc-${c}`));
    const docCats = new Set<string>(topic.docCategories);
    const actions = catalogue.filter(
      (a) =>
        (a.kind === 'calc' && calcIds.has(a.id)) ||
        (a.kind === 'doc' && !!a.docCategory && docCats.has(a.docCategory)),
    );
    actions.forEach((a) => claimed.add(a.id));
    return { key: topic.key, actions };
  });
  const leftovers = catalogue.filter((a) => !claimed.has(a.id));

  return (
    <Screen scroll contentClassName="px-5 pb-12" header={<TopBar showBack showAvatar={false} />}>
      <ScreenTitle title={t('home.customizeTitle')} subtitle={t('home.customizeSub')} />

      {sections.map(({ key, actions }) =>
        actions.length ? (
          <View key={key}>
            <Text className="mb-3 mt-6 text-base font-sans-semibold text-ink-100">{t(key)}</Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {actions.map((action) => (
                <GridTile key={action.id} tile={tileFor(action)} />
              ))}
            </View>
          </View>
        ) : null,
      )}

      {leftovers.length ? (
        <View>
          <Text className="mb-3 mt-6 text-base font-sans-semibold text-ink-100">
            {t('home.customizeMore')}
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {leftovers.map((action) => (
              <GridTile key={action.id} tile={tileFor(action)} />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
};

export default HomeCustomize;
