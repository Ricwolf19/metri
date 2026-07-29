import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon, FlaskIcon, XIcon } from '@/components/icons';
import { FadeInUp, PressableScale } from '@/components/ui';
import { useT } from '@/i18n';
import { APP_VERSION } from '@/lib/env';
import { settings } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

/**
 * Home banner telling the user they are on a sideloaded beta, and routing to
 * `/beta` for the version and install instructions.
 *
 * Dismissal is stored per version, so the banner comes back on the next release
 * instead of disappearing forever the first time it is closed — that is what
 * makes it a release signal and not just decoration.
 */
export const BetaBanner = () => {
  const t = useT();
  const router = useRouter();
  const { brand } = useTheme();
  const [visible, setVisible] = useState(
    () => settings.getBetaNoticeDismissedVersion() !== APP_VERSION,
  );

  if (!visible) return null;

  const dismiss = () => {
    settings.setBetaNoticeDismissedVersion(APP_VERSION);
    setVisible(false);
  };

  return (
    <FadeInUp>
      <PressableScale onPress={() => router.push('/beta')}>
        <View className="mt-1 flex-row items-center rounded-card border border-ink-600 bg-ink-850 p-4">
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-field bg-brand/15">
            <FlaskIcon color={brand} size={18} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-sm font-sans-semibold text-ink-50">{t('beta.bannerTitle')}</Text>
            <Text className="mt-0.5 text-xs text-ink-400">
              {t('beta.bannerBody', { version: APP_VERSION })}
            </Text>
          </View>
          <ChevronRightIcon color="#71717a" size={18} />
          <Pressable
            hitSlop={10}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel={t('beta.bannerDismiss')}
            className="ml-2"
          >
            <XIcon color="#71717a" size={16} />
          </Pressable>
        </View>
      </PressableScale>
    </FadeInUp>
  );
};
