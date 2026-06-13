import { DarkTheme } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, View } from 'react-native';
import { vars } from 'nativewind';

import { settings, type ThemePreference } from '@/lib/storage';

import { NAV_COLORS, THEME_VARS, type ThemeScheme } from './tokens';

type NavTheme = typeof DarkTheme;

type ThemeContextValue = {
  /** What the user picked: system / light / dark. */
  preference: ThemePreference;
  /** The resolved scheme actually rendered. */
  scheme: ThemeScheme;
  setPreference: (preference: ThemePreference) => void;
  navTheme: NavTheme;
  statusBarStyle: 'light' | 'dark';
  /** Accent hex that stays legible on the current surface (for icon `color` props). */
  accent: string;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const resolve = (preference: ThemePreference): ThemeScheme => {
  if (preference === 'system') return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
  return preference;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    settings.getThemePreference(),
  );
  const [systemScheme, setSystemScheme] = useState<ThemeScheme>(() => resolve('system'));

  // Track the OS scheme so 'system' stays live.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemScheme(colorScheme === 'light' ? 'light' : 'dark'),
    );
    return () => sub.remove();
  }, []);

  const scheme: ThemeScheme = preference === 'system' ? systemScheme : preference;

  const setPreference = useCallback((next: ThemePreference) => {
    settings.setThemePreference(next);
    setPreferenceState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const c = NAV_COLORS[scheme];
    const navTheme: NavTheme = {
      ...DarkTheme,
      dark: scheme === 'dark',
      colors: {
        ...DarkTheme.colors,
        primary: '#bef82b',
        background: c.background,
        card: c.card,
        text: c.text,
        border: c.border,
      },
    };
    return {
      preference,
      scheme,
      setPreference,
      navTheme,
      statusBarStyle: scheme === 'dark' ? 'light' : 'dark',
      accent: scheme === 'dark' ? '#bef82b' : '#65a30d',
    };
  }, [preference, scheme, setPreference]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={vars(THEME_VARS[scheme])} className="flex-1 bg-ink-900">
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>.');
  return ctx;
};
