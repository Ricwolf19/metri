import { Linking, Text, View } from 'react-native';

import { ExternalLinkIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, Screen, ScreenTitle } from '@/components/ui';
import { betaLinks } from '@/features/beta/links';
import { useRouter } from 'expo-router';
import { useT, type TranslationKey } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const SectionLabel = ({ text }: { text: string }) => (
  <Text className="mb-2 mt-7 text-sm font-sans-semibold text-ink-200">{text}</Text>
);

const QA = ({ q, a }: { q: string; a: string }) => (
  <View>
    <Text className="text-sm font-sans-semibold text-ink-50">{q}</Text>
    <Text className="mt-1 text-sm leading-6 text-ink-300">{a}</Text>
  </View>
);

/** Ring color legend rows (mirrors SyncRing's palette). */
const RING: { color: string; key: TranslationKey }[] = [
  { color: '#bef82b', key: 'sync.legendSynced' },
  { color: '#38bdf8', key: 'sync.legendSyncing' },
  { color: '#71717a', key: 'sync.legendOffline' },
  { color: '#f87171', key: 'sync.legendError' },
];

/**
 * Quick answers: what the avatar ring means, what each plan includes, what
 * lives on the web vs in the app, and the useful links — the "how does Metri
 * fit together" screen for testers and new users.
 */
const Faq = () => {
  const t = useT();
  const router = useRouter();
  const { brand } = useTheme();
  const open = (url: string) => Linking.openURL(url);

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
      <ScreenTitle title={t('faq.title')} />

      {/* Sync ring */}
      <SectionLabel text={t('faq.ringTitle')} />
      <Card className="gap-2.5">
        <Text className="text-sm leading-6 text-ink-300">{t('faq.ringBody')}</Text>
        {RING.map(({ color, key }) => (
          <View key={key} className="flex-row items-center gap-2.5">
            <View style={{ backgroundColor: color }} className="h-2.5 w-2.5 rounded-full" />
            <Text className="text-sm text-ink-300">{t(key)}</Text>
          </View>
        ))}
      </Card>

      {/* Plans */}
      <SectionLabel text={t('faq.plansTitle')} />
      <Card className="gap-4">
        <QA q={t('faq.planFreeQ')} a={t('faq.planFreeA')} />
        <QA q={t('faq.planPremiumQ')} a={t('faq.planPremiumA')} />
      </Card>

      {/* Web vs mobile */}
      <SectionLabel text={t('faq.platformsTitle')} />
      <Card className="gap-4">
        <QA q={t('faq.webQ')} a={t('faq.webA')} />
        <QA q={t('faq.mobileQ')} a={t('faq.mobileA')} />
      </Card>

      {/* Feedback */}
      <SectionLabel text={t('faq.feedbackTitle')} />
      <Card>
        <Text className="text-sm leading-6 text-ink-300">{t('faq.feedbackBody')}</Text>
        <View className="mt-4">
          <Button
            label={t('faq.feedbackCta')}
            variant="brand"
            onPress={() => open(betaLinks.feedback)}
          />
        </View>
      </Card>

      {/* Links */}
      <SectionLabel text={t('faq.linksTitle')} />
      <View className="gap-2">
        <Button
          label={t('faq.linkWeb')}
          variant="secondary"
          leftIcon={<ExternalLinkIcon color={brand} size={18} />}
          onPress={() => open('https://metri.info')}
        />
        <Button
          label={t('beta.releasesCta')}
          variant="secondary"
          leftIcon={<ExternalLinkIcon color={brand} size={18} />}
          onPress={() => open(betaLinks.releases)}
        />
        <Button
          label={t('beta.webCta')}
          variant="secondary"
          leftIcon={<ExternalLinkIcon color={brand} size={18} />}
          onPress={() => open(betaLinks.download)}
        />
      </View>
    </Screen>
  );
};

export default Faq;
