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
    },
  },
]);
