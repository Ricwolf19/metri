import { useEffect, useState, useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';

import { Card, SectionLabel, Switch } from '@/components/ui';
import { useT, type TranslationKey } from '@/i18n';
import { settings } from '@/lib/storage';

import { canLock, LOCK_SECTIONS, setSectionLock, subscribeLock, type LockSection } from './lock';

const COPY: Record<LockSection, { label: TranslationKey; hint: TranslationKey }> = {
  photos: { label: 'lock.photos', hint: 'lock.photosHint' },
  settings: { label: 'lock.settings', hint: 'lock.settingsHint' },
};

const LockRow = ({ section, available }: { section: LockSection; available: boolean }) => {
  const t = useT();
  const on = useSyncExternalStore(subscribeLock, () => settings.getSectionLock(section));
  const toggle = (next: boolean) =>
    void setSectionLock(section, next, {
      message: t('lock.confirmPrompt'),
      cancel: t('common.cancel'),
    });
  return (
    <View className="flex-row items-center gap-4">
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-sans-medium text-ink-100">{t(COPY[section].label)}</Text>
        <Text className="mt-0.5 text-[11px] leading-4 text-ink-500">{t(COPY[section].hint)}</Text>
      </View>
      <Switch
        value={on}
        onValueChange={toggle}
        disabled={!available && !on}
        accessibilityLabel={t(COPY[section].label)}
      />
    </View>
  );
};

/**
 * The settings card for the private-section lock: one switch per section, each
 * flipped only after the phone's own unlock succeeds. A phone with no PIN,
 * pattern or biometric has nothing to unlock with, so the switches stay off
 * and say why (one already on stays reachable, so it can still be turned off).
 */
export const PrivacyLockCard = () => {
  const t = useT();
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    let live = true;
    void canLock().then((ok) => {
      if (live) setAvailable(ok);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <>
      <SectionLabel label={t('lock.sectionTitle')} hint={t('lock.sectionHint')} />
      <Card>
        <View className="gap-4">
          {LOCK_SECTIONS.map((s) => (
            <LockRow key={s} section={s} available={available} />
          ))}
        </View>
        {available ? null : (
          <Text className="mt-3 text-xs leading-5 text-amber-500">{t('lock.unavailable')}</Text>
        )}
      </Card>
    </>
  );
};
