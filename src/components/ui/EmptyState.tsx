import { Text, View } from 'react-native';

/**
 * The "this widget has nothing to show yet" block.
 *
 * Analytics widgets render it INSTEAD of hiding themselves: a metric that
 * disappears until it has data makes the app look unfinished and gives the
 * user no idea what would fill it. `hint` must say exactly what unlocks the
 * metric ("log 2 more sessions"), never a generic "no data".
 */
export const EmptyState = ({ hint }: { hint: string }) => (
  <View className="min-h-16 items-center justify-center rounded-field border border-dashed border-ink-700 px-4 py-5">
    <Text className="text-center text-xs leading-5 text-ink-500">{hint}</Text>
  </View>
);
