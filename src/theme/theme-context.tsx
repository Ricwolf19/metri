import { DarkTheme } from 'expo-router';
import { createContext, useContext } from 'react';
import { Platform, View, type ColorValue } from 'react-native';
import { vars } from 'nativewind';

import { NAV_COLORS, TEXT_SELECTION, THEME_VARS, tokenHex } from './tokens';

type NavTheme = typeof DarkTheme;

/** Spread onto a `TextInput`: the selection highlight, caret and handles. */
type TextSelectionProps = {
  selectionColor: ColorValue;
  cursorColor?: ColorValue;
  selectionHandleColor?: ColorValue;
};

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
  /** Selection colours for every text field (`{...textSelection}` before the caller's props). */
  textSelection: TextSelectionProps;
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
    primary: tokenHex('--brand'),
    background: NAV_COLORS.background,
    card: NAV_COLORS.card,
    text: NAV_COLORS.text,
    border: NAV_COLORS.border,
  },
};

/**
 * Android takes the highlight as given and draws caret and handles from their
 * own props; iOS uses `selectionColor` as the field's tint (caret, handles AND
 * a highlight it lightens itself), so it gets the opaque brand.
 */
const TEXT_SELECTION_PROPS = Platform.select<TextSelectionProps>({
  android: {
    selectionColor: TEXT_SELECTION.highlight,
    cursorColor: TEXT_SELECTION.caret,
    selectionHandleColor: TEXT_SELECTION.caret,
  },
  default: { selectionColor: TEXT_SELECTION.caret },
});

const BRAND = tokenHex('--brand');

const THEME: ThemeContextValue = {
  navTheme: NAV_THEME,
  statusBarStyle: 'light',
  accent: BRAND,
  brand: BRAND,
  brandContrast: tokenHex('--brand-contrast'),
  muted: tokenHex('--ink-400'),
  danger: '#ef4444',
  info: tokenHex('--info'),
  textSelection: TEXT_SELECTION_PROPS,
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
