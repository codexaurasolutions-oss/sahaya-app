import React, { useState, useEffect, useRef } from 'react';
import SplashScreen from 'react-native-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/Navigation/AuthStack';
import { FocusAwareStatusBar } from './src/Component/UI/FocusAwareStatusBar';
import { Provider, useSelector } from 'react-redux';
import { persistor, store } from './src/Redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import RootStack from './src/Navigation/RootStack';
import StaffStacks from './src/Navigation/StaffStacks';
import { getLanguage, setLanguage } from './src/Constants/AsyncStorage';
import localization from './src/Constants/localization';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-get-random-values';
import { PermissionsAndroid, Platform, Linking, Alert } from 'react-native';
import { navigationRef } from './src/Navigation/RootNavigation';
import { fcmService } from './src/pushNotifacation/FMCService';
import {localNotificationService} from './src/pushNotifacation/LocalNotificationService';

const App = () => {
  const [langCode, setLangCode] = useState('');
  const notifInitDone = useRef(false);

  const loadLanguage = async () => {
    const storedLangCode = await getLanguage();
    if (storedLangCode) {
      setLangCode(storedLangCode);
      setLanguage(storedLangCode);
      localization.setLanguage(storedLangCode);
    } else {
      setLanguage('en');
      setLangCode('en');
      localization.setLanguage('en');
    }
  };

  useEffect(() => {
    loadLanguage();
    const timer = setTimeout(() => {
      SplashScreen?.hide();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const initNotif = async () => {
      if (notifInitDone.current) return;
      notifInitDone.current = true;

      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const alreadyGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );

          if (!alreadyGranted) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
              {
                title: 'Sahayya Notifications',
                message:
                  'Sahayya needs notification permission to send you job alerts, salary updates, and important reminders.',
                buttonPositive: 'Allow',
                buttonNegative: 'Not Now',
              },
            );

            if (
              granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
            ) {
              setTimeout(() => {
                Alert.alert(
                  'Notification Permission',
                  'Notification permission was denied. You can enable it later from App Settings to receive job alerts and updates.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Open Settings',
                      onPress: () => Linking.openSettings(),
                    },
                  ],
                );
              }, 1500);
            }
          }
        }
      } catch (error) {
        // silent
      }

      await localNotificationService.configure();
      fcmService.register();
    };

    const timer = setTimeout(() => {
      initNotif();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (langCode === null) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <MainNavigation />
      </PersistGate>
    </Provider>
  );
};

export default App;

const MainNavigation = () => {
  const isAuth = useSelector(store => store?.isAuth);
  const userTypes = useSelector(store => store?.userType);
  const languageCode = useSelector(state => state.language_code);

  return (
    <NavigationContainer ref={navigationRef} key={languageCode}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <FocusAwareStatusBar />
        {isAuth ? userTypes == 2 ? <StaffStacks /> : <RootStack /> : <AuthStack />}
      </SafeAreaView>
    </NavigationContainer>
  );
};
