import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
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
import { LOGIN, LEGAL_CONSENT_BULK } from './../../Backend/api_routes';
import { POST } from '../../Backend/Backend';
import LegalConsentModal from '../../Component/LegalConsentModal';
import { TERMS_AND_CONDITIONS_CONTENT } from '../../Constants/legalContents';

const Login = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

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

    if (!isTermsAccepted) {
      setTermsError('Please accept Terms & Conditions to continue.');
      return;
    } else {
      setTermsError('');
    }

    if (isValidForm(error)) {
      var payload = {
        phone_number: mobile,
        country_code: selectedCountry.dial_code,
      };
      setPendingPayload(payload);
      setShowTermsModal(true);
    }
  };

  const logConsentAndProceed = () => {
    setShowTermsModal(false);
    setIsLoading(true);
    POST(
      LEGAL_CONSENT_BULK,
      {
        phone_number: selectedCountry.dial_code + mobile,
        consents: [
          { type: 'terms_and_conditions', consent_data: { accepted: true } },
        ],
      },
      () => proceedLogin(0),
      () => proceedLogin(0),
      () => proceedLogin(0),
    );
  };

  const proceedLogin = (retryCount = 0) => {
    if (!pendingPayload) return;
    setIsLoading(true);
    POST(
      LOGIN,
      pendingPayload,
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
          setTimeout(() => proceedLogin(retryCount + 1), 2000);
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
              {LocalizedStrings.Auth.terms_message}{' '}
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
                {LocalizedStrings.Auth.term_services}{' '}
              </Typography>
            </TouchableOpacity>
            <Typography size={12}>{LocalizedStrings.Auth.and} </Typography>
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

      <LegalConsentModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={logConsentAndProceed}
        title="Terms and conditions"
        contentSections={TERMS_AND_CONDITIONS_CONTENT}
        acceptButtonText="I agree"
      />
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
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
