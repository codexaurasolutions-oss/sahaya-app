import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import Button from '../../Component/Button';
import { useSelector } from 'react-redux';
import LocalizedStrings from '../../Constants/localization';
import { useIsFocused } from '@react-navigation/native';
import SimpleToast from 'react-native-simple-toast';
import { GET_WITH_TOKEN } from '../../Backend/Backend';
import { customerDashbord, ListJob, myWork, PROFILE, ReferralCode } from '../../Backend/api_routes';

const StaffDashboard = ({ navigation }) => {
  const userDetail = useSelector(store => store?.userDetails);
  const isFocused = useIsFocused();
  const [dataDash, setDataDash] = useState();
  const [jobCount, setJobCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [staffJobId, setStaffJobId] = useState(null);
  const [houseownerId, setHouseownerId] = useState(null);
  const [walletBalance, setWalletBalance] = useState('0.00');

  const fetchWalletBalance = () => {
    GET_WITH_TOKEN(
      ReferralCode,
      success => {
        setWalletBalance(success?.data?.total_earnings || '0.00');
      },
      error => {},
      () => {},
    );
  };

  useEffect(() => {
    if (isFocused) {
      GetUser();
      fetchJobCount();
      fetchLeaveCount();
      fetchWalletBalance();
      // Try to resolve houseownerId from userDetail first
      const fromUser =
        userDetail?.added_by ||
        userDetail?.houseowner_id ||
        userDetail?.employer_id ||
        null;
      if (fromUser) {
        setHouseownerId(fromUser);
      }
    }
  }, [isFocused]);

  const GetUser = () => {
    GET_WITH_TOKEN(
      customerDashbord,
      success => {
        setDataDash(success?.data || success);
        // Try to get leave count from dashboard response
        const dashLeaves = success?.data?.leave_requests || success?.leave_requests || success?.data?.leave_summary?.leaves || [];
        if (Array.isArray(dashLeaves) && dashLeaves.length > 0) {
          setLeaveCount(dashLeaves.length);
        }
      },
      error => {
        SimpleToast.show('Failed to load profile', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const fetchJobCount = () => {
    GET_WITH_TOKEN(
      ListJob,
      success => {
        const jobs = success?.data;
        setJobCount(Array.isArray(jobs) ? jobs.length : 0);
      },
      () => {},
      () => {},
    );
  };

  const fetchLeaveCount = () => {
    GET_WITH_TOKEN(
      myWork,
      success => {
        const leaves = success?.data?.leave_requests;
        setLeaveCount(Array.isArray(leaves) ? leaves.length : 0);

        // Extract job_id and houseowner_id for navigation
        const jobApps = success?.jobApplications || success?.data?.jobApplications || success?.job_applications || success?.data?.job_applications || [];
        const jobAppsArr = Array.isArray(jobApps) ? jobApps : [];
        // Only set staffJobId if there's an actual job application with a job_id
        // Do NOT fallback to success?.data?.id — that's the user/work ID, not a job
        const jobId = jobAppsArr?.[0]?.job_id || null;
        setStaffJobId(jobId);
        const ownerId =
          jobAppsArr?.[0]?.houseowner_id ||
          jobAppsArr?.[0]?.job?.houseowner_id ||
          jobAppsArr?.[0]?.job?.user_id ||
          success?.data?.houseowner_id ||
          success?.data?.employer_id ||
          success?.data?.added_by ||
          null;
        if (ownerId) {
          setHouseownerId(ownerId);
        } else if (!houseownerId) {
          // If still no houseownerId, try the profile API
          fetchHouseownerFromProfile();
        }
      },
      () => {},
      () => {},
    );
  };

  const fetchHouseownerFromProfile = () => {
    GET_WITH_TOKEN(
      PROFILE,
      success => {
        const profile = success?.data;
        const ownerId =
          profile?.added_by ||
          profile?.houseowner_id ||
          profile?.employer_id ||
          null;
        if (ownerId) {
          setHouseownerId(ownerId);
        }
      },
      () => {},
      () => {},
    );
  };

  // Get user image and name - skip default/placeholder images from backend
  const imgUrl = userDetail?.image?.toLowerCase() || '';
  const isDefaultImage =
    !userDetail?.image ||
    imgUrl.includes('noimage') ||
    imgUrl.includes('no_image') ||
    imgUrl.includes('no-image') ||
    imgUrl.includes('default') ||
    imgUrl.includes('placeholder');
  const userImage = isDefaultImage ? null : userDetail?.image;
  const userName =
    userDetail?.first_name && userDetail?.last_name
      ? `${userDetail?.first_name} ${userDetail?.last_name}`
      : userDetail?.first_name || userDetail?.name || 'User';
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
    <CommanView>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, backgroundColor: '#FFFFFF' }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ReferAndEarn')}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <View style={{
            height: 32, width: 32, borderRadius: 16,
            borderWidth: 1.5, borderColor: '#D98579',
            backgroundColor: '#FFFFFF',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Typography type={Font?.Poppins_SemiBold} style={{ fontSize: 16, color: '#D98579' }}>
              {'\u20B9'}
            </Typography>
          </View>
          <View style={{ marginLeft: 6 }}>
            <Typography type={Font?.Poppins_Medium} style={{ fontSize: 11, color: '#555' }}>
              Wallet
            </Typography>
            <Typography type={Font?.Poppins_SemiBold} style={{ fontSize: 13, color: '#1a1a1a' }}>
              {'\u20B9'}{walletBalance || '0.00'}
            </Typography>
          </View>
        </TouchableOpacity>

        <Typography
          type={Font?.Poppins_Medium}
          style={{ flex: 1, textAlign: 'center', fontSize: 18, color: '#000' }}
        >
          {LocalizedStrings.staffSection?.StaffDashboard?.title || 'Staff Dashboard'}
        </Typography>

        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Image source={ImageConstant?.notification} style={{ height: 30, width: 30, resizeMode: 'center' }} />
        </TouchableOpacity>
      </View>
      <View style={{ borderBottomWidth: 1, borderColor: '#EBEBEA' }} />

      <TouchableOpacity
        onPress={() => {
          navigation.navigate('StaffProfileMain');
        }}
        style={[styles.card, { marginTop: 20 }]}
      >
        <View style={styles.row}>
          <View style={{ flexDirection: 'row', flex: 0.9 }}>
            <Image
              source={userImage ? { uri: userImage } : ImageConstant.user}
              style={styles.profilePic}
            />
            <View style={{ marginLeft: 10 }}>
              <Typography type={Font.Poppins_Bold} style={styles.name}>
                {userName}
              </Typography>
              <Typography type={Font.Poppins_Regular}>
                {LocalizedStrings.staffSection?.StaffDashboard?.greeting ||
                  'Ready for a productive day!'}
              </Typography>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              flex: 0.1,
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
            }}
          >
            <Image
              source={ImageConstant?.BackArrow}
              tintColor={'#D98579'}
              style={{
                width: 20,
                height: 20,
                resizeMode: 'center',
                transform: [{ rotate: '180deg' }],
              }}
            />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.rowBetween}>
        <View style={[styles.card, styles.flexCard, styles.summaryCard]}>
          <View style={styles.cardContent}>
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 10,
                alignItems: 'center',
              }}
            >
              <Image
                source={ImageConstant.late}
                style={{
                  height: 20,
                  width: 20,
                  tintColor: '#D98579',
                  marginRight: 10,
                }}
              />
              <Typography type={Font.Poppins_Medium} style={styles.greenText}>
                {LocalizedStrings.staffSection?.StaffDashboard?.present_today ||
                  'Present Today'}
              </Typography>
            </View>
            <Typography type={Font.Poppins_SemiBold} color="#8C8D8B">
              {LocalizedStrings.staffSection?.StaffDashboard
                ?.attendance_summary || 'Attendance Summary'}
            </Typography>
            <Typography type={Font.Poppins_light} size={14}>
              {LocalizedStrings.staffSection?.StaffDashboard?.last_30_days ||
                'Last 30 Days'} - {dataDash?.attendance_summary?.last_30_days?.days_present || 0}{' '}
              {LocalizedStrings.staffSection?.StaffDashboard?.days_present ||
                'Days Present'}
              {'\n'}{dataDash?.attendance_summary?.last_30_days?.leaves_taken || 0}{' '}
              {LocalizedStrings.staffSection?.StaffDashboard?.leaves_taken ||
                'Leaves'}
            </Typography>
          </View>
          <Button
            title={
              LocalizedStrings.staffSection?.StaffDashboard?.view_statistics ||
              'View Statistics'
            }
            main_style={styles.smallBtn}
            title_style={styles.btnTextSmall}
            disabled={!staffJobId}
            onPress={() => navigation.navigate('StaffAttendance')}
            style={{ height: 40 }}
          />
        </View>

        <View style={[styles.card, styles.flexCard, styles.summaryCard]}>
          <View style={styles.cardContent}>
            <View style={{
                height: 28,
                width: 28,
                borderRadius: 8,
                backgroundColor: '#FFF0EE',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10,
              }}>
              <Typography type={Font.Poppins_Bold} size={16} color="#D98579">₹</Typography>
            </View>
            <Typography type={Font.Poppins_SemiBold} color="#8C8D8B">
              {LocalizedStrings.staffSection?.StaffDashboard?.earnings_summary ||
                'Earnings Summary'}
            </Typography>
            <Typography type={Font.Poppins_Bold} style={styles.earning}>
              ₹{dataDash?.earnings_summary?.total_earnings || 0}
            </Typography>
            <Typography style={styles.subText}>
              {LocalizedStrings.staffSection?.StaffDashboard
                ?.total_earnings_month || 'Total earnings this month'}
            </Typography>
          </View>
          <Button
            title={
              LocalizedStrings.staffSection?.StaffDashboard?.view_details ||
              'View Details'
            }
            main_style={styles.smallBtn}
            title_style={styles.btnTextSmall}
            disabled={!staffJobId}
            onPress={() => navigation.navigate('EarningSummary', { id: staffJobId })}
            style={{ height: 40 }}
          />
        </View>
      </View>

      <View style={styles.rowBetween}>
        <View style={[styles.card, styles.flexCard, styles.summaryCard]}>
          <View style={styles.cardContent}>
            <Image
              source={ImageConstant.lines}
              style={{
                height: 25,
                width: 20,
                tintColor: '#D98579',
                marginRight: 10,
                marginBottom: 10,
              }}
            />
            <Typography type={Font.Poppins_SemiBold} color="#8C8D8B">
              {LocalizedStrings.staffSection?.StaffDashboard?.leave_requests ||
                'Leave Requests'}
            </Typography>
            <Typography type={Font?.Poppins_Bold}>
              {leaveCount} {LocalizedStrings.LeaveApplications?.LeaveType || 'Leave Type'}
            </Typography>
            <Typography style={styles.subText}>
              {LocalizedStrings.staffSection?.StaffDashboard?.in_last_month ||
                'In Last month'}
            </Typography>
            <Typography style={styles.linkText}>
              {LocalizedStrings.staffSection?.StaffDashboard?.view_history ||
                'View History'}
            </Typography>
          </View>
          <Button
            title={
              LocalizedStrings.staffSection?.StaffDashboard?.apply_leave ||
              'Apply Leave'
            }
            main_style={styles.smallBtn}
            title_style={styles.btnTextSmall}
            disabled={!staffJobId}
            onPress={() => navigation.navigate('ApplyLeave', { houseownerId })}
            style={{ height: 40 }}
          />
        </View>

        <View style={[styles.card, styles.flexCard, styles.summaryCard]}>
          <View style={styles.cardContent}>
            <Image
              source={ImageConstant.Calendar}
              style={{
                height: 25,
                width: 22.5,
                tintColor: '#D98579',
                marginRight: 10,
                marginBottom: 10,
              }}
            />
            <Typography type={Font.Poppins_SemiBold} color="#8C8D8B">
              {LocalizedStrings.staffSection?.StaffDashboard?.new_job_matches ||
                'New Job Matches'}
            </Typography>
            <Typography type={Font.Poppins_Bold}>
              {jobCount} {LocalizedStrings.staffSection?.JobDetails?.title || 'Job Details'}
            </Typography>
            <Typography style={styles.subText}>
              {LocalizedStrings.staffSection?.StaffDashboard?.recommended_jobs ||
                'Recommended jobs based on your profile'}
            </Typography>
          </View>
          <Button
            title={
              LocalizedStrings.staffSection?.StaffDashboard?.view_jobs ||
              'View Jobs'
            }
            main_style={styles.smallBtn}
            title_style={styles.btnTextSmall}
            onPress={() => navigation.navigate('ActiveJob')}
            style={{ height: 40 }}
          />
        </View>
      </View>


      <View style={{ marginTop: 20, marginBottom: 100 }}>
        <Button
          onPress={() => {
            navigation.navigate('AIJobSearch');
          }}
          linerColor={['#D98579', '#C4706A']}
          title={LocalizedStrings.staffSection?.StaffDashboard?.ai_search_jobs || 'AI Search Jobs'}
          main_style={{ width: '100%' }}
        />
      </View>
    </CommanView>
  </View>
  );
};

export default StaffDashboard;

const styles = StyleSheet.create({
  headerTitle: { fontSize: 18 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 5,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: {
    fontSize: 16,
    marginBottom: 4,
  },

  flexCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  summaryCard: {
    minHeight: 220,
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  smallBtn: {
    borderRadius: 8,
    marginTop: 12,
    width: '100%',
  },
  btnTextSmall: {
    fontSize: 12,
    textAlign: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  linkText: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },

  greenText: {
    color: 'green',
    fontSize: 12,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  earning: {
    fontSize: 18,
    color: '#E87C6F',
    marginVertical: 6,
  },
  subText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  alertItem: {
    marginVertical: 5,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
