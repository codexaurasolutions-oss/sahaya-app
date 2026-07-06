import { AppRegistry, NativeModules } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import {handleNotificationPressEvent} from './src/pushNotifacation/LocalNotificationService';

const CHANNEL_ID = 'sahayya-notifications';

async function ensureChannel() {
  try {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Sahayya Notifications',
      description:
        'Job alerts, salary updates, leave approvals, and important reminders',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
      badge: true,
    });
  } catch (e) {}
}

messaging().setBackgroundMessageHandler(async remoteMessage => {
  const title =
    remoteMessage?.data?.title ||
    remoteMessage?.notification?.title ||
    'Sahayya';
  const message =
    remoteMessage?.data?.body ||
    remoteMessage?.notification?.body ||
    '';
  if (!message) return;

  const hasSystemNotification = Boolean(
    remoteMessage?.notification?.title || remoteMessage?.notification?.body,
  );

  if (hasSystemNotification) {
    return;
  }

  await ensureChannel();

  await notifee.displayNotification({
    title,
    body: message,
    data: remoteMessage?.data || {},
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: {id: 'default'},
      sound: 'default',
    },
    ios: {
      sound: 'default',
      badge: true,
    },
  });
});

notifee.onBackgroundEvent(handleNotificationPressEvent);

// --- THE ULTIMATE 'S' CRASH KILLER ---
if (!NativeModules.ReactLocalization) {
  NativeModules.ReactLocalization = {
    language: 'en',
    getInterfaceLanguage: () => 'en',
    S: {}
  };
}

if (typeof global.S === 'undefined') {
  Object.defineProperty(global, 'S', {
    get() { return {}; },
    configurable: true
  });
}

const originalNativeModules = NativeModules;
global.NativeModules = new Proxy(originalNativeModules, {
  get(target, prop) {
    if (prop in target) return target[prop];
    return {
      S: {},
      default: {},
      getString: () => '',
      language: 'en'
    };
  }
});

AppRegistry.registerComponent(appName, () => App);
