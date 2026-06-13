/** @type {import('tailwindcss').Config} */

// metri brand palette — derived from the logo (lime accent on near-black)
// plus a cool, slightly blue-tinted dark scale ("ink") in the spirit of
// Zed's docs, used for backgrounds, surfaces and borders.
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary accent — the dumbbell green from the logo.
        lime: {
          DEFAULT: '#bef82b',
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#dcf8a6',
          300: '#cef47a',
          400: '#bef82b', // brand
          500: '#a3e635',
          600: '#84cc16',
          700: '#65a30d',
          800: '#4d7c0f',
          900: '#3f6212',
        },
        // Cool neutrals for surfaces and text. Values come from CSS variables so
        // they swap per theme (see src/theme/tokens.ts + ThemeProvider). `950`
        // stays constant — it's the dark text used on the lime accent.
        ink: {
          DEFAULT: '#0b0d12',
          950: '#08090d',
          900: 'rgb(var(--ink-900) / <alpha-value>)', // app background
          850: 'rgb(var(--ink-850) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)', // cards / surfaces
          750: 'rgb(var(--ink-750) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)', // raised surfaces
          600: 'rgb(var(--ink-600) / <alpha-value>)', // borders
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)', // muted text
          300: 'rgb(var(--ink-300) / <alpha-value>)', // secondary text
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          50: 'rgb(var(--ink-50) / <alpha-value>)',
        },
        // Accent TEXT that must stay legible on the current surface (lime on dark,
        // a darker green on light).
        accent: 'rgb(var(--accent) / <alpha-value>)',
        // Accent FILL for buttons/CTAs — calmer green on white so it isn't neon.
        accentFill: 'rgb(var(--accent-fill) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};
