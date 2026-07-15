/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-splash-screen', () => ({
  hide: jest.fn(),
  show: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('redux-persist/integration/react', () => ({
  PersistGate: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('react-redux', () => ({
  Provider: ({children}: {children: React.ReactNode}) => children,
  useSelector: (selector: (state: object) => unknown) =>
    selector({isAuth: false, userType: null, language_code: 'en'}),
}));

jest.mock('../src/Redux/store', () => {
  const {createStore} = require('redux');
  return {
    store: createStore(() => ({
      isAuth: false,
      userType: null,
      language_code: 'en',
    })),
    persistor: {},
  };
});

jest.mock('../src/Navigation/AuthStack', () => () => null);
jest.mock('../src/Navigation/RootStack', () => () => null);
jest.mock('../src/Navigation/StaffStacks', () => () => null);
jest.mock('../src/Navigation/RootNavigation', () => ({navigationRef: {}}));
jest.mock('../src/Component/UI/FocusAwareStatusBar', () => ({
  FocusAwareStatusBar: () => null,
}));
jest.mock('../src/Constants/AsyncStorage', () => ({
  getLanguage: jest.fn(async () => 'en'),
  setLanguage: jest.fn(async () => undefined),
}));
jest.mock('../src/pushNotifacation/FMCService', () => ({
  fcmService: {register: jest.fn()},
}));
jest.mock('../src/pushNotifacation/LocalNotificationService', () => ({
  localNotificationService: {configure: jest.fn(async () => undefined)},
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));
jest.mock('react-native-get-random-values', () => ({}));

import App from '../App';

test('renders correctly', async () => {
  jest.useFakeTimers();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    jest.runAllTimers();
    await Promise.resolve();
  });

  ReactTestRenderer.act(() => renderer.unmount());
  jest.useRealTimers();
});
