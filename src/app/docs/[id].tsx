import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { BadgeRow, Card, Deferred, FadeInUp, Screen, ScreenTitle, Skeleton } from '@/components/ui';
import { getDocById } from '@/features/docs';
import { DocMarkdown } from '@/features/docs/DocMarkdown';
import { docSections } from '@/features/docs/doc-sections';
import { openContentLink } from '@/features/docs/openContentLink';
import { useI18n } from '@/i18n';

/** What the first section's place holds until it mounts: a few lines of text, not a blank card. */
const BodySkeleton = () => (
  <View className="gap-2.5">
    <Skeleton className="h-4 w-11/12" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
    <Skeleton className="mt-3 h-24 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </View>
);

const DocDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useI18n();
  const router = useRouter();

  const section = typeof id === 'string' ? getDocById(locale, id) : null;
  if (!section) return <Redirect href="/explore" />;
  const onLinkPress = (href: string) => openContentLink(href, router);

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
        {/* Title and tags paint with the push. The body waits for the push to
            END, then mounts one section (up to the next `##`) a frame, so no
            single commit lays out the whole document and its tables. */}
        <Card>
          {docSections(section.body).map((part, i) => (
            <Deferred key={i} order={i} fallback={i === 0 ? <BodySkeleton /> : null}>
              <DocMarkdown onLinkPress={onLinkPress}>{part}</DocMarkdown>
            </Deferred>
          ))}
        </Card>
      </FadeInUp>
    </Screen>
  );
};

export default DocDetail;
