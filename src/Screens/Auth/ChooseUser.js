import { StyleSheet, View, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import CommanView from '../../Component/CommanView';
import Header from '../../Component/Header';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import { useDispatch } from 'react-redux';
import { userType } from '../../Redux/action';
import LocalizedStrings from '../../Constants/localization';
import { POST_WITH_TOKEN } from '../../Backend/Backend';
import { PROFILE_UPDATE } from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';

const ChooseUser = ({ navigation }) => {
  const [user, setUser] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const Dispatch = useDispatch();

  const goToPlanScreen = roleId => {
    navigation.navigate('ChoosePlan', {
      userType: roleId,
      autoFreeOnMount: String(roleId) === '2',
    });
  };

  const saveRoleAndProceed = roleId => {
    if (isLoading) return;
    setIsLoading(true);
    Dispatch(userType(roleId));

    POST_WITH_TOKEN(
      PROFILE_UPDATE,
      { user_role_id: roleId, is_edit: '0' },
      () => {
        setIsLoading(false);
        goToPlanScreen(roleId);
      },
      errorResponse => {
        setIsLoading(false);
        SimpleToast.show(
          errorResponse?.data?.message ||
          errorResponse?.message ||
          'Could not save role. Please try again.',
          SimpleToast.SHORT,
        );
      },
      fail => {
        setIsLoading(false);
        SimpleToast.show(
          fail?.msg || fail?.message || 'Network error. Please try again.',
          SimpleToast.SHORT,
        );
      },
    );
  };

  return (
    <CommanView>
      {/* Header */}
      <Header
        title={LocalizedStrings.ChooseUser?.title || 'Choose Role'}
        style_title={{ fontFamily: Font?.Manrope_SemiBold }}
        centerIcon={true}
        centerIconSource={ImageConstant?.logo}
      />

      {/* Middle Content */}
      <View style={styles.container}>
        <Typography
          size={20}
          type={Font?.Poppins_SemiBold}
          style={{ marginBottom: 30 }}
        >
          {LocalizedStrings.ChooseUser?.continue_as || 'Continue as'}
        </Typography>

        {/* House Owner Button */}
        <TouchableOpacity
          style={[
            styles.button,
            user === 3 ? styles.filledButton : styles?.outlinedButton,
          ]}
          onPress={() => {
            setUser(3);
            Dispatch(userType(3));
          }}
        >
          <Typography
            type={Font?.Poppins_Medium}
            size={16}
            color={user === 3 ? '#fff' : '#D98579'}
          >
            {LocalizedStrings.ChooseUser?.house_owner || 'House Owner'}
          </Typography>
        </TouchableOpacity>

        {/* Staff Button */}
        <TouchableOpacity
          style={[
            styles.button,
            user === 2 ? styles.filledButton : styles?.outlinedButton,
          ]}
          onPress={() => {
            setUser(2);
            Dispatch(userType(2));
          }}
        >
          <Typography
            type={Font?.Poppins_Medium}
            size={16}
            color={user === 2 ? '#fff' : '#D98579'}
          >
            {LocalizedStrings.ChooseUser?.staff || 'Staff'}
          </Typography>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flex: 1,
          width: '100%',
          alignItems: 'center',
          bottom: 0,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          title={LocalizedStrings.ChooseUser?.continue || 'Continue'}
          onPress={() => {
            saveRoleAndProceed(user);
          }}
          main_style={{ marginTop: 20, width: '80%' }}
          disabled={isLoading}
          loader={isLoading}
        />
      </View>
    </CommanView>
  );
};

export default ChooseUser;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  button: {
    paddingVertical: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
    width: '80%',
  },
  filledButton: {
    backgroundColor: '#D98579',
  },
  outlinedButton: {
    borderWidth: 1,
    borderColor: '#D98579',
    backgroundColor: '#fff',
  },
});
