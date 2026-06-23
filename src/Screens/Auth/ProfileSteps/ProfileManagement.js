import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { isPlaceholderImage } from '../../../Utils/ImageUtils';
import { Font } from '../../../Constants/Font';
import { useSelector, useDispatch } from 'react-redux';
import { userDetails } from '../../../Redux/action';
import LocalizedStrings from '../../../Constants/localization';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../../Backend/Backend';
import {
  GET_NOTIFICATION_SETTINGS,
  SAVE_NOTIFICATION_SETTINGS,
  PROFILE_UPDATE,
} from '../../../Backend/api_routes';
import { Switch } from 'react-native';
import SimpleToast from 'react-native-simple-toast';
import { useIsFocused } from '@react-navigation/native';

const ProfileManagement = ({ navigation }) => {
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const data = useSelector(state => state?.userDetails);
  const dispatch = useDispatch();
  const isFocused = useIsFocused();

  // Auto Present state
  const [autoPresent, setAutoPresent] = useState(
    data?.auto_attendence === 1 || data?.auto_attendence === '1' || data?.auto_attendence === true
  );
  const [autoPresentLoading, setAutoPresentLoading] = useState(false);

  // Fetch notification settings on component mount
  useEffect(() => {
    if (isFocused) {
      fetchNotificationSettings();
    }
  }, [isFocused]);

  const fetchNotificationSettings = () => {
    setLoading(true);
    GET_WITH_TOKEN(
      GET_NOTIFICATION_SETTINGS,
      success => {
        setLoading(false);
        if (success?.data) {
          // Assuming API returns value as "1" for enabled, "0" for disabled
          // Adjust based on your actual API response structure
          const notificationValue =
            success?.data?.value || success?.data?.notification || '0';
          setSmsAlerts(notificationValue === '1' || notificationValue === 1);
        }
      },
      error => {
        setLoading(false);
      },
      fail => {
        setLoading(false);
      },
    );
  };

  const handleSmsAlertsChange = value => {
    setSmsAlerts(value);
    saveNotificationSettings(value ? '1' : '0');
  };

  const saveNotificationSettings = value => {
    setSaving(true);
    const formData = new FormData();
    formData.append('value', value);

    POST_FORM_DATA(
      SAVE_NOTIFICATION_SETTINGS,
      formData,
      success => {
        setSaving(false);
        SimpleToast.show(
          success?.message || 'Notification settings saved successfully',
          SimpleToast.SHORT,
        );
      },
      error => {
        setSaving(false);
        SimpleToast.show(
          error?.message || 'Failed to save notification settings',
          SimpleToast.SHORT,
        );
      },
      fail => {
        setSaving(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };


  const handleAutoPresentToggle = value => {
    setAutoPresent(value);
    setAutoPresentLoading(true);
    const formData = new FormData();
    formData.append('auto_attendence', value ? 1 : 0);
    formData.append('is_edit', '1');
    POST_FORM_DATA(
      PROFILE_UPDATE,
      formData,
      success => {
        setAutoPresentLoading(false);
        dispatch(userDetails(success?.data));
        SimpleToast.show(
          value ? 'Auto Present enabled' : 'Auto Present disabled',
          SimpleToast.SHORT,
        );
      },
      error => {
        setAutoPresentLoading(false);
        setAutoPresent(!value);
        SimpleToast.show('Failed to update setting', SimpleToast.SHORT);
      },
      fail => {
        setAutoPresentLoading(false);
        setAutoPresent(!value);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.EditProfile?.title || 'Profile'}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        style_title={styles.headerTitle}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <View style={styles.profileWrapper}>
          <View style={{ position: 'relative' }}>
            <Image
              source={
                data?.image && !isPlaceholderImage(data?.image)
                  ? { uri: data?.image }
                  : ImageConstant.user
              }
              style={styles.profileImage}
            />
          </View>

          <Typography type={Font.Poppins_SemiBold} style={styles.profileName}>
            {data?.first_name} {data?.last_name}
          </Typography>
          <Typography style={styles.profileSub}>
            {LocalizedStrings.EditProfile?.Household_Owner || 'Household Owner'}
          </Typography>
        </View>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography
              type={Font.Poppins_SemiBold}
              style={styles.sectionTitle}
            >
              {LocalizedStrings.EditProfile?.Personal_Details ||
                'Personal Details'}
            </Typography>
            <Image source={ImageConstant.person} style={styles.headerIcon} />
          </View>

          <View style={styles.fieldRow}>
            <Typography style={styles.fieldLabel}>
              {LocalizedStrings.EditProfile?.Name || 'Name'}
            </Typography>
            <Typography style={styles.fieldValue}>
              {data?.first_name}
            </Typography>
          </View>

          <View style={styles.fieldRow}>
            <Typography style={styles.fieldLabel}>
              {LocalizedStrings.EditProfile?.Date_of_Birth || 'Date of Birth'}
            </Typography>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={ImageConstant.Calendar}
                style={styles.iconSmall}
                resizeMode="center"
              />
              <Typography style={styles.fieldValue}>{data?.dob}</Typography>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Typography style={styles.fieldLabel}>
              {LocalizedStrings.EditProfile?.Gender || 'Gender'}
            </Typography>
            <Typography style={styles.fieldLabel}>{data?.gender}</Typography>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography
              type={Font.Poppins_SemiBold}
              style={styles.sectionTitle}
            >
              {LocalizedStrings.EditProfile?.Contact_Information ||
                'Contact Information'}
            </Typography>
          </View>

          <View style={styles.fieldRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Typography style={styles.fieldLabel}>
                {' '}
                {LocalizedStrings.EditProfile?.Phone || 'Phone'}
              </Typography>
              <Image
                source={ImageConstant.phone}
                style={[styles.iconSmall, { marginLeft: 7 }]}
              />
            </View>
            <Typography style={styles.fieldValue}>
              {data?.phone_number}
            </Typography>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography
              type={Font.Poppins_SemiBold}
              style={styles.sectionTitle}
            >
              Auto Attendance
            </Typography>
          </View>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Typography type={Font.Poppins_Medium} size={14}>
                Auto Present
              </Typography>
              <Typography type={Font.Poppins_Regular} style={styles.subText}>
                Automatically mark staff as present daily.
              </Typography>
            </View>
            <Switch
              value={autoPresent}
              onValueChange={handleAutoPresentToggle}
              trackColor={{ false: '#EBEBEA', true: '#D98579' }}
              thumbColor={autoPresent ? '#fff' : '#fff'}
              disabled={autoPresentLoading}
            />
          </View>
        </View>

      </ScrollView>
    </CommanView>
  );
};

export default ProfileManagement;

const styles = StyleSheet.create({
  headerTitle: { fontSize: 18 },
  profileWrapper: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: { height: 90, width: 90, borderRadius: 45 },
  profileName: { fontSize: 18, marginTop: 10 },
  profileSub: { fontSize: 14, color: '#666' },
  editIconWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  editIcon: {
    width: 16,
    height: 16,
    tintColor: '#E87C6F',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
  },
  headerIcon: {
    width: 18,
    height: 18,
    tintColor: '#666',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#333',
  },
  fieldValue: {
    fontSize: 14,
    color: '#000',
    marginLeft: 6,
  },
  iconSmall: {
    width: 16,
    height: 16,
    tintColor: '#555',
    marginRight: 7,
  },
  bulletIcon: {
    width: 15,
    height: 15,
    tintColor: '#D98579',
    marginRight: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  subText: {
    fontSize: 12,
    color: '#666',
    width: '80%',
  },
  premiumCard: {
    backgroundColor: 'rgb(234, 234, 234)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
    marginTop: 15,
    // borderWidth: 1,
    // borderColor: '#E87C6F',
  },
  premiumTitle: { fontSize: 16, marginBottom: 5 },
  price: { fontSize: 15, color: '#E87C6F', marginBottom: 10 },
  benefit: { fontSize: 14, marginVertical: 2 },
  planButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  upgradeBtn: { width: '48%' },
  downgradeBtn: { width: '48%' },

  bottomButtons: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
  },
  cancelBtn: {
    width: '45%',
  },
  saveBtn: {
    width: '45%',
  },
  dropdown: {
    marginHorizontal: 0,
    height: 43,
    borderColor: 'white',
    width: 130,
  },
  dropdownText: {
    marginLeft: 10,
    fontFamily: Font.Poppins_Regular,
  },
  dropdownTitle: {
    textAlign: 'left',
    fontFamily: Font.Poppins_Regular,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mail: {
    fontSize: 12,
    color: '#666',
    width: '80%',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  subText: {
    fontSize: 12,
    color: '#666',
    width: '80%',
  },
});
