/**
 * Component tests (`*.test.tsx`) run here, on jest-expo — React Native's own
 * renderer, mocks and Babel config. Pure logic and repo tests stay on vitest
 * (`*.test.ts`, `vitest.config.mts`): two runners, split by file extension.
 * @see AGENTS.md "Commands".
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // jest-expo's list plus the libraries this app ships untranspiled.
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|standard-navigation|nativewind|react-native-css-interop|iconoir-react-native|@shopify|victory-native))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
};
