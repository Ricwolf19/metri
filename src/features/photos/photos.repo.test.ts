import { beforeEach, describe, expect, it, vi } from 'vitest';

import { progressCheckins, progressPhotos } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));
// The files are the native side; the repo's job is the rows and which files go.
const deleted: string[] = [];
/** A source the image pipeline cannot read. */
const BROKEN = 'file:///cache/broken.jpg';
vi.mock('./media', () => ({
  persistPhoto: async (src: string, id: string) => {
    if (src === BROKEN) throw new Error('cannot decode');
    return {
      uri: `file:///docs/progress/${id}.jpg`,
      thumbUri: `file:///docs/progress/${id}_thumb.jpg`,
      width: 1620,
      height: 2160,
    };
  },
  persistVideo: async (_src: string, id: string) => ({
    uri: `file:///docs/progress/${id}.mp4`,
    thumbUri: `file:///docs/progress/${id}_thumb.jpg`,
    width: 450,
    height: 600,
  }),
  deletePhotoFiles: (...uris: string[]) => deleted.push(...uris),
}));

const { db } = await import('@/db/client');
const repo = await import('./photos.repo');

const U = 'u-1';

const wipe = () => {
  for (const table of [progressPhotos, progressCheckins]) db.delete(table).run();
  deleted.length = 0;
};

const photo = (checkinId: string, pose: 'front' | 'back' | null) =>
  repo.addMedia(U, { checkinId, kind: 'photo', pose, srcUri: 'file:///cache/shot.jpg' });

describe('addMedia', () => {
  beforeEach(wipe);

  it('replaces the photo of a pose on a retake, and deletes its files', async () => {
    const c = repo.createCheckin(U, '2026-11-10');
    const first = await photo(c.id, 'front');
    const retake = await photo(c.id, 'front');
    const rows = db.select().from(progressPhotos).all();
    expect(rows.map((r) => r.id)).toEqual([retake.id]);
    expect(deleted).toEqual([first.uri, first.thumbUri]);
  });

  it('keeps every clip and every photo without a pose', async () => {
    const c = repo.createCheckin(U, '2026-11-10');
    await photo(c.id, null);
    await photo(c.id, null);
    await repo.addMedia(U, {
      checkinId: c.id,
      kind: 'video',
      pose: null,
      srcUri: 'a.mp4',
      durationMs: 9000,
    });
    await repo.addMedia(U, {
      checkinId: c.id,
      kind: 'video',
      pose: null,
      srcUri: 'b.mp4',
      durationMs: 4000,
    });
    expect(db.select().from(progressPhotos).all()).toHaveLength(4);
  });

  it("refuses another account's check-in", async () => {
    const c = repo.createCheckin('u-2', '2026-11-10');
    await expect(photo(c.id, 'front')).rejects.toThrow();
  });

  it('starts a check-in with its first photo', async () => {
    const saved = await repo.addMedia(U, {
      checkinId: null,
      date: '2026-11-10',
      kind: 'photo',
      pose: 'front',
      srcUri: 'file:///cache/shot.jpg',
    });
    expect(repo.getCheckin(saved.checkinId ?? '', U)?.date).toBe('2026-11-10');
  });

  it('leaves no empty check-in behind when the first save fails', async () => {
    const save = repo.addMedia(U, {
      checkinId: null,
      date: '2026-11-10',
      kind: 'photo',
      pose: 'front',
      srcUri: BROKEN,
    });
    await expect(save).rejects.toThrow();
    expect(db.select().from(progressCheckins).all()).toEqual([]);
  });

  it('deletes the files it wrote when the row cannot be saved', async () => {
    const c = repo.createCheckin(U, '2026-11-10');
    const write = vi.spyOn(db, 'transaction').mockImplementationOnce(() => {
      throw new Error('disk full');
    });
    await expect(photo(c.id, 'front')).rejects.toThrow('disk full');
    write.mockRestore();
    expect(db.select().from(progressPhotos).all()).toEqual([]);
    expect(deleted).toHaveLength(2);
    expect(deleted.every((uri) => uri.startsWith('file:///docs/progress/'))).toBe(true);
  });
});

describe('setMediaPose', () => {
  beforeEach(wipe);

  it('swaps with the photo already holding that pose', async () => {
    const c = repo.createCheckin(U, '2026-11-10');
    const a = await photo(c.id, 'front');
    const b = await photo(c.id, 'back');
    repo.setMediaPose(a.id, U, 'back');
    expect(repo.getMedia(a.id, U)?.pose).toBe('back');
    expect(repo.getMedia(b.id, U)?.pose).toBe('front');
  });
});

describe('deleteMedia', () => {
  beforeEach(wipe);

  it('takes the check-in with its last item, and only then', async () => {
    const c = repo.createCheckin(U, '2026-11-10');
    const a = await photo(c.id, 'front');
    const b = await photo(c.id, 'back');
    repo.deleteMedia(a.id, U);
    expect(repo.getCheckin(c.id, U)).not.toBeNull();
    repo.deleteMedia(b.id, U);
    expect(repo.getCheckin(c.id, U)).toBeNull();
    expect(deleted).toEqual([a.uri, a.thumbUri, b.uri, b.thumbUri]);
  });

  it('never deletes for another account', async () => {
    const c = repo.createCheckin(U, '2026-11-10');
    const a = await photo(c.id, 'front');
    repo.deleteMedia(a.id, 'u-2');
    repo.deleteCheckin(c.id, 'u-2');
    expect(repo.getMedia(a.id, U)).not.toBeNull();
    expect(deleted).toEqual([]);
  });
});

describe('deleteCheckin', () => {
  beforeEach(wipe);

  it('removes the check-in, its rows and its files', async () => {
    const c = repo.createCheckin(U, '2026-11-10');
    const a = await photo(c.id, 'front');
    repo.deleteCheckin(c.id, U);
    expect(db.select().from(progressPhotos).all()).toEqual([]);
    expect(db.select().from(progressCheckins).all()).toEqual([]);
    expect(deleted).toEqual([a.uri, a.thumbUri]);
  });
});

describe('adoptLegacyPhotos', () => {
  beforeEach(wipe);

  const legacy = (id: string, takenAt: string) =>
    db
      .insert(progressPhotos)
      .values({
        id,
        userId: U,
        uri: `${id}.jpg`,
        thumbUri: `${id}_t.jpg`,
        takenAt: new Date(takenAt),
      })
      .run();

  it('files older photos into one check-in per local day, joining one already there', () => {
    const existing = repo.createCheckin(U, '2026-09-10');
    legacy('p1', '2026-09-10T08:00:00');
    legacy('p2', '2026-09-10T20:00:00');
    legacy('p3', '2026-09-17T08:00:00');
    expect(repo.adoptLegacyPhotos(U)).toBe(3);

    const rows = db.select().from(progressPhotos).all();
    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(byId.get('p1')?.checkinId).toBe(existing.id);
    expect(byId.get('p2')?.checkinId).toBe(existing.id);
    const other = byId.get('p3')?.checkinId;
    expect(other).not.toBe(existing.id);
    expect(repo.getCheckin(other ?? '', U)?.date).toBe('2026-09-17');
    expect(byId.get('p1')?.pose).toBeNull();
  });

  it('does nothing the second time', () => {
    legacy('p1', '2026-09-10T08:00:00');
    repo.adoptLegacyPhotos(U);
    expect(repo.adoptLegacyPhotos(U)).toBe(0);
    expect(db.select().from(progressCheckins).all()).toHaveLength(1);
  });
});
