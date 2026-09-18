import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { StarIcon, XIcon } from '@/components/icons';
import { Card } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

/** Nudge toward an account (restore, export/import, premium; the upgrade keeps every row).
 * Dismiss snoozes 14 days and it returns by design — never blocking. */
export const LocalModeBanner = () => {
  const t = useT();
  const router = useRouter();
  const { brand } = useTheme();
  const { isLocalOnly } = useAuth();
  // Snooze check happens once per mount (initializer), keeping render pure.
  const [hidden, setHidden] = useState(() => Date.now() < settings.getLocalBannerSnoozedUntil());

  if (!isLocalOnly || hidden) return null;

  const snooze = () => {
    settings.snoozeLocalBanner();
    setHidden(true);
  };

  return (
    <Card className="mb-3 border-brand/25">
      <View className="flex-row items-start gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-brand/15">
          <StarIcon color={brand} size={17} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-sans-semibold text-ink-50">{t('banner.localTitle')}</Text>
          <Text className="mt-1 text-xs leading-5 text-ink-400">{t('banner.localBody')}</Text>
          <Pressable
            onPress={() => router.push('/(auth)/sign-up')}
            accessibilityRole="button"
            className="mt-2 self-start"
          >
            <Text className="text-sm font-sans-semibold text-brand">{t('banner.localCta')}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={snooze}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        >
          <XIcon color="#71717a" size={16} />
        </Pressable>
      </View>
    </Card>
  );
};
