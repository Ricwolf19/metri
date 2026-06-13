import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, Input, PressableScale, Screen } from '@/components/ui';
import { DOC_CATEGORIES, getDocs, searchDocs, type DocSection } from '@/features/docs';
import { useI18n } from '@/i18n';

const DocRow = ({
  section,
  delay,
  onPress,
}: {
  section: DocSection;
  delay: number;
  onPress: (id: string) => void;
}) => (
  <FadeInUp delay={delay}>
    <PressableScale onPress={() => onPress(section.id)}>
      <Card className="flex-row items-center">
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-ink-50">{section.title}</Text>
          <Text numberOfLines={1} className="mt-0.5 text-xs text-ink-400">
            {section.tags
              .slice(0, 3)
              .map((tag) => `#${tag}`)
              .join('  ')}
          </Text>
        </View>
        <ChevronRightIcon color="#566077" />
      </Card>
    </PressableScale>
  </FadeInUp>
);

const Docs = () => {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? '');

  // Apply a tag tapped on a doc detail (even if this tab was already mounted) by
  // adjusting state during render when the param changes — React's recommended
  // pattern, no effect needed.
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    if (typeof q === 'string') setQuery(q);
  }

  const docs = getDocs(locale);
  const results = useMemo(() => (query.trim() ? searchDocs(docs, query) : null), [docs, query]);

  const open = (id: string) => router.push({ pathname: '/docs/[id]', params: { id } });

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-8">
      <TopBar title={t('docs.title')} subtitle={t('docs.subtitle')} />

      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={t('docs.searchPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {results ? (
        results.length === 0 ? (
          <Text className="mt-6 text-center text-sm text-ink-400">{t('docs.noResults')}</Text>
        ) : (
          <View className="mt-4 gap-3">
            {results.map((s, i) => (
              <DocRow key={s.id} section={s} delay={i * 50} onPress={open} />
            ))}
          </View>
        )
      ) : (
        <View className="mt-4 gap-6">
          {DOC_CATEGORIES.map((cat) => {
            const items = docs.filter((d) => d.category === cat);
            if (items.length === 0) return null;
            return (
              <View key={cat}>
                <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  {t(`docs.cat.${cat}`)}
                </Text>
                <View className="gap-3">
                  {items.map((s, i) => (
                    <DocRow key={s.id} section={s} delay={i * 50} onPress={open} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text className="mt-8 text-center text-xs text-ink-500">{t('docs.disclaimer')}</Text>
    </Screen>
  );
};

export default Docs;
