import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Linking, Text, View } from 'react-native';

import { CheckIcon, StarIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, Screen, ScreenTitle, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import type { Tier } from '@/features/auth/entitlements';
import { exportUserData } from '@/features/plan/export';
import { buildImportPrompt } from '@/features/plan/import-prompt';
import { ImportPanel } from '@/features/plan/ImportPanel';
import { useI18n, useT, type TranslationKey } from '@/i18n';
import { WEB_URL } from '@/lib/env';
import { useTheme } from '@/theme/theme-context';

const CONTACT_EMAIL = 'rhtc19@gmail.com';

const TIER_BULLETS: Record<Tier, TranslationKey[]> = {
  local: [
    'plan.bulletAllFree',
    'plan.bulletExportImport',
    'plan.bulletDeviceOnly',
    'plan.bulletNoBackup',
  ],
  free: ['plan.bulletSecurity', 'plan.bulletWebPerks'],
  premium: ['plan.bulletSync', 'plan.bulletDevices', 'plan.bulletFuture'],
};

const TIER_LABEL: Record<Tier, TranslationKey> = {
  local: 'plan.tier.local',
  free: 'plan.tier.free',
  premium: 'plan.tier.premium',
};

const TierCard = ({ cardTier, current }: { cardTier: Tier; current: boolean }) => {
  const t = useT();
  const { brand } = useTheme();
  return (
    <Card className={current ? 'border-brand/40 bg-brand/10' : undefined}>
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-sans-semibold text-ink-50">{t(TIER_LABEL[cardTier])}</Text>
        {current ? (
          <View className="rounded-full bg-brand/15 px-2.5 py-1">
            <Text className="font-mono-medium text-[10px] uppercase tracking-wider text-brand">
              {t('plan.currentBadge')}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="mt-3 gap-2">
        {TIER_BULLETS[cardTier].map((key) => (
          <View key={key} className="flex-row items-start gap-2">
            <CheckIcon color={brand} size={14} />
            <Text className="flex-1 text-sm leading-5 text-ink-300">{t(key)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

/** Plan hub: current tier, what each tier adds, export/import + AI import prompt.
 * Export and import are unconditional — no account, no tier. The user's data is never held
 * hostage; sync is the only paid capability (@see entitlements.ts). */
const Plan = () => {
  const t = useT();
  const { brand } = useTheme();
  const { locale } = useI18n();
  const router = useRouter();
  const { user, tier, isPremium } = useAuth();
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

  const onCopyPrompt = async () => {
    await Clipboard.setStringAsync(buildImportPrompt(locale));
    toast.success(t('plan.aiPromptCopied'));
  };

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
      <ScreenTitle
        title={t('plan.title')}
        subtitle={t('plan.currentTier', { tier: t(TIER_LABEL[tier]) })}
      />

      {/* Tiers, current first-class */}
      <View className="gap-3">
        <TierCard cardTier="local" current={tier === 'local'} />
        <TierCard cardTier="free" current={tier === 'free'} />
        <TierCard cardTier="premium" current={tier === 'premium'} />
      </View>

      {/* Export / import — the "your data is never held hostage" tools */}
      <Text className="mb-2 mt-8 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('plan.dataTitle')}
      </Text>
      <View className="gap-3">
        <Card>
          <Text className="text-base font-sans-semibold text-ink-50">{t('plan.exportTitle')}</Text>
          <Text className="mt-1 text-sm leading-6 text-ink-400">{t('plan.exportBody')}</Text>
          <View className="mt-4">
            <Button label={t('premium.exportCta')} variant="secondary" onPress={onExport} />
          </View>
        </Card>
        <Card>
          <Text className="text-base font-sans-semibold text-ink-50">{t('plan.importTitle')}</Text>
          <View className="mt-3">
            <ImportPanel userId={user?.id ?? ''} />
          </View>
        </Card>
        <Card>
          <Text className="text-base font-sans-semibold text-ink-50">
            {t('plan.aiPromptTitle')}
          </Text>
          <Text className="mt-1 text-sm leading-6 text-ink-400">{t('plan.aiPromptBody')}</Text>
          <View className="mt-4">
            <Button label={t('plan.aiPromptCopy')} variant="secondary" onPress={onCopyPrompt} />
          </View>
        </Card>
      </View>

      {/* How to get Premium (beta: manual grant) */}
      {isPremium ? null : (
        <>
          <Text className="mb-2 mt-8 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t('premium.howTitle')}
          </Text>
          <Card>
            <View className="mb-3 flex-row items-center gap-2">
              <StarIcon color={brand} size={16} />
              <Text className="text-base font-sans-semibold text-ink-50">{t('premium.title')}</Text>
            </View>
            <Text className="text-sm leading-6 text-ink-300">{t('premium.howBody')}</Text>
            <View className="mt-4 gap-2">
              <Button
                label={t('premium.contactCta')}
                variant="secondary"
                onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Metri%20Premium`)}
              />
              <Button
                label={t('premium.webCta')}
                variant="ghost"
                onPress={() => Linking.openURL(WEB_URL)}
              />
            </View>
          </Card>
        </>
      )}

      <Text className="mt-6 text-center text-xs leading-5 text-ink-500">
        {t('premium.betaBody')}
      </Text>
    </Screen>
  );
};

export default Plan;
