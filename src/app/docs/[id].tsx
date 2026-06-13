import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, Screen } from '@/components/ui';
import { getDocById } from '@/features/docs';
import { markdownRules } from '@/features/docs/MarkdownTable';
import { markdownStyles } from '@/features/docs/markdownStyles';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const DocDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useI18n();
  const { scheme } = useTheme();
  const router = useRouter();

  const section = typeof id === 'string' ? getDocById(locale, id) : null;
  if (!section) return <Redirect href="/(tabs)/docs" />;

  return (
    <Screen scroll contentClassName="px-5 pb-12">
      <TopBar title={section.title} showBack showAvatar={false} />

      <FadeInUp>
        {/* Tags are tappable — they search the docs by that tag. */}
        <View className="mb-4 flex-row flex-wrap gap-2">
          {section.tags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => router.push({ pathname: '/(tabs)/docs', params: { q: tag } })}
              className="rounded-full bg-ink-800 px-2.5 py-1"
            >
              <Text className="text-xs text-accent">#{tag}</Text>
            </Pressable>
          ))}
        </View>
        <Card>
          <Markdown style={markdownStyles(scheme)} rules={markdownRules}>
            {section.body}
          </Markdown>
        </Card>
      </FadeInUp>
    </Screen>
  );
};

export default DocDetail;
