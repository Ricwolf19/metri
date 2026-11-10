import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { SyncPanel } from '@/features/sync/SyncPanel';
import { SYNC_STATE_KEY, SyncRing } from '@/features/sync/SyncRing';
import { useSyncState } from '@/features/sync/useSyncState';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { HeaderMenu } from './HeaderMenu';
import { BookIcon, ChevronLeftIcon, FlaskIcon, HelpIcon } from './icons';
import { Avatar } from './ui/Avatar';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';

type Props = {
  showBack?: boolean;
  /** Replaces `router.back()` for a screen whose way out is not the stack (e.g. an onboarding step). */
  onBack?: () => void;
  showAvatar?: boolean;
  /** Nested screens: page title (+ optional subtitle) inside the pill. */
  title?: string;
  subtitle?: string;
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

/** The floating navbar pill: back / avatar / beta on the left, doc / FAQ / overflow on the right; lives in
 * `Screen`'s `header` slot. Tab screens keep it text-free (`<ScreenTitle>` in content); nested screens pass
 * `title`/`subtitle` — see AGENTS.md#conventions (Screens). */
export const TopBar = ({
  showBack,
  onBack,
  showAvatar = true,
  title,
  subtitle,
  right,
  docId,
  menu,
  showFaq,
  showBeta,
}: Props) => {
  const router = useRouter();
  const t = useT();
  const { brand } = useTheme();
  const { user } = useAuth();
  const syncState = useSyncState();
  const [syncOpen, setSyncOpen] = useState(false);
  // The ring's colour is the only sync signal on screen; its name says the same.
  const syncLabel =
    syncState === 'off'
      ? t('topbar.sync')
      : t('topbar.syncState', { state: t(SYNC_STATE_KEY[syncState]) });

  const accessories = (
    <View className="flex-row items-center gap-3">
      {docId ? (
        <Pressable
          hitSlop={8}
          onPress={() => router.push({ pathname: '/docs/[id]', params: { id: docId } })}
          accessibilityRole="button"
          accessibilityLabel={t('topbar.howTo')}
          className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
        >
          <BookIcon color={brand} size={18} />
        </Pressable>
      ) : null}
      {right}
      {showFaq ? (
        <Pressable
          hitSlop={8}
          onPress={() => router.push('/faq')}
          accessibilityRole="button"
          accessibilityLabel={t('faq.title')}
          className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
        >
          <HelpIcon color="#a1a1aa" size={18} />
        </Pressable>
      ) : null}
      {menu ? <HeaderMenu /> : null}
    </View>
  );

  return (
    <View className="flex-row items-center gap-3 px-5 py-2.5">
      <View className="shrink-0 flex-row items-center gap-3">
        {showBack ? (
          <Pressable
            // Bare icon, no chip: the touch target stays 44dp via hitSlop while
            // the control gives ~16dp of width back to the content.
            hitSlop={14}
            onPress={onBack ?? (() => router.back())}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
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
              accessibilityLabel={syncLabel}
            >
              {/* The ring is the only sync indicator; tapping it opens the
                  panel with the legend + recent activity (beta support). */}
              <SyncRing size={28} gap={2}>
                <Avatar uri={user.avatarUri} size={28} />
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
            accessibilityLabel={t('beta.title')}
            className="h-9 w-9 items-center justify-center rounded-full border border-brand/30 bg-brand/10"
          >
            <FlaskIcon color={brand} size={17} />
          </Pressable>
        ) : null}
      </View>

      {title ? (
        <View className="min-w-0 flex-1 justify-center">
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            accessibilityRole="header"
            className={[
              'font-sans-semibold text-ink-50',
              subtitle ? 'text-[15px] leading-[18px]' : 'text-base leading-5',
            ].join(' ')}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              className="text-[11px] leading-[14px] text-ink-400"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : (
        <View className="flex-1" />
      )}

      {accessories}
    </View>
  );
};
