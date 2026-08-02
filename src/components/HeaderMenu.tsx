import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-context';
import { useT, type TranslationKey } from '@/i18n';

import { BellIcon, GearIcon, LogOutIcon, ShieldIcon, StarIcon } from './icons';
import type { IconProps } from './icons';

type Item = {
  key: TranslationKey;
  href: Href;
  Icon: React.ComponentType<IconProps>;
};

/** Overflow entries: settings and the low-traffic pages that used to spend a
 * whole tab (WhatsApp-style kebab). Add here instead of widening the tab bar. */
const ITEMS: Item[] = [
  { key: 'menu.settings', href: '/profile', Icon: GearIcon },
  { key: 'menu.notifications', href: '/notifications', Icon: BellIcon },
  { key: 'menu.premium', href: '/premium', Icon: StarIcon },
  { key: 'menu.legal', href: '/legal', Icon: ShieldIcon },
];

/** The header's 3-dot overflow menu — a top-right anchored dropdown. */
export const HeaderMenu = () => {
  const router = useRouter();
  const t = useT();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const go = (href: Href) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Pressable
        hitSlop={8}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('menu.open')}
        className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
      >
        <GearIcon color="#a1a1aa" size={18} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* Full-screen scrim closes on tap; the sheet anchors under the header. */}
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)}>
          <View
            style={{ marginTop: insets.top + 52 }}
            className="mr-4 self-end overflow-hidden rounded-card border border-ink-700 bg-ink-850"
          >
            {ITEMS.map(({ key, href, Icon }, i) => (
              <Pressable
                key={key}
                onPress={() => go(href)}
                accessibilityRole="menuitem"
                android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
                className={[
                  'flex-row items-center gap-3 px-4 py-3.5',
                  i > 0 ? 'border-t border-ink-800' : '',
                ].join(' ')}
              >
                <Icon color="#a1a1aa" size={18} />
                <Text className="pr-6 text-base text-ink-100">{t(key)}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                setOpen(false);
                signOut();
                router.replace('/(auth)/sign-in');
              }}
              accessibilityRole="menuitem"
              android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
              className="flex-row items-center gap-3 border-t border-ink-800 px-4 py-3.5"
            >
              <LogOutIcon color="#f87171" size={18} />
              <Text className="pr-6 text-base text-red-400">{t('profile.signOut')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};
