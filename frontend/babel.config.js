module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // 'react-native-reanimated/plugin', // Temporarily disabled due to compatibility issues
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@store': './src/store',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@types': './src/types',
        },
      },
    ],
  ],
};
