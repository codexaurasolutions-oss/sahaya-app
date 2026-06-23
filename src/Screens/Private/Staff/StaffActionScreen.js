import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';
import SimpleToast from 'react-native-simple-toast';
import { API } from '../../../Backend/Backend';
import { isPlaceholderImage } from '../../../Utils/ImageUtils';

const getProfileImage = (img) => {
  if (!img || isPlaceholderImage(img)) return null;
  if (typeof img === 'string' && img.startsWith('http')) return img;
  const baseUrl = (API && typeof API === 'string') ? API.replace('/api/', '') : '';
  return `${baseUrl}${img}`;
};

const StaffActionScreen = ({ navigation, route }) => {
  const staff = route?.params?.staff || {};
  
  // Resolve image and name exactly like HouseHoldStaffProfile
  const profileImageUrl = getProfileImage(staff?.image) || getProfileImage(staff?.staff?.image) || getProfileImage(staff?.user?.image);
  const fullName = `${staff?.first_name || ''} ${staff?.last_name || ''}`.trim() || staff?.name || 'Staff';
  
  const workInfo = staff?.user_work_info || staff?.work_info || staff?.staff?.user_work_info || {};
  let displayRole = 'Staff';
  if (Array.isArray(workInfo?.primary_role) && workInfo.primary_role.length > 0) {
    displayRole = workInfo.primary_role.join(', ');
  } else if (typeof workInfo?.primary_role === 'string') {
    displayRole = workInfo.primary_role;
  } else if (staff?.role) {
    displayRole = staff.role;
  }

  const handleCall = () => {
    const number = staff?.phone_number || staff?.staff?.phone_number;
    if (!number) {
      SimpleToast.show('Phone number not available', SimpleToast.SHORT);
      return;
    }
    Linking.openURL(`tel:+91${number}`);
  };

  const openWhatsApp = async () => {
    const number = staff?.phone_number || staff?.staff?.phone_number;
    if (!number) {
      SimpleToast.show('Phone number not available', SimpleToast.SHORT);
      return;
    }
    const phone = number.replace(/\D/g, '');
    const url = `whatsapp://send?phone=91${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      SimpleToast.show('WhatsApp not installed', SimpleToast.SHORT);
      return;
    }
    Linking.openURL(url);
  };

  const navigateToProfile = () => {
    navigation.navigate('HouseHoldStaffProfile', { item: staff });
  };

  const navigateToSalary = () => {
    const staffId = staff?.id || staff?.staff?.id;
    const name = fullName;
    navigation.navigate('Salary', { staffId: staffId, staffName: name });
  };

  const navigateToAttendance = () => {
    const staffId = staff?.id || staff?.staff?.id;
    const name = fullName;
    navigation.navigate('AttendanceScreen', { staffId: staffId, staffName: name });
  };

  const navigateToTerminate = () => {
    // We can navigate to the full profile which contains the terminate modal, 
    // or we can build a standalone terminate logic here.
    // The user said: "terminate staff okkey woah terminat wallai sai connect hoga"
    // Let's pass a param to HouseHoldStaffProfile to auto-open terminate modal
    navigation.navigate('HouseHoldStaffProfile', { item: staff, autoOpenTerminate: true });
  };

  return (
    <CommanView>
      <HeaderForUser
        title="Staff Options"
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        source_logo={ImageConstant?.notification}
        onPressRightIcon={() => navigation.navigate('Notification')}
      />

      <View style={styles.container}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={profileImageUrl ? { uri: profileImageUrl } : ImageConstant.user} 
              style={styles.avatar} 
            />
            {/* View Profile Button on top right of the avatar area */}
            <TouchableOpacity style={styles.viewProfileBtn} onPress={navigateToProfile}>
              <Typography size={12} color="#D98579" type={Font.Poppins_Medium}>View Profile</Typography>
            </TouchableOpacity>
          </View>
          
          <Typography size={22} type={Font.Poppins_SemiBold} style={{ marginTop: 15 }}>
            {fullName}
          </Typography>
          <Typography size={14} type={Font.Poppins_Regular} color="#666">
            {displayRole}
          </Typography>

          {/* Call & WhatsApp Buttons */}
          <View style={styles.communicationRow}>
            <TouchableOpacity style={styles.commBtn} onPress={handleCall}>
              <Image source={ImageConstant.phone} style={styles.commIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.commBtn} onPress={openWhatsApp}>
              <Image source={ImageConstant.WhatsApp} style={[styles.commIcon, { tintColor: null }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionSection}>
          <Typography size={18} type={Font.Poppins_SemiBold} style={{ marginBottom: 15, marginLeft: 5 }}>
            Quick Actions
          </Typography>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToSalary}>
            <View style={[styles.iconWrapper, { backgroundColor: '#E0F2FE' }]}>
              <Typography size={20} color="#0284C7" type={Font.Poppins_Bold}>₹</Typography>
            </View>
            <View style={styles.actionTextWrapper}>
              <Typography size={16} type={Font.Poppins_Medium}>Pay Salary</Typography>
              <Typography size={12} type={Font.Poppins_Regular} color="#888">Manage advances and monthly pay</Typography>
            </View>
            <Image source={ImageConstant.Arrow} style={styles.arrowIcon} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToAttendance}>
            <View style={[styles.iconWrapper, { backgroundColor: '#DCFCE7' }]}>
              <Image source={ImageConstant.date} style={[styles.actionIcon, { tintColor: '#16A34A' }]} />
            </View>
            <View style={styles.actionTextWrapper}>
              <Typography size={16} type={Font.Poppins_Medium}>Attendance Statistics</Typography>
              <Typography size={12} type={Font.Poppins_Regular} color="#888">View and mark daily attendance</Typography>
            </View>
            <Image source={ImageConstant.Arrow} style={styles.arrowIcon} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToTerminate}>
            <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
              <Image source={ImageConstant.close} style={[styles.actionIcon, { tintColor: '#DC2626' }]} />
            </View>
            <View style={styles.actionTextWrapper}>
              <Typography size={16} type={Font.Poppins_Medium}>Terminate Staff</Typography>
              <Typography size={12} type={Font.Poppins_Regular} color="#888">Remove staff and settle dues</Typography>
            </View>
            <Image source={ImageConstant.Arrow} style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </CommanView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: '#D98579',
  },
  viewProfileBtn: {
    position: 'absolute',
    top: 0,
    right: 20,
    backgroundColor: '#FFF0EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D98579',
  },
  communicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 20,
  },
  commBtn: {
    width: 120,
    height: 45,
    borderWidth: 1,
    borderColor: '#D98579',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  commIcon: {
    width: 22,
    height: 22,
    tintColor: '#D98579',
    resizeMode: 'contain',
  },
  actionSection: {
    paddingHorizontal: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  actionTextWrapper: {
    flex: 1,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: '#ccc',
    transform: [{ rotate: '180deg' }],
  },
});

export default StaffActionScreen;
