import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MetriLogo from '@/assets/logo/metri-logo.svg';

const STACK = [
  'Offline-first SQLite (Drizzle) — ready',
  'MMKV fast storage — ready',
  'NativeWind v4 styling — ready',
  'Expo Router navigation — ready',
];

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-ink-900">
      <View className="flex-1 items-center justify-center px-8">
        {/* Brand logo — full metri mark + wordmark from the SVG source */}
        <MetriLogo width={240} height={175} />

        <Text className="mt-4 text-center text-base text-ink-300">
          Offline-first workout tracker for serious lifters.
        </Text>

        <View className="mt-10 w-full max-w-sm rounded-2xl border border-ink-600 bg-ink-800 p-5">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">
            Project setup
          </Text>
          {STACK.map((item) => (
            <View key={item} className="flex-row items-center py-1.5">
              <View className="mr-3 h-1.5 w-1.5 rounded-full bg-lime-400" />
              <Text className="text-sm text-ink-100">{item}</Text>
            </View>
          ))}
        </View>

        <Text className="mt-8 text-center text-xs text-ink-400">
          Edit <Text className="font-mono text-ink-300">src/app/index.tsx</Text> to start building.
        </Text>
      </View>
    </SafeAreaView>
  );
}
