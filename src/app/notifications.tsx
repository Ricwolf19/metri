import { useState } from 'react';
import { Text, View } from 'react-native';

import { BellIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Card,
  Screen,
  ScreenTitle,
  SectionLabel,
  SegmentedControl,
  Stepper,
  Switch,
} from '@/components/ui';
import {
  CHECKIN_OFFSET_RANGE,
  DEFAULT_CHECKIN_OFFSET_MIN,
  EVENT_GROUPS,
  NOTIFICATION_EVENTS,
  type EventConfig,
  type NotificationEvent,
} from '@/features/notifications/events';
import { getEventConfig, syncNotificationEvents } from '@/features/notifications/policies';
import { TIP_FREQUENCIES, tipSlotsFor } from '@/features/notifications/tips';
import { StartTimeField } from '@/features/training/components/StartTimeField';
import { fromHourMinute, toHourMinute } from '@/features/training/schedule';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';
import { settings } from '@/lib/storage';

/** Which inline time picker is open — only one at a time, `null` for none. */
type OpenPicker = number | null;

const EventCard = ({ event }: { event: NotificationEvent }) => {
  const t = useT();
  const [cfg, setCfg] = useState<EventConfig>(() => getEventConfig(event));
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  const update = (patch: Partial<EventConfig>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    settings.setEventConfig(event.id, next);
    void syncNotificationEvents();
  };

  const times = cfg.timesPerDay ?? 2;
  // A stale `slots` from a different count is ignored until the user edits again.
  const slots = cfg.slots?.length === times ? cfg.slots : tipSlotsFor(times);
  const offset = cfg.offsetMinutes ?? DEFAULT_CHECKIN_OFFSET_MIN;

  const setSlot = (index: number, startMinute: number) =>
    update({
      slots: slots.map((slot, i) => (i === index ? toHourMinute(startMinute) : slot)),
    });

  const detail = () => {
    switch (event.tuning) {
      case 'program':
        return (
          <Text className="text-xs leading-5 text-ink-400">
            {cfg.schedule?.length
              ? t('notifEvent.trainingFollowsProgram')
              : t('notifEvent.trainingNoProgram')}
          </Text>
        );
      case 'offset':
        return (
          <>
            <Text className="text-xs leading-5 text-ink-400">
              {cfg.schedule?.length
                ? t('notifEvent.checkinFollowsProgram', {
                    delay: t('notifEvent.hours', { n: Math.round(offset / 60) }),
                  })
                : t('notifEvent.trainingNoProgram')}
            </Text>
            <View className="mt-3">
              <Stepper
                label={t('notifEvent.checkinDelay')}
                value={offset}
                min={CHECKIN_OFFSET_RANGE.min}
                max={CHECKIN_OFFSET_RANGE.max}
                step={CHECKIN_OFFSET_RANGE.step}
                format={(n) => t('notifEvent.hours', { n: Math.round(n / 60) })}
                onChange={(offsetMinutes) => update({ offsetMinutes })}
              />
            </View>
          </>
        );
      case 'frequency':
        return (
          <>
            <SectionLabel className="mt-0" label={t('notifEvent.tipsPerDay')} />
            <SegmentedControl
              segments={TIP_FREQUENCIES.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(times)}
              onChange={(value) => {
                const next = Number(value);
                // The slot list must match the count, so a change reseeds it.
                update({ timesPerDay: next, slots: tipSlotsFor(next) });
                setOpenPicker(null);
              }}
            />
            <SectionLabel label={t('notifEvent.tipsWhen')} className="mt-5" />
            {slots.map((slot, i) => (
              <View key={i} className={i > 0 ? 'mt-1' : ''}>
                <Text className="text-xs text-ink-400">
                  {t('notifEvent.tipSlot', { n: i + 1 })}
                </Text>
                <StartTimeField
                  value={fromHourMinute(slot.hour, slot.minute)}
                  open={openPicker === i}
                  onToggle={() => setOpenPicker(openPicker === i ? null : i)}
                  onChange={(startMinute) => setSlot(i, startMinute)}
                />
              </View>
            ))}
          </>
        );
      case 'time':
        return (
          <>
            <SectionLabel className="mt-0" label={t('notifEvent.time')} />
            <StartTimeField
              value={fromHourMinute(cfg.hour, cfg.minute)}
              open={openPicker === 0}
              onToggle={() => setOpenPicker(openPicker === 0 ? null : 0)}
              onChange={(startMinute) => update(toHourMinute(startMinute))}
            />
          </>
        );
    }
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

      {cfg.enabled ? <View className="mt-4 border-t border-ink-800 pt-4">{detail()}</View> : null}
    </Card>
  );
};

/**
 * Notification settings, sectioned by what the notification IS: your training
 * (schedule-driven), knowledge (the rotating tips), plain reminders. The
 * catalogue itself is feature-owned — the user tunes events, never adds them.
 * The master switch kills everything at once.
 */
const Notifications = () => {
  const t = useT();
  const { muted } = useTheme();
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
          {EVENT_GROUPS.map(({ group, labelKey }) => {
            const events = NOTIFICATION_EVENTS.filter((e) => e.group === group);
            if (!events.length) return null;
            return (
              <View key={group}>
                <SectionLabel label={t(labelKey)} />
                <View className="gap-3">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </View>
              </View>
            );
          })}

          <Card className="mt-7 flex-row items-center gap-3" surface="sunken">
            <BellIcon color={muted} size={18} />
            <View className="flex-1">
              <Text className="text-sm font-sans-semibold text-ink-200">
                {t('notifEvent.soonTitle')}
              </Text>
              <Text className="mt-0.5 text-xs leading-5 text-ink-400">
                {t('notifEvent.soonBody')}
              </Text>
            </View>
          </Card>
        </>
      ) : null}
    </Screen>
  );
};

export default Notifications;
