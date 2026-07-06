import React, {useState, useCallback} from 'react';
import {TouchableOpacity, Image, View, Text} from 'react-native';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {useEffect} from 'react';
import {GET_WITH_TOKEN} from '../Backend/Backend';
import {NotificationUnreadCount} from '../Backend/api_routes';
import {ImageConstant} from '../Constants/ImageConstant';
import {subscribeToNotificationChanges} from '../pushNotifacation/notificationEvents';

const NotificationBell = ({navigateTo = 'Notification', style}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const fetchUnreadCount = useCallback(() => {
    GET_WITH_TOKEN(
      NotificationUnreadCount,
      success => {
        setUnreadCount(success?.unread_count || 0);
      },
      () => {},
      () => {},
    );
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchUnreadCount();
    }
  }, [isFocused, fetchUnreadCount]);

  // Refresh count every 30 seconds when screen is focused
  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isFocused, fetchUnreadCount]);

  useEffect(() => {
    return subscribeToNotificationChanges(() => {
      fetchUnreadCount();
    });
  }, [fetchUnreadCount]);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate(navigateTo)}
      style={[{position: 'relative'}, style]}>
      <Image
        source={ImageConstant?.notification}
        style={{height: 30, width: 30, resizeMode: 'center'}}
      />
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            backgroundColor: '#DC2626',
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}>
          <Text
            style={{
              color: 'white',
              fontSize: 10,
              fontWeight: 'bold',
              lineHeight: 14,
              textAlign: 'center',
            }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationBell;
