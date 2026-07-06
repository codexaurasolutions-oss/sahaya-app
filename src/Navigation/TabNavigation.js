import React, {useState, useEffect, useCallback} from 'react';
import { useSelector } from 'react-redux';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { isIos } from '../Backend/Utility';
import { Colors } from '../Constants/Colors';
import { ImageConstant } from '../Constants/ImageConstant';
import {
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Typography from '../Component/UI/Typography';
import { Font } from '../Constants/Font';
import { GET_WITH_TOKEN } from '../Backend/Backend';

import { createStackNavigator } from '@react-navigation/stack';
import Dashboard from '../Screens/Private/Dashboard/Dashboard';
import More from '../Screens/Private/MoreScreens/More';
import Staff from "../Screens/Private/Staff/Staff"
import ReferAndEarn from '../Screens/Private/MoreScreens/ReferAndEarn';
import MyJobPosting from '../Screens/Private/MoreScreens/MyJobPosting';
import PostNewJob from '../Screens/Private/MoreScreens/PostNewJob';
import ListingJob from '../Screens/Private/MoreScreens/ListingJob';
import {subscribeToNotificationChanges} from '../pushNotifacation/notificationEvents';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#FFFFFF' } }}
      initialRouteName="Dashboard"
    >
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="StaffManagement" component={Staff} />
    </Stack.Navigator>
  );
};

const MoreStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="More"
    >
      <Stack.Screen name="More" component={More} />
    </Stack.Navigator>
  );
};

const JobPostingStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="MyJobPosting"
    >
      <Stack.Screen
        name="MyJobPosting"
        component={MyJobPosting}
        initialParams={{ showBackButton: false }}
      />
      <Stack.Screen name="PostNewJob" component={PostNewJob} />
      <Stack.Screen name="ListingJob" component={ListingJob} />
    </Stack.Navigator>
  );
};

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

export const TabNavigation = () => {
  const [jobBadgeCount, setJobBadgeCount] = useState(0);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const fetchJobBadgeCount = useCallback(() => {
    GET_WITH_TOKEN(
      'notifications/unread-count',
      success => {
        setJobBadgeCount(success?.unread_count || 0);
      },
      () => {},
      () => {},
    );
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchJobBadgeCount();
    }
  }, [isFocused, fetchJobBadgeCount]);

  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(fetchJobBadgeCount, 30000);
    return () => clearInterval(interval);
  }, [isFocused, fetchJobBadgeCount]);

  useEffect(() => {
    return subscribeToNotificationChanges(() => {
      fetchJobBadgeCount();
    });
  }, [fetchJobBadgeCount]);

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
          elevation: 5,
          backgroundColor: Colors.white,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          bottom: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        },
        tabBarButton: props => (
          <TouchableOpacity activeOpacity={0.7} {...props}>
            {props.children}
          </TouchableOpacity>
        ),
      }}
      sceneContainerStyle={{ backgroundColor: '#FFFFFF' }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tab}>
              <LinearImage isFocused={focused} image={ImageConstant?.Dashboard} />
              <Typography
                size={focused ? 11 : 10}
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
        name="Jobs"
        component={JobPostingStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tab}>
              <View>
                <LinearImage isFocused={focused} image={ImageConstant?.joblisting} />
                <TabBadge count={jobBadgeCount} />
              </View>
              <Typography
                size={focused ? 11 : 10}
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
            <View style={styles.tab}>
              <LinearImage isFocused={focused} image={ImageConstant?.win} />
              <Typography
                size={focused ? 11 : 10}
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
        component={MoreStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tab}>
              <LinearImage isFocused={focused} image={ImageConstant?.More} />
              <Typography
                size={focused ? 11 : 10}
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
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: widthPercentageToDP(25),
    height: 55,
  },
  text: {
    width: widthPercentageToDP(22),
  },
});
