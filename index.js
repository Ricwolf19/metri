import 'expo-router/entry';

import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/features/widget/task-handler';

// Widgets render via headless JS with no UI mounted, so the handler must be
// registered at the bundle entry — not inside the React tree.
registerWidgetTaskHandler(widgetTaskHandler);
