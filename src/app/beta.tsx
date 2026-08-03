import { Linking, Text, View } from 'react-native';

import {
  DownloadIcon,
  ExternalLinkIcon,
  FlaskIcon,
  GithubIcon,
  MailIcon,
} from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, Screen, ScreenTitle } from '@/components/ui';
import { betaLinks } from '@/features/beta/links';
import { useT } from '@/i18n';
import { APP_VERSION } from '@/lib/env';
import { useTheme } from '@/theme/theme-context';

const SectionLabel = ({ text }: { text: string }) => (
  <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
    {text}
  </Text>
);

const Bullet = ({ text }: { text: string }) => (
  <View className="flex-row items-start gap-3">
    <View className="mt-2 h-1.5 w-1.5 rounded-full bg-brand" />
    <Text className="flex-1 text-sm leading-6 text-ink-300">{text}</Text>
  </View>
);

const Step = ({ n, text }: { n: number; text: string }) => (
  <View className="flex-row items-start gap-3">
    <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-brand/15">
      <Text className="font-mono-medium text-xs text-brand">{n}</Text>
    </View>
    <Text className="flex-1 text-sm leading-6 text-ink-300">{text}</Text>
  </View>
);

/**
 * Support screen for beta testers: which version they run, why some updates
 * arrive on their own and others need a manual APK, and where to get it.
 * Reached from the Home banner and from Profile.
 */
const Beta = () => {
  const t = useT();
  const { brand } = useTheme();

  // The system browser, not an in-app one: the APK link is a file download.
  const open = (url: string) => Linking.openURL(url);

  return (
    <Screen scroll contentClassName="px-5 pb-12" header={<TopBar showBack showAvatar={false} />}>
      <ScreenTitle title={t('beta.title')} />

      {/* Which build am I on */}
      <Card className="items-center border-brand/30 bg-brand/10">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand">
          <FlaskIcon color="#08090d" size={26} />
        </View>
        <View className="mt-3 rounded-full border border-brand/40 px-2 py-0.5">
          <Text className="font-mono-medium text-xs uppercase tracking-wider text-brand">
            {t('beta.badge')}
          </Text>
        </View>
        <Text className="mt-3 text-lg font-sans-bold text-ink-50">
          {t('beta.version', { version: APP_VERSION })}
        </Text>
        <Text className="mt-2 text-center text-sm leading-6 text-ink-300">
          {t('beta.introBody')}
        </Text>
      </Card>

      {/* Automatic vs manual updates */}
      <SectionLabel text={t('beta.updatesTitle')} />
      <Card className="gap-3">
        <Bullet text={t('beta.updatesAuto')} />
        <Bullet text={t('beta.updatesManual')} />
      </Card>

      {/* Manual install walkthrough */}
      <SectionLabel text={t('beta.installTitle')} />
      <Card className="gap-4">
        <Step n={1} text={t('beta.installStep1')} />
        <Step n={2} text={t('beta.installStep2')} />
        <Step n={3} text={t('beta.installStep3')} />
        <Step n={4} text={t('beta.installStep4')} />
        <Text className="border-t border-ink-600 pt-4 text-xs leading-5 text-ink-400">
          {t('beta.installNote')}
        </Text>
      </Card>

      <View className="mt-4 gap-2">
        <Button
          label={t('beta.apkCta')}
          variant="brand"
          leftIcon={<DownloadIcon color="#08090d" size={18} />}
          onPress={() => open(betaLinks.apk)}
        />
        <Button
          label={t('beta.releasesCta')}
          variant="secondary"
          leftIcon={<GithubIcon color={brand} size={18} />}
          onPress={() => open(betaLinks.releases)}
        />
        <Button
          label={t('beta.webCta')}
          variant="outline"
          leftIcon={<ExternalLinkIcon color={brand} size={18} />}
          onPress={() => open(betaLinks.download)}
        />
      </View>

      {/* How we announce a build that needs a manual install */}
      <Card className="mt-7 bg-ink-850">
        <View className="flex-row items-center gap-2">
          <MailIcon color={brand} size={16} />
          <Text className="font-mono-medium text-xs uppercase tracking-wider text-brand">
            {t('beta.notifyTitle')}
          </Text>
        </View>
        <Text className="mt-1.5 text-sm leading-6 text-ink-300">{t('beta.notifyBody')}</Text>
      </Card>
    </Screen>
  );
};

export default Beta;
