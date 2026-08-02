import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { SyncPanel } from '@/features/sync/SyncPanel';
import { SyncRing } from '@/features/sync/SyncRing';

import { HeaderMenu } from './HeaderMenu';
import { BookIcon, FlaskIcon, HelpIcon } from './icons';
import { Avatar } from './ui/Avatar';

type Props = {
  /** Stack screens only — tab screens render no title (the tab label names them). */
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showAvatar?: boolean;
  right?: React.ReactNode;
  /** When set, shows a "how to use" book button linking to that doc section. */
  docId?: string;
  /** Tab screens: gear menu (settings / notifications / premium / legal). */
  menu?: boolean;
  /** Tab screens: quick-answers FAQ entry, next to the gear. */
  showFaq?: boolean;
  /** Tab screens: flask entry to the beta panel. */
  showBeta?: boolean;
};

/**
 * The app navbar. Headers are disabled globally, so every screen renders this.
 * Tab layout: avatar + flask on the left, FAQ + gear on the right — no text
 * (the bottom tab label already names the section). The avatar opens the sync
 * status panel; the gear opens the overflow menu. Stack screens keep the
 * back-chevron + title form.
 */
export const TopBar = ({
  title,
  subtitle,
  showBack,
  showAvatar = true,
  right,
  docId,
  menu,
  showFaq,
  showBeta,
}: Props) => {
  const router = useRouter();
  const { user } = useAuth();
  const [syncOpen, setSyncOpen] = useState(false);

  return (
    <View className="flex-row items-center justify-between gap-4 px-5 pb-4 pt-2">
      <View className="flex-1 flex-row items-center gap-3">
        {showBack ? (
          <Pressable
            hitSlop={10}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
          >
            <Text className="text-lg text-ink-100">‹</Text>
          </Pressable>
        ) : null}
        {showAvatar && user ? (
          <>
            <Pressable
              hitSlop={8}
              onPress={() => setSyncOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Sync status"
            >
              {/* The ring is the only sync indicator; tapping it opens the
                  panel with the legend + recent activity (beta support). */}
              <SyncRing size={32}>
                <Avatar uri={user.avatarUri} size={32} />
              </SyncRing>
            </Pressable>
            <SyncPanel visible={syncOpen} onClose={() => setSyncOpen(false)} />
          </>
        ) : null}
        {showBeta ? (
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/beta')}
            accessibilityRole="button"
            accessibilityLabel="Beta"
            className="h-9 w-9 items-center justify-center rounded-full border border-brand/30 bg-brand/10"
          >
            <FlaskIcon color="#bef82b" size={17} />
          </Pressable>
        ) : null}
        {title ? (
          <View className="flex-1">
            <Text className="text-2xl font-sans-bold text-ink-50" numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="mt-0.5 text-sm text-ink-400" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-3">
        {docId ? (
          <Pressable
            hitSlop={8}
            onPress={() => router.push({ pathname: '/docs/[id]', params: { id: docId } })}
            accessibilityRole="button"
            accessibilityLabel="How to use"
            className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
          >
            <BookIcon color="#bef82b" size={18} />
          </Pressable>
        ) : null}
        {right}
        {showFaq ? (
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/faq')}
            accessibilityRole="button"
            accessibilityLabel="FAQ"
            className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
          >
            <HelpIcon color="#a1a1aa" size={18} />
          </Pressable>
        ) : null}
        {menu ? <HeaderMenu /> : null}
      </View>
    </View>
  );
};
