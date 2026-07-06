import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../../Backend/Backend';
import {
  NotificationList,
  NotificationRead,
} from '../../../Backend/api_routes';
import { useIsFocused } from '@react-navigation/native';
import {emitNotificationChange} from '../../../pushNotifacation/notificationEvents';

const ICON_CONFIG = {
  leave: { bg: '#E8F5E9', color: '#4CAF50', label: 'L' },
  staff: { bg: '#E3F2FD', color: '#5C6BC0', label: 'S' },
  salary: { bg: '#E8F5E9', color: '#4CAF50', label: 'S' },
  document: { bg: '#F5F5F5', color: '#9E9E9E', label: 'D' },
  attendance: { bg: '#E8F5E9', color: '#4CAF50', label: 'A' },
  general: { bg: '#F5F5F5', color: '#9E9E9E', label: 'N' },
};

const getIconConfig = type => {
  if (!type) return ICON_CONFIG.general;
  const key = type.toLowerCase();
  if (key.includes('leave')) return ICON_CONFIG.leave;
  if (key.includes('staff') || key.includes('member') || key.includes('onboard'))
    return ICON_CONFIG.staff;
  if (key.includes('salary') || key.includes('payment')) return ICON_CONFIG.salary;
  if (key.includes('document') || key.includes('kyc') || key.includes('verif'))
    return ICON_CONFIG.document;
  if (key.includes('attend')) return ICON_CONFIG.attendance;
  return ICON_CONFIG.general;
};

const formatTime = dateStr => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString();
};

const Notification = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(
    (showLoader = true) => {
      if (showLoader) setLoading(true);
      GET_WITH_TOKEN(
        NotificationList,
        success => {
          const list = success?.data || success?.notifications || [];
          setNotifications(Array.isArray(list) ? list : []);
          setLoading(false);
          setRefreshing(false);
        },
        () => {
          setLoading(false);
          setRefreshing(false);
        },
        () => {
          setLoading(false);
          setRefreshing(false);
        },
      );
    },
    [],
  );

  useEffect(() => {
    if (isFocused) fetchNotifications();
  }, [fetchNotifications, isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const markAsRead = id => {
    POST_WITH_TOKEN(NotificationRead, { notification_id: id });
    setNotifications(prev =>
      prev.map(n =>
        n.id === id
          ? {...n, read_at: new Date().toISOString(), status: 'read'}
          : n,
      ),
    );
    emitNotificationChange();
  };

  const getNotificationJobId = item => {
    if (item?.job_id) return item.job_id;

    const message = item?.message || item?.title || item?.body || '';
    const parts = message.split(/has applied for the job:\s*/i);
    return parts.length > 1 ? parts[1].trim() : null;
  };

  const handleNotificationPress = item => {
    if (!item) return;

    if (!item.read_at) {
      markAsRead(item.id);
    }

    const typeStr = (item?.type || '').toLowerCase();
    const messageStr = (item?.message || item?.title || item?.body || '').toLowerCase();

    if (typeStr === 'job_application' || messageStr.includes('has applied for the job')) {
      const jobId = getNotificationJobId(item);
      
      // If we have a direct numeric job_id, navigate
      if (jobId && (typeof jobId === 'number' || /^\d+$/.test(String(jobId).trim()))) {
        navigation.navigate('ListingJob', { id: Number(jobId) });
        return;
      }
      
      // Fallback: If jobId is not numeric (e.g. it's the job title like "Cook"), 
      // navigate to the MyJobPosting screen instead so they can find the job themselves
      navigation.navigate('MyJobPosting');
      return;
    }
  };

  const renderItem = ({ item }) => {
    const config = getIconConfig(item.type);
    const isUnread = !item.read_at;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={[styles.card, isUnread && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}>
        <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
          <Typography
            style={[styles.iconLabel, { color: config.color }]}
            type={Font.Poppins_Bold}>
            {config.label}
          </Typography>
        </View>
        <View style={styles.textContainer}>
          <Typography
            type={isUnread ? Font.Poppins_SemiBold : Font.Poppins_Medium}
            style={styles.message}>
            {item.message || item.title || item.body || ''}
          </Typography>
          <Typography type={Font.Poppins_Regular} style={styles.time}>
            {formatTime(item.created_at || item.time)}
          </Typography>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Typography type={Font.Poppins_Medium} style={styles.emptyText}>
          No notifications yet
        </Typography>
      </View>
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={
          LocalizedStrings.NotificationsActivities?.title ||
          'Notifications & Activities'
        }
        onPressLeftIcon={() => navigation?.goBack()}
        source_arrow={ImageConstant?.BackArrow}
        style_title={{ fontSize: 18 }}
      />
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            notifications.length === 0
              ? styles.emptyListContent
              : { paddingVertical: 10 }
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#D98579']}
              tintColor="#D98579"
            />
          }
        />
      )}
    </CommanView>
  );
};

export default Notification;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  unreadCard: {
    backgroundColor: '#FAFAFA',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconLabel: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: '#000',
    lineHeight: 21,
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emptyListContent: {
    flexGrow: 1,
  },
});
