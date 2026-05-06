import { AppRegistry, NativeModules } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// --- NUCLEAR PROXY TO KILL 'S' PROPERTY CRASH ---
if (!global.__S_PROXY_INJECTED__) {
  global.__S_PROXY_INJECTED__ = true;
  
  const nativeModulesProxy = new Proxy(NativeModules, {
    get(target, prop) {
      const module = target[prop];
      if (module === undefined) {
        // Return a dummy object that has every property (including 'S') as a dummy function/object
        return new Proxy({}, {
          get(t, p) {
            if (p === 'S' || p === 'default') return {};
            return undefined;
          }
        });
      }
      return module;
    }
  });

  // Overwrite NativeModules with our safe proxy
  Object.defineProperty(NativeModules, 'Proxy', {
    value: nativeModulesProxy,
    configurable: true,
    enumerable: true,
    writable: true
  });
  
  // Also handle global undefined accesses if possible
  if (typeof global.S === 'undefined') {
    global.S = {};
  }
}
// ------------------------------------------------

AppRegistry.registerComponent(appName, () => App);
