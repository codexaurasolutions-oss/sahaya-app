import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Header from '../../Component/Header';
import { Font } from '../../Constants/Font';
import Button from '../../Component/Button';
import Typography from '../../Component/UI/Typography';
import CommanView from '../../Component/CommanView';
import LocalizedStrings from '../../Constants/localization';
import { setLanguage as saveLanguage } from '../../Constants/AsyncStorage';

const languages = [
  'English',
  'हिंदी (Hindi)',
  'తెలుగు (Telugu)',
  'தமிழ் (Tamil)',
  'ಕನ್ನಡ (Kannada)',
  'മലയാളം (Malayalam)',
  'मराठी (Marathi)',
  'ગુજરાતી (Gujarati)',
  'বাংলা (Bengali)',
  'ਪੰਜਾਬੀ (Punjabi)',
  'ଓଡ଼ିଆ (Odia)',
  'অসমীয়া (Assamese)',
  'नेपाली (Nepali)',
];


const Language = ({ navigation }) => {
  const [selectedLang, setSelectedLang] = useState('English');

  // Set default language to English
  useEffect(() => {
    LocalizedStrings.setLanguage('en');
  }, []);

  const handleLanguageSelect = async language => {
    setSelectedLang(language);

    // Set the language based on selection
    let langCode = 'en'; // default to English
    if (language.includes('हिंदी')) langCode = 'hi';
    else if (language.includes('தமிழ்')) langCode = 'ta';
    else if (language.includes('తెలుగు')) langCode = 'te';
    else if (language.includes('ಕನ್ನಡ')) langCode = 'kn';
    else if (language.includes('മലയാളം')) langCode = 'ml';
    else if (language.includes('मराठी')) langCode = 'mr';
    else if (language.includes('ગુજરાતી')) langCode = 'gu';
    else if (language.includes('বাংলা')) langCode = 'bn';
    else if (language.includes('ਪੰਜਾਬੀ')) langCode = 'pa';
    else if (language.includes('ଓଡ଼ିଆ')) langCode = 'or';
    else if (language.includes('অসমীয়া')) langCode = 'as';
    else if (language.includes('नेपाली')) langCode = 'ne';

    await saveLanguage(langCode);
    LocalizedStrings.setLanguage(langCode);
  };

  return (
    <CommanView >
      <Header
        title={LocalizedStrings.Auth?.language || 'Choose Your Language'}
        style_title={{ fontFamily: Font?.Manrope_SemiBold }}
      />

      {/* Languages List */}
      <FlatList
        data={languages}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ marginTop: 20 }}
        renderItem={({ item }) => {
          const isSelected = selectedLang === item;
          return (
            <TouchableOpacity
              style={[styles.langButton, isSelected && styles.langSelected]}
              onPress={() => handleLanguageSelect(item)}
            >
              <Typography
                type={Font?.Manrope_SemiBold}
                color={isSelected ? '#fff' : '#6B6B6B'}
              >
                {item}
              </Typography>
            </TouchableOpacity>
          );
        }}
      />

      {/* Save & Continue Button */}
      <View style={styles.bottomButton}>
        <Button
          title={LocalizedStrings.Auth?.save_continue || 'Save & Continue'}
          onPress={() => navigation?.navigate('IntroScreen')}
        />
      </View>
    </CommanView>
  );
};

export default Language;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  langButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 5,
    height: 98,
  },
  langSelected: {
    backgroundColor: '#F0C5BD', // your theme color
    borderColor: '#F0C5BD',
  },
  langText: {
    fontFamily: Font?.Manrope_Regular,
    fontSize: 14,
  },
  bottomButton: {
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
});
