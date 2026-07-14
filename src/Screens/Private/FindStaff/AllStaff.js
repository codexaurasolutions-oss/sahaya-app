import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, { useState } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import Button from '../../../Component/Button';
import LocalizedStrings from '../../../Constants/localization';

const AllStaff = ({navigation}) => {
  const [Describe, setDescribe] = useState('');

  const suggestions = [
    "Professional Housekeeper exp.",
    "Experienced Male Driver",
    "Senior Chef with Veg South Indian Cuisine",
    "Dog walker near me",
    "Chef with North Indian & South Indian Cuisine",
  ];

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.FindStaff.title}
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
            {LocalizedStrings.FindStaff.title}
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
              style_inputContainer={{ height: 120, alignItems: 'flex-start', paddingTop: 10, paddingRight: 10 }}
            />
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

          {/* AI Chat Button */}
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() =>
              navigation.push('AiCopilot', {
                mode: 'staffSearch',
                draft: Describe.trim(),
              })
            }
          >
            <View style={styles.chatButtonInner}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>AI</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatBtnTitle}>Chat with Sahayya AI</Text>
                <Text style={styles.chatBtnSubtitle}>
                  {LocalizedStrings.FindStaffAI.Welcome_Desc}
                </Text>
              </View>
              <Text style={styles.chatBtnArrow}>{'>'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={() => navigation.navigate("FindStaff", { description: Describe })}
            linerColor={['#D98579', '#C4706A']}
            title={LocalizedStrings.FindStaffAI.Find_Staff}
            main_style={{ width: '100%' }}
          />
          <TouchableOpacity 
            onPress={() => navigation.navigate("FindStaff", { description: '' })}
            style={styles.secondaryBtn}
          >
            <Typography type={Font?.Poppins_Medium} size={14} color="#D98579">
              {LocalizedStrings.FindStaff.Matching_Candidates || "View Staff in My Area"}
            </Typography>
          </TouchableOpacity>
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
  chatButton: {
    marginTop: 20,
    marginHorizontal: 4,
    backgroundColor: '#F0FAF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B8E6E0',
    overflow: 'hidden',
  },
  chatButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#029991',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    color: '#FFF',
    fontFamily: Font.Poppins_Bold,
    fontSize: 14,
  },
  chatBtnTitle: {
    fontFamily: Font.Poppins_SemiBold,
    fontSize: 14,
    color: '#1a1a1a',
  },
  chatBtnSubtitle: {
    fontFamily: Font.Poppins_Regular,
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chatBtnArrow: {
    fontSize: 24,
    color: '#029991',
    fontFamily: Font.Poppins_Bold,
  },
  buttonContainer: {
    paddingBottom: 15,
  },
  secondaryBtn: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
  },
});
