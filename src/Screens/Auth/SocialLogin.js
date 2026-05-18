import React, { useEffect } from 'react';
import { StyleSheet, View, ImageBackground, StatusBar } from 'react-native';
import { ImageConstant } from '../../Constants/ImageConstant';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import { Font } from '../../Constants/Font';
import { useDispatch } from 'react-redux';
import { isAuth, userDetails, Token } from '../../Redux/action';
import LocalizedStrings from '../../Constants/localization';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { POST } from '../../Backend/Backend';
import { SIGINUP } from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';

const SocialLogin = ({ navigation }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    GoogleSignin.configure({
      // Paste your Web Client ID from Firebase/Google Cloud Console here
      webClientId: '342118935526-5enee4e4c8rm0k9gu8nsufdnm8mp9h3l.apps.googleusercontent.com',
      // Paste your iOS Client ID from GoogleService-Info.plist (CLIENT_ID) here
      iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const userInfo = response?.data || response;

      if (userInfo?.user) {
        const { email, name, photo, id: googleId } = userInfo.user;
        const nameParts = (name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Send to backend for authentication
        const formdata = new FormData();
        formdata.append('email', email);
        formdata.append('first_name', firstName);
        formdata.append('last_name', lastName);
        formdata.append('google_id', googleId);
        formdata.append('login_type', 'google');
        if (photo) formdata.append('image', photo);

        POST(
          SIGINUP,
          formdata,
          success => {
            if (success?.token) {
              dispatch(Token(success.token));
            }
            if (success?.data) {
              dispatch(userDetails(success.data));
            }
            dispatch(isAuth(true));
            SimpleToast.show('Login successful!', SimpleToast.SHORT);
          },
          error => {
            const msg =
              error?.data?.message ||
              error?.message ||
              'Google login failed. Please try again.';
            SimpleToast.show(msg, SimpleToast.SHORT);
          },
          fail => {
            SimpleToast.show(
              'Network error. Please check your connection.',
              SimpleToast.SHORT,
            );
          },
        );
      }
    } catch (error) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        SimpleToast.show('Sign in already in progress', SimpleToast.SHORT);
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        SimpleToast.show(
          'Google Play Services not available',
          SimpleToast.SHORT,
        );
      } else {
        SimpleToast.show('Google Sign-In failed', SimpleToast.SHORT);
        console.log('Google Sign-In Error:', error);
      }
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ImageBackground
        source={ImageConstant?.BackGroundImage}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Title Section */}
          <View style={styles.titleWrapper}>
            <Typography
              color="#fff"
              type={Font?.Manrope_Regular}
              size={36}
              lineHeight={50}
            >
              {LocalizedStrings.Auth?.login || 'Sign In'}
            </Typography>
            <Typography
              color="#fff"
              size={16}
              type={Font?.Poppins_Regular}
              style={styles.subtitle}
            >
              {LocalizedStrings.Auth?.welcome_back || 'Welcome back!'}
            </Typography>
            <Typography color="#fff" size={16}>
              {LocalizedStrings.Auth?.sign_in_continue ||
                'Please sign in to continue.'}
            </Typography>
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonWrapper}>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Button
                  onPress={handleGoogleLogin}
                  icon={ImageConstant?.Google}
                  linerColor={['#FFFFFF', '#FFFFFF']}
                  title={'Google'}
                  title_style={{ color: '#000000' }}
                />
              </View>
              <View style={styles.halfWidth}>
                <Button
                  onPress={() => {
                    navigation?.navigate('SiginUp');
                  }}
                  icon={ImageConstant?.Apple}
                  linerColor={['#FFFFFF', '#FFFFFF']}
                  title={'Apple'}
                  title_style={{ color: '#000000' }}
                />
              </View>
            </View>
            <View style={styles.fullWidth}>
              <Button
                onPress={() => {
                  navigation?.navigate('SiginUp');
                }}
                icon={ImageConstant?.FaceBook}
                linerColor={['#FFFFFF', '#FFFFFF']}
                title={'Facebook'}
                title_style={{ color: '#000000' }}
              />
            </View>
          </View>
        </View>
      </ImageBackground>
    </>
  );
};

export default SocialLogin;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: 50,
  },
  subtitle: {
    marginVertical: 4,
  },
  buttonWrapper: {
    marginBottom: 60,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfWidth: {
    width: '48%',
  },
  fullWidth: {
    width: '100%',
  },
});
