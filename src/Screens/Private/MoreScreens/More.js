import { StyleSheet, View, Image, TouchableOpacity, Modal } from 'react-native';
import React, { useState, useCallback } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import { isAuth, userDetails } from '../../../Redux/action';
import { useDispatch, useSelector } from 'react-redux';
import { POST_WITH_TOKEN, GET_WITH_TOKEN } from '../../../Backend/Backend';
import { DELETE_ACCOUNT, LOGOUT, PROFILE } from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../../Constants/localization';
import Button from '../../../Component/Button';
import { useFocusEffect } from '@react-navigation/native';

const More = ({ navigation }) => {
  const dispatch = useDispatch();
  const userDetail = useSelector(state => state?.userDetails);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch profile data when screen is focused
  useFocusEffect(
    useCallback(() => {
      GET_WITH_TOKEN(
        PROFILE,
        success => {
          if (success?.data) {
            dispatch(userDetails(success?.data?.added_by_user || success?.data));
          }
        },
        () => {},
        () => {},
      );
    }, [dispatch]),
  );

  // Navigate to Refer & Earn screen
  const handleRefer = () => {
    navigation.navigate('ReferAndEarn');
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
        SimpleToast.show(success?.message || 'Account deleted successfully', SimpleToast.SHORT);
        // Logout user after account deletion
        dispatch(isAuth(false));
        dispatch(userDetails({}));
      },
      error => {
        setLoading(false);
        SimpleToast.show(error?.message || 'Failed to delete account', SimpleToast.SHORT);
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  // Handle CMS Page Navigation
  const handleCMSPage = (slug) => {
    navigation.navigate('Policy', { slug });
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
        SimpleToast.show('Logged out successfully', SimpleToast.SHORT);
        // Clear auth state and user details
        dispatch(isAuth(false));
        dispatch(userDetails({}));
      },
      error => {
        setLoading(false);
        // Even if API fails, logout locally
        dispatch(isAuth(false));
        dispatch(userDetails({}));
        SimpleToast.show('Logged out', SimpleToast.SHORT);
      },
      fail => {
        setLoading(false);
        // Even if network fails, logout locally
        dispatch(isAuth(false));
        dispatch(userDetails({}));
        SimpleToast.show('Logged out', SimpleToast.SHORT);
      },
    );
  };
  return (
    <CommanView>
      <HeaderForUser title={LocalizedStrings.MoreOptions.title} style_title={{ fontSize: 18 }} />

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image
          source={
            userDetail?.image &&
              !userDetail?.image?.toLowerCase()?.includes('noimage') &&
              !userDetail?.image?.toLowerCase()?.includes('default') &&
              !userDetail?.image?.toLowerCase()?.includes('placeholder')
              ? { uri: userDetail?.image }
              : ImageConstant.user
          }
          style={styles.avatar}
        />
        <View>
          <Typography type={Font?.Poppins_Medium} size={15}>
            {userDetail?.first_name} {userDetail?.last_name}
          </Typography>
          <Typography type={Font?.Poppins_Regular} size={11}>
            {LocalizedStrings.MoreOptions.household_owner}
          </Typography>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => {
            navigation?.navigate('HouseholdProfile');
          }}
        >
          <Typography type={Font?.Poppins_Medium} size={14} color="#D98579">
            {LocalizedStrings.MoreOptions.edit_profile}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Options List */}
      <Typography
        style={{ marginTop: 30 }}
        type={Font?.Poppins_SemiBold}
        size={14}
        color="#D98579"
      >
        {LocalizedStrings.MoreOptions.account_household}
      </Typography>
      <View style={styles.optionsBox}>
        <Option
          title={LocalizedStrings.MoreOptions.profile_settings}
          subtitle={LocalizedStrings.MoreOptions.manage_personal}
          onPress={() => {
            navigation.navigate('ProfileManagement');
          }}
        />
        <Option
          Images={ImageConstant?.Briefcase}
          onPress={() => {
            navigation.navigate('MyJobPosting');
          }}
          title={LocalizedStrings.MoreOptions.job_listings}
          subtitle={LocalizedStrings.MoreOptions.discover_tasks}
        />
        <Option
          Images={ImageConstant?.ic_bellring}
          title={LocalizedStrings.MoreOptions.alerts_notifications}
          subtitle={LocalizedStrings.MoreOptions.view_manage_alerts}
          onPress={() => navigation.navigate('Notification')}
        />
        <Option
          Images={ImageConstant?.staff}
          isBorder={true}
          title={LocalizedStrings.MoreOptions.account_access}
          subtitle={LocalizedStrings.MoreOptions.add_manage_family}
          onPress={() =>
            navigation.navigate('FamilyMembers', { backScreen: 'More' })
          }
        />
        <Option
          Images={ImageConstant?.Salary}
          isBorder={true}
          title={LocalizedStrings.MoreOptions.leave_applications || 'Leave Applications'}
          subtitle={LocalizedStrings.MoreOptions.leave_applications_subtitle || 'Staff Leave Applications'}
          onPress={() => navigation.navigate('Leave')}
        />

        <Option
          Images={ImageConstant?.Calendar}
          isBorder={true}
          title={LocalizedStrings.MoreOptions.attendance_statistics || 'Attendance Statistics'}
          subtitle={LocalizedStrings.MoreOptions.attendance_statistics_subtitle || 'Staff Attendance'}
          onPress={() => navigation.navigate('AttendanceScreen')}
        />
        <Option
          Images={ImageConstant?.Dollar}
          title={LocalizedStrings.MoreOptions.membership || 'Membership'}
          subtitle={LocalizedStrings.MoreOptions.membership_subtitle || 'View and manage your membership'}
          onPress={() => navigation.navigate('HouseholdManager')}
        />
        <Option
          Images={ImageConstant?.Location}
          isBorder={true}
          title={'My Addresses'}
          subtitle={'Manage your saved addresses'}
          onPress={() => navigation.navigate('ManageAddresses')}
        />
        <Option
          Images={ImageConstant?.lines}
          isBorder={true}
          title={'Payment History'}
          subtitle={'View all salary payments and dates'}
          onPress={() => navigation.navigate('RecentSalaryList')}
        />
      </View>

      <Typography
        style={{ marginTop: 50 }}
        type={Font?.Poppins_SemiBold}
        size={14}
        color="#D98579"
      >
        {LocalizedStrings.MoreOptions.app_support}
      </Typography>
      <View style={[styles.optionsBox, { marginBottom: 100 }]}>
        <Option
          Images={ImageConstant?.ic_help}
          title={LocalizedStrings.MoreOptions.help_support}
          subtitle={LocalizedStrings.MoreOptions.find_answers}
          onPress={() => handleCMSPage('help-support')}
        />
        <Option
          Images={ImageConstant?.ic_policy}
          title={LocalizedStrings.MoreOptions.privacy_policy}
          subtitle={LocalizedStrings.MoreOptions.data_practices}
          onPress={() => handleCMSPage('privacy-policy')}
        />
        <Option
          Images={ImageConstant?.ic_term}
          title={LocalizedStrings.MoreOptions.terms_service}
          subtitle={LocalizedStrings.MoreOptions.review_agreements}
          onPress={() => handleCMSPage('terms-of-service')}
        />
        <Option
          Images={ImageConstant?.ic_about}
          title={'App Update'}
          subtitle={'Download latest production build'}
          onPress={() => navigation.navigate('AppUpdate')}
        />
        <Option
          Images={ImageConstant?.ic_about}
          title={LocalizedStrings.MoreOptions.about_app}
          subtitle={LocalizedStrings.MoreOptions.version + ' 1.2.3'}
          onPress={() => handleCMSPage('about-us')}
        />
        <Option
          Images={ImageConstant?.Users}
          title={LocalizedStrings.Settings.delete}
          subtitle={LocalizedStrings.Settings.deleteSubtitle}
          onPress={handleDeleteAccount}
          imageStyle={{ tintColor: 'rgba(140, 141, 139, 1)' }}
        />
        <Option
          onPress={handleLogout}
          Images={ImageConstant?.ic_logout}
          isBorder={false}
          title={LocalizedStrings.MoreOptions.logout}
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
              {LocalizedStrings.MoreOptions.logout || 'Log Out'}
            </Typography>
            <Typography
              type={Font.Poppins_Regular}
              size={14}
              style={styles.modalMessage}
              color="#666"
            >
              {LocalizedStrings.Settings.logoutConfirm || 'Are you sure you want to log out?'}
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
                  {LocalizedStrings.Settings.cancel || 'Cancel'}
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
                  {loading ? 'Logging out...' : (LocalizedStrings.MoreOptions.logout || 'Log Out')}
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
              {LocalizedStrings.Settings.accountDeleteTitle || 'Delete Account'}
            </Typography>
            <Typography
              type={Font.Poppins_Regular}
              size={14}
              style={styles.modalMessage}
              color="#666"
            >
              {LocalizedStrings.Settings.accountDeleteDesc || 'Are you sure you want to delete your account? This action cannot be undone. Data will be kept for records.'}
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
                  {LocalizedStrings.Settings.cancel || 'Cancel'}
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteAccountButton]}
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
  onPress,
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

export default More;

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
