/**
 * @format
 */

import { NativeModules, AppRegistry } from 'react-native';

// Global Crash Protector: Mock problematic native modules before they are required
const safeMock = (name, mockObj = {}) => {
  if (NativeModules && !NativeModules[name]) {
    try {
      NativeModules[name] = mockObj;
    } catch (e) {
      // In some RN versions NativeModules is read-only, but we try anyway
    }
  }
};

safeMock('ReactLocalization', { language: 'en' });
safeMock('RNScreens', {});
safeMock('RNSScreen', {});
safeMock('RNSScreenStack', {});
safeMock('RNSSafeAreaContext', {});
safeMock('RNSSafeAreaProvider', {});
safeMock('RNSSafeAreaContextManager', {});

import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { enableScreens } from 'react-native-screens';

// Disable screens optimization if it's causing crashes
try {
  enableScreens(false);
} catch (e) {}

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
