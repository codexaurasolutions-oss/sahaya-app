import { AppRegistry, NativeModules } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// --- THE ULTIMATE 'S' CRASH KILLER ---
// We mock the specific module that usually causes this in minified builds
if (!NativeModules.ReactLocalization) {
  NativeModules.ReactLocalization = {
    language: 'en',
    getInterfaceLanguage: () => 'en',
    S: {} // In case it's looking for 'S' directly on the module
  };
}

// Global catch-all for any property 'S' on undefined
if (typeof global.S === 'undefined') {
  Object.defineProperty(global, 'S', {
    get() { return {}; },
    configurable: true
  });
}

// Fallback for NativeModules proxy
const originalNativeModules = NativeModules;
global.NativeModules = new Proxy(originalNativeModules, {
  get(target, prop) {
    if (prop in target) return target[prop];
    // Return a dummy object for any missing module
    return {
      S: {},
      default: {},
      getString: () => '',
      language: 'en'
    };
  }
});
// -------------------------------------

AppRegistry.registerComponent(appName, () => App);
