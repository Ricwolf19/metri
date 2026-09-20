import { Linking, Platform } from 'react-native';
import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidImportance,
  EventType,
  TriggerType,
  type Event,
} from 'react-native-notify-kit';

import { restState, type ActiveRest } from '@/features/training/rest-state';

/**
 * Rest-timer notification (the only module importing react-native-notify-kit).
 *
 * Android: one ongoing notification whose countdown is drawn by the OS
 * (`showChronometer`, so it ticks on the lock screen with no JS alive) plus a
 * trigger with the same id that replaces it at `endsAt` with "Rest over". Action
 * buttons arrive as background events (headless when the app is killed), so the
 * handlers below must only touch MMKV and notifee. iOS gets the "Rest over"
 * trigger only (no chronometer, no actions yet).
 */

const CHANNEL_ID = 'rest-timer';
/** The rest-over alert gets its own channel: a looping alarm sound cannot share
 * a channel with the silent, ongoing countdown (Android fixes sound per channel). */
const ALARM_CHANNEL_ID = 'rest-alarm';
/** Shared by the resting and the rest-over notification: the second replaces the first. */
const REST_ID = 'rest';
const ACTION = {
  open: 'rest-open',
  skip: 'rest-skip',
  plus30: 'rest-plus-30',
  plus60: 'rest-plus-60',
} as const;
const BRAND = '#bef82b';

const isAndroid = Platform.OS === 'android';

export const initRestNotifications = async (): Promise<void> => {
  if (!isAndroid) return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Rest timer',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [250, 250, 250, 250],
  });
  await notifee.createChannel({
    id: ALARM_CHANNEL_ID,
    name: 'Rest finished',
    importance: AndroidImportance.HIGH,
    sound: 'rest_alarm',
    vibrationPattern: [250, 250, 250, 250],
  });
};

const workoutUrl = (rest: ActiveRest) =>
  `metri://training/workout/${rest.workoutId}?slot=${rest.slotId}`;

const scheduleRestOver = (rest: ActiveRest) =>
  notifee.createTriggerNotification(
    {
      id: REST_ID,
      title: rest.copy.overTitle,
      body: rest.copy.overBody,
      data: { url: workoutUrl(rest) },
      android: {
        channelId: ALARM_CHANNEL_ID,
        category: AndroidCategory.ALARM,
        smallIcon: 'ic_notification',
        color: BRAND,
        lightUpScreen: true,
        // Rings until the set is acknowledged — mid-session the phone is not
        // in hand, so a single chime is missed.
        loopSound: true,
        ongoing: true,
        autoCancel: false,
        pressAction: { id: ACTION.open, launchActivity: 'default' },
        actions: [{ title: rest.copy.skipLabel, pressAction: { id: ACTION.skip } }],
      },
      ios: { sound: 'rest_alarm.wav', critical: false },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: rest.endsAt,
      alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
    },
  );

/** Show (or redraw) the resting notification and (re)arm the rest-over trigger. */
const showRest = async (rest: ActiveRest): Promise<void> => {
  if (isAndroid) {
    await notifee.displayNotification({
      id: REST_ID,
      title: rest.copy.restingTitle,
      body: rest.copy.restingBody,
      data: { url: workoutUrl(rest) },
      android: {
        channelId: CHANNEL_ID,
        ongoing: true,
        onlyAlertOnce: true,
        autoCancel: false,
        showChronometer: true,
        chronometerDirection: 'down',
        timestamp: rest.endsAt,
        showTimestamp: false,
        category: AndroidCategory.ALARM,
        smallIcon: 'ic_notification',
        color: BRAND,
        pressAction: { id: ACTION.open, launchActivity: 'default' },
        actions: [
          { title: rest.copy.skipLabel, pressAction: { id: ACTION.skip } },
          { title: rest.copy.plus30Label, pressAction: { id: ACTION.plus30 } },
          { title: rest.copy.plus60Label, pressAction: { id: ACTION.plus60 } },
        ],
      },
    });
  }
  await scheduleRestOver(rest);
};

/** Persist + show. The screen calls this once per logged set. */
export const startRest = async (rest: ActiveRest): Promise<void> => {
  restState.set(rest);
  await showRest(rest).catch(() => {});
};

/** Push `endsAt` forward; a rest that already ended restarts from now. */
export const extendRest = async (seconds: number): Promise<void> => {
  const current = restState.get();
  if (!current) return;
  const next = { ...current, endsAt: Math.max(current.endsAt, Date.now()) + seconds * 1000 };
  restState.set(next);
  await showRest(next).catch(() => {});
};

/** Skip, reached zero, next set logged, workout finished or abandoned. */
export const endRest = async (): Promise<void> => {
  restState.clear();
  await notifee.cancelNotification(REST_ID).catch(() => {});
};

const openUrl = (event: Event) => {
  const url = event.detail.notification?.data?.url;
  if (typeof url === 'string') void Linking.openURL(url);
};

/** Shared by the foreground and the background (headless) subscriptions. */
const handleRestEvent = async ({ type, detail }: Event): Promise<void> => {
  if (detail.notification?.id !== REST_ID) return;
  if (type === EventType.ACTION_PRESS) {
    const id = detail.pressAction?.id;
    if (id === ACTION.skip) await endRest();
    else if (id === ACTION.plus30) await extendRest(30);
    else if (id === ACTION.plus60) await extendRest(60);
    return;
  }
  if (type === EventType.PRESS) openUrl({ type, detail });
};

export const subscribeRestEvents = (): (() => void) =>
  notifee.onForegroundEvent((event) => {
    void handleRestEvent(event);
  });

/** Cold start from a notification tap: route to the workout. */
export const openInitialRestNotification = async (): Promise<void> => {
  const initial = await notifee.getInitialNotification().catch(() => null);
  if (initial?.notification?.id === REST_ID) {
    openUrl({ type: EventType.PRESS, detail: { notification: initial.notification } });
  }
};

export const registerRestBackgroundHandler = (): void => {
  notifee.onBackgroundEvent(handleRestEvent);
};
