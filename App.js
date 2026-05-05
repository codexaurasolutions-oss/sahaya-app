import React, { useState, useEffect } from 'react';
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
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-get-random-values';
import { PermissionsAndroid, Platform } from 'react-native';
import { fcmService } from './src/pushNotifacation/FMCService';
import { localNotificationService } from './src/pushNotifacation/LocalNotificationService';

const App = () => {
  const [langCode, setLangCode] = useState(null);

  const loadLanguage = async () => {
    try {
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
    } catch (e) {
      setLangCode('en');
    }
  };

  useEffect(() => {
    loadLanguage();
    const timer = setTimeout(() => {
      SplashScreen?.hide();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Wait until language is loaded
  if (langCode === null) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <MainNavigation />
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;

const MainNavigation = () => {
  const isAuth = useSelector(store => store?.isAuth);
  const userTypes = useSelector(store => store?.userType);
  const languageCode = useSelector(state => state.language_code);

  useEffect(() => {
    const requestNotificationPermissions = async () => {
      try {
        if (Platform.OS === 'android') {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        }
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    };

    requestNotificationPermissions();

    try {
      fcmService.registerAppWithFCM();
      fcmService.register();
      localNotificationService.configure();
    } catch (e) {
      console.warn('FCM/Notification setup error:', e);
    }
  }, []);

  return (
    <NavigationContainer key={languageCode}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <FocusAwareStatusBar />
        {isAuth ? userTypes == 2 ? <StaffStacks /> : <RootStack /> : <AuthStack />}
      </SafeAreaView>
    </NavigationContainer>
  );
};
