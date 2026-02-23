const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for TiaTeleMD
 * Compatible with Expo SDK 52+ and React Native
 */
const defaultConfig = getDefaultConfig(__dirname);

// Add SVG transformer support
defaultConfig.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// Configure resolver
const { assetExts, sourceExts } = defaultConfig.resolver;
defaultConfig.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
defaultConfig.resolver.sourceExts = [...sourceExts, 'svg'];

// Polyfill Node.js core modules for React Native
defaultConfig.resolver.extraNodeModules = {
  crypto: require.resolve('react-native-get-random-values'),
  stream: require.resolve('stream-browserify'),
  url: require.resolve('url'),
};

module.exports = defaultConfig;
