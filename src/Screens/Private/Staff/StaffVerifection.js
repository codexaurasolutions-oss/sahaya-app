import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import HeaderForUser from '../../../Component/HeaderForUser';
import Button from '../../../Component/Button';
import { ImageConstant } from '../../../Constants/ImageConstant';
import SimpleModal from './../../../Component/UI/SimpleModal';
import { OtpInput } from 'react-native-otp-entry';
import LocalizedStrings from '../../../Constants/localization';
import { POST_FORM_DATA } from '../../../Backend/Backend';
import { AADHAR_SAVE, AADHAR_VERFIY } from '../../../Backend/api_routes';

const buildSafeStaffPayload = (baseUser = {}, verifiedUser = {}) => {
  const nextUser = verifiedUser && typeof verifiedUser === 'object' ? verifiedUser : {};
  const prevUser = baseUser && typeof baseUser === 'object' ? baseUser : {};

  return {
    id: nextUser?.id || prevUser?.id,
    user_id: nextUser?.user_id || prevUser?.user_id,
    name: nextUser?.name || prevUser?.name,
    first_name: nextUser?.first_name || prevUser?.first_name,
    last_name: nextUser?.last_name || prevUser?.last_name,
    email: nextUser?.email || prevUser?.email,
    phone_number:
      nextUser?.phone_number ||
      nextUser?.mobile_number ||
      prevUser?.phone_number ||
      prevUser?.mobile_number,
    phone_number_prefix:
      nextUser?.phone_number_prefix ||
      nextUser?.phone_number_country_code ||
      prevUser?.phone_number_prefix ||
      prevUser?.phone_number_country_code,
    gender: nextUser?.gender || prevUser?.gender,
    dob: nextUser?.dob || prevUser?.dob,
    aadhar_number: nextUser?.aadhar_number || prevUser?.aadhar_number,
    aadhar__verify:
      nextUser?.aadhar__verify !== undefined
        ? nextUser?.aadhar__verify
        : prevUser?.aadhar__verify,
    image: nextUser?.image || prevUser?.image,
    upi_id: nextUser?.upi_id || prevUser?.upi_id,
    addresses: Array.isArray(nextUser?.addresses)
      ? nextUser.addresses
      : Array.isArray(prevUser?.addresses)
        ? prevUser.addresses
        : [],
    user_work_info:
      nextUser?.user_work_info ||
      nextUser?.userWorkInfo ||
      prevUser?.user_work_info ||
      prevUser?.userWorkInfo ||
      null,
    kyc_information:
      nextUser?.kyc_information ||
      nextUser?.kycInformation ||
      prevUser?.kyc_information ||
      prevUser?.kycInformation ||
      null,
    aadhar_front:
      nextUser?.aadhar_front ||
      nextUser?.aadhaar_front ||
      prevUser?.aadhar_front ||
      prevUser?.aadhaar_front ||
      null,
    aadhar_back:
      nextUser?.aadhar_back ||
      nextUser?.aadhaar_back ||
      prevUser?.aadhar_back ||
      prevUser?.aadhaar_back ||
      null,
    verification_certificate:
      nextUser?.verification_certificate ||
      prevUser?.verification_certificate ||
      null,
  };
};

