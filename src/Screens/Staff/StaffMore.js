import { StyleSheet, View, Image, TouchableOpacity, Modal, Switch } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import { isAuth, userDetails } from '../../Redux/action';
import { POST_WITH_TOKEN, GET_WITH_TOKEN } from '../../Backend/Backend';
import { DELETE_ACCOUNT, LOGOUT, StaffAvailabilityUpdate, StaffAvailabilityStatus } from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../Constants/localization';

const StaffMore = ({ navigation }) => {
  const dispatch = useDispatch();
  const userDetail = useSelector(store => store?.userDetails);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isJobSeeking, setIsJobSeeking] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    // Fetch current job seeking status
    GET_WITH_TOKEN(
      StaffAvailabilityStatus,
      res => {
        const status = res?.data?.is_available || res?.data?.is_job_seeking || res?.is_available || false;
        setIsJobSeeking(!!status);
      },
      () => {},
      () => {},
    );
  }, []);

  const handleJobSeekingToggle = (value) => {
    setToggleLoading(true);
    POST_WITH_TOKEN(
      StaffAvailabilityUpdate,
      { is_available: value, is_job_seeking: value },
      res => {
        setToggleLoading(false);
        setIsJobSeeking(value);
        SimpleToast.show(
          value ? 'You are now visible to employers' : 'You are now hidden from job search',
          SimpleToast.SHORT,
        );
      },
      err => {
        setToggleLoading(false);
        SimpleToast.show('Failed to update status. Try again.', SimpleToast.SHORT);
      },
      () => {
        setToggleLoading(false);
        SimpleToast.show('Network error. Try again.', SimpleToast.SHORT);
      },
    );
  };

  // Get user image and name from userDetails
  const imgUrl = userDetail?.image?.toLowerCase() || '';
  const isDefaultImage =
    !userDetail?.image ||
    imgUrl.includes('noimage') ||
    imgUrl.includes('no_image') ||
    imgUrl.includes('no-image') ||
    imgUrl.includes('default') ||
    imgUrl.includes('placeholder');
  const userImage = isDefaultImage
    ? ImageConstant?.user
    : { uri: userDetail.image };
  const userName = userDetail?.first_name && userDetail?.last_name 
    ? `${userDetail.first_name} ${userDetail.last_name}`
    : userDetail?.first_name || userDetail?.name || 'User';
  
  // Get role from work info or default
  const userRole = userDetail?.user_work_info?.primary_role 
    || userDetail?.work_info?.primary_role 
    || LocalizedStrings.SalaryManagement?.staff_member || 'Staff Member';

  // Navigate to Refer & Earn screen
  const handleRefer = () => {
    navigation.navigate('ReferAndEarn');
  };

  // Handle CMS Page Navigation
  const handleCMSPage = (slug) => {
    navigation.navigate('Policy', { slug });
  };

  // Handle Delete Account
  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(false);
    setLoading(true);
    POST_WITH_TOKEN(
      DELETE_ACCOUNT,
      {},
      success => {
        setLoading(false);
        SimpleToast.show(success?.message || LocalizedStrings.Settings?.accountDeletedSuccess || 'Account deleted successfully', SimpleToast.SHORT);
        // Logout user after account deletion
        dispatch(isAuth(false));
        dispatch(userDetails({}));
      },
      error => {
        setLoading(false);
        SimpleToast.show(error?.message || LocalizedStrings.Settings?.accountDeleteFailed || 'Failed to delete account', SimpleToast.SHORT);
      },
      fail => {
        setLoading(false);
        SimpleToast.show(LocalizedStrings.Settings?.networkError || 'Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  // Handle Logout
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setLoading(true);
    POST_WITH_TOKEN(
      LOGOUT,
      {},
      success => {
        setLoading(false);
        SimpleToast.show(LocalizedStrings.Settings?.logoutSuccess || 'Logged out successfully', SimpleToast.SHORT);
        dispatch(isAuth(false));
        dispatch(userDetails({}));
      },
      error => {
        setLoading(false);
        dispatch(isAuth(false));
        dispatch(userDetails({}));
        SimpleToast.show(LocalizedStrings.Settings?.loggedOut || 'Logged out', SimpleToast.SHORT);
      },
      fail => {
        setLoading(false);
        dispatch(isAuth(false));
        dispatch(userDetails({}));
        SimpleToast.show(LocalizedStrings.Settings?.loggedOut || 'Logged out', SimpleToast.SHORT);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.MoreOptions?.title || 'More Options'}
        style_title={{ fontSize: 18 }}
      />

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image source={userImage} style={styles.avatar} />
        <View>
          <Typography type={Font?.Poppins_Medium} size={15}>
            {userName}
          </Typography>
          <Typography type={Font?.Poppins_Regular} size={11}>
            {userRole}
          </Typography>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => {
          navigation?.navigate("EditProfile")
        }}>
          <Typography type={Font?.Poppins_Medium} size={14} color="#D98579">
            {LocalizedStrings.EditProfile?.title || "Edit Profile"}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Job Seeking Toggle */}
      <View style={styles.jobSeekingCard}>
        <View style={{ flex: 1 }}>
          <Typography type={Font?.Poppins_SemiBold} size={14}>
            Looking for a Job
          </Typography>
          <Typography type={Font?.Poppins_Regular} size={12} color="#888">
            {isJobSeeking
              ? 'Visible to employers — they can find you'
              : 'Hidden from job search — turn on to get hired'}
          </Typography>
        </View>
        <Switch
          value={isJobSeeking}
          onValueChange={handleJobSeekingToggle}
          disabled={toggleLoading}
          trackColor={{ false: '#E0E0E0', true: '#D98579' }}
          thumbColor={isJobSeeking ? '#fff' : '#fff'}
        />
      </View>

      {/* Options List */}
      <Typography
        style={{ marginTop: 30 }}
        type={Font?.Poppins_SemiBold}
        size={14}
        color="#D98579"
      >
        {LocalizedStrings.MoreOptions?.account_household || 'Account & Household'}
      </Typography>
      <View style={styles.optionsBox}>
        <Option
           imageStyle={{tintColor:'rgba(140, 141, 139, 1)'}}
          title={LocalizedStrings.MoreOptions?.profile_settings || "Profile & Settings"}
          subtitle={LocalizedStrings.MoreOptions?.manage_personal || 'Manage your personal and household settings'}
          onPress={() => { navigation.navigate("StaffProfileMain") }}
        />

        <Option
          Images={ImageConstant?.ic_bellring}
          title={LocalizedStrings.MoreOptions?.alerts_notifications || "Alerts & Notifications"}
          subtitle={LocalizedStrings.MoreOptions?.view_manage_alerts || 'View and manage your alerts'}
          onPress={() => navigation.navigate('Notifications')}
        />

        <Option
          Images={ImageConstant?.joblisting}
          imageStyle={{tintColor:'rgba(140, 141, 139, 1)'}}
          title={LocalizedStrings.MoreOptions?.job_listings || "Job Listing"}
          subtitle={LocalizedStrings.MoreOptions?.discover_tasks || "See all active job postings"}
          onPress={() => navigation.navigate('JobListing')}
        />

        <Option
          Images={ImageConstant?.Salary}
          title={LocalizedStrings.MoreOptions?.membership || "Membership"}
          imageStyle={{tintColor:'rgba(140, 141, 139, 1)'}}
          subtitle={LocalizedStrings.MoreOptions?.membership_desc || "View and manage your membership plans"}
          onPress={() => navigation.navigate('MemberShip')}
        />
        <Option
          Images={ImageConstant?.Salary}
          title="My Advances"
          imageStyle={{tintColor:'rgba(140, 141, 139, 1)'}}
          subtitle="View advances received and deduction history"
          onPress={() => navigation.navigate('StaffAdvanceView')}
        />
        <Option
          Images={ImageConstant?.lines}
          title="Payment History"
          imageStyle={{tintColor:'rgba(140, 141, 139, 1)'}}
          subtitle="View all salary payments and dates"
          onPress={() => navigation.navigate('StaffPaymentHistory')}
        />
      </View>

      <Typography
        style={{ marginTop: 50 }}
        type={Font?.Poppins_SemiBold}
        size={14}
        color="#D98579"
      >
        {LocalizedStrings.MoreOptions?.app_support || 'App & Support'}
      </Typography>
      <View style={[styles.optionsBox, { marginBottom: 100 }]}>
        <Option
          Images={ImageConstant?.ic_help}
          title={LocalizedStrings.MoreOptions?.help_support || "Help & Support"}
          subtitle={LocalizedStrings.Settings?.helpSubtitle || 'Find answers and contact us'}
          onPress={() => handleCMSPage('help-support')}
        />
        <Option
          Images={ImageConstant?.ic_policy}
          title={LocalizedStrings.MoreOptions?.privacy_policy || "Privacy Policy"}
          subtitle={LocalizedStrings.Settings?.privacyPolicyDesc || 'Understand our data handling practices'}
          onPress={() => handleCMSPage('privacy-policy')}
        />
        <Option
          Images={ImageConstant?.ic_term}
          title={LocalizedStrings.MoreOptions?.terms_service || "Terms of Service"}
          subtitle={LocalizedStrings.Settings?.termsServiceDesc || 'Review app usage agreements'}
          onPress={() => handleCMSPage('terms-of-service')}
        />
        <Option
          Images={ImageConstant?.ic_about}
          title={LocalizedStrings.MoreOptions?.about_app || "About This App"}
          subtitle={LocalizedStrings.Settings?.aboutSubtitle || 'Version 1.2.3'}
          onPress={() => handleCMSPage('about-us')}
        />
        <Option
          Images={ImageConstant?.Users}
          title={LocalizedStrings.Settings?.delete || "Delete Account"}
          imageStyle={{tintColor:'rgba(140, 141, 139, 1)'}}
          subtitle={LocalizedStrings.Settings?.deleteSubtitle || "Permanently remove your account. Data will be kept for records."}
          onPress={handleDeleteAccount}
        />
        <Option
          onPress={handleLogout}
          Images={ImageConstant?.ic_logout}
          isBorder={false}
          title={LocalizedStrings.MoreOptions?.logout || "Log Out"}
          danger={true}
        />
      </View>

      {/* Logout Modal */}
      <Modal
        transparent={true}
        visible={showLogoutModal}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalIconContainer}>
              <Image
                source={ImageConstant?.ic_logout}
                style={styles.modalIcon}
                tintColor="#D98579"
              />
            </View>
            <Typography
              type={Font.Poppins_SemiBold}
              size={20}
              style={styles.modalTitle}
            >
              {LocalizedStrings.Settings?.logout || 'Log Out'}
            </Typography>
            <Typography
              type={Font.Poppins_Regular}
              size={14}
              style={styles.modalMessage}
              color="#666"
            >
              {LocalizedStrings.Settings?.logoutConfirm || 'Are you sure you want to log out?'}
            </Typography>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Typography
                  type={Font.Poppins_Medium}
                  size={16}
                  color="#666"
                >
                  {LocalizedStrings.Settings?.cancel || 'Cancel'}
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={confirmLogout}
                disabled={loading}
              >
                <Typography
                  type={Font.Poppins_Medium}
                  size={16}
                  color="#fff"
                >
                  {loading ? 'Logging out...' : (LocalizedStrings.Settings?.logout || 'Log Out')}
                </Typography>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        transparent={true}
        visible={showDeleteModal}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalIconContainer, { backgroundColor: '#FFF5F5' }]}>
              <Image
                source={ImageConstant?.Users}
                style={styles.modalIcon}
                tintColor="#FF5724"
              />
            </View>
            <Typography
              type={Font.Poppins_SemiBold}
              size={20}
              style={styles.modalTitle}
            >
              {LocalizedStrings.Settings?.accountDeleteTitle || 'Delete Account'}
            </Typography>
            <Typography
              type={Font.Poppins_Regular}
              size={14}
              style={styles.modalMessage}
              color="#666"
            >
              {LocalizedStrings.Settings?.accountDeleteDesc || 'Are you sure you want to delete your account? This action cannot be undone. Data will be kept for records.'}
            </Typography>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Typography
                  type={Font.Poppins_Medium}
                  size={16}
                  color="#666"
                >
                  {LocalizedStrings.Settings?.cancel || 'Cancel'}
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteAccountButton}
                onPress={confirmDeleteAccount}
                disabled={loading}
              >
                <Typography
                  type={Font.Poppins_Medium}
                  size={16}
                  color="#fff"
                >
                  {loading ? 'Deleting...' : ('Delete')}
                </Typography>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </CommanView>
  );
};

