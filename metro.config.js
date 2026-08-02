const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

// Sentry's wrapper over expo/metro-config: same defaults plus Debug IDs so
// uploaded sourcemaps match the bundles. Our customizations layer on top.
const config = getSentryExpoConfig(__dirname);

// Import .svg files as React components (react-native-svg-transformer)
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Allow importing Drizzle's generated .sql migration files
config.resolver.sourceExts.push('sql');

module.exports = withNativeWind(config, { input: './src/global.css' });
