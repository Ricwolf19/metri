import { eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { users, type NewUser, type PublicUser, type User } from '@/db/schema';
import { generateSalt, hashPassword, randomId, verifyPassword } from '@/lib/crypto';

/** Strip password material before a row ever reaches the UI. */
const toPublic = (row: User): PublicUser => {
  const rest: Partial<User> = { ...row };
  delete rest.passwordHash;
  delete rest.passwordSalt;
  return rest as PublicUser;
};

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
  password: string;
  displayName?: string;
  role?: NewUser['role'];
  avatarColor?: string;
};

export const createUser = async (input: CreateUserInput): Promise<PublicUser> => {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();

  if (findRawByEmail(email)) throw new Error('That email is already registered.');
  if (findRawByUsername(username)) throw new Error('That username is taken.');

  const salt = await generateSalt();
  const passwordHash = await hashPassword(input.password, salt);

  const [row] = db
    .insert(users)
    .values({
      id: randomId(),
      email,
      username,
      passwordHash,
      passwordSalt: salt,
      role: input.role ?? 'user',
      displayName: input.displayName?.trim() || username,
      avatarColor: input.avatarColor,
    })
    .returning()
    .all();

  return toPublic(row);
};

/** Verify credentials by email OR username. Returns the public user or null. */
export const verifyCredentials = async (
  identifier: string,
  password: string,
): Promise<PublicUser | null> => {
  const id = identifier.trim().toLowerCase();
  const row = findRawByEmail(id) ?? findRawByUsername(id);
  if (!row) return null;
  const ok = await verifyPassword(password, row.passwordSalt, row.passwordHash);
  return ok ? toPublic(row) : null;
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
  >
>;

export const updateProfile = (id: string, patch: ProfileUpdate): PublicUser | null => {
  const [row] = db
    .update(users)
    .set({ ...patch, updatedAt: sql`(current_timestamp)` })
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
      bmrComputedAt: sql`(current_timestamp)`,
      updatedAt: sql`(current_timestamp)`,
    })
    .where(eq(users.id, id))
    .returning()
    .all();
  return row ? toPublic(row) : null;
};

const findRawById = (id: string): User | null => {
  const [row] = db.select().from(users).where(eq(users.id, id)).all();
  return row ?? null;
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
    .set({ ...set, updatedAt: sql`(current_timestamp)` })
    .where(eq(users.id, id))
    .returning()
    .all();
  return toPublic(row);
};

/** Verify the current password, then store a fresh salt + hash for the new one. */
export const changePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const row = findRawById(id);
  if (!row) throw new Error('User not found.');
  const ok = await verifyPassword(currentPassword, row.passwordSalt, row.passwordHash);
  if (!ok) throw new Error('Current password is incorrect.');

  const salt = await generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  db.update(users)
    .set({ passwordHash, passwordSalt: salt, updatedAt: sql`(current_timestamp)` })
    .where(eq(users.id, id))
    .run();
};

/** Save onboarding metrics and stamp the user as onboarded. */
export const completeOnboarding = (id: string, patch: ProfileUpdate): PublicUser | null => {
  const [row] = db
    .update(users)
    .set({ ...patch, onboardedAt: sql`(current_timestamp)`, updatedAt: sql`(current_timestamp)` })
    .where(eq(users.id, id))
    .returning()
    .all();
  return row ? toPublic(row) : null;
};
