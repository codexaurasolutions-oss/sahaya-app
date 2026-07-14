import {useEffect, useRef, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice from '@react-native-voice/voice';
import LocalizedStrings from '../Constants/localization';

const VOICE_LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  bn: 'bn-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  as: 'as-IN',
  ur: 'ur-IN',
  ne: 'ne-NP',
};

const getVoiceErrorMessage = event => {
  const code = String(event?.error?.code || event?.code || '');
  const message = String(event?.error?.message || event?.message || '').toLowerCase();

  if (code === '9' || message.includes('permission')) {
    return 'Microphone permission is off. Please allow it in app settings and try again.';
  }

  if (code === '7' || message.includes('no match')) {
    return 'Speech was not clear. Please try speaking again.';
  }

  return 'Voice input could not start. Please check the phone speech service and try again.';
};

const useVoiceSearch = ({disabled = false, onError, onResult}) => {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const busyRef = useRef(false);
  const speechEndTimerRef = useRef(null);
  const localeRef = useRef(
    VOICE_LOCALE_MAP[LocalizedStrings.getLanguage?.()] || 'en-IN',
  );
  const onErrorRef = useRef(onError);
  const onResultRef = useRef(onResult);

  onErrorRef.current = onError;
  onResultRef.current = onResult;

  const resetVoiceState = () => {
    if (speechEndTimerRef.current) {
      clearTimeout(speechEndTimerRef.current);
      speechEndTimerRef.current = null;
    }
    busyRef.current = false;
    setIsListening(false);
    setIsLoading(false);
  };

  useEffect(() => {
    AsyncStorage.getItem('LANGUAGE')
      .then(language => {
        if (language && VOICE_LOCALE_MAP[language]) {
          localeRef.current = VOICE_LOCALE_MAP[language];
        }
      })
      .catch(() => {});

    Voice.onSpeechResults = event => {
      const transcript = event?.value?.[0]?.trim() || '';
      resetVoiceState();

      if (transcript) {
        onResultRef.current?.(transcript);
      } else {
        onErrorRef.current?.('Speech was not clear. Please try speaking again.');
      }
    };

    Voice.onSpeechError = event => {
      resetVoiceState();
      onErrorRef.current?.(getVoiceErrorMessage(event));
    };

    Voice.onSpeechStart = () => {
      setIsListening(true);
      setIsLoading(false);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
      speechEndTimerRef.current = setTimeout(() => {
        if (busyRef.current) {
          resetVoiceState();
          onErrorRef.current?.('Speech was not clear. Please try speaking again.');
        }
      }, 5000);
    };

    return () => {
      busyRef.current = false;
      if (speechEndTimerRef.current) {
        clearTimeout(speechEndTimerRef.current);
      }
      Voice.destroy()
        .catch(() => {})
        .finally(() => Voice.removeAllListeners());
    };
  }, []);

  const requestPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone permission',
        message: 'Sahayya needs microphone access to convert your voice into search text.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const startVoice = async () => {
    if (disabled || busyRef.current) {
      return;
    }

    busyRef.current = true;
    setIsLoading(true);

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        resetVoiceState();
        onErrorRef.current?.('Microphone permission is needed for voice search.');
        return;
      }

      const options = {
        REQUEST_PERMISSIONS_AUTO: false,
        EXTRA_MAX_RESULTS: 1,
        EXTRA_PARTIAL_RESULTS: false,
      };

      setIsListening(true);

      try {
        await Voice.start(localeRef.current, options);
      } catch (primaryError) {
        await Voice.destroy().catch(() => {});
        await Voice.start('en-IN', options);
      }

      setIsLoading(false);
    } catch (error) {
      resetVoiceState();
      onErrorRef.current?.(getVoiceErrorMessage(error));
    }
  };

  const stopVoice = async () => {
    try {
      await Voice.stop();
    } catch (error) {
    } finally {
      resetVoiceState();
    }
  };

  return {isListening, isLoading, startVoice, stopVoice};
};

export default useVoiceSearch;
