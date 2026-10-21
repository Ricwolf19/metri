import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { BookIcon, DumbbellIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Deferred, FadeInUp, GridTile, Input, Screen, type Tile } from '@/components/ui';
import { CALC_CONTENT } from '@/features/calculators/content';
import { CALC_META, calcShortTitle } from '@/features/calculators/registry';
import type { CalcId } from '@/features/calculators/types';
import { getDocs, searchDocs, type DocSection } from '@/features/docs';
import { KnowledgeCheckCard } from '@/features/explore/KnowledgeCheckCard';
import { TOPICS } from '@/features/explore/topics';
import { useSpotlight } from '@/features/spotlight/SpotlightProvider';
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
  const spotlight = useSpotlight();
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

  // Tiles keep their identity across renders (the search re-renders this
  // screen per keystroke), so the memoised `GridTile` actually skips.
  const { calcTile, docTile, libraryTile } = useMemo(() => {
    const calcTiles = new Map<CalcId, Tile>(
      CALC_META.map((m) => [
        m.id,
        {
          id: `calc-${m.id}`,
          title: calcShortTitle(m.id, locale),
          href: { pathname: '/calculators/[id]', params: { id: m.id } },
          icon: iconOf.get(m.id) ?? BookIcon,
        },
      ]),
    );
    const docTiles = new Map<string, Tile>(
      docs.map((doc) => [
        doc.id,
        {
          id: `doc-${doc.id}`,
          title: doc.title,
          href: { pathname: '/docs/[id]', params: { id: doc.id } },
          icon: BookIcon,
          isDoc: true,
        },
      ]),
    );
    // The exercise library is consultable knowledge, so it lives here too.
    const library: Tile = {
      id: 'exercise-library',
      title: t('exercise.library'),
      href: '/training/exercises',
      icon: DumbbellIcon,
    };
    // Every id passed in comes from the same CALC_META / docs these maps were
    // built from; the fallback only keeps the type honest.
    return {
      calcTile: (id: CalcId): Tile => calcTiles.get(id) ?? library,
      docTile: (doc: DocSection): Tile => docTiles.get(doc.id) ?? library,
      libraryTile: library,
    };
  }, [docs, iconOf, locale, t]);

  const needle = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!needle) return null;
    const calcMatches = CALC_META.filter((m) =>
      CALC_CONTENT[m.id][locale].h1.toLowerCase().includes(needle),
    ).map((m) => calcTile(m.id));
    const docMatches = searchDocs(docs, needle).map(docTile);
    const libraryMatch = libraryTile.title.toLowerCase().includes(needle) ? [libraryTile] : [];
    return [...libraryMatch, ...calcMatches, ...docMatches];
  }, [needle, locale, docs, calcTile, docTile, libraryTile]);

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-32"
      header={<TopBar menu showFaq showBeta />}
      onPullHold={spotlight?.open}
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
        <>
          <KnowledgeCheckCard />
          {TOPICS.map((topic, i) => {
            const tiles: Tile[] = [
              ...(topic.key === 'explore.topicTraining' ? [libraryTile] : []),
              ...topic.calcs.map(calcTile),
              ...topic.docCategories.flatMap((cat) =>
                docs.filter((d) => d.category === cat).map(docTile),
              ),
            ];
            if (!tiles.length) return null;
            const block = (
              <FadeInUp delay={i * 50}>
                <SectionHeader text={t(topic.key)} />
                <View className="flex-row flex-wrap justify-between gap-y-3">
                  {tiles.map((tile) => (
                    <GridTile key={tile.id} tile={tile} />
                  ))}
                </View>
              </FadeInUp>
            );
            // Sixty-odd tiles: the topics below the fold mount after the transition.
            return i < 2 ? (
              <View key={topic.key}>{block}</View>
            ) : (
              <Deferred key={topic.key} order={i - 2}>
                {block}
              </Deferred>
            );
          })}
        </>
      )}
    </Screen>
  );
};

export default Explore;
