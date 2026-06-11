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
        // Cool dark neutrals for surfaces and text.
        ink: {
          DEFAULT: '#0b0d12',
          950: '#08090d',
          900: '#0b0d12', // app background
          850: '#0f1219',
          800: '#141823', // cards / surfaces
          750: '#1a1f2b',
          700: '#212737', // raised surfaces
          600: '#2c3447', // borders
          500: '#3b4459',
          400: '#566077', // muted text
          300: '#7c869c', // secondary text
          200: '#aab2c4',
          100: '#d7dce6',
          50: '#eef1f6',
        },
      },
      fontFamily: {
        sans: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};
