import { Linking, Platform } from 'react-native';
import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidForegroundServiceType,
  AndroidImportance,
  AndroidStyle,
  EventType,
  TriggerType,
  type Event,
} from 'react-native-notify-kit';

import { dayQuery } from '@/features/training/adherence.repo';
import { localDateKey } from '@/features/training/dates';
import { restState, shiftRestEnd, type ActiveRest } from '@/features/training/rest-state';
import { sessionState, type ActiveSession } from '@/features/training/session-state';
import { startAlarm, stopAlarm } from '@/lib/sounds';
import { session as authSession } from '@/lib/storage';

import {
  ACTION,
  notificationContent,
  notificationMode,
  type NotificationContent,
} from './notification-content';
import { holdCheckin, releaseCheckin } from './policies';
import { runSessionService, type ServiceDeps } from './session-service';

/**
 * The ONE training notification (the only module importing react-native-notify-kit).
 *
 * Android: a single ongoing notification, `SESSION_ID`, that changes face
 * instead of being joined by a second one. Training mode shows the next set
 * (exercise, set n/total, target, load) under a session clock; a rest turns the
 * same card into an OS-drawn countdown (`showChronometer`, so it ticks on the
 * lock screen with no JS alive) with Skip / +30 s / +1 min; when the rest ends
 * it becomes "rest over" and rings until acknowledged, then goes back to
 * training mode. The card never disappears before finish/abandon.
 *
 * It is a foreground service for the whole session (`session-service.ts`): a
 * re-display with the same id only re-notifies, a different id would be
 * refused while the service runs, and only `endSession` stops it. Action
 * buttons arrive as background events (headless when the app is killed), so
 * the handlers below must only touch MMKV and notifee. iOS gets the rest-over
 * trigger only (no ongoing card, no chronometer, no actions yet).
 */

/**
 * Channel ids carry a version because **a registered channel is immutable** —
 * changing its sound or importance in code is silently ignored on every device
 * that already has it. Bump the suffix and add the old id to `RETIRED_CHANNELS`
 * whenever those settings change, or existing installs keep the old behaviour
 * for good.
 */
const TRAINING_CHANNEL_ID = 'training-v1';
/** The rest-over FALLBACK gets its own channel: a looping alarm sound cannot
 * share a channel with the silent, ongoing card (Android fixes sound per channel). */
const ALARM_CHANNEL_ID = 'rest-alarm-v2';
const RETIRED_CHANNELS = ['rest-timer', 'rest-alarm', 'rest-timer-v2', 'session-v1'];
/** Every face of the notification, and the fallback trigger, share this id. */
const SESSION_ID = 'session';
const BRAND = '#bef82b';

const isAndroid = Platform.OS === 'android';

