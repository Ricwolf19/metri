/**
 * Feature entitlements derived from a plan — mirrors metri.info/lib/entitlements.
 * App code checks `can(plan, feature)`, never `plan === 'premium'`, so adding
 * tiers/features later needs no refactor.
 */
export type Plan = 'free' | 'premium';
export type Feature = 'sync';

const ENTITLEMENTS: Record<Plan, Record<Feature, boolean>> = {
  free: { sync: false },
  premium: { sync: true },
};

const normalize = (plan: string | null | undefined): Plan =>
  plan === 'premium' ? 'premium' : 'free';

const entitlementsFor = (plan: string | null | undefined) => ENTITLEMENTS[normalize(plan)];

export const can = (plan: string | null | undefined, feature: Feature): boolean =>
  entitlementsFor(plan)[feature] ?? false;

/** User-facing tier: 'local' has no server account at all. */
export type Tier = 'local' | 'free' | 'premium';

/** Derive the display tier from the row. UI copy keys off this, never `plan`. */
export const getTier = (user: { authKind: string; plan: string } | null): Tier => {
  if (!user || user.authKind === 'local') return 'local';
  return normalize(user.plan);
};
