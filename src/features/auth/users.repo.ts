import { eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { users, type NewUser, type PublicUser, type User } from '@/db/schema';
import { randomId } from '@/lib/crypto';

/** Identity, kept so call sites still read as "this is what the UI may see".
 * The row holds no credential material — passwords are Better Auth's. */
const toPublic = (row: User): PublicUser => row;

export const countUsers = (): number => {
  const [row] = db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .all();
  return row?.count ?? 0;
};

export const findById = (id: string): PublicUser | null => {
  const [row] = db.select().from(users).where(eq(users.id, id)).all();
  return row ? toPublic(row) : null;
};

const findRawByEmail = (email: string): User | null => {
  const [row] = db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).all();
  return row ?? null;
};

const findRawByUsername = (username: string): User | null => {
  const [row] = db
    .select()
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .all();
  return row ?? null;
};

export type CreateUserInput = {
  email: string;
  username: string;
  displayName?: string;
  role?: NewUser['role'];
  avatarColor?: string;
};

/** Create the local mirror row for an account. Takes no password — credentials
 * are held by Better Auth on the server and never reach the device. */
export const createUser = async (input: CreateUserInput): Promise<PublicUser> => {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();

  if (findRawByEmail(email)) throw new Error('That email is already registered.');
  if (findRawByUsername(username)) throw new Error('That username is taken.');

  const [row] = db
    .insert(users)
    .values({
      id: randomId(),
      email,
      username,
      role: input.role ?? 'user',
      displayName: input.displayName?.trim() || username,
      avatarColor: input.avatarColor,
    })
    .returning()
    .all();

  return toPublic(row);
};

/** Public lookup by email (null if none). */
export const findByEmail = (email: string): PublicUser | null => {
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
  const base =
    input.email
      .split('@')[0]
      .replace(/[^a-z0-9_]/gi, '')
      .toLowerCase() || 'user';
  const created = await createUser({
    email: input.email,
    username: `${base}-${randomId().slice(0, 4)}`,
    displayName: input.displayName ?? undefined,
  });
  return setUserPlan(created.id, plan) ?? created;
};

/** Refresh the locally-cached entitlement plan (mirrors the remote session). */
export const setUserPlan = (id: string, plan: string): PublicUser | null => {
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

export type AccountUpdate = { email?: string; username?: string };

/** Change email/username with uniqueness checks that exclude the user's own row. */
export const updateAccount = async (id: string, patch: AccountUpdate): Promise<PublicUser> => {
  const set: Partial<User> = {};

  if (patch.email !== undefined) {
    const email = patch.email.trim().toLowerCase();
    const existing = findRawByEmail(email);
    if (existing && existing.id !== id) throw new Error('That email is already registered.');
    set.email = email;
  }
  if (patch.username !== undefined) {
    const username = patch.username.trim().toLowerCase();
    const existing = findRawByUsername(username);
    if (existing && existing.id !== id) throw new Error('That username is taken.');
    set.username = username;
  }

  const [row] = db
    .update(users)
    .set({ ...set, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
    .all();
  return toPublic(row);
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
