import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { FlaskIcon, MailIcon, ShieldIcon, StarIcon } from '@/components/icons';
import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';

import { ANNOUNCEMENTS, type Announcement, type AnnouncementKind } from './data';

const KIND_ICON: Record<AnnouncementKind, typeof FlaskIcon> = {
  info: FlaskIcon,
  promo: StarIcon,
  warning: ShieldIcon,
  maintenance: MailIcon,
};

/**
 * Shows the first undismissed announcement as a one-time full-screen notice
 * after sign-in/up (mounted on Home, next to the premium intro). Dismissals are
 * per-announcement id in MMKV, so a new id — e.g. a new release's beta note —
 * resurfaces on the next launch. The header flask stays as the permanent entry.
 */
export const AnnouncementModal = () => {
  const t = useT();
  const router = useRouter();
  const [current, setCurrent] = useState<Announcement | null>(() => {
    const dismissed = settings.getDismissedAnnouncements();
    return ANNOUNCEMENTS.find((a) => !dismissed.includes(a.id)) ?? null;
  });

  if (!current) return null;
  const Icon = KIND_ICON[current.kind];

  const close = () => {
    settings.addDismissedAnnouncement(current.id);
    setCurrent(null);
  };

  return (
    <Modal visible animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-between bg-ink-900 px-6 pb-10 pt-24">
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-brand">
            <Icon color="#08090d" size={30} />
          </View>
          <Text className="mt-5 text-center text-2xl font-sans-bold text-ink-50">
            {t(current.titleKey)}
          </Text>
          <Text className="mt-3 text-center text-base leading-7 text-ink-300">
            {t(current.bodyKey)}
          </Text>
        </View>
        <View className="gap-2">
          {current.href ? (
            <Button
              label={t('ann.seeMore')}
              variant="brand"
              onPress={() => {
                const href = current.href!;
                close();
                router.push(href);
              }}
            />
          ) : null}
          <Button label={t('ann.dismiss')} variant="ghost" onPress={close} />
        </View>
      </View>
    </Modal>
  );
};
