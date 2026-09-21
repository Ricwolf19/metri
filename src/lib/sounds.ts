import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';

/**
 * The app's sound cues. One module owns every player so a screen never touches
 * expo-audio directly, and so the alarm can be stopped from anywhere.
 *
 * Players are created lazily and kept: `createAudioPlayer` decodes on creation,
 * and a cue that stutters the first time it fires is worse than no cue.
 */
export type SoundId = 'sessionDone' | 'discard' | 'restAlarm';

const SOURCES: Record<SoundId, number> = {
  sessionDone: require('@/assets/sounds/session_done.wav'),
  discard: require('@/assets/sounds/discard.wav'),
  restAlarm: require('@/assets/sounds/rest_alarm.wav'),
};

const players = new Map<SoundId, AudioPlayer>();

/** Buzz, pause, buzz — long enough to feel through a pocket, repeated. */
const VIBRATION_PATTERN = [0, 700, 600, 700, 600];

/**
 * Two modes, because the app makes two kinds of sound.
 *
 * A cue is feedback: it honours the silent switch and goes quiet with the app,
 * so it never talks over the user's own audio. The rest alarm is the opposite —
 * the lifter armed it on purpose and is not holding the phone, so it has to
 * survive the screen going off and ring through a silenced ringer, the same way
 * a clock alarm does. Switching is global in expo-audio, hence the restore.
 */
const CUE_MODE = { playsInSilentMode: false, shouldPlayInBackground: false } as const;
const ALARM_MODE = { playsInSilentMode: true, shouldPlayInBackground: true } as const;

let configured = false;
const setMode = (mode: typeof CUE_MODE | typeof ALARM_MODE) => {
  void setAudioModeAsync(mode).catch(() => {});
};
const configure = () => {
  if (configured) return;
  configured = true;
  setMode(CUE_MODE);
};

const playerFor = (id: SoundId): AudioPlayer | null => {
  const existing = players.get(id);
  if (existing) return existing;
  try {
    configure();
    const player = createAudioPlayer(SOURCES[id]);
    players.set(id, player);
    return player;
  } catch {
    // Audio is decoration: a device that refuses to play must not break a save.
    return null;
  }
};

/** Decode every cue once at startup; the first play must not be the slow one. */
export const preloadSounds = (): void => {
  for (const id of Object.keys(SOURCES) as SoundId[]) playerFor(id);
};

/** Fire and forget. Never throws — the caller's action matters, the sound does not. */
export const playSound = (id: SoundId): void => {
  const player = playerFor(id);
  if (!player) return;
  try {
    void player.seekTo(0).catch(() => {});
    player.loop = false;
    player.play();
  } catch {
    /* ignore */
  }
};

/**
 * The rest alarm rings and buzzes until it is acknowledged.
 *
 * Only ever called from the rest foreground service: with the app backgrounded
 * there is no React tree left to run it, and without the service Android stops
 * the audio the moment the screen goes off. The vibration repeats because the
 * notification channel cannot do it — Android mutes a channel's haptics as soon
 * as it carries a sound.
 */
export const startAlarm = (): void => {
  setMode(ALARM_MODE);
  try {
    Vibration.vibrate(VIBRATION_PATTERN, true);
  } catch {
    /* a device without a vibrator still gets the sound */
  }
  const player = playerFor('restAlarm');
  if (!player) return;
  try {
    void player.seekTo(0).catch(() => {});
    player.loop = true;
    player.volume = 1;
    player.play();
  } catch {
    /* ignore */
  }
};

export const stopAlarm = (): void => {
  try {
    Vibration.cancel();
  } catch {
    /* ignore */
  }
  const player = players.get('restAlarm');
  if (player) {
    try {
      player.loop = false;
      player.pause();
      void player.seekTo(0).catch(() => {});
    } catch {
      /* ignore */
    }
  }
  // Back to cue behaviour, or every later beep would ignore the silent switch.
  setMode(CUE_MODE);
};
