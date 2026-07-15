import {DeviceEventEmitter} from 'react-native';

const SUBSCRIPTION_UPDATED_EVENT = 'sahayya:subscription-updated';

export const notifySubscriptionUpdated = payload => {
  DeviceEventEmitter.emit(SUBSCRIPTION_UPDATED_EVENT, payload || {});
};

export const onSubscriptionUpdated = listener =>
  DeviceEventEmitter.addListener(SUBSCRIPTION_UPDATED_EVENT, listener);
