import { StyleSheet, View, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { OtpInput } from 'react-native-otp-entry';
import { useDispatch } from 'react-redux';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Button from '../../../Component/Button';
import HeaderForUser from '../../../Component/HeaderForUser';
import { POST_FORM_DATA } from '../../../Backend/Backend';
import { AADHAR_SAVE, AADHAR_VERFIY } from '../../../Backend/api_routes';
import { Token, userDetails } from '../../../Redux/action';
import LocalizedStrings from '../../../Constants/localization';

const AadharOtp = ({ navigation, route }) => {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60); // 60 sec timer
  const [otpError, setOtpError] = useState('');
  const { mobile } = route?.params;
  const dispatch = useDispatch();
  const last4 = mobile?.toString()?.slice(-4);

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

  // Resend OTP function
  const handleResend = () => {
    let data = new FormData();
    data?.append('aadhar_number', route?.params?.aadhar_number);
    POST_FORM_DATA(
      AADHAR_SAVE,
      data,
      sucess => {
        setOtpError(''); // Clear any previous errors
        setResendTimer(60);
        let timer = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      },
      error => {
        setOtpError(
          error?.data?.errors?.aadhar_number ? error.data.errors.aadhar_number[0] :
            error?.data?.message || 'Failed to resend OTP'
        );
        console.log('Resend OTP Error:', error);
      },
      fail => {
        setOtpError('Network error. Please try again.');
        console.log('Resend OTP Failed:', fail);
      },
    );
  };

  // Verify OTP function
  const handleVerify = () => {
    if (otp.length !== 6) {
      setOtpError(
        LocalizedStrings.AddStaff.OTP_Placeholders ||
        'Please enter a valid 6-digit OTP',
      );
      return;
    } else {
      let data = new FormData();
      data?.append('otp', otp);
      // Add aadhar_number if available from route params
      if (route?.params?.aadhar_number) {
        data?.append('aadhar_number', route?.params?.aadhar_number);
      }
      // Add user_id if available from route params
      const userId = route?.params?.user_id;
      if (userId) {
        data?.append('user_id', userId);
      }
      POST_FORM_DATA(
        AADHAR_VERFIY,
        data,
        sucess => {
          dispatch(userDetails(sucess?.user));
          navigation?.navigate('StepFirst');
        },
        error => {
          // Better error handling to show all possible error messages
          if (error?.data?.message) {
            setOtpError(error?.data?.message);
          } else if (error?.data?.error) {
            setOtpError(error?.data?.error);
          } else if (error?.message) {
            setOtpError(error.message);
          } else {
            setOtpError('Failed to verify OTP. Please try again.');
          }
          console.log('OTP Verification Error:', error);
        },
        fail => {
          setOtpError('Network error. Please try again.');
          console.log('OTP Verification Failed:', fail);
        },
      );
    }
  };

  return (
    <CommanView>
      {/* Header */}
      <HeaderForUser
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => {
          navigation?.goBack();
        }}
        title={LocalizedStrings.AddStaff.Verify || 'Aadhar - OTP Verification'}
        style_title={{ fontSize: 18 }}
      />
      <View style={{ flex: 0.5, justifyContent: 'center' }}>
        {/* OTP Box */}
        <View style={styles.otpBox}>
          <Typography
            size={18}
            textAlign={'center'}
            type={Font?.Poppins_Medium}
          >
            {LocalizedStrings.AddStaff.Verify}
          </Typography>
          <Typography size={12} textAlign={'center'} style={{ marginTop: 30 }}>
            {LocalizedStrings.AddStaff.Description + last4}
          </Typography>
          {/* OTP Input */}
          <OtpInput
            numberOfDigits={6}
            focusColor="#D98579"
            onTextChange={text => setOtp(text)}
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
          {otpError ? (
            <Typography
              size={12}
              color="red"
              style={{ textAlign: 'right', marginBottom: 10 }}
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
                {LocalizedStrings.AddStaff.Resend_Text} {resendTimer}s
              </Typography>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <Typography size={14}>
                  {LocalizedStrings.AddStaff.Resend_Text.split('?')[0]}?{' '}
                </Typography>
                <TouchableOpacity onPress={handleResend}>
                  <Typography size={14} color="#D98579">
                    {LocalizedStrings.AadhaarOTPVerification?.resend ||
                      'Resend'}
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          <Button
            icon={ImageConstant?.Arrow}
            title={LocalizedStrings.AddStaff.Verify_Add_Staff}
            onPress={handleVerify}
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    </CommanView>
  );
};

export default AadharOtp;

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
