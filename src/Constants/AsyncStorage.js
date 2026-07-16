import AsyncStorage from '@react-native-async-storage/async-storage';

const normalizeAppLanguage = lang => (lang === 'ur' ? 'hi' : lang);

export const getLanguage = async () => {
  const language = await AsyncStorage.getItem('LANGUAGE');
  const normalizedLanguage = normalizeAppLanguage(language);

  if (language && language !== normalizedLanguage) {
    await AsyncStorage.setItem('LANGUAGE', normalizedLanguage);
  }

  return normalizedLanguage;
};

export const setLanguage = async lang => {
  return await AsyncStorage.setItem('LANGUAGE', normalizeAppLanguage(lang))
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
