import notifee, {
  AndroidImportance,
  EventType,
} from '@notifee/react-native';
import {notificationOpen} from './notificationAction';

export const handleNotificationPressEvent = async ({type, detail}) => {
  if (
    (type === EventType.PRESS || type === EventType.ACTION_PRESS) &&
    detail?.notification?.data
  ) {
    notificationOpen({data: detail.notification.data});
  }
};

class LocalNotificationService {
  channelId = 'sahayya-notifications';
  unsubscribeForeground = null;

  configure = async () => {
    await this.createChannel();
    this.setupListeners();
  };

  setupListeners = () => {
    if (this.unsubscribeForeground) {
      return;
    }

    this.unsubscribeForeground = notifee.onForegroundEvent(
      handleNotificationPressEvent,
    );
  };

  createChannel = async () => {
    try {
      await notifee.createChannel({
        id: this.channelId,
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

  showlocalNotification = async ({notification, data}) => {
    try {
      const title = notification?.title || 'Sahayya';
      const message =
        notification?.body || notification?.title || '';
      if (!message) {
        return;
      }

      await notifee.displayNotification({
        title,
        body: message,
        data: data || {},
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {id: 'default'},
          sound: 'default',
        },
        ios: {
          sound: 'default',
          badge: true,
        },
      });
    } catch (error) {
      // silent
    }
  };

  cancelAllLocalNotifications = async () => {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      // silent
    }
  };

  clearNotificationBadge = async () => {
    try {
      await notifee.setBadgeCount(0);
    } catch (error) {
      // silent
    }
  };

  removeAllDeliveredNotificationByID = async notificationId => {
    try {
      await notifee.cancelNotification(notificationId);
    } catch (error) {
      // silent
    }
  };
}

export const localNotificationService = new LocalNotificationService();
