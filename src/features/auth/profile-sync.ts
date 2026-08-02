import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { users, type ActivityLevel, type PublicUser, type Sex } from '@/db/schema';
import { API_URL } from '@/lib/env';
import { settings, type ClockFormat, type LocaleCode, type Units } from '@/lib/storage';

import { authClient } from './auth-client';

/**
 * Account-profile sync (free feature): the web's `user_profile` row mirrors the
 * local user, so a reinstall + sign-in restores body metrics and preferences
 * instead of replaying onboarding. Pull on sign-in; push (fire-and-forget) from
 * every place the local profile changes.
 */

type RemoteProfile = {
  displayName: string | null;
  sex: string | null;
  age: number | null;
  bodyHeightCm: number | null;
  bodyWeightKg: number | null;
  bodyFatPct: number | null;
  activityLevel: string | null;
  latestBmr: number | null;
  latestTdee: number | null;
  bmrFormula: string | null;
  unitsPreference: string | null;
  locale: string | null;
  clockFormat: string | null;
};

const headers = (): Record<string, string> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const cookie = authClient.getCookie();
  if (cookie) h.Cookie = cookie;
  return h;
};

/**
 * Pull the remote profile and apply it locally. Returns true when the account
 * already completed onboarding elsewhere (the caller then skips the flow and
 * greets instead). Best-effort: any failure means "behave like before".
 */
export const restoreRemoteProfile = async (userId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/api/profile`, { headers: headers() });
    if (!res.ok) return false;
    const { profile } = (await res.json()) as { profile: RemoteProfile | null };
    if (!profile) return false;

    // Device preferences.
    if (profile.locale === 'en' || profile.locale === 'es') {
      settings.setLocale(profile.locale as LocaleCode);
    }
    if (profile.unitsPreference === 'kg' || profile.unitsPreference === 'lb') {
      settings.setUnits(profile.unitsPreference as Units);
    }
    if (profile.clockFormat === '12' || profile.clockFormat === '24') {
      settings.setClockFormat(profile.clockFormat as ClockFormat);
    }

    // Profile + body metrics. Only overwrite with real values.
    const complete =
      !!profile.sex &&
      profile.age != null &&
      profile.bodyHeightCm != null &&
      profile.bodyWeightKg != null;
    db.update(users)
      .set({
        ...(profile.displayName ? { displayName: profile.displayName } : {}),
        ...(profile.sex ? { sex: profile.sex as Sex } : {}),
        ...(profile.age != null ? { age: profile.age } : {}),
        ...(profile.bodyHeightCm != null ? { heightCm: profile.bodyHeightCm } : {}),
        ...(profile.bodyWeightKg != null ? { weightKg: profile.bodyWeightKg } : {}),
        ...(profile.bodyFatPct != null ? { bodyFatPct: profile.bodyFatPct } : {}),
        ...(profile.activityLevel ? { activityLevel: profile.activityLevel as ActivityLevel } : {}),
        ...(profile.latestBmr != null ? { bmr: profile.latestBmr } : {}),
        ...(profile.latestTdee != null ? { tdee: profile.latestTdee } : {}),
        ...(profile.bmrFormula ? { bmrFormula: profile.bmrFormula } : {}),
        ...(complete ? { onboardedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .run();

    return complete;
  } catch {
    return false;
  }
};

/** Push the current local profile + preferences to the web (fire-and-forget). */
export const pushProfile = (user: PublicUser): void => {
  void fetch(`${API_URL}/api/profile`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({
      displayName: user.displayName,
      sex: user.sex,
      age: user.age,
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      bodyFatPct: user.bodyFatPct,
      activityLevel: user.activityLevel,
      bmr: user.bmr,
      tdee: user.tdee,
      bmrFormula: user.bmrFormula,
      units: settings.getUnits(),
      locale: settings.getLocale(),
      clockFormat: settings.getClockFormat(),
    }),
  }).catch(() => {});
};
