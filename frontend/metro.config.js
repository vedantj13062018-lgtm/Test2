// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SVG transformer support
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// SVG extensions support
const { assetExts, sourceExts } = config.resolver;
config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...sourceExts, 'svg'];

// Polyfill Node.js core modules for React Native
config.resolver.extraNodeModules = {
    crypto: require.resolve('react-native-get-random-values'),
    stream: require.resolve('stream-browserify'),
    url: require.resolve('url'),
};

module.exports = config;
