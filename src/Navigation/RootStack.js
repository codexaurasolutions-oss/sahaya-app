import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import React from 'react';
import { TabNavigation } from './TabNavigation';
import FindStaff from '../../src/Screens/Private/FindStaff/FindStaff';
import AllStaff from '../../src/Screens/Private/FindStaff/AllStaff';
import FamilyMembers from '../../src/Screens/Private/MoreScreens/FamilyMembers';
import MyJobPosting from '../../src/Screens/Private/MoreScreens/MyJobPosting';
import ListingJob from '../../src/Screens/Private/MoreScreens/ListingJob';
import NewMember from '../../src/Screens/Private/MoreScreens/NewMember';
import Notification from '../../src/Screens/Private/MoreScreens/Notification';
import PostNewJob from '../../src/Screens/Private/MoreScreens/PostNewJob';
import Aadhar from './../Screens/Private/Staff/Aadhar';
import NewStaffFrom from './../Screens/Private/Staff/NewStaffFrom';
import StaffVerifection from './../Screens/Private/Staff/StaffVerifection';
import HouseholdProfile from './../Screens/Private/MoreScreens/HouseholdProfile';
import AadharOtp from './../Screens/Private/Staff/AadharOtp';
import LeaveApplications from './../Screens/Leave/LeaveApplications';
import ProfileManagement from '../Screens/Auth/ProfileSteps/ProfileManagement';
import AttendanceScreen from '../Screens/Calender/AttendanceScreen';
import HouseholdManager from '../Screens/Membership/HouseholdManager';
import HouseHoldStaffProfile from './../Screens/Private/Staff/HouseHoldStaffProfile';
import Step1 from '../Screens/Auth/ProfileSteps/Step1';
import PolicyScreen from '../Component/PolicyScreen';
import AppUpdate from '../Screens/Private/MoreScreens/AppUpdate';
import ReferAndEarn from '../Screens/Private/MoreScreens/ReferAndEarn';
import RecentSalaryList from '../Screens/Private/Salary/RecentSalaryList';
import { useSelector } from 'react-redux';

const commonOptions = {
  CardStyleInterpolators: CardStyleInterpolators.forHorizontalIOS,
  headerShown: false,
  cardStyle: { backgroundColor: '#FFFFFF' },
};
const Stack = createStackNavigator();

const RootStack = () => {
  const userDetails = useSelector(state => state?.userDetails);
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={userDetails?.step < 4 ? 'Step1' : 'TabNavigation'}
    >
      <Stack.Screen
        name="TabNavigation"
        component={TabNavigation}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="Step1"
        component={Step1}
      />
      <Stack.Screen
        name="FindStaff"
        component={FindStaff}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="AllStaff"
        component={AllStaff}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="FamilyMembers"
        component={FamilyMembers}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="MyJobPosting"
        component={MyJobPosting}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="Notification"
        component={Notification}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="PostNewJob"
        component={PostNewJob}
        options={{ ...commonOptions }}
      />

      <Stack.Screen
        name="Aadhar"
        component={Aadhar}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="StaffVerifection"
        component={StaffVerifection}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="NewStaffFrom"
        component={NewStaffFrom}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="NewMember"
        component={NewMember}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="HouseholdProfile"
        component={HouseholdProfile}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="AadharOtp"
        component={AadharOtp}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="Leave"
        component={LeaveApplications}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="ProfileManagement"
        component={ProfileManagement}
        options={{ ...commonOptions }}
      />

      <Stack.Screen
        name="AttendanceScreen"
        component={AttendanceScreen}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="HouseholdManager"
        component={HouseholdManager}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="HouseHoldStaffProfile"
        component={HouseHoldStaffProfile}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="Policy"
        component={PolicyScreen}
        options={{ ...commonOptions }}
      />
      <Stack.Screen
        name="ListingJob"
        component={ListingJob}
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
        name="RecentSalaryList"
        component={RecentSalaryList}
        options={{ ...commonOptions }}
      />
    </Stack.Navigator>
  );
};

export default RootStack;
