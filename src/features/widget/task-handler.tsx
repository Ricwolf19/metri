import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { markTrainingDay } from '@/features/training/adherence.repo';
import { session } from '@/lib/storage';

import { computeWidgetSnapshot } from './data';
import { MetriWidget } from './MetriWidget';
import { readWidgetSnapshot, writeWidgetSnapshot, type WidgetSnapshot } from './snapshot';

/**
 * Headless entry for widget lifecycle events (added, periodic update, resize,
 * clicks). This runs without the app UI, so nothing here may assume a session
 * or throw — a crash blanks the widget. Fresh SQLite data is attempted first
 * (native modules are available in the headless context); the MMKV snapshot
 * written by the app is the fallback, and a null snapshot renders placeholders.
 */
const safeSnapshot = (): WidgetSnapshot | null => {
  try {
    const fresh = computeWidgetSnapshot();
    if (fresh) {
      writeWidgetSnapshot(fresh);
      return fresh;
    }
  } catch {
    // fall through to the cached snapshot
  }
  try {
    return readWidgetSnapshot();
  } catch {
    return null;
  }
};

/** "Mark today" tapped on the widget: write the adherence row without opening
 * the app. The day lands as trained-with-no-session, same as marking it from
 * Home; sync picks it up on the next app foreground. */
const markToday = (): void => {
  try {
    const userId = session.getUserId();
    if (userId) markTrainingDay(userId, { status: 'trained' });
  } catch {
    // The re-render below falls back to the cached snapshot; the app stays
    // the source of truth if the headless write is unavailable.
  }
};

export const widgetTaskHandler = async (props: WidgetTaskHandlerProps): Promise<void> => {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(
        <MetriWidget snapshot={safeSnapshot()} height={props.widgetInfo.height} />,
      );
      break;
    case 'WIDGET_CLICK':
      // Navigation uses the built-in OPEN_APP/OPEN_URI actions and never lands
      // here; the only custom action is the mark-today badge.
      if (props.clickAction === 'MARK_TRAINED') {
        markToday();
        props.renderWidget(
          <MetriWidget snapshot={safeSnapshot()} height={props.widgetInfo.height} />,
        );
      }
      break;
    default:
      break;
  }
};
