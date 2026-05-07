import { StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import Button from '../../../Component/Button';
import LocalizedStrings from '../../../Constants/localization';
import SimpleToast from 'react-native-simple-toast';
import Voice from '@react-native-community/voice';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';

const AllStaff = ({navigation}) => {
  const [Describe, setDescribe] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const suggestions = [
    "Professional Housekeeper exp.",
    "Experienced Male Driver",
    "Senior Chef with Veg South Indian Cuisine",
    "Dog walker near me",
    "Chef with North Indian & South Indian Cuisine",
  ];

  React.useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = (e) => {
    console.log('onSpeechStart: ', e);
    setIsRecording(true);
  };

  const onSpeechEnd = (e) => {
    console.log('onSpeechEnd: ', e);
    setIsRecording(false);
  };

  const onSpeechError = (e) => {
    console.log('onSpeechError: ', e);
    setIsRecording(false);
    if (e?.error?.message?.includes('No recognition result matched')) {
      // Ignore silent timeouts
    } else {
      SimpleToast.show('Speech error. Please try again.', SimpleToast.SHORT);
    }
  };

  const onSpeechResults = (e) => {
    console.log('onSpeechResults: ', e);
    if (e.value && e.value.length > 0) {
      setDescribe(e.value[0]);
    }
  };

  const toggleVoiceRecognition = async () => {
    if (isRecording) {
      try {
        await Voice.stop();
        setIsRecording(false);
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        // Check permissions on Android
        if (Platform.OS === 'android') {
          const result = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
          if (result !== RESULTS.GRANTED) {
            SimpleToast.show('Microphone permission is required for voice search.', SimpleToast.LONG);
            return;
          }
        }
        
        setDescribe('');
        await Voice.start('en-IN'); // Use Indian English for better accuracy
      } catch (e) {
        console.error(e);
        SimpleToast.show('Could not start voice recognition.', SimpleToast.SHORT);
      }
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
