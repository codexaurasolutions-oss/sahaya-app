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
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-get-random-values';
import { Alert, PermissionsAndroid, Platform, } from 'react-native';
import { fcmService } from './src/pushNotifacation/FMCService';
import { localNotificationService } from './src/pushNotifacation/LocalNotificationService';

const App = () => {
  const [langCode, setLangCode] = useState('');
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

  if (langCode === null) {
    return null;
  }

  const requestNotificationPermissions = async () => {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.requestPermissions();
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('Notification permission denied');
      }
    }
  };


  useEffect(() => {
    requestNotificationPermissions()
    fcmService.registerAppWithFCM();
    fcmService.register(onRegister, onNotification, onOpenNotification);

    localNotificationService.configure(onOpenNotification);

    function onRegister(token) { }

    function onNotification(notify) {
      localNotificationService.showlocalNotification(
        'channel-id',
        Platform.OS === 'ios' ? notify.message : notify.title,
        notify.body,
        notify,
      );
    }

    function onOpenNotification(notify, data) {
      console.log('[App] onOpenNotification: ', notify);
    }
  }, []);

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
    <NavigationContainer key={languageCode}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <FocusAwareStatusBar />
        {isAuth ? userTypes == 2 ? <StaffStacks /> : <RootStack /> : <AuthStack />}
      </SafeAreaView>
    </NavigationContainer>
  );
};
