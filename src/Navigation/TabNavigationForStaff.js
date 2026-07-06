import React, {useState, useEffect, useCallback} from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { isIos } from '../Backend/Utility';
import { Colors } from '../Constants/Colors';
import { ImageConstant } from '../Constants/ImageConstant';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import Typography from '../Component/UI/Typography';
import { Font } from '../Constants/Font';
import StaffDashboard from '../Screens/Staff/StaffDashboard';
import StaffMore from '../Screens/Staff/StaffMore';
import MyWork from './../Screens/Staff/MyWork';
import ReferAndEarn from '../Screens/Private/MoreScreens/ReferAndEarn';
import JobListing from './../Screens/Staff/JobListing';
import { GET_WITH_TOKEN } from '../Backend/Backend';
import {subscribeToNotificationChanges} from '../pushNotifacation/notificationEvents';

const Tab = createBottomTabNavigator();

export const bottomTabHeight = isIos ? 90 : 70;

const TabBadge = ({count}) => {
  if (!count || count <= 0) return null;
  return (
    <View style={tabBadgeStyles.badge}>
      <View style={tabBadgeStyles.inner}>
        <Typography style={tabBadgeStyles.text}>
          {count > 99 ? '99+' : count}
        </Typography>
      </View>
    </View>
  );
};

const tabBadgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -12,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  inner: {
    paddingHorizontal: 4,
  },
  text: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 14,
    textAlign: 'center',
  },
});

export const TabNavigationForStaff = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [myWorkBadgeCount] = useState(0);
  const isFocused = useIsFocused();

  const fetchUnreadCount = useCallback(() => {
    GET_WITH_TOKEN(
      'notifications/unread-count',
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

  const LinearImage = ({ image = ImageConstant?.home, isFocused = false }) => {
    return (
      <Image
        source={image}
        style={{ width: 17.5, height: 17.5, top: 5, marginBottom: 7.5 }}
        resizeMode={'contain'}
        tintColor={isFocused ? '#D98579' : Colors?.black}
      />
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarActiveTintColor: Colors.blue,
        tabBarInactiveTintColor: Colors.black,
        tabBarStyle: {
          height: bottomTabHeight,
          elevation: 10,
          backgroundColor: Colors.white,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 5,
        },
        tabBarButton: props => (
          <TouchableOpacity activeOpacity={0.7} {...props}>
            {props.children}
          </TouchableOpacity>
        ),
      }}
      initialRouteName="DashboardHome"
    >
      <Tab.Screen
        name="DashboardHome"
        component={StaffDashboard}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tab, {}]}>
              <View>
                <LinearImage
                  isFocused={focused}
                  image={ImageConstant?.Dashboard}
                />
                <TabBadge count={unreadCount} />
              </View>
              <Typography
                lineHeight={16.5}
                size={11}
                color={focused ? '#D98579' : Colors?.black}
                type={focused ? Font.Poppins_SemiBold : Font.Poppins_Regular}
                style={styles.text}
                numberOfLines={1}
                textAlign={'center'}
              >
                Dashboard
              </Typography>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="My Work"
        component={MyWork}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tab, {}]}>
              <View>
                <LinearImage
                  isFocused={focused}
                  image={ImageConstant?.Briefcase}
                />
                <TabBadge count={myWorkBadgeCount} />
              </View>
              <Typography
                size={focused ? 12 : 10}
                color={focused ? '#D98579' : Colors?.black}
                type={focused ? Font.Poppins_SemiBold : Font.Poppins_Regular}
                style={styles.text}
                numberOfLines={1}
                textAlign={'center'}
              >
                My Work
              </Typography>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="PlaceJobListings"
        component={JobListing}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tab]}>
              <LinearImage
                isFocused={focused}
                image={ImageConstant?.Briefcase}
              />
              <Typography
                size={focused ? 12 : 10}
                color={focused ? '#D98579' : Colors?.black}
                type={focused ? Font.Poppins_SemiBold : Font.Poppins_Regular}
                style={styles.text}
                numberOfLines={1}
                textAlign={'center'}
              >
                Jobs
              </Typography>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ReferEarn"
        component={ReferAndEarn}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tab]}>
              <LinearImage isFocused={focused} image={ImageConstant?.win} />
              <Typography
                size={focused ? 12 : 10}
                color={focused ? '#D98579' : Colors?.black}
                type={focused ? Font.Poppins_SemiBold : Font.Poppins_Regular}
                style={styles.text}
                numberOfLines={1}
                textAlign={'center'}
              >
                Refer
              </Typography>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={StaffMore}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tab]}>
              <LinearImage isFocused={focused} image={ImageConstant?.More} />
              <Typography
                size={focused ? 12 : 10}
                color={focused ? '#D98579' : Colors?.black}
                type={focused ? Font.Poppins_SemiBold : Font.Poppins_Regular}
                style={styles.text}
                numberOfLines={1}
                textAlign={'center'}
              >
                More
              </Typography>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tab: {
    marginTop: 10,
    paddingHorizontal: 25,
    borderColor: Colors?.blue_icon,
    borderTopColor: Colors.primary_blue,
    alignItems: 'center',
    width: widthPercentageToDP(18),
    height: 55,
    justifyContent: 'flex-end',
  },
  text: {
    width: widthPercentageToDP(18),
  },
});
