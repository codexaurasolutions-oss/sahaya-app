import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import { ImageConstant } from '../../Constants/ImageConstant';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import Input from '../../Component/Input';
import Button from '../../Component/Button';
import SimpleToast from 'react-native-simple-toast';
import { GET_WITH_TOKEN } from '../../Backend/Backend';
import { SUBSCRIPTION_USER_CURRENT } from '../../Backend/api_routes';

const AIJobSearch = ({navigation}) => {
  const [Describe, setDescribe] = useState('');
  const [checking, setChecking] = useState(false);

  // AI job search requires an active membership. Staff start on a free plan at
  // signup; once that is exhausted, they must pick a membership to continue.
  const handleFindJobs = () => {
    if (checking) return;
    setChecking(true);
    GET_WITH_TOKEN(
      SUBSCRIPTION_USER_CURRENT,
      success => {
        setChecking(false);
        const subscription = success?.data || success?.subscription;
        const hasActiveSubscription = success?.is_active &&
          subscription &&
          (Array.isArray(subscription) ? subscription.length > 0 : true);
        if (hasActiveSubscription) {
          navigation.navigate('AIJobResults', { description: Describe });
        } else {
          SimpleToast.show(
            'Your free plan is over. Please purchase a membership to use AI job search.',
            SimpleToast.LONG,
          );
          navigation.navigate('MemberShip', { userType: 2 });
        }
      },
      () => {
        setChecking(false);
        SimpleToast.show(
          'Please purchase a membership to use AI job search.',
          SimpleToast.LONG,
        );
        navigation.navigate('MemberShip', { userType: 2 });
      },
      () => {
        setChecking(false);
        navigation.navigate('MemberShip', { userType: 2 });
      },
    );
  };
  const suggestions = [
    "Housekeeper job near me",
    "Driver job with good salary",
    "Chef job in Bengaluru",
    "Part-time babysitter role",
    "Cook with North Indian cuisine",
  ];
  return (
    <CommanView>
      <HeaderForUser
        title={'AI Job Matching'}
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
            Find your perfect job match
          </Typography>
          <Typography
            type={Font?.Poppins_Regular}
            size={13}
            color="#666"
            style={styles.subtitle}
          >
            Describe the kind of job you're looking for. Try including roles, location, salary expectations or work type.
          </Typography>

          <Input
            mainStyle={{ width: '100%', marginTop: 20 }}
            style_input={styles.inputText}
            placeholder={'Describe what kind of job you want'}
            multiline={true}
            value={Describe}
            onChange={(text) => setDescribe(text)}
            style_inputContainer={{ height: 120, alignItems: 'flex-start', paddingTop: 10 }}
          />

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
            onPress={handleFindJobs}
            linerColor={['#D98579', '#C4706A']}
            title={'Find Jobs'}
            main_style={{ width: '100%' }}
            disabled={checking}
            loader={checking}
          />
        </View>
      </View>
    </CommanView>
  );
};

export default AIJobSearch;

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
});
