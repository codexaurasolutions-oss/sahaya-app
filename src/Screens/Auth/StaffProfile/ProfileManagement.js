import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Button from '../../../Component/Button';
import LocalizedStrings from '../../../Constants/localization';

const ProfileManagement = ({ navigation }) => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

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
            <Image source={ImageConstant.user} style={styles.profileImage} />

            {/* Edit Icon Overlay */}
            <TouchableOpacity
              style={styles.editIconWrapper}
              onPress={() => navigation.navigate('ProfileManagementPicture')}
            >
              <Image source={ImageConstant.Camera} style={styles.editIcon} />
            </TouchableOpacity>
          </View>

          <Typography type={Font.Poppins_SemiBold} style={styles.profileName}>
            Sarah Smith
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
              {LocalizedStrings.EditProfile?.Personal_Details || 'Personal Details'}
            </Typography>
            <Image source={ImageConstant.person} style={styles.headerIcon} />
          </View>

          <View style={styles.fieldRow}>
            <Typography style={styles.fieldLabel}>{LocalizedStrings.EditProfile?.Name || 'Name'}</Typography>
            <Typography style={styles.fieldValue}>Sarah</Typography>
          </View>

          <View style={styles.fieldRow}>
            <Typography style={styles.fieldLabel}>{LocalizedStrings.EditProfile?.Date_of_Birth || 'Date of Birth'}</Typography>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={ImageConstant.Calendar} style={styles.iconSmall} resizeMode='center' />
              <Typography style={styles.fieldValue}>1990-07-15</Typography>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Typography style={styles.fieldLabel}>{LocalizedStrings.EditProfile?.Gender || 'Gender'}</Typography>
            <Typography style={styles.fieldLabel}>Male</Typography>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography
              type={Font.Poppins_SemiBold}
              style={styles.sectionTitle}
            >
              {LocalizedStrings.EditProfile?.Contact_Information || 'Contact Information'}
            </Typography>
          </View>

          <View style={styles.fieldRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Typography style={styles.fieldLabel}> {LocalizedStrings.EditProfile?.Phone || 'Phone'}</Typography>
              <Image
                source={ImageConstant.phone}
                style={[styles.iconSmall, { marginLeft: 7 }]}
              />
            </View>
            <Typography style={styles.fieldValue}>+1 (555) 123-4567</Typography>
          </View>

          <View style={styles.fieldRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Typography style={styles.fieldLabel}> {LocalizedStrings.EditProfile?.Email || 'Email'}</Typography>
              <Image
                source={ImageConstant.mail}
                style={[styles.iconSmall, { marginLeft: 7 }]}
              />
            </View>
            <Typography style={styles.fieldValue}>
              sarah.smith@gmail.com
            </Typography>
          </View>
        </View>

        <View style={styles.card}>
          <Typography type={Font.Poppins_SemiBold} style={styles.sectionTitle}>
            {LocalizedStrings.EditProfile?.Notification_Preferences || 'Notification Preferences'}
          </Typography>

          <View style={styles.toggleRow}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '50%',
              }}
            >
              <Image
                source={ImageConstant.ic_bellring}
                style={styles.iconSmall}
              />
              <View>
                <Typography style={styles.benefit}>{LocalizedStrings.EditProfile?.Email_Alerts || 'Email Alerts'}</Typography>
                <Typography style={styles.mail}>
                  {LocalizedStrings.EditProfile?.Email_Alerts_Desc || 'Receive updates and offers via email.'}
                </Typography>
              </View>
            </View>
            <Switch
              value={emailAlerts}
              onValueChange={setEmailAlerts}
              trackColor={{ false: '#ccc', true: '#E87C6F' }}
              thumbColor={'#fff'}
            />
          </View>

          {/* SMS Alerts - commented out
          <View style={styles.toggleRow}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '50%',
              }}
            >
              <Image source={ImageConstant.mail} style={styles.iconSmall} />
              <View>
                <Typography style={styles.benefit}>{LocalizedStrings.EditProfile?.SMS_Alerts || 'SMS Alerts'}</Typography>
                <Typography style={styles.subText}>
                  {LocalizedStrings.EditProfile?.SMS_Alerts_Desc || 'Get important notifications via text message.'}
                </Typography>
              </View>
            </View>
            <Switch
              value={smsAlerts}
              onValueChange={setSmsAlerts}
              trackColor={{ false: '#ccc', true: '#E87C6F' }}
              thumbColor={'#fff'}
            />
          </View>
          */}
        </View>

        <View style={styles.premiumCard}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Typography
                type={Font.Poppins_SemiBold}
                style={styles.premiumTitle}
              >
                {LocalizedStrings.EditProfile?.Premium_Household || 'Premium Household'}
              </Typography>
              <Typography style={styles.price}>₹15.99 / month</Typography>
            </View>
            <Image
              source={ImageConstant.win}
              style={{ height: 30, width: 19 }}
            />
          </View>
          <Typography type={Font.Poppins_light} style={{ marginVertical: 10 }}>
            Access to all premium features including advanced scheduling and
            multi-device sync.
          </Typography>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={ImageConstant.correct} style={styles.bulletIcon} />
            <Typography style={styles.benefit}>
              {' '}
              {LocalizedStrings.EditProfile?.Unlimited_Members || 'Unlimited household members'}
            </Typography>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={ImageConstant.correct} style={styles.bulletIcon} />
            <Typography style={styles.benefit}>
              {' '}
              {LocalizedStrings.EditProfile?.Priority_Support || 'Priority customer support'}
            </Typography>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={ImageConstant.correct} style={styles.bulletIcon} />
            <Typography style={styles.benefit}>
              {' '}
              {LocalizedStrings.EditProfile?.Exclusive_Content || 'Exclusive content library'}
            </Typography>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={ImageConstant.correct} style={styles.bulletIcon} />
            <Typography style={styles.benefit}> {LocalizedStrings.EditProfile?.Ad_Free || 'Ad-free experience'}</Typography>
          </View>

          <View style={styles.planButtons}>
            <Button title={LocalizedStrings.EditProfile?.Upgrade_Plan || 'Upgrade Plan'} main_style={styles.upgradeBtn} />
            <Button title={LocalizedStrings.EditProfile?.Downgrade || 'Downgrade'} main_style={styles.downgradeBtn} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <Button title={LocalizedStrings.EditProfile?.Cancel || 'Cancel'} main_style={styles.cancelBtn} />
        <Button
          title={LocalizedStrings.EditProfile?.Save_Changes || 'Save Changes'}
          main_style={styles.saveBtn}
          onPress={() => navigation.navigate('SuccessStaffScreen')}
        />
      </View>
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
    tintColor: '#E87C6F', // ya tumhare theme ka primary color
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
    backgroundColor: '#FFF5F3',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#E87C6F',
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
});
