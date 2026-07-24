import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import React, { useState } from 'react';
import CommanView from '../../Component/CommanView';
import Header from '../../Component/Header';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import Input from '../../Component/Input';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import LocalizedStrings from '../../Constants/localization';
import { validators } from './../../Backend/Validator';
import { isValidForm } from '../../Backend/Utility';
import { LOGIN } from './../../Backend/api_routes';
import { POST } from '../../Backend/Backend';

const Login = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState({
    flag: '🇮🇳',
    dial_code: '+91',
    name: 'India',
    code: 'IN',
  });

  const handleMobileChange = text => {
    const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 10);
    setMobile(digitsOnly);
    if (mobileError) setMobileError('');
  };

  const handleCountrySelect = country => {
    setSelectedCountry(country);
  };

  const handleVerify = () => {
    if (isLoading) return;

    let error = {
      number: validators?.checkPhoneNumberWithFixLength('Mobile', 10, mobile),
    };
    setMobileError(error?.number);

    if (isValidForm(error)) {
      var payload = {
        phone_number: mobile,
        country_code: selectedCountry.dial_code,
      };
      proceedLogin(payload, 0);
    }
  };

  const proceedLogin = (payload, retryCount = 0) => {
    setIsLoading(true);
    POST(
      LOGIN,
      payload,
      response => {
        setIsLoading(false);
        if (response?.status === true) {
          navigation?.navigate('Otp', {
            type: 'login',
            mobile: mobile,
            countryCode: selectedCountry.dial_code,
            user_id: response?.user_id,
            testOtp: response?.otp,
          });
        } else {
          setMobileError(
            response?.message ||
              LocalizedStrings.Auth?.mobile_invalid ||
              'Login failed. Please try again.',
          );
        }
      },
      error => {
        setIsLoading(false);
        if (error?.data?.message) {
          setMobileError(error?.data?.message);
        } else if (error?.message) {
          setMobileError(error.message);
        } else {
          setMobileError(
            LocalizedStrings.Auth?.mobile_invalid ||
              'Something went wrong. Please try again.',
          );
        }
      },
      fail => {
        console.log('Login Network Fail:', fail?.code, fail?.message, 'retry:', retryCount);
        if (retryCount < 2) {
          setTimeout(() => proceedLogin(payload, retryCount + 1), 2000);
          return;
        }
        setIsLoading(false);
        const failMsg = fail?.msg || fail?.message || '';
        if (failMsg.includes('timeout') || failMsg.includes('taking too long')) {
          setMobileError('Server is busy. Please try again in a moment.');
        } else {
          setMobileError('Network error. Please check your connection.');
        }
      },
    );
  };

  return (
    <CommanView>
      <Header
        title={LocalizedStrings.Auth.login}
        style_title={{ fontFamily: Font?.Manrope_SemiBold }}
        centerIcon={true}
        centerIconSource={ImageConstant?.logo}
      />
      <View
        style={{
          borderWidth: 1,
          borderColor: '#EBEBEA',
          padding: 20,
          borderRadius: 12,
        }}
      >
        <Input
          countryPicker
          showTitle
          placeholder={LocalizedStrings.Auth.mobile_placeholder}
          value={mobile}
          onChange={handleMobileChange}
          style_input={[styles.inputText]}
          title={LocalizedStrings.Auth.enter_mobile}
          placeholderTextColor={'#00000080'}
          keyboardType="number-pad"
          maxLength={10}
          error={mobileError}
          country={selectedCountry}
          onCountryPress={handleCountrySelect}
        />

        <Typography size={14} style={{ marginTop: mobileError ? 5 : 0 }}>
          {LocalizedStrings.Auth.otp_message}
        </Typography>

        <Button
          title="Log In"
          onPress={handleVerify}
          style={{ marginTop: 20 }}
          icon={ImageConstant?.Arrow}
          disabled={isLoading}
          loader={isLoading}
        />

        <View style={styles.createAccountContainer}>
          <Typography style={{ textAlign: 'center' }}>
            {LocalizedStrings.Auth.no_account}
          </Typography>
          <TouchableOpacity
            onPress={() => navigation?.navigate('SiginUp')}
            style={styles.createAccountButton}
          >
            <Typography color="#D98579" type={Font?.Poppins_SemiBold}>
              {LocalizedStrings.Auth.create_account}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </CommanView>
  );
};

export default Login;

const styles = StyleSheet.create({
  inputText: {
    color: '#000',
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  createAccountContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  createAccountButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#FFF5F4',
    borderWidth: 1,
    borderColor: '#F1C3BC',
  },
});
