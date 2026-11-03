import { TopBar } from '@/components/TopBar';
import { Button, Card, Deferred, Screen, ScreenTitle } from '@/components/ui';
import { DocMarkdown } from '@/features/docs/DocMarkdown';
import { docSections } from '@/features/docs/doc-sections';
import { openContentLink } from '@/features/docs/openContentLink';
import { getLegal } from '@/features/legal/content';
import { useRouter } from 'expo-router';

import { useI18n } from '@/i18n';

const Legal = () => {
  const { t, locale } = useI18n();
  const router = useRouter();

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-12"
      header={<TopBar showBack showAvatar={false} />}
      footer={
        <Button
          label={t('common.continue')}
          variant="brand"
          fullWidth
          onPress={() => router.back()}
        />
      }
    >
      <ScreenTitle title={t('legal.title')} />
      {/* Long: it mounts after the push, a section a frame (see the docs screen). */}
      <Card>
        {docSections(getLegal(locale)).map((part, i) => (
          <Deferred key={i} order={i} fallback={i === 0 ? undefined : null}>
            <DocMarkdown onLinkPress={(href) => openContentLink(href, router)}>{part}</DocMarkdown>
          </Deferred>
        ))}
      </Card>
    </Screen>
  );
};

export default Legal;
