const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const config = {
  resolver: {
    // Block localization libraries that cause 'S' property crash
    // These use NativeModules.ReactLocalization which is not available
    blockList: [
      /node_modules\/react-native-localization\/.*/,
      /node_modules\/react-localization\/.*/,
      /node_modules\/localized-strings\/.*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
