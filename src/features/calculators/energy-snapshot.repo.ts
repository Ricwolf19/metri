import type { PublicUser } from '@/db/schema';
import { saveBmr, type BmrSnapshot } from '@/features/auth/users.repo';
import { pushProfile } from '@/features/auth/profile-sync';

/** Persist the snapshot and mirror it to the account (a no-op for local users). */
export const storeEnergySnapshot = (userId: string, snap: BmrSnapshot): PublicUser | null => {
  const next = saveBmr(userId, snap);
  if (next) pushProfile(next);
  return next;
};
