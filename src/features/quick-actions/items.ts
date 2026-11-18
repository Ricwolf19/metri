import type { Href } from 'expo-router';

import type { TFunction, TranslationKey } from '@/i18n';

/**
 * The long-press shortcuts on the app icon. Pure: `useQuickActions` hands
 * these to the OS. Ids are what the OS keeps between launches (a pinned
 * shortcut outlives an update), so never rename one; titles are the
 * dictionaries' and re-set whenever the language changes.
 */
type QuickActionId = 'train' | 'checkin' | 'food' | 'photo';

type Spec = { id: QuickActionId; titleKey: TranslationKey; href: Href; iosIcon: string };

const SPECS: readonly Spec[] = [
  // The Train tab owns the one Play (the next split), and a session already
  // under way reopens from there — a shortcut never starts a split itself.
  {
    id: 'train',
    titleKey: 'quickActions.train',
    href: '/(tabs)/training',
    iosIcon: 'symbol:dumbbell',
  },
  {
    id: 'checkin',
    titleKey: 'quickActions.checkin',
    href: '/body/checkin',
    iosIcon: 'symbol:scalemass',
  },
  { id: 'food', titleKey: 'quickActions.food', href: '/food/add', iosIcon: 'symbol:fork.knife' },
  // Straight to the camera: a shortcut is for taking the photo, not browsing them.
  {
    id: 'photo',
    titleKey: 'quickActions.photo',
    href: '/progress/capture',
    iosIcon: 'symbol:camera',
  },
];

/** The app's own launcher icon: Android draws a shortcut with no icon as a blank disc. */
const ANDROID_ICON = 'ic_launcher';

/** What the OS is handed: no route rides along — the id picks it on the way back. */
export type QuickActionItem = { id: QuickActionId; title: string; icon: string };

export const quickActionItems = (t: TFunction, os: 'ios' | 'android'): QuickActionItem[] =>
  SPECS.map((s) => ({
    id: s.id,
    title: t(s.titleKey),
    icon: os === 'ios' ? s.iosIcon : ANDROID_ICON,
  }));

/** The route a delivered action names — only one of ours, never a payload's own href. */
export const quickActionHref = (action: { id?: unknown }): Href | null =>
  SPECS.find((s) => s.id === action.id)?.href ?? null;

/**
 * A tab is switched to, never pushed: pushed from a screen stacked over the
 * tabs, it stacked a SECOND `(tabs)` tree (every tab mounted again).
 */
export const isTabHref = (href: Href): boolean =>
  typeof href === 'string' && href.startsWith('/(tabs)');
