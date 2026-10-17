import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { TopBar } from '@/components/TopBar';
import { BadgeRow, Card, Deferred, FadeInUp, Screen, ScreenTitle } from '@/components/ui';
import { getDocById } from '@/features/docs';
import { markdownRules } from '@/features/docs/MarkdownTable';
import { markdownStyles } from '@/features/docs/markdownStyles';
import { openContentLink } from '@/features/docs/openContentLink';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const DocDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useI18n();
  const { scheme } = useTheme();
  const router = useRouter();

  const section = typeof id === 'string' ? getDocById(locale, id) : null;
  const body = section?.body ?? '';
  // One element the compiler memoizes on body and theme: the renderer parses
  // the whole markdown on every render it receives.
  const markdown = (
    <Markdown
      style={markdownStyles(scheme)}
      rules={markdownRules}
      onLinkPress={(href) => openContentLink(href, router)}
    >
      {body}
    </Markdown>
  );
  if (!section) return <Redirect href="/explore" />;

  return (
    <Screen scroll contentClassName="px-5 pb-12" header={<TopBar showBack showAvatar={false} />}>
      <ScreenTitle title={section.title} />

      <FadeInUp>
        {/* Tags are tappable — they search the docs by that tag. */}
        <View className="mb-4">
          <BadgeRow
            items={section.tags.map((tag) => ({
              value: tag,
              label: `#${tag}`,
              onPress: () => router.push({ pathname: '/explore', params: { q: tag } }),
            }))}
            tone="brand"
          />
        </View>
        {/* Title and tags paint with the push; the body (tables included) mounts after it. */}
        <Deferred fallback={<Card className="min-h-64" />}>
          <Card>{markdown}</Card>
        </Deferred>
      </FadeInUp>
    </Screen>
  );
};

export default DocDetail;
