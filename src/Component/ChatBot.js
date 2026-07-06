import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Font } from '../Constants/Font';
import { Colors } from '../Constants/Colors';
import { POST_WITH_TOKEN } from '../Backend/Backend';
import { ChatEndpoint } from '../Backend/api_routes';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatBot = ({ visible, onClose, onSearchResults }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      text: "Hi! I'm Sahayya AI. Tell me what kind of staff you're looking for — I'll help you find the perfect match!",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isMountedRef = useRef(true);
  const msgIdCounter = useRef(1);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    const userMsg = {
      id: String(++msgIdCounter.current),
      role: 'user',
      text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    Keyboard.dismiss();

    // Build history for context
    const history = [...messages, userMsg]
      .filter(m => m.id !== '1') // exclude initial greeting
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));

    try {
      POST_WITH_TOKEN(
        ChatEndpoint,
        { message: text, history },
        (response) => {
          if (!isMountedRef.current) return;
          const reply = response?.reply || "I couldn't understand that. Can you rephrase?";
          const action = response?.action;
          const results = response?.results;

          const botMsg = {
            id: String(++msgIdCounter.current),
            role: 'assistant',
            text: reply,
          };

          setMessages(prev => [...prev, botMsg]);

          // If we got search results, pass them up to parent
          if (action === 'search' && results && onSearchResults) {
            onSearchResults(results, response?.filters);
          }

          setLoading(false);
        },
        (error) => {
          if (!isMountedRef.current) return;
          const errorMsg = {
            id: String(++msgIdCounter.current),
            role: 'assistant',
            text: "Sorry, I'm having trouble right now. Please try again or use the search bar directly.",
          };
          setMessages(prev => [...prev, errorMsg]);
          setLoading(false);
        },
        (fail) => {
          if (!isMountedRef.current) return;
          const failMsg = {
            id: String(++msgIdCounter.current),
            role: 'assistant',
            text: "Network error. Please check your connection and try again.",
          };
          setMessages(prev => [...prev, failMsg]);
          setLoading(false);
        },
      );
    } catch (err) {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, { transform: [{ translateY: slideAnim }] }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiAvatar}>
              <Text style={styles.aiAvatarText}>AI</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Sahayya AI</Text>
              <Text style={styles.headerSubtitle}>Ask me anything about staff</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : styles.botText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <ActivityIndicator size="small" color={Colors.blue} />
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

export default ChatBot;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    zIndex: 999,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blue || '#029991',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  aiAvatarText: {
    color: '#FFF',
    fontFamily: Font.Poppins_Bold,
    fontSize: 14,
  },
  headerTitle: {
    fontFamily: Font.Poppins_SemiBold,
    fontSize: 16,
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontFamily: Font.Poppins_Regular,
    fontSize: 12,
    color: '#888',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.blue || '#029991',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFF',
    fontFamily: Font.Poppins_Regular,
  },
  botText: {
    color: '#333',
    fontFamily: Font.Poppins_Regular,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Font.Poppins_Regular,
    color: '#333',
    backgroundColor: '#F8F9FB',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blue || '#029991',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#CCC',
  },
  sendBtnText: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: Font.Poppins_Bold,
    marginTop: -2,
  },
});
