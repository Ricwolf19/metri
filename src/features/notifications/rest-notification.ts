import { Linking, Platform } from 'react-native';
import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidForegroundServiceType,
  AndroidImportance,
  EventType,
  TriggerType,
  type Event,
} from 'react-native-notify-kit';

import { restState, type ActiveRest } from '@/features/training/rest-state';
import { startAlarm, stopAlarm } from '@/lib/sounds';

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

/**
 * Channel ids carry a version because **a registered channel is immutable** —
 * changing its sound or importance in code is silently ignored on every device
 * that already has it. Bump the suffix and add the old id to `RETIRED_CHANNELS`
 * whenever those settings change, or existing installs keep the old behaviour
 * for good.
 */
const CHANNEL_ID = 'rest-timer-v2';
/** The rest-over alert gets its own channel: a looping alarm sound cannot share
 * a channel with the silent, ongoing countdown (Android fixes sound per channel). */
const ALARM_CHANNEL_ID = 'rest-alarm-v2';
const RETIRED_CHANNELS = ['rest-timer', 'rest-alarm'];
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
  for (const id of RETIRED_CHANNELS) await notifee.deleteChannel(id).catch(() => {});
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
    // The lifter asked for this alert and is not holding the phone. It is the
    // one thing metri sends that Do Not Disturb should not swallow.
    bypassDnd: true,
    vibrationPattern: [250, 250, 250, 250],
  });
};

const workoutUrl = (rest: ActiveRest) =>
  `metri://training/workout/${rest.workoutId}?slot=${rest.slotId}`;

/**
 * "Rest over", shared by both paths. `silent` is the service's version: it makes
 * the noise itself through the media stream, so letting the channel sound too
 * would double up. The trigger fallback keeps the channel sound, since with the
 * service gone it is the only thing left that can ring.
 */
const restOverNotification = (rest: ActiveRest, silent: boolean) => ({
  id: REST_ID,
  title: rest.copy.overTitle,
  body: rest.copy.overBody,
  data: { url: workoutUrl(rest) },
  android: {
    channelId: silent ? CHANNEL_ID : ALARM_CHANNEL_ID,
    ...(silent
      ? {
          asForegroundService: true,
          foregroundServiceTypes: [
            AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
          ],
        }
      : // Rings until the set is acknowledged: mid-session the phone is not in
        // hand, so a single chime is missed.
        { loopSound: true }),
    category: AndroidCategory.ALARM,
    smallIcon: 'ic_notification',
    color: BRAND,
    lightUpScreen: true,
    ongoing: true,
    autoCancel: false,
    pressAction: { id: ACTION.open, launchActivity: 'default' },
    actions: [
      { title: rest.copy.skipLabel, pressAction: { id: ACTION.skip } },
      { title: rest.copy.plus30Label, pressAction: { id: ACTION.plus30 } },
    ],
  },
  ios: { sound: 'rest_alarm.wav', critical: false },
});

const displayRestOver = (rest: ActiveRest) =>
  notifee.displayNotification(restOverNotification(rest, true));

/** Armed as a fallback for a service Android decided to kill. */
const scheduleRestOver = (rest: ActiveRest) =>
  notifee.createTriggerNotification(restOverNotification(rest, false), {
    type: TriggerType.TIMESTAMP,
    timestamp: rest.endsAt,
    alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
  });

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
        // The rest runs as a foreground service so the JS runtime survives the
        // screen going off. That is what lets the alarm below ring at all: with
        // the app merely backgrounded there is no React tree left to run it.
        asForegroundService: true,
        foregroundServiceTypes: [
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
        ],
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

/** How often the service re-checks the clock and whether the rest still stands. */
const TICK_MS = 1000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The rest this notification describes, or null once it has been acknowledged. */
const liveRest = (workoutId: string): ActiveRest | null => {
  const current = restState.get();
  return current && current.workoutId === workoutId ? current : null;
};

/**
 * Body of the rest foreground service: hold the runtime open for the rest, ring
 * when it ends, and keep ringing until the lifter acknowledges.
 *
 * The countdown lives here rather than on an `AlarmManager` trigger because
 * exact alarms are denied by default from Android 14 on for anything that is
 * not a clock, so the trigger can land minutes late in Doze. While this service
 * runs the trigger is redundant, so it is cancelled; if Android kills the
 * service anyway the trigger is still armed and fires the channel sound as a
 * fallback.
 */
const runRestService = async (workoutId: string): Promise<void> => {
  let alarming = false;
  try {
    for (;;) {
      const rest = liveRest(workoutId);
      // Skipped, extended past, or the next set was logged: nothing left to do.
      if (!rest) return;

      if (Date.now() < rest.endsAt) {
        // A "+30 s" while the alarm rings puts the lifter back in the rest.
        if (alarming) {
          alarming = false;
          stopAlarm();
          await showRest(rest).catch(() => {});
        }
        await sleep(TICK_MS);
        continue;
      }

      if (!alarming) {
        alarming = true;
        await notifee.cancelTriggerNotification(REST_ID).catch(() => {});
        await displayRestOver(rest).catch(() => {});
        startAlarm();
      }
      await sleep(TICK_MS);
    }
  } finally {
    if (alarming) stopAlarm();
  }
};

/**
 * Registered at the bundle entry, not in the React tree: the service outlives
 * every screen. Returns only when the rest is done, which is what tells Android
 * it may stop the service.
 */
export const registerRestForegroundService = (): void => {
  notifee.registerForegroundService(async (notification) => {
    const workoutId = restState.get()?.workoutId;
    if (notification.id !== REST_ID || !workoutId) return;
    await runRestService(workoutId);
  });
};

/**
 * Persist + show; the screen calls this once per logged set.
 *
 * `startRest`/`extendRest`/`endRest` are the only places a rest changes state,
 * so they are also the only places that silence the alarm — callers never do.
 */
export const startRest = async (rest: ActiveRest): Promise<void> => {
  stopAlarm();
  restState.set(rest);
  await showRest(rest).catch(() => {});
};

/** Push `endsAt` forward; a rest that already ended restarts from now. */
export const extendRest = async (seconds: number): Promise<void> => {
  const current = restState.get();
  if (!current) return;
  stopAlarm();
  const next = { ...current, endsAt: Math.max(current.endsAt, Date.now()) + seconds * 1000 };
  restState.set(next);
  await showRest(next).catch(() => {});
};

/** Skip, reached zero, next set logged, workout finished or abandoned. */
export const endRest = async (): Promise<void> => {
  // Cleared first: the service reads this to decide it is done.
  restState.clear();
  stopAlarm();
  await notifee.cancelTriggerNotification(REST_ID).catch(() => {});
  await notifee.cancelNotification(REST_ID).catch(() => {});
  if (isAndroid) await notifee.stopForegroundService().catch(() => {});
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
