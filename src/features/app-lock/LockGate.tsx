import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';

import { LockIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { authenticate, isLocked, subscribeLock, type LockSection } from './lock';

/** Whether `section` is locked right now; re-renders on unlock, relock and a toggle. */
const useSectionLocked = (section: LockSection): boolean =>
  useSyncExternalStore(subscribeLock, () => isLocked(section));

/**
 * Wraps a private screen. Unlocked (or never locked), it renders the screen;
 * locked, a SOLID surface — nothing of the screen mounts, so no photo is read
 * or drawn behind it — that asks the OS once on arrival and offers Unlock
 * after a cancel. Back always works: a lock never traps anyone on a page.
 */
export const LockGate = ({
  section,
  children,
}: {
  section: LockSection;
  children: React.ReactNode;
}) => {
  const t = useT();
  const { muted } = useTheme();
  const locked = useSectionLocked(section);
  const unlock = () => void authenticate(t('lock.prompt'), t('common.cancel'));

  // Asked once per arrival, not on every relock: a prompt that reopened by
  // itself after a cancel would leave no way to just go back.
  const asked = useRef(false);
  useEffect(() => {
    if (!locked || asked.current) return;
    asked.current = true;
    unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  if (!locked) return <>{children}</>;

  return (
    <Screen edges={['top']} header={<TopBar showBack showAvatar={false} />}>
      <View className="flex-1 items-center justify-center bg-ink-900 px-8">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-ink-800">
          <LockIcon color={muted} size={26} />
        </View>
        <Text className="mt-4 text-center text-lg font-sans-semibold text-ink-50">
          {t(section === 'photos' ? 'lock.photosTitle' : 'lock.settingsTitle')}
        </Text>
        <Text className="mt-1 text-center text-sm leading-5 text-ink-400">{t('lock.body')}</Text>
        <View className="mt-6 w-full">
          <Button label={t('lock.unlock')} variant="brand" onPress={unlock} />
        </View>
      </View>
    </Screen>
  );
};
