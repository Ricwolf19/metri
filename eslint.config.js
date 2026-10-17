// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // House style: prefer arrow-function expressions everywhere (components,
    // hooks, helpers) for one consistent shape across the app.
    rules: {
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'react/function-component-definition': [
        'error',
        { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
      ],
      // Live queries go through `@/db/useLiveQuery`: mandatory deps, a
      // synchronous first read and one re-query per frame. Drizzle's own hook
      // defaults `deps` to [] and re-queries once per changed row.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'drizzle-orm/expo-sqlite',
              importNames: ['useLiveQuery'],
              message: 'Import useLiveQuery from @/db/useLiveQuery (deps are mandatory there).',
            },
          ],
        },
      ],
    },
  },
]);
