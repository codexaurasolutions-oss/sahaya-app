import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {GET_WITH_TOKEN} from '../Backend/Backend';

const TabBadge = ({count, style}) => {
  if (!count || count <= 0) return null;

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  text: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 14,
    textAlign: 'center',
  },
});

export default TabBadge;

export const useUnreadCount = (route) => {
  const [count, setCount] = useState(0);
  const isFocused = useIsFocused();

  const fetchCount = useCallback(() => {
    GET_WITH_TOKEN(
      'notifications/unread-count',
      success => setCount(success?.unread_count || 0),
      () => {},
      () => {},
    );
  }, []);

  useEffect(() => {
    if (isFocused) fetchCount();
  }, [isFocused, fetchCount]);

  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isFocused, fetchCount]);

  return count;
};
