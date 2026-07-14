import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { TabNavigationForStaff } from './TabNavigationForStaff';
import QuitJob from './../Screens/Staff/QuitJob';
import ApplyLeave from './../Screens/Staff/ApplyLeave';
import JobsList from './../Screens/Staff/JobsList';
import JobDetails from './../Screens/Staff/JobDetails';
import EditProfile from './../Screens/Staff/EditProfile';
import Notifications from './../Screens/Staff/Notifications';
import StaffProfileMain from './../Screens/Staff/StaffProfileMain';
import EarningSummary from './../Screens/Staff/EarningSummary';
import StaffAttendance from './../Screens/Staff/StaffAttendance';
import StaffAdvanceView from './../Screens/Staff/StaffAdvanceView';
import StaffPaymentHistory from './../Screens/Staff/StaffPaymentHistory';
import HireMeScreen from './../Screens/Staff/HireMeScreen';

import JobListing from './../Screens/Staff/JobListing';
import AIJobSearch from './../Screens/Staff/AIJobSearch';
import AIJobResults from './../Screens/Staff/AIJobResults';
import MemberShip from './../Screens/Staff/MemberShip';
import StepFirst from '../Screens/Auth/StaffProfile/StepFirst';
import PolicyScreen from '../Component/PolicyScreen';
import AppUpdate from '../Screens/Private/MoreScreens/AppUpdate';
import ReferAndEarn from '../Screens/Private/MoreScreens/ReferAndEarn';
import StaffWallet from '../Screens/Staff/StaffWallet';
import BankAccounts from '../Screens/Staff/BankAccounts';
import { useDispatch, useSelector } from 'react-redux';
import Aadhaar from '../Screens/Auth/Aadhaar';
import AadharOtp from '../Screens/Private/Staff/AadharOtp';
import { GET_WITH_TOKEN } from '../Backend/Backend';
import { PROFILE } from '../Backend/api_routes';
import { userDetails } from '../Redux/action';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const commonOptions = {
  CardStyleInterpolators: CardStyleInterpolators.forHorizontalIOS,
  headerShown: false,
};
const Stack = createStackNavigator();

const RootStack = () => {
  const userDetail = useSelector(state => state?.userDetails);
  const Dispatch = useDispatch();

  global.Profile = async () => {
    GET_WITH_TOKEN(
      PROFILE,
      success => {
        console.log('90909', success?.data);

        Dispatch(userDetails(success?.data));
      },
      error => { },
      fail => { },
    );
  };

  useEffect(() => {
    global.Profile();
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={
        !userDetail || Object.keys(userDetail).length === 0
          ? 'TabNavigationForStaff'
          : (userDetail?.aadhar__verify == 0 || userDetail?.aadhar__verify == null || userDetail?.aadhar__verify == false)
            ? 'Aadhaar'
            : userDetail?.step < 5
              ? 'StepFirst'
              : 'TabNavigationForStaff'
      }
    >
      <Stack.Screen
        name="TabNavigationForStaff"
        component={TabNavigationForStaff}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="Aadhaar"
        component={Aadhaar}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="AadharOtp"
        component={AadharOtp}
      />
      <Stack.Screen
        name="StepFirst"
        component={StepFirst}
        options={{ ...commonOptions }}
      />

      <Stack.Screen
        name="QuitJob"
        component={QuitJob}
        options={{ ...commonOptions }}
      />

      <Stack.Screen
        name="ApplyLeave"
        component={ApplyLeave}
        options={{ ...commonOptions }}
      />

      <Stack.Screen
        name="ActiveJob"
        component={JobListing}
        options={{ ...commonOptions }}
      />

      <Stack.Screen
        name="JobDetails"
        component={JobDetails}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="StaffProfileMain"
        component={StaffProfileMain}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="JobListing"
        component={JobListing}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="MemberShip"
        component={MemberShip}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="Policy"
        component={PolicyScreen}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="EarningSummary"
        component={EarningSummary}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="StaffAdvanceView"
        component={StaffAdvanceView}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="StaffPaymentHistory"
        component={StaffPaymentHistory}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="HireMe"
        component={HireMeScreen}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="StaffAttendance"
        component={StaffAttendance}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="AIJobSearch"
        component={AIJobSearch}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="AIJobResults"
        component={AIJobResults}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="AppUpdate"
        component={AppUpdate}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="ReferAndEarn"
        component={ReferAndEarn}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="StaffWallet"
        component={StaffWallet}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="BankAccounts"
        component={BankAccounts}
        options={{ ...commonOptions }}
      />
    </Stack.Navigator>
  );
};

export default RootStack;
