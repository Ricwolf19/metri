import { Linking, Text, View } from 'react-native';

import { StarIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, Screen, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { exportUserData } from '@/features/premium/export';
import { useT } from '@/i18n';
import { WEB_URL } from '@/lib/env';

const CONTACT_EMAIL = 'rhtc19@gmail.com';

const Premium = () => {
  const t = useT();
  const { user, isPremium } = useAuth();
  const toast = useToast();

  const onExport = async () => {
    if (!user) return;
    try {
      await exportUserData(user.id);
      toast.success(t('premium.exportedToast'));
    } catch {
      /* user cancelled the share sheet */
    }
  };

  return (
    <Screen scroll contentClassName="px-5 pb-12">
      <TopBar title={t('premium.title')} showBack showAvatar={false} />

      {/* Hero */}
      <Card className="items-center border-brand/30 bg-brand/10">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand">
          <StarIcon color="#08090d" size={26} />
        </View>
        <View className="mt-3 flex-row items-center gap-2">
          <Text className="text-lg font-sans-bold text-ink-50">{t('premium.title')}</Text>
          {isPremium ? (
            <View className="rounded-full bg-brand px-2 py-0.5">
              <Text className="text-xs font-sans-bold text-brandContrast">{t('plan.premium')}</Text>
            </View>
          ) : (
            <View className="rounded-full border border-brand/40 px-2 py-0.5">
              <Text className="font-mono-medium text-xs uppercase tracking-wider text-brand">
                {t('premium.beta')}
              </Text>
            </View>
          )}
        </View>
        <Text className="mt-2 text-center text-sm leading-6 text-ink-300">
          {t('premium.coreFree')}
        </Text>
      </Card>

      {/* What premium adds */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('premium.benefitsTitle')}
      </Text>
      <Card className="flex-row items-start gap-3">
        <View className="mt-0.5 h-2 w-2 rounded-full bg-brand" />
        <Text className="flex-1 text-sm leading-6 text-ink-200">{t('premium.benefitSync')}</Text>
      </Card>

      {/* Without premium + export */}
      <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('premium.withoutTitle')}
      </Text>
      <Card>
        <Text className="text-sm leading-6 text-ink-300">{t('premium.withoutBody')}</Text>
        <View className="mt-4">
          <Button label={t('premium.exportCta')} variant="secondary" onPress={onExport} />
        </View>
      </Card>

      {/* How to get it */}
      {!isPremium ? (
        <>
          <Text className="mb-2 mt-7 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t('premium.howTitle')}
          </Text>
          <Card>
            <Text className="text-sm leading-6 text-ink-300">{t('premium.howBody')}</Text>
            <View className="mt-4 gap-2">
              <Button
                label={t('premium.contactCta')}
                variant="brand"
                onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Metri%20Premium`)}
              />
              <Button
                label={t('premium.webCta')}
                variant="outline"
                onPress={() => Linking.openURL(WEB_URL)}
              />
            </View>
          </Card>
        </>
      ) : null}

      {/* Beta note */}
      <Card className="mt-7 bg-ink-850">
        <Text className="font-mono-medium text-xs uppercase tracking-wider text-brand">
          {t('premium.betaTitle')}
        </Text>
        <Text className="mt-1.5 text-sm leading-6 text-ink-300">{t('premium.betaBody')}</Text>
      </Card>
    </Screen>
  );
};

export default Premium;
