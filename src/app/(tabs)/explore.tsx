import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BookIcon, type IconProps } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { FadeInUp, Input, Screen } from '@/components/ui';
import { CALC_CONTENT } from '@/features/calculators/content';
import { CALC_META } from '@/features/calculators/registry';
import type { CalcId } from '@/features/calculators/types';
import { getDocs, searchDocs, type DocSection } from '@/features/docs';
import type { DocCategory } from '@/features/docs/types';
import { useI18n, useT, type TranslationKey } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

/**
 * One curated topic per section, mixing the calculators and guides that belong
 * together — the reader thinks in themes ("nutrition"), not in content types
 * ("calculator vs doc"). Every calc id and doc category appears exactly once.
 */
const TOPICS: { key: TranslationKey; calcs: CalcId[]; docCategories: DocCategory[] }[] = [
  {
    key: 'explore.topicTraining',
    calcs: ['onerm', 'plates', 'wilks'],
    docCategories: ['training'],
  },
  {
    key: 'explore.topicNutrition',
    calcs: ['tdee', 'macros', 'protein', 'deficit', 'calsburned', 'water'],
    docCategories: ['nutrition', 'supplements'],
  },
  {
    key: 'explore.topicBody',
    calcs: ['bmi', 'bodyfat', 'ffmi', 'leanmass', 'idealweight', 'whtr'],
    docCategories: ['progress'],
  },
  {
    key: 'explore.topicCardio',
    calcs: ['heartrate'],
    docCategories: ['recovery'],
  },
  {
    key: 'explore.topicBasics',
    calcs: [],
    docCategories: ['getting-started', 'calculators', 'glossary'],
  },
];

type Tile = {
  id: string;
  title: string;
  href: Href;
  icon: ComponentType<IconProps>;
  isDoc?: boolean;
};

/** Square-ish grid tile — two per row, icon on top, short title below. */
const GridTile = ({ tile }: { tile: Tile }) => {
  const router = useRouter();
  const { brand } = useTheme();
  const Icon = tile.icon;
  return (
    <Pressable
      onPress={() => router.push(tile.href)}
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(150,150,150,0.10)' }}
      className="w-[48.5%] rounded-card border border-ink-700 bg-ink-850 p-4 active:opacity-80"
    >
      <View
        className={[
          'h-10 w-10 items-center justify-center rounded-field',
          tile.isDoc ? 'bg-ink-800' : 'bg-brand/15',
        ].join(' ')}
      >
        <Icon color={tile.isDoc ? '#a1a1aa' : brand} size={20} />
      </View>
      <Text numberOfLines={2} className="mt-3 text-sm font-sans-semibold leading-5 text-ink-50">
        {tile.title}
      </Text>
    </Pressable>
  );
};

const SectionHeader = ({ text }: { text: string }) => (
  <Text className="mb-3 mt-7 text-base font-sans-semibold text-ink-100">{text}</Text>
);

/** Short display name: drops the "X calculator" boilerplate the H1s carry. */
const calcTitle = (id: CalcId, locale: 'en' | 'es'): string => {
  const h1 = CALC_CONTENT[id][locale].h1;
  return h1.replace(/^Calculadora de /i, '').replace(/ calculator$/i, '');
};

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
    title: calcTitle(id, locale),
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
    <Screen scroll edges={['top']} contentClassName="px-5 pb-10">
      <TopBar menu showFaq showBeta />

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
