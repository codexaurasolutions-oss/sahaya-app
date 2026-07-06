import AsyncStorage from '@react-native-async-storage/async-storage';

export const getLanguage = async () => {
  const language = await AsyncStorage.getItem('LANGUAGE');

  return language;
};

export const setLanguage = async lang => {
  return await AsyncStorage.setItem('LANGUAGE', lang)
    .then(res => res)
    .catch(e => e);
};

export const getFcmToken = async () => {
  const token = await AsyncStorage.getItem('fcm_token');
  return token;
};

export const setFcmToken = async token => {
  if (token) {
    return await AsyncStorage.setItem('fcm_token', token);
  }
};

export const clearFcmToken = async () => {
  return await AsyncStorage.removeItem('fcm_token');
};
