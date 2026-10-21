import { DarkTheme } from 'expo-router';
import { createContext, useContext } from 'react';
import { View } from 'react-native';
import { vars } from 'nativewind';

import { NAV_COLORS, THEME_VARS } from './tokens';

type NavTheme = typeof DarkTheme;

type ThemeContextValue = {
  navTheme: NavTheme;
  statusBarStyle: 'light';
  /** Accent hex that stays legible on the surface (for icon `color` props). */
  accent: string;
  /** Brand (lime) hex — for icon `color` props / lime accents. */
  brand: string;
  /** Text/icon color that sits on a brand fill. */
  brandContrast: string;
  /** Muted icon color (ink-400) for chevrons and secondary glyphs. */
  muted: string;
  /** Destructive icon color (red-500) — delete / discard glyphs. */
  danger: string;
  /** Informational icon color (sky): a per-side tag, a saved load detail. Never "active". */
  info: string;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * The one (dark) palette, as icon `color` props and the navigation shell read
 * it. A system/light/dark preference used to live here; the light scale went
 * with it (2026-10-20), so this is constant and never re-renders its tree.
 */
const NAV_THEME: NavTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#bef82b',
    background: NAV_COLORS.background,
    card: NAV_COLORS.card,
    text: NAV_COLORS.text,
    border: NAV_COLORS.border,
  },
};

const THEME: ThemeContextValue = {
  navTheme: NAV_THEME,
  statusBarStyle: 'light',
  accent: '#bef82b',
  brand: '#bef82b',
  brandContrast: '#08090d',
  muted: '#71717a',
  danger: '#ef4444',
  info: '#38bdf8',
};

/** Installed once: NativeWind resolves the `ink-*` classes against these. */
const ROOT_VARS = vars(THEME_VARS);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={THEME}>
    <View style={ROOT_VARS} className="flex-1 bg-ink-900">
      {children}
    </View>
  </ThemeContext.Provider>
);

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>.');
  return ctx;
};
