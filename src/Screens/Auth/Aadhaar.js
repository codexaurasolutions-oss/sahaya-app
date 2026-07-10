import { StyleSheet, View } from 'react-native';
import CommanView from '../../Component/CommanView';
import Header from '../../Component/Header';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import Input from '../../Component/Input';
import { useState } from 'react';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import { validators } from '../../Backend/Validator';
import { isValidForm } from '../../Backend/Utility';
import { POST_FORM_DATA, POST_WITH_TOKEN } from '../../Backend/Backend';
import { AADHAR_SAVE, DELETE_ACCOUNT, LOGOUT } from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../Constants/localization';
import { useDispatch } from 'react-redux';
import { isAuth, userDetails } from '../../Redux/action';

const Aadhaar = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const Dispatch = useDispatch();

  const SaveAddhar = () => {
    let error = {
      add_error: validators?.checkRequire('Aadhaar Number', mobile),
    };
    if (!mobile || !/^[0-9]{12}$/.test(mobile)) {
      const errMsg = 'Aadhaar number must be 12 digits';
      setError({ add_error: errMsg });
      return;
    }
    setError(error);
    if (isValidForm(error)) {
      setIsLoading(true);
      let data = new FormData();
      data?.append('aadhar_number', mobile);
      console.log('Saving Aadhaar:', mobile);

      POST_FORM_DATA(
        AADHAR_SAVE,
        data,
        sucess => {
          setIsLoading(false);
          SimpleToast.show(sucess?.message || 'OTP Sent', SimpleToast.SHORT);
          const userId = sucess?.data?.user_id || sucess?.data?.id;
          navigation?.navigate('AadharOtp', { 
            mobile: mobile,
            user_id: userId,
            aadhar_number: mobile 
          });
        },
        error => {
          setIsLoading(false);
          console.log('Aadhaar Save Error:', error);

          let errorMsg = 'Something went wrong';
          if (Array.isArray(error?.data?.errors?.aadhar_number) && error.data.errors.aadhar_number.length > 0) {
            errorMsg = error.data.errors.aadhar_number[0];
          } else if (error?.data?.message) {
            errorMsg = error.data.message;
          } else if (error?.message) {
            errorMsg = error.message;
          }

          setError({ add_error: errorMsg });
          SimpleToast.show(errorMsg, SimpleToast.LONG);
        },
        fail => {
          setIsLoading(false);
          console.log('Aadhaar Save Fail:', fail);
          SimpleToast.show('Network Error. Please try again.', SimpleToast.SHORT);
        },
      );
    }
  };

  const confirmLogout = () => {
    POST_WITH_TOKEN(
      DELETE_ACCOUNT,
      {},
      success => {
        // SimpleToast.show(
        //   success?.message ||
        //     LocalizedStrings.Settings?.accountDeletedSuccess ||
        //     'Account deleted successfully',
        //   SimpleToast.SHORT,
        // );
        // Logout user after account deletion
        Dispatch(isAuth(false));
        Dispatch(userDetails({}));
      },
      error => {
        SimpleToast.show(
          error?.message ||
          LocalizedStrings.Settings?.accountDeleteFailed ||
          'Failed to delete account',
          SimpleToast.SHORT,
        );
      },
      fail => {
        SimpleToast.show(
          LocalizedStrings.Settings?.networkError ||
          'Network error. Please try again.',
          SimpleToast.SHORT,
        );
      },
    );
  };

  return (
    <CommanView>
      <Header
        title={LocalizedStrings.Auth?.aadhaar_number || 'Aadhaar Number'}
        style_title={{ fontFamily: Font?.Manrope_SemiBold }}
        source_arrow={ImageConstant?.BackArrow}
        onBackPressFun={confirmLogout}
        centerIcon={true}
        onBackPress={true}
        centerIconSource={ImageConstant?.logo}
      />

      <View
        style={{
          borderWidth: 1,
          borderColor: '#EBEBEA',
          padding: 20,
          borderRadius: 12,
        }}
      >
        {/* <GooglePlacesInput
        apiKey="AIzaSyC_NIogrb_hZ34PeXkYeb3KbAxjddn7wgk"
        onPlaceSelected={()=>{}}
        showIcon={true}
      /> */}
        <Input
          showTitle
          placeholder={
            LocalizedStrings.Auth?.aadhaar_placeholder ||
            'Enter 12-digit Aadhaar Number'
          }
          value={mobile}
          onChange={text => setMobile(text)}
          maxLength={12}
          style_input={styles.inputText}
          title={LocalizedStrings.Auth?.aadhaar_number || 'Aadhaar Number'}
          placeholderTextColor={'#00000080'}
          keyboardType="number-pad"
          error={error?.add_error}
        />

        <Button
          title={LocalizedStrings.Auth?.verify || 'Verify'}
          onPress={() => SaveAddhar()}
          style={{ marginTop: 20 }}
          icon={ImageConstant?.Arrow}
          loader={isLoading}
          disabled={isLoading}
        />

        <Typography size={12} textAlign={'center'} style={{ marginTop: 30 }}>
          {LocalizedStrings.Auth?.aadhaar_info ||
            'We use Aadhaar for identity verification and to prevent fraudulent listings, enhancing trust within the Sahayya community.'}
        </Typography>
      </View>
    </CommanView>
  );
};

export default Aadhaar;

const styles = StyleSheet.create({
  inputText: {
    color: '#000',
  },
});
