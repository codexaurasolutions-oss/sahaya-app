import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import CommanView from '../../Component/CommanView';
import Header from '../../Component/Header';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import { OtpInput } from 'react-native-otp-entry';
import { useDispatch } from 'react-redux';
import { isAuth, Token, userDetails, userType } from '../../Redux/action';
import { POST, GET_WITH_TOKEN } from './../../Backend/Backend';
import { VERIFY_OTP, RESEND_OTP, SUBSCRIPTION_USER_CURRENT, PROFILE } from './../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../Constants/localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Otp = ({ navigation, route }) => {
  const { type, aadhaar, mobile, countryCode, user_id } = route?.params;
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30); // 30 sec timer
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const dispatch = useDispatch();

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


  // Send OTP function (used for auto-send and resend)
  const sendOTP = () => {
    if (!mobile || !countryCode) {
      SimpleToast.show(
        LocalizedStrings.Auth?.mobile_required ||
        'Mobile number not found. Please try again.',
        SimpleToast.SHORT,
      );
      return;
    }
    setIsLoading(true);
    setOtpError('');
    var formdata = new FormData();
    formdata.append('phone_number', mobile);
    formdata.append('country_code', countryCode);

    POST(
      RESEND_OTP,
      formdata,
      response => {
        setIsLoading(false);
        SimpleToast.show(
          response?.message ||
          response?.msg ||
          LocalizedStrings.Auth?.otp_message ||
          'OTP sent successfully!',
          SimpleToast.SHORT,
        );
        setResendTimer(30);
      },
      error => {
        setIsLoading(false);
        if (error?.data?.message) {
          setOtpError(error?.data?.message);
        } else if (error?.message) {
          setOtpError(error.message);
        } else {
          setOtpError(
            'Failed to send OTP. Please try again.',
          );
        }
      },
    );
  };

  // Resend OTP function
  const handleResend = () => {
    sendOTP();
  };

  // Fetch full profile before proceeding (returning users need complete data for navigation)
  const fetchProfileAndProceed = (roleId) => {
    GET_WITH_TOKEN(
      PROFILE,
      (success) => {
        if (success?.data) {
          dispatch(userDetails(success.data));
          dispatch(userType(success.data?.user_role_id || roleId));
        }
        checkSubscriptionAndProceed(roleId);
      },
      () => {
        // On error, proceed with what we have
        checkSubscriptionAndProceed(roleId);
      },
      () => {
        checkSubscriptionAndProceed(roleId);
      },
    );
  };

  // Check if user has an active subscription, then proceed accordingly.
  // Staff (roleId === 2) are routed through ChoosePlan with autoFreeOnMount so the
  // free plan is silently activated and they land on the referral screen.
  const checkSubscriptionAndProceed = (roleId) => {
    GET_WITH_TOKEN(
      SUBSCRIPTION_USER_CURRENT,
      (success) => {
        setIsLoading(false);
        const subscription = success?.data || success?.subscription;
        const hasActiveSubscription = success?.is_active &&
          subscription &&
          (Array.isArray(subscription) ? subscription.length > 0 : true);

        if (hasActiveSubscription) {
          // User already has an active subscription, go to app
          dispatch(isAuth(true));
        } else {
          // No active subscription, show plan selection
          navigation?.navigate('ChoosePlan', { userType: roleId, autoFreeOnMount: String(roleId) === '2' });
        }
      },
      (error) => {
        setIsLoading(false);
        // On error checking subscription, show plan selection to be safe
        navigation?.navigate('ChoosePlan', { userType: roleId, autoFreeOnMount: String(roleId) === '2' });
      },
      () => {
        setIsLoading(false);
        navigation?.navigate('ChoosePlan', { userType: roleId, autoFreeOnMount: String(roleId) === '2' });
      },
    );
  };

  // Verify OTP function
  const handleVerify = async () => {
    const FcmToken = await AsyncStorage.getItem('fcm_token');

    if (otp.length !== 6) {
      setOtpError(
        LocalizedStrings.Auth?.otp_placeholder ||
        LocalizedStrings.AddStaff?.OTP_Placeholders ||
        LocalizedStrings.Auth?.mobile_invalid ||
        'Please enter a valid 6-digit OTP',
      );
      return;
    }

    if (!mobile || !countryCode) {
      SimpleToast.show(
        LocalizedStrings.Auth?.mobile_required ||
        'Mobile number not found. Please try again.',
        SimpleToast.SHORT,
      );
      return;
    }
    setIsLoading(true);
    setOtpError('');
    var formdata = new FormData();
    formdata?.append('otp', otp);
    formdata?.append('user_id', user_id);
    formdata?.append('device_token', FcmToken);
    formdata?.append(
      'device_type',
      Platform.OS == 'android' ? 'android' : 'ios',
    );

    console.log('Sending OTP:', otp, 'Length:', otp.length);
    console.log('-----formdata-----', formdata);

    POST(
      VERIFY_OTP,
      formdata,
      async response => {
        await dispatch(Token(response?.token));
        console.log('OTP', response);
        if (response) {
          dispatch(userDetails(response?.user));
          dispatch(userType(response?.user?.user_role_id));
          SimpleToast.show(response?.message, SimpleToast.SHORT);
          if (!response?.user?.user_role_id || type === 'signup') {
            setIsLoading(false);
            navigation?.navigate('ChooseUser');
          } else {
            // Returning user - fetch full profile first, then check subscription
            fetchProfileAndProceed(response?.user?.user_role_id);
          }
        } else {
          setIsLoading(false);
          setOtpError(
            response.message ||
            LocalizedStrings.Auth?.mobile_invalid ||
            'Invalid OTP. Please try again.',
          );
        }
      },
      error => {
        setIsLoading(false);
        console.log('Verify OTP Error:', error);
        let errorMsg = '';

        if (error?.data?.error) {
          errorMsg = error.data.error;
          // Display what the server actually expected (if provided by backend)
          if (error.data.debug_stored) {
            errorMsg += `\n(Expect: ${error.data.debug_stored} | Sent: ${error.data.debug_sent})`;
          }
        } else if (error?.data?.message) {
          errorMsg = error.data.message;
        } else if (error?.message) {
          errorMsg = error.message;
        } else {
          errorMsg = 'Something went wrong. Please try again.';
        }
        setOtpError(errorMsg);
      },
      fail => {
        console.log('API Fail:', fail);
      },
    );
  };

  return (
    <CommanView>
      {/* Header */}
      <Header
        title={
          LocalizedStrings.Auth?.otp_verification ||
          LocalizedStrings.AddStaff?.Verify ||
          'OTP Verification'
        }
        style_title={{ fontFamily: Font?.Manrope_SemiBold }}
        centerIcon={true}
        centerIconSource={ImageConstant?.logo}
      />

      {/* OTP Box */}
      <View style={styles.otpBox}>
        {aadhaar ? (
          <View style={{ alignItems: 'center' }}>
            <Typography size={18} type={Font?.Poppins_Medium}>
              {LocalizedStrings.Auth?.otp_verification ||
                LocalizedStrings.AddStaff?.Verify ||
                'OTP Verification'}
            </Typography>
            <Typography
              size={12}
              textAlign={'center'}
              style={{ marginTop: 10 }}
            >
              {LocalizedStrings.AddStaff?.Description ||
                'An OTP has been sent to the mobile number linked with staff Aadhaar.'}
            </Typography>
          </View>
        ) : (
          <>
            <Typography size={18} type={Font?.Poppins_Medium}>
              {LocalizedStrings.Auth?.otp_verification || 'OTP Verification'}
            </Typography>
          </>
        )}

        {/* OTP Input */}
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

        {/* Resend Option */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={resendTimer > 0}
          style={{ alignSelf: 'center' }}
        >
          {resendTimer > 0 ? (
            <Typography size={14} type={Font?.Poppins_Regular} color={'#999'}>
              {LocalizedStrings.AddStaff?.Resend_Text ||
                "Didn't receive the OTP? Resend"}{' '}
              in {resendTimer}s
            </Typography>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Typography size={14}>
                {LocalizedStrings.AadhaarOTPVerification?.not_received ||
                  LocalizedStrings.AddStaff?.Resend_Text?.split('?')[0] ||
                  "Didn't receive the OTP?"}{' '}
              </Typography>
              <TouchableOpacity onPress={handleResend}>
                <Typography size={14} color="#D98579">
                  {LocalizedStrings.AadhaarOTPVerification?.resend || 'Resend'}
                </Typography>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* Submit Button */}
        <Button
          icon={ImageConstant?.Arrow}
          title={
            aadhaar
              ? LocalizedStrings.AadhaarOTPVerification?.verify_proceed ||
              LocalizedStrings.AddStaff?.Verify_Add_Staff ||
              'Verify & Proceed'
              : LocalizedStrings.Auth?.verify || 'Submit'
          }
          onPress={handleVerify}
          style={{ marginTop: 20 }}
          disabled={isLoading}
          loader={isLoading}
        />
        {!aadhaar && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Typography size={12} textAlign={'center'}>
              {LocalizedStrings.Auth.terms_message + ' '}
            </Typography>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Policy', { slug: 'terms-condition' })
              }
            >
              <Typography
                size={12}
                textAlign={'center'}
                style={{ color: '#D98579', textDecorationLine: 'underline' }}
              >
                {LocalizedStrings.Auth.term_services + ' '}
              </Typography>
            </TouchableOpacity>
            <Typography size={12} textAlign={'center'}>
              {LocalizedStrings.Auth.and + ' '}
            </Typography>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Policy', { slug: 'privacy-policy' })
              }
            >
              <Typography
                size={12}
                textAlign={'center'}
                style={{ color: '#D98579', textDecorationLine: 'underline' }}
              >
                {LocalizedStrings.Auth.term_policy}
              </Typography>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Text */}
      {type != 'login' && !aadhaar && (
        <View style={styles.bottomText}>
          <Typography type={Font?.Poppins_Regular}>
            {LocalizedStrings.Auth?.already_have_account ||
              'Already have an account?'}{' '}
          </Typography>
          <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
            <Typography type={Font?.Poppins_Regular} color="#D98579">
              {LocalizedStrings.Auth?.login || 'Log in'}
            </Typography>
          </TouchableOpacity>
        </View>
      )}
    </CommanView>
  );
};

export default Otp;

const styles = StyleSheet.create({
  otpBox: {
    borderWidth: 1,
    borderColor: '#EBEBEA',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  bottomText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    bottom: 0,
    flex: 1,
  },
});
