import '@/global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { ActivityIndicator, Text, View } from 'react-native';

import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';

const MetriTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#bef82b',
    background: '#0b0d12',
    card: '#0b0d12',
    text: '#fefefe',
    border: '#2c3447',
  },
};

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-900 px-8">
        <Text className="text-center text-base text-red-400">
          Database failed to initialize:{'\n'}
          {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-900">
        <ActivityIndicator color="#bef82b" />
      </View>
    );
  }

  return (
    <ThemeProvider value={MetriTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0b0d12' } }} />
    </ThemeProvider>
  );
}
