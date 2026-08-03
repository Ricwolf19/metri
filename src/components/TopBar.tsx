import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { SyncPanel } from '@/features/sync/SyncPanel';
import { SyncRing } from '@/features/sync/SyncRing';

import { HeaderMenu } from './HeaderMenu';
import { BookIcon, ChevronLeftIcon, FlaskIcon, HelpIcon } from './icons';
import { Avatar } from './ui/Avatar';

type Props = {
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
 * The app navbar: a thin, text-free bar of controls — back chevron / avatar /
 * beta flask on the left, doc / FAQ / overflow on the right. Goes in `Screen`'s
 * `header` slot, which keeps it fixed while the content scrolls.
 *
 * The page title is deliberately NOT here — it lives in the content as
 * `<ScreenTitle>`, so it gets full width and scrolls away.
 */
export const TopBar = ({
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

  const accessories = (
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
  );

  return (
    <View className="flex-row items-center justify-between gap-4 px-5 pb-3 pt-2">
      <View className="flex-1 flex-row items-center gap-3">
        {showBack ? (
          <Pressable
            // Bare icon, no chip: the touch target stays 44dp via hitSlop while
            // the control gives ~16dp of width back to the content.
            hitSlop={14}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="-ml-1"
          >
            <ChevronLeftIcon color="#e4e4e7" size={26} />
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
      </View>

      {accessories}
    </View>
  );
};
