import type { Sex } from '@/db/schema';
import type { TranslationKey } from '@/i18n/en';

/**
 * The tape-measurement catalogue. Sites are DATA: `body_measurements.site`
 * stores the id as plain text, so adding a site is one entry here — never a
 * migration, and never a rename (ids are a sync wire format).
 *
 * `core` is the weekly default, kept short on purpose: a check-in that takes
 * two minutes gets done every week, and consistency beats completeness.
 * `pro` sites are opt-in per user (MMKV, `settings.getEnabledProSites`).
 */
export const MEASUREMENT_SITES = [
  { id: 'chest', set: 'core' },
  { id: 'waist', set: 'core' },
  { id: 'hips', set: 'core' },
  { id: 'arm_left', set: 'core' },
  { id: 'arm_right', set: 'core' },
  { id: 'leg_left', set: 'core' },
  { id: 'leg_right', set: 'core' },
  { id: 'neck', set: 'pro' },
  { id: 'shoulders', set: 'pro' },
  { id: 'arm_flexed', set: 'pro' },
  { id: 'forearm', set: 'pro' },
  { id: 'calf', set: 'pro' },
] as const;

export type SiteId = (typeof MEASUREMENT_SITES)[number]['id'];

export const PRO_SITES = MEASUREMENT_SITES.filter((s) => s.set === 'pro');

export const siteLabelKey = (id: SiteId): TranslationKey => `site.${id}`;
/** Where exactly the tape goes — the landmark that keeps readings comparable. */
export const siteHintKey = (id: SiteId): TranslationKey => `siteHint.${id}`;

/** Core sites plus whichever pro sites this user switched on, catalogue order. */
export const enabledSites = (enabledPro: readonly string[]): SiteId[] =>
  MEASUREMENT_SITES.filter((s) => s.set === 'core' || enabledPro.includes(s.id)).map((s) => s.id);

/**
 * The site that tells the truth about a phase: fat is gained and lost first
 * where each sex stores it, so that is where a bulk going wrong (or a cut
 * working) shows before the scale can say so.
 */
export const keySiteFor = (sex: Sex | null): SiteId => (sex === 'female' ? 'hips' : 'waist');
