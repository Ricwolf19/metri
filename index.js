import 'expo-router/entry';

import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { registerRestBackgroundHandler } from './src/features/notifications/rest-notification';
import { widgetTaskHandler } from './src/features/widget/task-handler';

// Widgets render via headless JS with no UI mounted, so the handler must be
// registered at the bundle entry — not inside the React tree. Same for the
// rest-timer notification actions (Skip / +30 s) pressed while the app is killed.
registerWidgetTaskHandler(widgetTaskHandler);
registerRestBackgroundHandler();
