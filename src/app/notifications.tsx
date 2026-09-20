import { useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Screen, ScreenTitle, SegmentedControl, Switch } from '@/components/ui';
import {
  NOTIFICATION_EVENTS,
  type EventConfig,
  type NotificationEvent,
} from '@/features/notifications/events';
import { getEventConfig, syncNotificationEvents } from '@/features/notifications/policies';
import { TIP_FREQUENCIES, TIP_SLOTS } from '@/features/notifications/tips';
import { formatClockTime } from '@/features/training/schedule';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useClockFormat } from '@/lib/useClockFormat';

const EventCard = ({ event }: { event: NotificationEvent }) => {
  const t = useT();
  const [cfg, setCfg] = useState<EventConfig>(() => getEventConfig(event));
  const clock = useClockFormat();

  const update = (patch: Partial<EventConfig>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    settings.setEventConfig(event.id, next);
    void syncNotificationEvents();
  };

  const times = cfg.timesPerDay ?? 3;
  const slots = TIP_SLOTS[times] ?? TIP_SLOTS[3];

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-base font-sans-semibold text-ink-50">{t(event.titleKey)}</Text>
          <Text className="mt-0.5 text-xs leading-5 text-ink-400">{t(event.descKey)}</Text>
        </View>
        <Switch value={cfg.enabled} onValueChange={(enabled) => update({ enabled })} />
      </View>

      {!cfg.enabled ? null : event.tuning === 'program' ? (
        <View className="mt-4 border-t border-ink-800 pt-4">
          <Text className="text-xs leading-5 text-ink-400">
            {cfg.schedule?.length
              ? t('notifEvent.trainingFollowsProgram')
              : t('notifEvent.trainingNoProgram')}
          </Text>
        </View>
      ) : event.tuning === 'frequency' ? (
        <View className="mt-4 border-t border-ink-800 pt-4">
          <Text className="mb-2 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
            {t('notifEvent.tipsPerDay')}
          </Text>
          <SegmentedControl
            segments={TIP_FREQUENCIES.map((n) => ({ value: String(n), label: String(n) }))}
            value={String(times)}
            onChange={(value) => update({ timesPerDay: Number(value) })}
          />
          <Text className="mt-2 text-xs text-ink-500">
            {slots.map((slot) => formatClockTime(slot.hour * 60 + slot.minute, clock)).join(' · ')}
          </Text>
        </View>
      ) : (
        <View className="mt-4 border-t border-ink-800 pt-4">
          {/* Fixed on purpose — see events.ts. */}
          <Text className="text-xs leading-5 text-ink-400">
            {t('notifEvent.fixedTime', {
              time: formatClockTime(cfg.hour * 60 + cfg.minute, clock),
            })}
          </Text>
        </View>
      )}
    </Card>
  );
};

/**
 * Notification events — a fixed, feature-owned catalogue the user switches on
 * or off but never extends, deletes or re-times: metri places each reminder
 * where it works (see events.ts). The master switch kills everything at once.
 */
const Notifications = () => {
  const t = useT();
  const [masterOn, setMasterOn] = useState(settings.getNotificationsEnabled());

  const onMasterToggle = (value: boolean) => {
    setMasterOn(value);
    settings.setNotificationsEnabled(value);
    void syncNotificationEvents();
  };

  return (
    <Screen scroll contentClassName="px-5 pb-12" header={<TopBar showBack showAvatar={false} />}>
      <ScreenTitle title={t('menu.notifications')} />

      <Card>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-base font-sans-semibold text-ink-50">
              {t('profile.notificationsLabel')}
            </Text>
            <Text className="mt-0.5 text-xs leading-5 text-ink-400">
              {t('profile.notificationsHint')}
            </Text>
          </View>
          <Switch value={masterOn} onValueChange={onMasterToggle} />
        </View>
      </Card>

      {masterOn ? (
        <>
          <Text className="mb-2 mt-7 text-sm font-sans-semibold text-ink-200">
            {t('notifEvent.section')}
          </Text>
          <View className="gap-3">
            {NOTIFICATION_EVENTS.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
};

export default Notifications;
