import { StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import CheckBox from '@react-native-community/checkbox';
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
import { SIGINUP } from './../../Backend/api_routes';
import { POST } from '../../Backend/Backend';
import SimpleToast from 'react-native-simple-toast';

const SiginUp = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');

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
    console.log('Selected country:', country);
  };

  const handleVerifyRequest = (retryCount = 0) => {
    if (isLoading) return;

    let error = {
      number: validators?.checkPhoneNumberWithFixLength('Mobile', 10, mobile),
    };
    setMobileError(error?.number);

    if (!isTermsAccepted) {
      setTermsError('Please accept Terms & Conditions to continue.');
      return;
    } else {
      setTermsError('');
    }

    if (isValidForm(error)) {
      setIsLoading(true);

      var payload = {
        phone_number: mobile,
        country_code: selectedCountry.dial_code,
      };

      console.log('Calling signup API with:', { phone: mobile, country: selectedCountry.dial_code });
      POST(
        SIGINUP,
        payload,
        response => {
          console.log('Signup Success Response:', response);
          setIsLoading(false);
          navigation?.navigate('Otp', {
            type: 'signup',
            mobile: mobile,
            countryCode: selectedCountry.dial_code,
            user_id: response?.user_id,
          });
        },
        error => {
          console.log('Signup Error Response:', JSON.stringify(error, null, 2));
          setIsLoading(false);
          
          if (error?.data?.errors?.phone_number) {
            const errorMsg = Array.isArray(error.data.errors.phone_number) 
              ? error.data.errors.phone_number[0] 
              : error.data.errors.phone_number;
            if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('taken')) {
              SimpleToast.show('This number is already registered. Please login.', SimpleToast.LONG);
              navigation.navigate('Login');
              return;
            }
            setMobileError(errorMsg);
          } else if (error?.data?.message) {
            const msg = error.data.message;
            if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('taken')) {
              SimpleToast.show('This number is already registered. Please login.', SimpleToast.LONG);
              navigation.navigate('Login');
              return;
            }
            setMobileError(msg);
          } else if (error?.message) {
            setMobileError(error.message);
          } else {
            setMobileError('Something went wrong. Please try again.');
          }
        },
        fail => {
          console.log('Signup Network Fail:', fail?.code, fail?.message);
          if (retryCount < 2) {
            setTimeout(() => handleVerifyRequest(retryCount + 1), 2000);
            return;
          }
          setIsLoading(false);
          const failMsg = fail?.msg || fail?.message || '';
          if (failMsg.includes('timeout') || failMsg.includes('taking too long')) {
            setMobileError('Server is busy. Please try again in a moment.');
          } else {
            setMobileError('Network error. Please check your connection.');
          }
        }
      );
    }
  };

  const handleVerify = () => {
    handleVerifyRequest(0);
  };

  return (
    <CommanView>
      <Header
        title={LocalizedStrings.Auth.signup}
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

        {/* ✅ Terms and Conditions Checkbox */}
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={isTermsAccepted}
            onValueChange={value => {
              setIsTermsAccepted(value);
              if (value) setTermsError('');
            }}
            tintColors={{ true: '#D98579', false: '#B0B0B0' }}
          />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', flex: 1 }}>
            <Typography size={12}>
              {LocalizedStrings.Auth.terms_message + ' '}
            </Typography>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Policy', { slug: 'terms-condition' })
              }
            >
              <Typography
                size={12}
                style={{ color: '#D98579', textDecorationLine: 'underline' }}
              >
                {LocalizedStrings.Auth.term_services + ' '}
              </Typography>
            </TouchableOpacity>
            <Typography size={12}>{LocalizedStrings.Auth.and + ' '}</Typography>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Policy', { slug: 'privacy-policy' })
              }
            >
              <Typography
                size={12}
                style={{ color: '#D98579', textDecorationLine: 'underline' }}
              >
                {LocalizedStrings.Auth.term_policy}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {termsError ? (
          <Typography size={12} style={{ color: 'red', marginTop: 4 }}>
            {termsError}
          </Typography>
        ) : null}

        <Button
          title={LocalizedStrings.Auth.verify}
          onPress={handleVerify}
          style={{ marginTop: 20 }}
          icon={ImageConstant?.Arrow}
          disabled={isLoading}
          loader={isLoading}
        />
      </View>

      {/* Bottom Section */}
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Typography style={{ textAlign: 'center' }}>
            {LocalizedStrings.Auth.already_have_account}{' '}
          </Typography>
          <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
            <Typography color="#D98579" style={{ textAlign: 'center' }}>
              {LocalizedStrings.Auth.login}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </CommanView>
  );
};

export default SiginUp;

const styles = StyleSheet.create({
  inputText: {
    color: '#000',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
  },
});
