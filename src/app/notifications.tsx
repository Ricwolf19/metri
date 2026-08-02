import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, Screen, Switch, TimePicker } from '@/components/ui';
import {
  NOTIFICATION_EVENTS,
  type EventConfig,
  type NotificationEvent,
} from '@/features/notifications/events';
import { getEventConfig, syncNotificationEvents } from '@/features/notifications/policies';
import { useI18n, useT } from '@/i18n';
import { settings } from '@/lib/storage';

// Monday-first single letters, mapped to expo weekday numbers (1=Sun…7=Sat).
const DAY_ORDER = [2, 3, 4, 5, 6, 7, 1];
const DAY_LABELS: Record<string, string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  es: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
};

const EventCard = ({ event }: { event: NotificationEvent }) => {
  const t = useT();
  const { locale } = useI18n();
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

  const labels = DAY_LABELS[locale] ?? DAY_LABELS.en;

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-base font-sans-semibold text-ink-50">{t(event.titleKey)}</Text>
          <Text className="mt-0.5 text-xs leading-5 text-ink-400">{t(event.descKey)}</Text>
        </View>
        <Switch value={cfg.enabled} onValueChange={(enabled) => update({ enabled })} />
      </View>

      {cfg.enabled ? (
        <View className="mt-4 border-t border-ink-800 pt-4">
          {/* Days */}
          <View className="mb-4 flex-row justify-between">
            {DAY_ORDER.map((weekday, i) => {
              const active = cfg.weekdays.includes(weekday);
              return (
                <Pressable
                  key={weekday}
                  onPress={() => toggleDay(weekday)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={[
                    'h-9 w-9 items-center justify-center rounded-full border',
                    active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
                  ].join(' ')}
                >
                  <Text
                    className={[
                      'text-xs font-sans-semibold',
                      active ? 'text-brand' : 'text-ink-400',
                    ].join(' ')}
                  >
                    {labels[i]}
                  </Text>
                </Pressable>
              );
            })}
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
    <Screen scroll contentClassName="px-5 pb-12">
      <TopBar title={t('menu.notifications')} showBack showAvatar={false} />

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
