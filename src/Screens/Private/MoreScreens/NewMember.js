import { Image, StyleSheet, View, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import DropdownComponent from '../../../Component/DropdownComponent';
import Button from '../../../Component/Button';
import Date_Picker from '../../../Component/Date_Picker';
import { POST_FORM_DATA } from '../../../Backend/Backend';
import { AddUser, UpdateMember } from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';
import LocalizedStrings from '../../../Constants/localization';
import { validators } from '../../../Backend/Validator';

const NewMember = ({ navigation, route }) => {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [relation, setRelation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Error states
  const [errors, setErrors] = useState({
    fullName: '',
    mobileNumber: '',
    gender: '',
    dateOfBirth: '',
    relation: '',
  });

  const routeData = route?.params?.data;
  useEffect(() => {
    setFullName(routeData?.name);
    setMobileNumber(routeData?.phone_number);
    setGender(routeData?.gender);
    setDateOfBirth(routeData?.dob);
    setRelation(routeData?.relation);
  }, [routeData]);

  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  const relationOptions = [
    {
      label: LocalizedStrings.FamilyMembers.relation_brother || 'brother',
      value: 'brother',
    },
    {
      label: LocalizedStrings.FamilyMembers.relation_sister || 'sister',
      value: 'sister',
    },
    {
      label: LocalizedStrings.FamilyMembers.relation_father || 'father',
      value: 'father',
    },
    {
      label: LocalizedStrings.FamilyMembers.relation_mother || 'mother',
      value: 'mother',
    },
    {
      label: LocalizedStrings.FamilyMembers.relation_son || 'son',
      value: 'son',
    },
    {
      label: LocalizedStrings.FamilyMembers.relation_daughter || 'daughter',
      value: 'daughter',
    },
    {
      label: LocalizedStrings.FamilyMembers.relation_spouse || 'spouse',
      value: 'spouse',
    },
  ];

  // Clear error when field changes
  const handleFullNameChange = value => {
    setFullName(value);
    if (errors.fullName) {
      setErrors(prev => ({ ...prev, fullName: '' }));
    }
  };

  const handleMobileChange = value => {
    setMobileNumber(value);
    if (errors.mobileNumber) {
      setErrors(prev => ({ ...prev, mobileNumber: '' }));
    }
  };

  const handleGenderChange = value => {
    setGender(value);
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: '' }));
    }
  };

  const handleDateChange = selectedDate => {
    const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
    setDateOfBirth(formattedDate);
    if (errors.dateOfBirth) {
      setErrors(prev => ({ ...prev, dateOfBirth: '' }));
    }
  };

  const handleRelationChange = value => {
    setRelation(value);
    if (errors.relation) {
      setErrors(prev => ({ ...prev, relation: '' }));
    }
  };

  const handleSave = () => {
    if (loading) return;
    // Reset errors
    const newErrors = {
      fullName: '',
      mobileNumber: '',
      gender: '',
      dateOfBirth: '',
      relation: '',
    };
    let hasError = false;

    // Validate Full Name
    const nameError = validators.checkAlphabet('Full Name', 2, 50, fullName);
    if (nameError) {
      newErrors.fullName = nameError;
      hasError = true;
    }

    // Validate Mobile Number
    const mobileError = validators.checkFixPhoneNumber(
      'Mobile Number',
      mobileNumber,
      10,
      15,
    );
    if (mobileError) {
      newErrors.mobileNumber = mobileError;
      hasError = true;
    }

    // Validate Gender
    if (!gender || (!gender?.value && !gender)) {
      newErrors.gender = 'Please select gender';
      hasError = true;
    }

    // Validate Date of Birth
    if (!dateOfBirth || dateOfBirth.trim() === '') {
      newErrors.dateOfBirth = 'Please select date of birth';
      hasError = true;
    } else {
      // Validate that date of birth is not in future
      const selectedDate = moment(dateOfBirth);
      const today = moment();
      if (selectedDate.isAfter(today)) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
        hasError = true;
      }
    }

    // Validate Relation
    if (!relation || (!relation?.value && !relation)) {
      newErrors.relation = 'Please select relation';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('mobile_number', mobileNumber);
    formData.append('gender', gender?.value || gender);
    formData.append('dob', dateOfBirth);
    formData.append('relation', relation?.value || relation);
    const api_routes = routeData?.id
      ? `${UpdateMember}/${routeData.id}`
      : AddUser;

    POST_FORM_DATA(
      api_routes,
      formData,
      success => {
        SimpleToast.show(
          LocalizedStrings.AddNewMember.member_added_success ||
            'Member added successfully!',
          SimpleToast.SHORT,
        );
        setLoading(false);
        navigation?.goBack();
      },
      error => {
        console.log('storeNewMember error raw:', JSON.stringify(error));
        let errMsg;
        try {
          const body =
            (error && error.errors) || (error && error.message) || (error && error.error)
              ? error
              : error?.data || error?.response?.data || error || {};
          if (body?.errors && typeof body.errors === 'object') {
            const lines = [];
            Object.keys(body.errors).forEach(k => {
              const v = body.errors[k];
              if (Array.isArray(v)) lines.push(`${k}: ${v.join(', ')}`);
              else lines.push(`${k}: ${v}`);
            });
            errMsg = lines.join('\n') || 'Validation error';
          } else if (body?.message) {
            errMsg = body.message;
          } else if (body?.error) {
            errMsg = body.error;
          } else if (typeof body === 'string' && body.length > 10) {
            errMsg = 'Server error. Please try again.';
          } else {
            errMsg = LocalizedStrings.AddNewMember.failed_to_add || 'Failed to add member';
          }
        } catch (e) {
          errMsg = LocalizedStrings.AddNewMember.failed_to_add || 'Failed to add member';
        }
        SimpleToast.show(String(errMsg).slice(0, 200), SimpleToast.LONG);
        setLoading(false);
      },
      fail => {
        SimpleToast.show(
          LocalizedStrings.AddNewMember.network_error ||
            'Network error. Please try again.',
          SimpleToast.SHORT,
        );
        setLoading(false);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.AddNewMember.title}
        onPressLeftIcon={() => navigation?.goBack()}
        source_arrow={ImageConstant?.BackArrow}
        style_title={{ fontSize: 18 }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 10,
            }}
          >
            <Image
              source={ImageConstant?.person}
              style={{ height: 22, width: 22, marginRight: 8 }}
            />
            <Typography type={Font.Poppins_SemiBold} size={17}>
              {LocalizedStrings.AddNewMember.personal_details}
            </Typography>
          </View>

          <Input
            title={LocalizedStrings.AddNewMember.full_name}
            // placeholder={LocalizedStrings.AddNewMember.full_name_placeholder}
            value={fullName}
            onChange={handleFullNameChange}
            error={errors.fullName}
          />
          <Input
            title={LocalizedStrings.AddNewMember.mobile_number}
            // placeholder={LocalizedStrings.AddNewMember.mobile_placeholder}
            value={mobileNumber}
            onChange={handleMobileChange}
            keyboardType="numeric"
            error={errors.mobileNumber}
          />
          <DropdownComponent
            title={LocalizedStrings.AddNewMember.gender}
            // placeholder={LocalizedStrings.AddNewMember.select_gender || 'Select Gender'}
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            data={genderOptions}
            value={gender}
            onChange={handleGenderChange}
            error={errors.gender}
          />
          <Date_Picker
            title={LocalizedStrings.AddNewMember.date_of_birth}
            placeholder={'DD-MM-YYYY'}
            selected_date={dateOfBirth}
            onConfirm={handleDateChange}
            allowFutureDates={false}
            error={errors.dateOfBirth}
          />
          <DropdownComponent
            title={LocalizedStrings.AddNewMember.relation || 'Relation'}
            // placeholder={LocalizedStrings.AddNewMember.select_relation || 'Select Relation'}
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            dropdownPosition="top"
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            data={relationOptions}
            value={relation}
            onChange={handleRelationChange}
            error={errors.relation}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={LocalizedStrings.AddNewMember.save_confirm || 'Save'}
            onPress={handleSave}
            main_style={styles.buttonStyle}
            // disabled={loading}
          />
        </View>
      </ScrollView>
    </CommanView>
  );
};

export default NewMember;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonStyle: {
    width: '100%',
  },
});
