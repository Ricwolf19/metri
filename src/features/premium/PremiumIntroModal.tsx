import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { StarIcon } from '@/components/icons';
import { Button } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';

/**
 * One-time full-screen intro shown to non-premium users after sign-in/up: what
 * stays free, what premium adds, and that their data is never held hostage.
 */
export const PremiumIntroModal = () => {
  const t = useT();
  const router = useRouter();
  const { user, isPremium } = useAuth();
  const [visible, setVisible] = useState(
    () => !!user && !isPremium && !settings.hasSeenPremiumIntro(),
  );

  const close = () => {
    settings.setPremiumIntroSeen(true);
    setVisible(false);
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-between bg-ink-900 px-6 pb-10 pt-24">
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-brand">
            <StarIcon color="#08090d" size={30} />
          </View>
          <Text className="mt-5 text-center text-2xl font-sans-bold text-ink-50">
            {t('premium.introTitle')}
          </Text>
          <Text className="mt-3 text-center text-base leading-7 text-ink-300">
            {t('premium.introBody')}
          </Text>
        </View>
        <View className="gap-2">
          <Button
            label={t('premium.introSeeMore')}
            variant="brand"
            onPress={() => {
              close();
              router.push('/premium');
            }}
          />
          <Button label={t('premium.introDismiss')} variant="ghost" onPress={close} />
        </View>
      </View>
    </Modal>
  );
};
