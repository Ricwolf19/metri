import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { BookIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { FadeInUp, GridTile, Input, Screen, type Tile } from '@/components/ui';
import { CALC_CONTENT } from '@/features/calculators/content';
import { CALC_META, calcShortTitle } from '@/features/calculators/registry';
import type { CalcId } from '@/features/calculators/types';
import { getDocs, searchDocs, type DocSection } from '@/features/docs';
import { TOPICS } from '@/features/explore/topics';
import { useI18n, useT } from '@/i18n';

const SectionHeader = ({ text }: { text: string }) => (
  <Text className="mb-3 mt-7 text-base font-sans-semibold text-ink-100">{text}</Text>
);

/**
 * Explore tab — every calculator and guide in one place, sectioned by theme so
 * related tools and reading sit together instead of two endless lists.
 */
const Explore = () => {
  const t = useT();
  const { locale } = useI18n();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? '');

  // Adopt an incoming ?q= (doc tag taps) even after first mount.
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setQuery(q ?? '');
  }

  const docs = useMemo(() => getDocs(locale), [locale]);
  const iconOf = useMemo(() => new Map(CALC_META.map((m) => [m.id, m.icon])), []);

  const calcTile = (id: CalcId): Tile => ({
    id: `calc-${id}`,
    title: calcShortTitle(id, locale),
    href: { pathname: '/calculators/[id]', params: { id } },
    icon: iconOf.get(id) ?? BookIcon,
  });
  const docTile = (doc: DocSection): Tile => ({
    id: `doc-${doc.id}`,
    title: doc.title,
    href: { pathname: '/docs/[id]', params: { id: doc.id } },
    icon: BookIcon,
    isDoc: true,
  });

  const needle = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!needle) return null;
    const calcMatches = CALC_META.filter((m) =>
      CALC_CONTENT[m.id][locale].h1.toLowerCase().includes(needle),
    ).map((m) => calcTile(m.id));
    const docMatches = searchDocs(docs, needle).map(docTile);
    return [...calcMatches, ...docMatches];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle, locale, docs]);

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-32"
      header={<TopBar menu showFaq showBeta />}
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={t('explore.searchPh')}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {results ? (
        results.length ? (
          <View className="mt-5 flex-row flex-wrap justify-between gap-y-3">
            {results.map((tile) => (
              <GridTile key={tile.id} tile={tile} />
            ))}
          </View>
        ) : (
          <Text className="mt-10 text-center text-sm text-ink-400">{t('explore.noResults')}</Text>
        )
      ) : (
        TOPICS.map((topic, i) => {
          const tiles: Tile[] = [
            ...topic.calcs.map(calcTile),
            ...topic.docCategories.flatMap((cat) =>
              docs.filter((d) => d.category === cat).map(docTile),
            ),
          ];
          if (!tiles.length) return null;
          return (
            <FadeInUp key={topic.key} delay={i * 50}>
              <SectionHeader text={t(topic.key)} />
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {tiles.map((tile) => (
                  <GridTile key={tile.id} tile={tile} />
                ))}
              </View>
            </FadeInUp>
          );
        })
      )}
    </Screen>
  );
};

export default Explore;
