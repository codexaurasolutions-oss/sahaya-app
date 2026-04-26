import React from 'react';
import { useSelector } from 'react-redux';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Image,

  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { isIos } from '../Backend/Utility';
import { Colors } from '../Constants/Colors';
import { ImageConstant } from '../Constants/ImageConstant';
import {
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Typography from '../Component/UI/Typography';
import { Font } from '../Constants/Font';

import { createStackNavigator } from '@react-navigation/stack';
import Dashboard from '../Screens/Private/Dashboard/Dashboard';
import More from '../Screens/Private/MoreScreens/More';
import Staff from "../Screens/Private/Staff/Staff"
import Salary from "../Screens/Private/Salary/Salary"
import RecentSalaryList from "../Screens/Private/Salary/RecentSalaryList"
import AdvanceManagement from "../Screens/Private/Salary/AdvanceManagement"
import ReferAndEarn from '../Screens/Private/MoreScreens/ReferAndEarn';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#FFFFFF' } }}
      initialRouteName="Dashboard"
    >
      <Stack.Screen name="Dashboard" component={Dashboard} />
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


const StaffStack = ()=>{
    return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Staff"
    >

      <Stack.Screen name="Staff" component={Staff} />

    </Stack.Navigator>
  );
}


const SalaryStack = ()=>{
  return(
      <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Salary"
    >
      <Stack.Screen name="Salary" component={Salary} />
      <Stack.Screen name="RecentSalaryList" component={RecentSalaryList} />
      <Stack.Screen name="AdvanceManagement" component={AdvanceManagement} />
    </Stack.Navigator>
  )
} 


export const bottomTabHeight = isIos ? 90 : 70;


export const TabNavigation = () => {
  const commonOptions = {
    headerShown: false,
  };
  const navigation = useNavigation();
  const lang_code = useSelector(store => store.langCode);

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
          // borderTopRightRadius: 20,
          // borderTopLeftRadius: 20,
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
        name="Staff"
        component={StaffStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tab}>
              <LinearImage isFocused={focused} image={ImageConstant?.staff} />
              <Typography
                size={focused ? 11 : 10}
                color={focused ? '#D98579' : Colors?.black}
                type={focused ? Font.Poppins_SemiBold : Font.Poppins_Regular}
                style={styles.text}
                numberOfLines={1}
                textAlign={'center'}
              >
                Staff
              </Typography>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Salary"
        component={SalaryStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tab}>
              <LinearImage isFocused={focused} image={ImageConstant?.Salary} />
              <Typography
                size={focused ? 11 : 10}
                color={focused ? '#D98579' : Colors?.black}
                type={focused ? Font.Poppins_SemiBold : Font.Poppins_Regular}
                style={styles.text}
                numberOfLines={1}
                textAlign={'center'}
              >
                Salary
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
    width: widthPercentageToDP(20),
    height: 55,
  },
  text: {
    width: widthPercentageToDP(18),
  },
});
