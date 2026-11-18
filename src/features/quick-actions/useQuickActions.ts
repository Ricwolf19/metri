import * as QuickActions from 'expo-quick-actions';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { tFor, useI18n } from '@/i18n';

import { isTabHref, quickActionHref, quickActionItems } from './items';

/** The action that cold-started the app, consumed once: a remount must not replay it. */
let pendingInitial: QuickActions.Action | undefined = QuickActions.initial;

const setItems = (items: QuickActions.Action[]) => {
  // A launcher without shortcuts, or no activity yet: the icon simply has none.
  QuickActions.setItems(items).catch(() => {});
};

/**
 * The app icon's long-press shortcuts, mounted in the tabs layout: the
 * navigator is up there, and it only renders for a lifter who exists. With
 * `enabled` false (signed out, onboarding not finished) the shortcuts are
 * cleared and a delivered one is held until the app is ready for it. The
 * route comes from our own table by action id (`quickActionHref`), never from
 * the payload, so a stale or foreign shortcut cannot open anything else.
 */
export const useQuickActions = (enabled: boolean) => {
  const router = useRouter();
  const { locale } = useI18n();
  const os = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : null;

  useEffect(() => {
    if (!os) return;
    // Re-set on a language change: the OS keeps the titles it was last handed.
    setItems(enabled ? quickActionItems(tFor(locale), os) : []);
  }, [enabled, locale, os]);

  useEffect(() => {
    if (!enabled) return;
    const go = (href: Href) => {
      if (!isTabHref(href)) router.push(href);
      // Over the tabs (a workout, a check-in open): back down to them, onto
      // that tab. On the tabs already: switch. `dismissTo` alone is not enough
      // there — the tab navigator does not handle the pop it sends.
      else if (router.canDismiss()) router.dismissTo(href);
      else router.navigate(href);
    };
    const open = (action: QuickActions.Action) => {
      const href = quickActionHref(action);
      // The next frame: the tabs navigator mounts in this same commit.
      if (href) setTimeout(() => go(href), 0);
    };
    if (pendingInitial) {
      open(pendingInitial);
      pendingInitial = undefined;
    }
    const sub = QuickActions.addListener(open);
    return () => sub.remove();
  }, [enabled, router]);
};