const Option = ({
  title,
  subtitle,
  danger,
  isBorder = true,
  Images = ImageConstant?.staff,
  imageStyle,
  onPress
}) => (
  <TouchableOpacity
    style={[styles.optionRow, { borderBottomWidth: isBorder ? 1 : 0 }]}
    onPress={onPress}
  >
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ flex: 0.1, justifyContent: 'center' }}>
        <Image
          source={Images}
          style={{ width: 20, height: 20, ...imageStyle }}
          resizeMode="center"
        />
      </View>
      <View style={{ flex: 0.8 }}>
        <Typography
          style={[styles.optionTitle, danger && { color: '#D98579' }]}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography style={styles.optionSubtitle}>{subtitle}</Typography>
        )}
      </View>
      <View style={{ flex: 0.1, justifyContent: 'center' }}>
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
);

export default StaffMore;

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 12,
    marginVertical: 12,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  role: {
    fontSize: 14,
    color: '#777',
  },
  editBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
  },
  jobSeekingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFF9F8',
  },
  editText: {
    fontSize: 14,
    color: '#F57C63',
  },
  optionsBox: {
    marginTop: 10,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    marginTop: 20,
    marginBottom: 8,
    color: '#999',
  },
  optionRow: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEA',
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: Font?.Poppins_Medium,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#999',
    fontFamily: Font?.Poppins_Regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    width: 35,
    height: 35,
  },
  modalTitle: {
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  logoutButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#D98579',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  deleteAccountButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF5724',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
