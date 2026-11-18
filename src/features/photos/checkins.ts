import type { ProgressCheckin, ProgressPhoto, ProgressPose } from '@/db/schema';
import type { TranslationKey } from '@/i18n';

/** Capture order: the camera walks them in this order, every strip draws them in it. */
export const POSES: readonly ProgressPose[] = ['front', 'back', 'left', 'right', 'flex'];

export const poseLabelKey = (pose: ProgressPose): TranslationKey => `photos.pose.${pose}`;

export const isPose = (value: unknown): value is ProgressPose =>
  typeof value === 'string' && (POSES as readonly string[]).includes(value);

/** A check-in with what it holds: one photo per pose at most, any number of clips. */
export type CheckinEntry = {
  checkin: ProgressCheckin;
  /** Photos in `POSES` order, then the ones with no pose, oldest first. */
  photos: ProgressPhoto[];
  /** Clips, oldest first. */
  videos: ProgressPhoto[];
};

const poseRank = (p: ProgressPhoto): number => (p.pose ? POSES.indexOf(p.pose) : POSES.length);

/**
 * Pair check-ins (newest first, as `checkinsQuery` reads them) with their media.
 * Media whose check-in is gone is dropped here; `adoptLegacyPhotos` files the
 * older photos that never had one before this runs.
 */
export const groupCheckins = (
  checkins: readonly ProgressCheckin[],
  media: readonly ProgressPhoto[],
): CheckinEntry[] => {
  const byCheckin = new Map<string, ProgressPhoto[]>();
  for (const m of media) {
    if (!m.checkinId) continue;
    const list = byCheckin.get(m.checkinId);
    if (list) list.push(m);
    else byCheckin.set(m.checkinId, [m]);
  }
  return checkins.map((checkin) => {
    const items = [...(byCheckin.get(checkin.id) ?? [])].sort(
      (a, b) => a.takenAt.getTime() - b.takenAt.getTime(),
    );
    return {
      checkin,
      photos: items
        .filter((m) => m.kind === 'photo')
        .sort((a, b) => poseRank(a) - poseRank(b) || a.takenAt.getTime() - b.takenAt.getTime()),
      videos: items.filter((m) => m.kind === 'video'),
    };
  });
};

export const photoForPose = (entry: CheckinEntry, pose: ProgressPose): ProgressPhoto | null =>
  entry.photos.find((p) => p.pose === pose) ?? null;

/** The first pose (in capture order) this check-in has no photo for, starting at `from`. */
export const nextMissingPose = (
  entry: CheckinEntry | null,
  from: ProgressPose | null = null,
): ProgressPose | null => {
  const start = from ? POSES.indexOf(from) : 0;
  const ordered = [...POSES.slice(start), ...POSES.slice(0, start)];
  return ordered.find((pose) => !entry || !photoForPose(entry, pose)) ?? null;
};

/**
 * The photo the camera lays over its view for `pose`: the same pose from the
 * latest OTHER check-in dated on or before `date` (the one being retaken may be
 * old), else the newest one at all. Entries are newest first.
 */
export const ghostFor = (
  entries: readonly CheckinEntry[],
  pose: ProgressPose,
  current: { id: string | null; date: string },
): ProgressPhoto | null => {
  let fallback: ProgressPhoto | null = null;
  for (const entry of entries) {
    if (entry.checkin.id === current.id) continue;
    const photo = photoForPose(entry, pose);
    if (!photo) continue;
    if (entry.checkin.date <= current.date) return photo;
    fallback ??= photo;
  }
  return fallback;
};

/** What the timeline shows; `video` keeps only check-ins holding a clip. */
export type TimelineFilter = 'all' | ProgressPose | 'video';

export const filterTimeline = <T extends CheckinEntry>(
  entries: readonly T[],
  filter: TimelineFilter,
): T[] => {
  if (filter === 'all') return [...entries];
  if (filter === 'video') return entries.filter((e) => e.videos.length > 0);
  return entries.filter((e) => photoForPose(e, filter) !== null);
};

/** Check-ins that can stand in a comparison of `pose`: they hold that photo. Oldest first. */
export const comparable = <T extends CheckinEntry>(
  entries: readonly T[],
  pose: ProgressPose,
): T[] => entries.filter((e) => photoForPose(e, pose) !== null).reverse();

/** The pose most check-ins share, so a comparison opens on something both sides have. */
export const commonestPose = (entries: readonly CheckinEntry[]): ProgressPose =>
  POSES.reduce(
    (best, pose) =>
      comparable(entries, pose).length > comparable(entries, best).length ? pose : best,
    POSES[0],
  );
