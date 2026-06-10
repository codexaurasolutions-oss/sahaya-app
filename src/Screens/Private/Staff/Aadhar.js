import { StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import HeaderForUser from '../../../Component/HeaderForUser';
import Button from '../../../Component/Button';
import { useNavigation } from '@react-navigation/native';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';
import { validators } from '../../../Backend/Validator';
import { POST_FORM_DATA } from '../../../Backend/Backend';
import { AADHAR_SAVE } from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';

const buildSafeStaffPayload = rawUser => {
  const user = rawUser && typeof rawUser === 'object' ? rawUser : {};

  return {
    id: user?.id,
    user_id: user?.user_id || user?.id,
    name: user?.name,
    first_name: user?.first_name,
    last_name: user?.last_name,
    email: user?.email,
    phone_number: user?.phone_number || user?.mobile_number || user?.mobile,
    phone_number_prefix:
      user?.phone_number_prefix ||
      user?.phone_number_country_code ||
      user?.country_code,
    gender: user?.gender,
    dob: user?.dob,
    aadhar_number: user?.aadhar_number || user?.aadhaar,
    aadhar__verify: user?.aadhar__verify,
    image: user?.image,
    upi_id: user?.upi_id,
    addresses: Array.isArray(user?.addresses) ? user.addresses : [],
    user_work_info: user?.user_work_info || user?.userWorkInfo || null,
    kyc_information: user?.kyc_information || user?.kycInformation || null,
    aadhar_front: user?.aadhar_front || user?.aadhaar_front || null,
    aadhar_back: user?.aadhar_back || user?.aadhaar_back || null,
    verification_certificate: user?.verification_certificate || null,
  };
};

const Aadhar = () => {
  const navigation = useNavigation();
  const [adharNumber, setAdharNumber] = useState('');
  const [error, setError] = useState({});

  const submit = () => {
    //  return
    let error = {
      add_error: validators?.checkRequire('Aahhaar Number', adharNumber),
    };
    if (!adharNumber || !/^[0-9]{12}$/.test(adharNumber)) {
      const errMsg = 'Aadhaar number must be 12 digits';
      setError({ add_error: errMsg });
      return errMsg;
    }
    setError(error);

    const body = {
      aadhar_number: adharNumber,
      is_staff_add: 1,
    };
    console.log('body---', body);

    POST_FORM_DATA(
      AADHAR_SAVE,
      body,
      sucess => {
        console.log('sucess=------', sucess);
        SimpleToast.show(sucess?.message, SimpleToast.SHORT);
        navigation?.navigate('StaffVerifection', {
          adharNumber: adharNumber,
          userData: buildSafeStaffPayload(sucess?.data),
        });
      },
      error => {
        console.log('error----', error);
        setError({
          add_error: error?.data?.errors?.aadhar_number?.[0] || error?.data?.message || error?.message || 'Something went wrong',
        });
      },
      fail => {
        console.log(fail);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => {
          navigation?.goBack();
        }}
        title={LocalizedStrings.AddStaff.title}
        style_title={styles.headerTitle}
      />

      <View style={styles.formContainer}>
        <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
          {LocalizedStrings.AddStaff.Enter_Staff_Aadhaar}
        </Typography>

        <View style={styles.inputWrapper}>
          <Input
            mainStyle={{ marginTop: -20 }}
            placeholder={LocalizedStrings.AddStaff.Aadhaar_Placeholder}
            keyboardType="number-pad"
            maxLength={12}
            value={adharNumber}
            onChange={text => setAdharNumber(text)}
            title={LocalizedStrings.AddStaff.Aadhaar_Number}
            error={error?.add_error}
          />
        </View>
        <View style={{ marginTop: 40 }}>
          <Button
            onPress={() => submit()}
            title={LocalizedStrings.AddStaff.Submit}
            main_style={styles.buttonStyle}
            icon={ImageConstant?.Arrow}
          />
        </View>
        <Typography type={Font?.Poppins_Regular} style={styles.noteText}>
          {LocalizedStrings.AddStaff.Aadhaar_Info}
        </Typography>
      </View>
    </CommanView>
  );
};

export default Aadhar;

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginTop: 100,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  inputWrapper: {
    marginTop: 40,
  },
  label: {
    fontSize: 16,
    color: '#8C8D8B',
  },
  buttonStyle: {
    width: '100%',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
});
