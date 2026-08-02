import type { Href } from 'expo-router';

import type { TranslationKey } from '@/i18n/en';

/**
 * In-app announcements — the channel for talking to every install (beta notes
 * today; promos, warnings or maintenance messages tomorrow). v1 ships the list
 * with the binary; moving it behind an API later only changes this file's
 * consumer, not the UI. Ordering = priority; the modal shows the first
 * undismissed entry, once per `id` (so re-announcing = new id).
 */
export type AnnouncementKind = 'info' | 'promo' | 'warning' | 'maintenance';

export type Announcement = {
  /** Stable dismissal key. Version-suffix it to resurface per release. */
  id: string;
  kind: AnnouncementKind;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  /** Optional deep link for the "see more" action. */
  href?: Href;
};

// Empty today: the beta notice became the full /beta screen shown after every
// sign-in/up. Future promos/maintenance notes go here (or a remote feed).
export const ANNOUNCEMENTS: Announcement[] = [];
