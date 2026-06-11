module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      // Lets Drizzle bundle .sql migration files via `import migrations from './migrations'`
      ['inline-import', { extensions: ['.sql'] }],
    ],
  };
};
