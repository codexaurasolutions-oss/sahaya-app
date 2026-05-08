import { StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator, NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import Button from '../../../Component/Button';
import LocalizedStrings from '../../../Constants/localization';
import SimpleToast from 'react-native-simple-toast';

const AllStaff = ({navigation}) => {
  const [Describe, setDescribe] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognizerRef = useRef(null);
  
  const suggestions = [
    "Professional Housekeeper exp.",
    "Experienced Male Driver",
    "Senior Chef with Veg South Indian Cuisine",
    "Dog walker near me",
    "Chef with North Indian & South Indian Cuisine",
  ];

  const requestMicPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          { title: 'Microphone Permission', message: 'App needs microphone for voice search' }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (e) {
        return false;
      }
    }
    return true;
  };

  const toggleVoiceRecognition = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      SimpleToast.show('Microphone permission denied', SimpleToast.SHORT);
      return;
    }

    try {
      // Use Android's built-in SpeechRecognizer via Intent
      const { SpeechRecognizer } = NativeModules;
      
      if (SpeechRecognizer && SpeechRecognizer.startListening) {
        setIsRecording(true);
        setDescribe('');
        SpeechRecognizer.startListening('en-US', (result) => {
          setIsRecording(false);
          if (result) setDescribe(result);
        }, (error) => {
          setIsRecording(false);
          SimpleToast.show('Voice not available. Please type your search.', SimpleToast.SHORT);
        });
      } else {
        // Fallback — show message
        SimpleToast.show('Voice search not available on this device. Please type your search.', SimpleToast.SHORT);
      }
    } catch (e) {
      setIsRecording(false);
      SimpleToast.show('Voice search not available. Please type your search.', SimpleToast.SHORT);
    }
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.FindStaffAI.title}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        style_title={{ fontSize: 18 }}
      />

      <View style={styles.container}>
        <View style={styles.content}>
          <Typography
            type={Font?.Poppins_SemiBold}
            size={24}
            style={styles.heading}
          >
            {LocalizedStrings.FindStaffAI.Welcome_Title}
          </Typography>
          <Typography
            type={Font?.Poppins_Regular}
            size={13}
            color="#666"
            style={styles.subtitle}
          >
            {LocalizedStrings.FindStaffAI.Welcome_Desc}
          </Typography>

          <View style={{ position: 'relative', width: '100%', marginTop: 20 }}>
            <Input
              mainStyle={{ width: '100%' }}
              style_input={styles.inputText}
              placeholder={LocalizedStrings.FindStaffAI.Describe_Requirements}
              multiline={true}
              value={Describe}
              onChange={(text) => setDescribe(text)}
              style_inputContainer={{ height: 120, alignItems: 'flex-start', paddingTop: 10, paddingRight: 50 }}
            />
            
            {/* Voice Input Button */}
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isRecording && styles.voiceButtonActive,
              ]}
              onPress={toggleVoiceRecognition}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Typography size={20} color="#fff">
                  🎤
                </Typography>
              )}
            </TouchableOpacity>

            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Typography size={12} color="#D98579" type={Font.Poppins_Medium}>
                  Listening...
                </Typography>
              </View>
            )}
          </View>

          <View style={styles.suggestionContainer}>
            {suggestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.suggestionChip,
                  Describe === item && styles.suggestionChipActive,
                ]}
                onPress={() => setDescribe(item)}
              >
                <Text style={[
                  styles.suggestionText,
                  Describe === item && styles.suggestionTextActive,
                ]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={() => navigation.navigate("FindStaff", { description: Describe })}
            linerColor={['#D98579', '#C4706A']}
            title={LocalizedStrings.FindStaffAI.Find_Staff}
            main_style={{ width: '100%' }}
          />
        </View>
      </View>
    </CommanView>
  );
};

export default AllStaff;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    paddingTop: 25,
  },
  heading: {
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  inputText: {
    color: '#000',
    height: 120,
    textAlignVertical: 'top',
  },
  suggestionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  suggestionChip: {
    backgroundColor: '#F2F4F7',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    margin: 4,
  },
  suggestionChipActive: {
    backgroundColor: '#FFF5EE',
    borderWidth: 1,
    borderColor: '#D98579',
  },
  suggestionText: {
    fontSize: 12,
    color: '#344054',
    fontFamily: Font.Poppins_Medium,
  },
  suggestionTextActive: {
    color: '#D98579',
  },
  buttonContainer: {
    paddingBottom: 15,
  },
  voiceButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D98579',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  voiceButtonActive: {
    backgroundColor: '#FF4444',
  },
  voiceIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  voiceIconActive: {
    tintColor: '#fff',
  },
  recordingIndicator: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D98579',
    marginRight: 6,
  },
});
