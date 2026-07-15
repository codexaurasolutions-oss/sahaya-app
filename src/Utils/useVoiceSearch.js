import {useCallback, useEffect, useRef, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import Sound, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  OutputFormatAndroidType,
} from 'react-native-nitro-sound';
import {POST_FORM_DATA} from '../Backend/Backend';
import {VOICE_TRANSCRIBE} from '../Backend/api_routes';

const MAX_RECORDING_MS = 12000;
const AUDIO_SETTINGS = {
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AVEncodingOptionIOS: 'aac',
  AVFormatIDKeyIOS: 'aac',
  AVNumberOfChannelsKeyIOS: 1,
  AVSampleRateKeyIOS: 16000,
  AudioChannels: 1,
  AudioSamplingRate: 16000,
  AudioEncodingBitRate: 64000,
};

const AUDIO_MIME_TYPES = {
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  webm: 'audio/webm',
};

const getAudioUpload = path => {
  const cleanPath = String(path || '').split('?')[0];
  const detectedExtension = cleanPath.split('.').pop()?.toLowerCase();
  const fallbackExtension = Platform.OS === 'ios' ? 'm4a' : 'mp4';
  const extension = AUDIO_MIME_TYPES[detectedExtension]
    ? detectedExtension
    : fallbackExtension;

  return {
    name: `voice-search.${extension}`,
    type: AUDIO_MIME_TYPES[extension],
    uri: cleanPath.startsWith('file://') ? cleanPath : `file://${cleanPath}`,
  };
};

const useVoiceSearch = ({disabled = false, onError, onResult}) => {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autoStopTimerRef = useRef(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const recordingRef = useRef(false);
  const finishRecordingRef = useRef(null);
  const onErrorRef = useRef(onError);
  const onResultRef = useRef(onResult);

  onErrorRef.current = onError;
  onResultRef.current = onResult;

  const clearAutoStopTimer = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }, []);

  const resetVoiceState = useCallback(() => {
    clearAutoStopTimer();
    busyRef.current = false;
    recordingRef.current = false;

    if (mountedRef.current) {
      setIsListening(false);
      setIsLoading(false);
    }
  }, [clearAutoStopTimer]);

  const requestPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone permission',
        message:
          'Sahayya needs microphone access to convert your voice into search text.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const transcribeAudio = useCallback(path => {
    const formData = new FormData();
    formData.append('audio', getAudioUpload(path));

    return new Promise((resolve, reject) => {
      POST_FORM_DATA(
        VOICE_TRANSCRIBE,
        formData,
        success => {
          const transcript = String(
            success?.data?.text || success?.text || '',
          ).trim();

          if (!transcript) {
            reject(new Error('EMPTY_TRANSCRIPT'));
            return;
          }

          resolve(transcript);
        },
        error => reject(new Error(error?.message || 'TRANSCRIPTION_FAILED')),
        failure =>
          reject(
            new Error(
              failure?.msg || failure?.message || 'TRANSCRIPTION_UNAVAILABLE',
            ),
          ),
        {timeout: 60000},
      );
    });
  }, []);

  const finishRecording = useCallback(async () => {
    if (!recordingRef.current) {
      return;
    }

    recordingRef.current = false;
    clearAutoStopTimer();
    if (mountedRef.current) {
      setIsListening(false);
      setIsLoading(true);
    }

    try {
      const audioPath = await Sound.stopRecorder();
      const transcript = await transcribeAudio(audioPath);
      resetVoiceState();
      onResultRef.current?.(transcript);
    } catch (error) {
      resetVoiceState();
      const message = String(error?.message || '');
      onErrorRef.current?.(
        message === 'EMPTY_TRANSCRIPT'
          ? 'Speech was not clear. Please try speaking again.'
          : 'Voice transcription is temporarily unavailable. Please try again or type your search.',
      );
    }
  }, [clearAutoStopTimer, resetVoiceState, transcribeAudio]);

  finishRecordingRef.current = finishRecording;

  const startVoice = useCallback(async () => {
    if (disabled || busyRef.current) {
      return;
    }

    busyRef.current = true;
    if (mountedRef.current) {
      setIsLoading(true);
    }

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        resetVoiceState();
        onErrorRef.current?.(
          'Microphone permission is needed for voice search.',
        );
        return;
      }

      await Sound.startRecorder(undefined, AUDIO_SETTINGS, false);
      recordingRef.current = true;

      if (mountedRef.current) {
        setIsListening(true);
        setIsLoading(false);
      }

      autoStopTimerRef.current = setTimeout(() => {
        finishRecordingRef.current?.();
      }, MAX_RECORDING_MS);
    } catch (error) {
      resetVoiceState();
      onErrorRef.current?.(
        'Voice recording could not start. Please check microphone permission and try again.',
      );
    }
  }, [disabled, requestPermission, resetVoiceState]);

  const stopVoice = useCallback(async () => {
    await finishRecording();
  }, [finishRecording]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearAutoStopTimer();

      if (recordingRef.current) {
        recordingRef.current = false;
        Sound.stopRecorder().catch(() => {});
      }
    };
  }, [clearAutoStopTimer]);

  return {isListening, isLoading, startVoice, stopVoice};
};

export default useVoiceSearch;