export const initRestNotifications = async (): Promise<void> => {
  if (!isAndroid) return;
  for (const id of RETIRED_CHANNELS) await notifee.deleteChannel(id).catch(() => {});
  // HIGH so the card can alert when the rest ends; every other redraw passes
  // `onlyAlertOnce`. No sound: the alarm is played by the service itself.
  await notifee.createChannel({
    id: TRAINING_CHANNEL_ID,
    name: 'Training',
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

/** One mapping from the pure content onto notifee's payload. */
const payload = (
  content: NotificationContent,
  opts: { channelId: string; foregroundService: boolean; loopSound?: boolean },
) => ({
  id: SESSION_ID,
  title: content.title,
  body: content.body,
  data: { url: content.url },
  android: {
    channelId: opts.channelId,
    ...(opts.foregroundService
      ? {
          asForegroundService: true,
          foregroundServiceTypes: [
            AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
          ],
        }
      : {}),
    // Rings until the set is acknowledged: mid-session the phone is not in
    // hand, so a single chime is missed.
    ...(opts.loopSound ? { loopSound: true } : {}),
    ...(content.lines.length > 1
      ? { style: { type: AndroidStyle.BIGTEXT as const, text: content.lines.join('\n') } }
      : {}),
    ...(content.chronometer
      ? {
          showChronometer: true,
          chronometerDirection: content.chronometer.direction,
          timestamp: content.chronometer.timestamp,
          showTimestamp: false,
        }
      : {}),
    ongoing: true,
    autoCancel: false,
    onlyAlertOnce: content.alertOnce,
    lightUpScreen: content.mode === 'restOver',
    category: content.mode === 'training' ? AndroidCategory.STATUS : AndroidCategory.ALARM,
    smallIcon: 'ic_notification',
    color: BRAND,
    pressAction: { id: ACTION.open, launchActivity: 'default' },
    actions: content.actions.map((a) => ({ title: a.title, pressAction: { id: a.id } })),
  },
  ...(opts.loopSound ? { ios: { sound: 'rest_alarm.wav', critical: false } } : {}),
});

/** The rest this session is in, or null (a rest of another workout is stale). */
const liveRest = (workoutId: string): ActiveRest | null => {
  const current = restState.get();
  return current && current.workoutId === workoutId ? current : null;
};

/** Redraw the card from MMKV in whatever face the clock says. Android only. */
const draw = async (): Promise<void> => {
  if (!isAndroid) return;
  const session = sessionState.get();
  if (!session) return;
  const rest = liveRest(session.workoutId);
  const content = notificationContent(session, rest, notificationMode(rest, Date.now()));
  if (!content) return;
  await notifee
    .displayNotification(
      payload(content, { channelId: TRAINING_CHANNEL_ID, foregroundService: true }),
    )
    .catch(() => {});
};

/**
 * Armed as a fallback for a service Android decided to kill: the same id, so it
 * replaces the card rather than joining it, on the channel that carries the
 * sound — with the service gone, the channel is the only thing left that can ring.
 */
const scheduleRestOver = async (rest: ActiveRest): Promise<void> => {
  const content = notificationContent(sessionState.get(), rest, 'restOver');
  if (!content) return;
  await notifee.createTriggerNotification(
    payload(content, { channelId: ALARM_CHANNEL_ID, foregroundService: false, loopSound: true }),
    {
      type: TriggerType.TIMESTAMP,
      timestamp: rest.endsAt,
      alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
    },
  );
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const serviceDeps: ServiceDeps = {
  now: Date.now,
  sleep,
  session: () => sessionState.get(),
  rest: () => restState.get(),
  onRestOver: async () => {
    await notifee.cancelTriggerNotification(SESSION_ID).catch(() => {});
    await draw();
    startAlarm();
  },
  onRestResumed: async () => {
    stopAlarm();
    await draw();
  },
  onStop: stopAlarm,
};

/**
 * Registered at the bundle entry, not in the React tree: the service outlives
 * every screen. Returns only when the session is gone, which is what tells
 * Android it may stop the service.
 */
export const registerRestForegroundService = (): void => {
  notifee.registerForegroundService(async (notification) => {
    if (notification.id !== SESSION_ID) return;
    const workoutId = sessionState.get()?.workoutId;
    if (!workoutId) return;
    await runSessionService(workoutId, serviceDeps);
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
  await draw();
  await scheduleRestOver(rest).catch(() => {});
};

/**
 * Shift `endsAt` by `seconds` (negative shortens); a rest that already ended
 * restarts from now. Shortening past zero ENDS the rest instead of ringing: the
 * reduce controls exist only on screen, so the lifter is holding the phone.
 */
export const extendRest = async (seconds: number): Promise<void> => {
  const current = restState.get();
  if (!current) return;
  const endsAt = shiftRestEnd(current.endsAt, Date.now(), seconds);
  if (endsAt == null) return endRest();
  stopAlarm();
  const next = { ...current, endsAt };
  restState.set(next);
  await draw();
  await scheduleRestOver(next).catch(() => {});
};

/**
 * Skip, ready, next set logged, or a stale rest found: back to training mode.
 * The service keeps running — only `endSession` stops it.
 */
export const endRest = async (): Promise<void> => {
  // Cleared first: the service reads this to know the ringing is over.
  restState.clear();
  stopAlarm();
  await notifee.cancelTriggerNotification(SESSION_ID).catch(() => {});
  if (isAndroid && sessionState.get()) await draw();
  // iOS, or no session to go back to: the fired rest-over is all there is.
  else await notifee.cancelNotification(SESSION_ID).catch(() => {});
};

/**
 * Show (or redraw) the card and record the session — kept on iOS too, since
 * the catch-up banner and the check-in hold read it. Only the first call of a
 * session holds the planned check-in back; redraws (one per logged set) must
 * not re-run the reconciler.
 */
export const showSession = async (session: ActiveSession): Promise<void> => {
  const fresh = sessionState.get()?.workoutId !== session.workoutId;
  sessionState.set(session);
  if (fresh) void holdCheckin(session.startedAt).catch(() => {});
  await draw();
};

/** Re-post the card as it stands (idempotent): the screen calls it when the app
 * comes back to the foreground, in case the OS killed the service alone. */
export const redrawSession = (): Promise<void> => draw();

/** Finishing marks the day trained; a check-in afterwards would ask what is answered. */
const isDayResolved = (startedAt: number): boolean => {
  const userId = authSession.getUserId();
  if (!userId) return false;
  try {
    return dayQuery(userId, localDateKey(new Date(startedAt))).get() !== undefined;
  } catch {
    return false;
  }
};

/**
 * Workout finished or abandoned: drop the card, the records and the service,
 * and re-anchor the check-in to the real end. Callers finish/abandon the log
 * FIRST, so a finished day already reads as resolved here. The only place the
 * foreground service stops.
 */
export const endSession = async (): Promise<void> => {
  const ended = sessionState.get();
  sessionState.clear();
  if (ended && restState.get()?.workoutId === ended.workoutId) {
    restState.clear();
    stopAlarm();
  }
  await notifee.cancelTriggerNotification(SESSION_ID).catch(() => {});
  await notifee.cancelNotification(SESSION_ID).catch(() => {});
  if (isAndroid) await notifee.stopForegroundService().catch(() => {});
  if (!ended) return;
  await releaseCheckin({
    startedAt: ended.startedAt,
    endedAt: Date.now(),
    dayResolved: isDayResolved(ended.startedAt),
  }).catch(() => {});
};

/**
 * Boot: a session record whose workout is still live gets its card (and the
 * service) back after a process death; one whose workout is no longer live
 * (killed mid-session, finished on another path) must not keep a notification
 * or the check-in hold.
 */
export const reconcileSession = async (isLive: (workoutId: string) => boolean): Promise<void> => {
  const session = sessionState.get();
  if (session && isLive(session.workoutId)) {
    await draw();
    return;
  }
  await endSession();
};

const openUrl = (event: Event) => {
  const url = event.detail.notification?.data?.url;
  if (typeof url === 'string') void Linking.openURL(url);
};

/** Shared by the foreground and the background (headless) subscriptions. */
const handleRestEvent = async ({ type, detail }: Event): Promise<void> => {
  if (detail.notification?.id !== SESSION_ID) return;
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
  if (initial && initial.notification?.id === SESSION_ID) {
    openUrl({ type: EventType.PRESS, detail: { notification: initial.notification } });
  }
};

export const registerRestBackgroundHandler = (): void => {
  notifee.onBackgroundEvent(handleRestEvent);
};
