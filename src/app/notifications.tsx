import { useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Screen, ScreenTitle, Switch, TimePicker } from '@/components/ui';
import {
  NOTIFICATION_EVENTS,
  type EventConfig,
  type NotificationEvent,
} from '@/features/notifications/events';
import { getEventConfig, syncNotificationEvents } from '@/features/notifications/policies';
import { WeekdayChips } from '@/features/training/components/WeekdayChips';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';

const EventCard = ({ event }: { event: NotificationEvent }) => {
  const t = useT();
  const [cfg, setCfg] = useState<EventConfig>(() => getEventConfig(event));
  const clock = settings.getClockFormat();

  const update = (patch: Partial<EventConfig>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    settings.setEventConfig(event.id, next);
    void syncNotificationEvents();
  };

  const toggleDay = (weekday: number) => {
    const has = cfg.weekdays.includes(weekday);
    const next = has ? cfg.weekdays.filter((d) => d !== weekday) : [...cfg.weekdays, weekday];
    if (!next.length) return; // an enabled event needs at least one day
    update({ weekdays: next });
  };

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-base font-sans-semibold text-ink-50">{t(event.titleKey)}</Text>
          <Text className="mt-0.5 text-xs leading-5 text-ink-400">{t(event.descKey)}</Text>
        </View>
        <Switch value={cfg.enabled} onValueChange={(enabled) => update({ enabled })} />
      </View>

      {cfg.enabled && cfg.schedule?.length ? (
        <View className="mt-4 border-t border-ink-800 pt-4">
          <Text className="text-xs leading-5 text-ink-400">
            {t('notifEvent.trainingFollowsProgram')}
          </Text>
        </View>
      ) : cfg.enabled ? (
        <View className="mt-4 border-t border-ink-800 pt-4">
          <View className="mb-4">
            <WeekdayChips selected={cfg.weekdays} onPress={toggleDay} size="sm" />
          </View>
          {/* Time */}
          <TimePicker
            hour={cfg.hour}
            minute={cfg.minute}
            clock={clock}
            onChange={({ hour, minute }) => update({ hour, minute })}
          />
        </View>
      ) : null}
    </Card>
  );
};

/**
 * Notification events — a fixed, feature-owned catalogue the user can tune
 * (on/off, days, time) but never extend or delete. The master switch kills
 * everything at once.
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
