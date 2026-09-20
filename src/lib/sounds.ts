import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

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

let configured = false;
const configure = () => {
  if (configured) return;
  configured = true;
  // A cue is feedback, not content: it honours the silent switch and goes
  // quiet with the app, so it never talks over the user's own audio.
  void setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false }).catch(
    () => {},
  );
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

/** The rest alarm rings until it is acknowledged, so it loops. */
export const startAlarm = (): void => {
  const player = playerFor('restAlarm');
  if (!player) return;
  try {
    void player.seekTo(0).catch(() => {});
    player.loop = true;
    player.play();
  } catch {
    /* ignore */
  }
};

export const stopAlarm = (): void => {
  const player = players.get('restAlarm');
  if (!player) return;
  try {
    player.loop = false;
    player.pause();
    void player.seekTo(0).catch(() => {});
  } catch {
    /* ignore */
  }
};
