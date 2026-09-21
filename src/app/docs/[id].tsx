import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { TopBar } from '@/components/TopBar';
import { BadgeRow, Card, FadeInUp, Screen, ScreenTitle } from '@/components/ui';
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
        <Card>
          <Markdown
            style={markdownStyles(scheme)}
            rules={markdownRules}
            onLinkPress={(href) => openContentLink(href, router)}
          >
            {section.body}
          </Markdown>
        </Card>
      </FadeInUp>
    </Screen>
  );
};

export default DocDetail;
