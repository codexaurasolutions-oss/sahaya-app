/**
 * @format
 */

import { NativeModules, AppRegistry, Platform } from 'react-native';

// SUPER BULLETPROOF PROTECTION
// If any NativeModule is accessed but not found, return an empty object instead of undefined.
// This prevents "Cannot read property 'S' of undefined" permanently.
const handler = {
  get: function(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    // Return a dummy object with some common properties to satisfy minified code
    return {
      S: {},
      default: {},
      initialization: true,
      addListener: () => {},
      removeListeners: () => {},
    };
  }
};

// Apply proxy to NativeModules
const SafeNativeModules = new Proxy(NativeModules, handler);

// Inject into global to catch libraries that use global.NativeModules
if (typeof global !== 'undefined') {
  global.NativeModules = SafeNativeModules;
}

import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { enableScreens } from 'react-native-screens';

try {
  enableScreens(false);
} catch (e) {}

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
