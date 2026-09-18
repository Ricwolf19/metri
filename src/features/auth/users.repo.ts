import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { users, type NewUser, type PublicUser, type User } from '@/db/schema';
import { randomId } from '@/lib/crypto';

/** Identity, kept so call sites still read as "this is what the UI may see".
 * The row holds no credential material — passwords are Better Auth's. */
const toPublic = (row: User): PublicUser => row;

export const findById = (id: string): PublicUser | null => {
  const [row] = db.select().from(users).where(eq(users.id, id)).all();
  return row ? toPublic(row) : null;
};

const findRawByEmail = (email: string): User | null => {
  const [row] = db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).all();
  return row ?? null;
};

type CreateUserInput = {
  email?: string;
  displayName?: string;
  authKind?: NewUser['authKind'];
  role?: NewUser['role'];
  avatarColor?: string;
};

/** Create a user row. No password: credentials stay with Better Auth (AGENTS.md); local rows have none. */
const createUser = async (input: CreateUserInput): Promise<PublicUser> => {
  const email = input.email?.trim().toLowerCase() || null;
  if (email && findRawByEmail(email)) throw new Error('That email is already registered.');

  const [row] = db
    .insert(users)
    .values({
      id: randomId(),
      email,
      authKind: input.authKind ?? 'remote',
      role: input.role ?? 'user',
      displayName: input.displayName?.trim() || email?.split('@')[0] || 'metri user',
      avatarColor: input.avatarColor,
    })
    .returning()
    .all();

  return toPublic(row);
};

/** Device-only user: no email, no server counterpart, full app locally. */
export const createLocalUser = (input: { displayName: string }): Promise<PublicUser> =>
  createUser({ displayName: input.displayName, authKind: 'local' });

/** Upgrade path (AGENTS.md): the local row becomes the remote mirror in place. A stale mirror already
 * holding that email is detached (email cleared) and its data left as an orphan — no merge, by design. */
export const adoptLocalUser = (
  localId: string,
  input: { email: string; displayName?: string | null; plan?: string | null },
): PublicUser | null => {
  const email = input.email.trim().toLowerCase();
  const stale = findRawByEmail(email);
  if (stale && stale.id !== localId) {
    db.update(users)
      .set({ email: null, authKind: 'local', updatedAt: new Date() })
      .where(eq(users.id, stale.id))
      .run();
  }
  const [row] = db
    .update(users)
    .set({
      email,
      authKind: 'remote',
      plan: input.plan === 'premium' ? 'premium' : 'free',
      ...(input.displayName ? { displayName: input.displayName } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, localId))
    .returning()
    .all();
  return row ? toPublic(row) : null;
};

/** Public lookup by email (null if none). */
const findByEmail = (email: string): PublicUser | null => {
  const [row] = db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).all();
  return row ? toPublic(row) : null;
};

/**
 * Find-or-create the LOCAL user row that anchors on-device data to a remote
 * (Better Auth) account. The server is authoritative for credentials; this row
 * only carries identity and the cached entitlement plan.
 */
export const upsertRemoteUser = async (input: {
  email: string;
  displayName?: string | null;
  plan?: string | null;
}): Promise<PublicUser> => {
  const plan = input.plan === 'premium' ? 'premium' : 'free';
  const existing = findByEmail(input.email);
  if (existing) {
    // Refresh the cached entitlement from the authoritative remote session.
    if (existing.plan !== plan) return setUserPlan(existing.id, plan) ?? existing;
    return existing;
  }
  const created = await createUser({
    email: input.email,
    displayName: input.displayName ?? undefined,
  });
  return setUserPlan(created.id, plan) ?? created;
};

/** Refresh the locally-cached entitlement plan (mirrors the remote session). */
const setUserPlan = (id: string, plan: string): PublicUser | null => {
  const [row] = db
    .update(users)
    .set({ plan, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
    .all();
  return row ? toPublic(row) : null;
};

export type ProfileUpdate = Partial<
  Pick<
    User,
    | 'displayName'
    | 'avatarUri'
    | 'avatarColor'
    | 'avatarId'
    | 'sex'
    | 'age'
    | 'heightCm'
    | 'weightKg'
    | 'activityLevel'
    | 'bodyFatPct'
  >
>;

export const updateProfile = (id: string, patch: ProfileUpdate): PublicUser | null => {
  const [row] = db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
    .all();
  return row ? toPublic(row) : null;
};

export type BmrSnapshot = {
  bmr: number;
  tdee: number;
  bmrFormula: string;
  sex: User['sex'];
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: User['activityLevel'];
};

/** Persist the latest Harris–Benedict result + its inputs to the user detail. */
export const saveBmr = (id: string, snap: BmrSnapshot): PublicUser | null => {
  const [row] = db
    .update(users)
    .set({
      bmr: snap.bmr,
      tdee: snap.tdee,
      bmrFormula: snap.bmrFormula,
      sex: snap.sex,
      age: snap.age,
      heightCm: snap.heightCm,
      weightKg: snap.weightKg,
      activityLevel: snap.activityLevel,
      bmrComputedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning()
    .all();
  return row ? toPublic(row) : null;
};

/** Save onboarding metrics and stamp the user as onboarded. */
export const completeOnboarding = (id: string, patch: ProfileUpdate): PublicUser | null => {
  const [row] = db
    .update(users)
    .set({ ...patch, onboardedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
    .all();
  return row ? toPublic(row) : null;
};
