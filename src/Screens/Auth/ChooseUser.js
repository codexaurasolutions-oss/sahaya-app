import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import CommanView from '../../Component/CommanView';
import Header from '../../Component/Header';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import { useDispatch, useSelector } from 'react-redux';
import { isAuth, userType } from '../../Redux/action';
import LocalizedStrings from '../../Constants/localization';
import { POST_FORM_DATA, POST_WITH_TOKEN, GET_WITH_TOKEN } from '../../Backend/Backend';
import { PROFILE_UPDATE, SUBSCRIPTIONS, SUBSCRIPTION_USER_SUBSCRIBE } from '../../Backend/api_routes';

const ChooseUser = ({ navigation }) => {
  const userTypes = useSelector(store => store?.userType);
  const [user, setUser] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const Dispatch = useDispatch();

  // During signup flow always show ChoosePlan so user can pick a plan
  // and then see the referral code screen (ApplyReferral) afterwards.
  // Staff (role 2) get autoFreeOnMount=true so they are auto-subscribed
  // to the free plan without needing to manually tap "Select Plan".
  const checkSubscriptionAndProceed = (roleId) => {
    if (String(roleId) === '2') {
      // For Staff, auto-subscribe to free plan and skip ChoosePlan screen
      setIsLoading(true);

      // First fetch subscriptions to find the free one for staff
      GET_WITH_TOKEN(
        SUBSCRIPTIONS,
        success => {
          const subscriptionData = success?.data;
          if (subscriptionData && Array.isArray(subscriptionData)) {
            // Find free plan for staff (role 2)
            const freePlan = subscriptionData.find(plan => {
              const planRole = plan?.role_id || plan?.user_role_id;
              const isFree = !plan?.price || plan.price === '0' || plan.price === '0.00';
              return isFree && String(planRole) === '2';
            });

            if (freePlan) {
              // Auto-subscribe to the free plan
              POST_WITH_TOKEN(
                SUBSCRIPTION_USER_SUBSCRIBE,
                { subscriptionId: freePlan.id, paymentId: null },
                subSuccess => {
                  setIsLoading(false);
                  navigation.navigate('ApplyReferral', { isFirstTime: true });
                },
                subError => {
                  setIsLoading(false);
                  navigation.navigate('ChoosePlan', {
                    userType: roleId,
                    autoFreeOnMount: false,
                  });
                }
              );
            } else {
              setIsLoading(false);
              navigation.navigate('ChoosePlan', {
                userType: roleId,
                autoFreeOnMount: false,
              });
            }
          } else {
            setIsLoading(false);
            navigation.navigate('ChoosePlan', {
              userType: roleId,
              autoFreeOnMount: false,
            });
          }
        },
        error => {
          setIsLoading(false);
          navigation.navigate('ChoosePlan', {
            userType: roleId,
            autoFreeOnMount: false,
          });
        }
      );
      return;
    }

    // For non-staff roles, go to ChoosePlan
    navigation.navigate('ChoosePlan', {
      userType: roleId,
      autoFreeOnMount: false,
    });
  };

  const SendStepsApi = (type) => {
    const formData = new FormData();
    formData.append('user_role_id', type);
    formData.append('is_edit', 0);
    POST_FORM_DATA(
      PROFILE_UPDATE,
      formData,
      sucess => {
        console.log('SendStepsApi---sucess====', sucess);
      },
      errorResponse => {
        console.log('errorResponse===', errorResponse);
      },
      fail => {
        console.log('fail====', fail);
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
            user == 3 ? styles.filledButton : styles?.outlinedButton,
          ]}
          onPress={() => {
            SendStepsApi(3);
            setUser(3), Dispatch(userType(3));
          }}
        >
          <Typography
            type={Font?.Poppins_Medium}
            size={16}
            color={user == 3 ? '#fff' : '#D98579'}
          >
            {LocalizedStrings.ChooseUser?.house_owner || 'House Owner'}
          </Typography>
        </TouchableOpacity>

        {/* Staff Button */}
        <TouchableOpacity
          style={[
            styles.button,
            user == 2 ? styles.filledButton : styles?.outlinedButton,
          ]}
          onPress={() => {
            SendStepsApi(2);
            setUser(2), Dispatch(userType(2));
          }}
        >
          <Typography
            type={Font?.Poppins_Medium}
            size={16}
            color={user == 2 ? '#fff' : '#D98579'}
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
            Dispatch(userType(user));
            checkSubscriptionAndProceed(user);
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
