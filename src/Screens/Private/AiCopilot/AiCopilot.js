import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice from '@react-native-voice/voice';
import {useSelector} from 'react-redux';
import HeaderForUser from '../../../Component/HeaderForUser';
import {POST_WITH_TOKEN} from '../../../Backend/Backend';
import {AI_COPILOT_CHAT} from '../../../Backend/api_routes';
import {Font} from '../../../Constants/Font';
import {ImageConstant} from '../../../Constants/ImageConstant';

const VOICE_LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
};

const OWNER_SUGGESTIONS = [
  'Find a cook near me',
  'Show staff absent this month',
  'How much salary did I pay last month?',
  'When will my membership expire?',
];

const STAFF_SUGGESTIONS = [
  'Show driver jobs near me',
  'What is my application status?',
  'What is my salary this month?',
  'How many credits do I have?',
];

const AiCopilot = ({navigation}) => {
  const userDetail = useSelector(store => store?.userDetails);
  const isOwner = Number(userDetail?.user_role_id) === 3;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLocale, setVoiceLocale] = useState('en-IN');

  const scrollRef = useRef(null);
  const messagesRef = useRef([]);
  const loadingRef = useRef(false);
  const speechResultsRef = useRef(null);
  const speechErrorRef = useRef(null);
  const voiceBusyRef = useRef(false);

  useEffect(() => {
    const greeting = isOwner
      ? "Hi! I'm Sahayya AI. I can help you find staff, check attendance, salary details, or membership info. How can I help?"
      : "Hi! I'm Sahayya AI. I can help you find jobs, check application status, salary info, or credits. How can I help?";

    setMessages([{role: 'assistant', content: greeting}]);
  }, [isOwner]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const lang = await AsyncStorage.getItem('LANGUAGE');
        if (lang && VOICE_LOCALE_MAP[lang]) {
          setVoiceLocale(VOICE_LOCALE_MAP[lang]);
        }
      } catch (error) {}
    };

    loadLanguage();
  }, []);

  const finishLoading = () => {
    loadingRef.current = false;
    setLoading(false);
  };

  const appendAssistantMessage = content => {
    setMessages(prev => [...prev, {role: 'assistant', content}]);
  };

  const sendMessage = async text => {
    const msgText = (text || input).trim();
    if (!msgText || loadingRef.current) {
      return;
    }

    Keyboard.dismiss();

    const currentMessages = messagesRef.current;
    const userMsg = {role: 'user', content: msgText};
    setMessages([...currentMessages, userMsg]);
    setInput('');
    loadingRef.current = true;
    setLoading(true);

    const history = currentMessages
      .slice(1)
      .slice(-20)
      .map(message => ({
        role: message.role,
        content: message.content,
      }));

    POST_WITH_TOKEN(
      AI_COPILOT_CHAT,
      {message: msgText, history},
      success => {
        appendAssistantMessage(
          success?.reply || "I couldn't process that. Please try again.",
        );
        finishLoading();
      },
      error => {
        appendAssistantMessage(
          error?.reply || error?.message || 'Something went wrong. Please try again.',
        );
        finishLoading();
      },
      () => {
        appendAssistantMessage('Network error. Please check your connection.');
        finishLoading();
      },
    );
  };

  const onSpeechResults = event => {
    const transcript = event.value?.[0]?.trim() || '';
    voiceBusyRef.current = false;
    setVoiceLoading(false);
    setIsListening(false);

    if (transcript) {
      setInput(transcript);
      sendMessage(transcript);
    }
  };

  const onSpeechError = event => {
    voiceBusyRef.current = false;
    setVoiceLoading(false);
    setIsListening(false);
    const errorCode = String(event?.error?.code || '');
    const permissionError = errorCode === '9' || errorCode === 'permission';
    appendAssistantMessage(
      permissionError
        ? 'Microphone permission is off. Please allow it in app settings and try again.'
        : 'I could not hear that clearly. Please try the mic again or type your question.',
    );
  };

  speechResultsRef.current = onSpeechResults;
  speechErrorRef.current = onSpeechError;

  useEffect(() => {
    Voice.onSpeechResults = event => speechResultsRef.current?.(event);
    Voice.onSpeechError = event => speechErrorRef.current?.(event);

    return () => {
      voiceBusyRef.current = false;
      Voice.destroy()
        .catch(() => {})
        .finally(() => Voice.removeAllListeners());
    };
  }, []);

  const requestVoicePermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone permission',
        message: 'Sahayya AI needs microphone access to convert your voice into text.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const startVoice = async () => {
    if (voiceBusyRef.current || loadingRef.current) return;
    voiceBusyRef.current = true;

    try {
      const hasPermission = await requestVoicePermission();
      if (!hasPermission) {
        voiceBusyRef.current = false;
        appendAssistantMessage('Microphone permission is needed for voice input.');
        return;
      }

      let isAvailable = true;
      try {
        isAvailable = Boolean(await Voice.isAvailable());
      } catch (availabilityError) {
        isAvailable = true;
      }
      if (!isAvailable) {
        voiceBusyRef.current = false;
        appendAssistantMessage(
          'Voice recognition is not available on this phone. Please enable or install the Google speech service.',
        );
        return;
      }

      setVoiceLoading(true);
      setIsListening(true);

      const recognitionOptions = {
        REQUEST_PERMISSIONS_AUTO: false,
        EXTRA_MAX_RESULTS: 1,
        EXTRA_PARTIAL_RESULTS: false,
      };

      try {
        await Voice.start(voiceLocale, recognitionOptions);
      } catch (primaryError) {
        await Voice.destroy().catch(() => {});
        await Voice.start('en-IN', {
          ...recognitionOptions,
        });
      }
      setVoiceLoading(false);
    } catch (error) {
      voiceBusyRef.current = false;
      setVoiceLoading(false);
      setIsListening(false);
      appendAssistantMessage(
        'Voice input could not start. Please check microphone permission and the phone speech service, then try again.',
      );
    }
  };

  const stopVoice = async () => {
    try {
      await Voice.stop();
    } catch (error) {
    } finally {
      voiceBusyRef.current = false;
      setVoiceLoading(false);
      setIsListening(false);
    }
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';

    return (
      <View
        key={`${msg.role}-${index}`}
        style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>AI</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContent,
            isUser ? styles.userContent : styles.aiContent,
          ]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {msg.content}
          </Text>
        </View>
      </View>
    );
  };

  const suggestions = isOwner ? OWNER_SUGGESTIONS : STAFF_SUGGESTIONS;
  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <SafeAreaView style={styles.container}>
      <HeaderForUser
        title="Sahayya AI"
        navigation={navigation}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        style_title={styles.headerTitle}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated: true})}>
          {messages.map((msg, index) => renderMessage(msg, index))}

          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map(suggestion => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(suggestion)}
                  activeOpacity={0.7}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>AI</Text>
              </View>
              <View style={[styles.messageContent, styles.aiContent]}>
                <ActivityIndicator size="small" color="#D98579" />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <TouchableOpacity
            style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
            onPress={isListening ? stopVoice : startVoice}
            disabled={loading || voiceLoading}
            activeOpacity={0.8}>
            {voiceLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.voiceBtnText}>{isListening ? 'Stop' : 'Mic'}</Text>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder={
              isOwner
                ? 'Ask about staff, attendance, salary...'
                : 'Ask about jobs, salary, credits...'
            }
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AiCopilot;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F6',
  },
  flex: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D98579',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  aiAvatarText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Font.Poppins_Bold,
  },
  messageContent: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userContent: {
    backgroundColor: '#D98579',
    borderBottomRightRadius: 4,
  },
  aiContent: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
    fontFamily: Font.Poppins_Regular,
  },
  aiText: {
    color: '#333',
    fontFamily: Font.Poppins_Regular,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    marginLeft: 40,
  },
  suggestionChip: {
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#D98579',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    color: '#D98579',
    fontSize: 13,
    fontFamily: Font.Poppins_Regular,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#fff',
  },
  voiceBtn: {
    width: 48,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D98579',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceBtnActive: {
    backgroundColor: '#E74C3C',
  },
  voiceBtnText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Font.Poppins_SemiBold,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Font.Poppins_Regular,
    color: '#333',
    marginRight: 8,
  },
  sendBtn: {
    width: 52,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D98579',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#E0C4BD',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Font.Poppins_SemiBold,
  },
});
