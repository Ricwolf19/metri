import { countUsers, createUser } from './users.repo';

/**
 * Seed the master admin user.
 *
 * The database lives ON THE DEVICE, so a Node CLI script can't reach it — seeding
 * has to run inside the app. This is idempotent: it only creates the admin when
 * the users table is empty, so it is safe to call on every launch.
 *
 * Credentials come from EXPO_PUBLIC_* env vars (see `.env.example`); the fallback
 * is a dev-only default — change `EXPO_PUBLIC_ADMIN_PASSWORD` before shipping.
 */
const ADMIN = {
  email: process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? 'admin@metri.app',
  username: process.env.EXPO_PUBLIC_ADMIN_USERNAME ?? 'admin',
  password: process.env.EXPO_PUBLIC_ADMIN_PASSWORD ?? 'change-me',
  displayName: process.env.EXPO_PUBLIC_ADMIN_NAME ?? 'Metri Admin',
};

export const seedAdmin = async (): Promise<void> => {
  if (countUsers() > 0) return;

  await createUser({
    email: ADMIN.email,
    username: ADMIN.username,
    password: ADMIN.password,
    displayName: ADMIN.displayName,
    role: 'admin',
    avatarColor: '#bef82b',
  });

  if (!process.env.EXPO_PUBLIC_ADMIN_PASSWORD) {
    console.warn(
      '[seed] Master admin created with the DEFAULT password. ' +
        'Set EXPO_PUBLIC_ADMIN_PASSWORD in .env and change it from the app.',
    );
  }
};
