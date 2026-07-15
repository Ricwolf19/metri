import '@/global.css';

// Per-weight subpath imports so Metro only bundles the 6 Geist files we use
// (the package barrel pulls in all 36 weights + italics).
import { useFonts } from '@expo-google-fonts/geist/useFonts';
import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_500Medium } from '@expo-google-fonts/geist/500Medium';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { Geist_700Bold } from '@expo-google-fonts/geist/700Bold';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono/400Regular';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono/500Medium';
import { Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLoader, ToastProvider } from '@/components/ui';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { AuthProvider } from '@/features/auth/auth-context';
import { initNotifications } from '@/features/reminders/scheduler';
import { initRestNotifications } from '@/features/training/rest-timer';
import { seedTraining } from '@/features/training/seed';
import { I18nProvider } from '@/i18n';
import { ThemeProvider, useTheme } from '@/theme/theme-context';

// Hold the native splash, then hand off to the in-app animated AppLoader so the
// branded logo stays continuous from launch into the migration/seed phase.
void SplashScreen.preventAutoHideAsync();

/** The navigation shell — themed once the providers are mounted. */
const ThemedStack = () => {
  const { navTheme, statusBarStyle } = useTheme();
  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: navTheme.colors.background },
          animation: 'fade',
        }}
      />
    </NavThemeProvider>
  );
};

const RootLayout = () => {
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  // Reveal our animated AppLoader as soon as JS mounts (native splash → AppLoader).
  useEffect(() => {
    void SplashScreen.hideAsync();
    void initNotifications().catch(() => {});
    void initRestNotifications().catch(() => {});
  }, []);

  // Seed the built-in training catalog (exercise library + suggested programs)
  // once migrations created the tables. This is shared app content, not user
  // data. Accounts now live on the metri.info backend, so no admin is seeded.
  useEffect(() => {
    if (!success) return;
    seedTraining()
      .catch((e) => console.warn('[seed] training failed:', e))
      .finally(() => setSeeded(true));
  }, [success]);

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

  if (!success || !seeded || !fontsLoaded) {
    return <AppLoader />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <ThemedStack />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
