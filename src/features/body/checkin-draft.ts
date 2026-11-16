import type { SiteId } from './sites';

/** The check-in as its fields hold it: text in the display unit, '' = nothing typed. */
export type CheckinDraft = { weight: string; sites: Partial<Record<SiteId, string>> };

/** A typed reading (a comma is a decimal point); anything not positive is no reading. */
export const parseReading = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** The draft as numbers say it: "80,0" and "80" are the same reading. */
export const normalizeCheckin = (draft: CheckinDraft, sites: SiteId[]): CheckinDraft => ({
  weight: String(parseReading(draft.weight) ?? ''),
  sites: Object.fromEntries(
    sites.map((site) => [site, String(parseReading(draft.sites[site]) ?? '')]),
  ),
});

export type CheckinChanges = {
  /** The new weight (display unit); null = leave the saved one alone. */
  weight: number | null;
  /** Per changed site: the new reading, or null to clear one that was saved. */
  tape: Partial<Record<SiteId, number | null>>;
};

/**
 * What a check-in save writes: only what differs from what was loaded for the
 * day. Re-saving a day used to rewrite every field — a fresh `updatedAt` per
 * row for sync to push, and in lb a weight read back through two conversions
 * drifted a hundredth on each save. An emptied weight stays saved (a day is
 * deleted with its own button); an emptied site clears that reading.
 */
export const checkinChanges = (
  loaded: CheckinDraft,
  typed: CheckinDraft,
  sites: SiteId[],
): CheckinChanges => {
  const weightNow = parseReading(typed.weight);
  const weight = weightNow !== parseReading(loaded.weight) ? weightNow : null;
  const tape: CheckinChanges['tape'] = {};
  for (const site of sites) {
    const before = parseReading(loaded.sites[site]);
    const now = parseReading(typed.sites[site]);
    if (now === before) continue;
    tape[site] = now;
  }
  return { weight, tape };
};
