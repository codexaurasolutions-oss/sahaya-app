import {NativeModules, Platform} from 'react-native';

export const detectSpeechLanguage = text => {
  const value = String(text || '');

  if (/[ఀ-౿]/u.test(value)) {
    return 'te-IN';
  }

  if (/[ऀ-ॿ]/u.test(value)) {
    return 'hi-IN';
  }

  return 'en-IN';
};

export const speakSearchQuery = async text => {
  const cleanText = String(text || '').trim();
  const speechOutput = NativeModules?.SpeechOutput;

  if (
    !cleanText ||
    Platform.OS !== 'android' ||
    typeof speechOutput?.speak !== 'function'
  ) {
    return false;
  }

  try {
    return await speechOutput.speak(cleanText, detectSpeechLanguage(cleanText));
  } catch (error) {
    return false;
  }
};
