import { useState } from 'react';
import { Text, View } from 'react-native';

import { Card, SectionLabel, Switch } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';

import { removeTrainingCalendar, requestCalendarAccess, syncTrainingCalendar } from './sync';

/**
 * The opt-in for the phone-calendar mirror, on the notifications screen beside
 * the training time it uses. On asks for calendar access first; a refusal
 * leaves it off and says where access is granted (no toast: nothing was saved).
 * Off deletes metri's calendar and everything it wrote.
 */
export const TrainingCalendarCard = () => {
  const t = useT();
  const { user } = useAuth();
  const [on, setOn] = useState(() => settings.getCalendarSync());
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggle = async (next: boolean) => {
    if (busy || !user) return;
    setBusy(true);
    try {
      if (!next) {
        setOn(false);
        await removeTrainingCalendar();
        return;
      }
      const ok = await requestCalendarAccess();
      setDenied(!ok);
      if (!ok) return;
      settings.setCalendarSync(true);
      setOn(true);
      await syncTrainingCalendar(user.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SectionLabel label={t('calendar.sectionTitle')} />
      <Card>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-base font-sans-semibold text-ink-50">{t('calendar.title')}</Text>
            <Text className="mt-0.5 text-xs leading-5 text-ink-400">{t('calendar.body')}</Text>
          </View>
          <Switch
            value={on}
            onValueChange={(v) => void toggle(v)}
            disabled={busy}
            accessibilityLabel={t('calendar.title')}
          />
        </View>
        {denied ? (
          <Text className="mt-3 text-xs leading-5 text-amber-500">{t('calendar.denied')}</Text>
        ) : null}
      </Card>
    </>
  );
};