const StaffVerifection = ({ navigation, route }) => {
  const userData = route?.params?.userData;
  const adharNumber = route?.params?.adharNumber;

  const [otp, setOtp] = useState('');
  const [Verify, setVerify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const last4 = adharNumber?.slice(-4) || '****';

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleResend = () => {
    if (resendTimer > 0) return;
    setOtpError('');

    const body = {
      aadhar_number: adharNumber,
      is_staff_add: 1,
    };

    POST_FORM_DATA(
      AADHAR_SAVE,
      body,
      success => {
        setResendTimer(60);
        setOtpError('');
      },
      error => {
        setOtpError(
          error?.data?.errors?.aadhar_number
            ? error.data.errors.aadhar_number[0]
            : error?.data?.message || 'Failed to resend OTP',
        );
      },
      fail => {
        setOtpError('Network error. Please try again.');
      },
    );
  };

  const handleVerify = () => {
    if (otp.length !== 6) {
      setOtpError(
        LocalizedStrings.AddStaff?.OTP_Placeholders ||
          'Please enter a valid 6-digit OTP',
      );
      return;
    }

    setOtpError('');
    setLoading(true);

    let data = new FormData();
    data.append('otp', otp);
    // Send user_id if available (try both field names from API response)
    const userId = userData?.user_id || userData?.id;
    if (userId) {
      data.append('user_id', userId);
    }
    data.append('aadhar_number', adharNumber);
    data.append('is_staff_add', 1);

    POST_FORM_DATA(
      AADHAR_VERFIY,
      data,
      success => {
        setLoading(false);
        const verifiedUser = success?.data?.user || success?.user || null;
        const mergedUserData = buildSafeStaffPayload(userData, verifiedUser);
        navigation.navigate('NewStaffFrom', {
          adharNumber: adharNumber,
          userData: mergedUserData,
        });
      },
      error => {
        setLoading(false);
        if (error?.data?.message) {
          setOtpError(error?.data?.message);
        } else if (error?.data?.error) {
          setOtpError(error?.data?.error);
        } else if (error?.message) {
          setOtpError(error.message);
        } else {
          setOtpError(error?.error || 'Invalid OTP. Please try again.');
        }
      },
      fail => {
        setLoading(false);
        setOtpError('Something went wrong. Please try again.');
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.AddStaff.title}
        style_title={styles.headerTitle}
        containerStyle={styles.headerContainer}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => {
          navigation?.goBack();
        }}
      />
      <View style={styles.card}>
        <Typography type={Font?.Poppins_SemiBold} style={styles.otpTitle}>
          {LocalizedStrings.AddStaff.Verify}
        </Typography>
        <Typography type={Font?.Poppins_Regular} style={styles.otpDesc}>
          {LocalizedStrings.AddStaff.Description}
          {last4}
        </Typography>

        <OtpInput
          numberOfDigits={6}
          focusColor="#D98579"
          onTextChange={text => {
            setOtp(text);
            if (otpError) {
              setOtpError('');
            }
          }}
          textInputProps={{
            keyboardType: 'number-pad',
          }}
          theme={{
            containerStyle: { marginTop: 20, marginBottom: 20 },
            pinCodeContainerStyle: {
              borderWidth: 1,
              borderColor: otpError ? 'red' : '#ccc',
              borderRadius: 8,
            },
            pinCodeTextStyle: {
              fontSize: 18,
              fontFamily: Font?.Poppins_Medium,
              color: '#000',
            },
          }}
        />

        {/* Error Message */}
        {otpError ? (
          <Typography
            size={12}
            color="red"
            style={{ textAlign: 'center', marginBottom: 10 }}
          >
            {otpError}
          </Typography>
        ) : null}

        <TouchableOpacity
          onPress={handleResend}
          disabled={resendTimer > 0}
          style={{ alignSelf: 'center' }}
        >
          {resendTimer > 0 ? (
            <Typography
              type={Font?.Poppins_Regular}
              size={14}
              color="#999"
              style={{ marginTop: 10, marginBottom: 20 }}
            >
              {LocalizedStrings.AddStaff.Resend_Text} {resendTimer}s
            </Typography>
          ) : (
            <Typography
              type={Font?.Poppins_Regular}
              style={{ marginTop: 10, marginBottom: 20 }}
            >
              {LocalizedStrings.AddStaff.Resend_Text.split('?')[0]}?{' '}
              <Typography type={Font?.Poppins_Regular} style={styles.resend}>
                {LocalizedStrings.AadhaarOTPVerification?.resend || 'Resend'}
              </Typography>
            </Typography>
          )}
        </TouchableOpacity>

        <Button
          onPress={handleVerify}
          title={LocalizedStrings.AddStaff.Verify_Add_Staff}
          main_style={styles.buttonStyle}
          icon={ImageConstant?.Arrow}
          loader={loading}
        />
      </View>
      <SimpleModal visible={Verify}>
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ padding: 40 }}>
            <Image
              source={ImageConstant?.ic_success}
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
            />
          </View>
          <Typography
            size={20}
            type={Font?.Poppins_SemiBold}
            textAlign={'center'}
          >
            {LocalizedStrings.StaffAddedSuccess.Title}
          </Typography>
          <Typography
            size={16}
            type={Font?.Poppins_Regular}
            textAlign={'center'}
            color="#8C8D8B"
            style={{ marginTop: 30 }}
          >
            {LocalizedStrings.StaffAddedSuccess.Message}
          </Typography>
          <Button
            title={LocalizedStrings.StaffAddedSuccess.Done}
            onPress={() => navigation.navigate('TabNavigation')}
            main_style={{ marginTop: 20, width: '100%' }}
            icon={ImageConstant?.Arrow}
          />
        </View>
      </SimpleModal>
    </CommanView>
  );
};

export default StaffVerifection;

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileWrapper: {
    alignItems: 'center',
    marginVertical: 0,
  },
  profileImage: {
    height: 90,
    width: 90,
    borderRadius: 45,
    alignSelf: 'flex-end',
  },
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
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EBEBEA',
    flex: 0.5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    marginTop: 5,
    marginBottom: 5,
  },
  role: {
    fontSize: 14,
    color: '#8C8D8B',
    marginBottom: 30,
  },
  info: {
    fontSize: 14,
    color: 'black',
    marginVertical: 2,
  },
  otpTitle: {
    // marginTop: 100,
    alignContent: 'center',
    fontSize: 16,
  },
  otpDesc: {
    textAlign: 'center',
    color: '#8C8D8B',
    marginTop: 6,
    marginBottom: 10,
    fontSize: 13,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  otpBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 18,
    width: 40,
    height: 50,
    marginHorizontal: 5,
  },
  resend: {
    color: '#f15a29',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonStyle: {
    width: '100%',
  },
});
