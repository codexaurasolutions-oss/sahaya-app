import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {Platform} from 'react-native';
import {notificationOpen} from './notificationAction';
import {POST_WITH_TOKEN} from '../Backend/Backend';
import {DeviceTokenUpdate} from '../Backend/api_routes';
import {store} from '../Redux/store';
import {emitNotificationChange} from './notificationEvents';

const CHANNEL_ID = 'sahayya-notifications';

class FCMService {
  pendingToken = null;
  configured = false;

  constructor() {
    store.subscribe(() => {
      const authState = store.getState();
      if (authState?.Token && this.pendingToken) {
        const tokenToUpload = this.pendingToken;
        this.pendingToken = null;
        this.uploadTokenToBackend(tokenToUpload);
      }
    });
  }

  register = async () => {
    if (this.configured) return;
    this.configured = true;

    await this.ensureChannel();
    this.createNotificationListeners();

    if (Platform.OS === 'ios') {
      await this.registerAppWithFCM();
    }

    await this.requestPermissionAndGetToken();
  };

  ensureChannel = async () => {
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
    } catch (error) {
      // silent
    }
  };

  registerAppWithFCM = async () => {
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
      await messaging().setAutoInitEnabled(true);
    }
  };

  requestPermissionAndGetToken = async () => {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          await this.getFcmToken();
        }
      } else {
        await this.getFcmToken();
      }
    } catch (error) {
      await this.getFcmToken();
    }
  };

  getFcmToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcm_token', fcmToken);
        await this.uploadTokenToBackend(fcmToken);
        return fcmToken;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  uploadTokenToBackend = async (fcmToken) => {
    const authState = store.getState();
    if (!authState?.Token) {
      this.pendingToken = fcmToken;
      return;
    }
    try {
      await POST_WITH_TOKEN(
        DeviceTokenUpdate,
        {device_token: fcmToken, device_type: Platform.OS},
        () => {},
        () => {},
      );
    } catch (error) {
      // silent - will retry on next token refresh
    }
  };

  deleteToken = () => {
    messaging()
      .deleteToken()
      .catch(() => {});
  };

  createNotificationListeners = () => {
    messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage) {
        notificationOpen(remoteMessage);
      }
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          notificationOpen(remoteMessage);
        }
      });

    this.messageListener = messaging().onMessage(async remoteMessage => {
      if (remoteMessage) {
        const title =
          remoteMessage?.data?.title ||
          remoteMessage?.notification?.title ||
          'Sahayya';
        const message =
          remoteMessage?.data?.body ||
          remoteMessage?.notification?.body ||
          '';
        if (!message) return;

        try {
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
          emitNotificationChange();
        } catch (error) {
          // silent
        }
      }
    });

    messaging().onTokenRefresh(async fcmToken => {
      await AsyncStorage.setItem('fcm_token', fcmToken);
      await this.uploadTokenToBackend(fcmToken);
    });
  };

  unRegister = () => {
    if (this.messageListener) {
      this.messageListener();
    }
  };
}

export const fcmService = new FCMService();
