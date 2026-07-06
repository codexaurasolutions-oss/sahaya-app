import { StyleSheet, View, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import CommanView from '../../../Component/CommanView';
import Header from '../../../Component/Header';
import { Font } from '../../../Constants/Font';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Input from '../../../Component/Input';
import DropdownComponent from '../../../Component/DropdownComponent';
import Button from '../../../Component/Button';
import StepLocation from '../ProfileSteps/StepLocation';
import StepHousehold from '../ProfileSteps/StepHousehold';
import Typography from '../../../Component/UI/Typography';
import { useDispatch, useSelector } from 'react-redux';
import { isAuth, userDetails } from '../../../Redux/action';
import { useNavigation } from '@react-navigation/native';
import ImageModal from '../../../Component/Modals/ImageModal';
import { POST_FORM_DATA, POST_WITH_TOKEN } from '../../../Backend/Backend';
import {
  DELETE_ACCOUNT,
  LOGOUT,
  PROFILE_UPDATE,
} from '../../../Backend/api_routes';
import { validators } from '../../../Backend/Validator';
import { formatDateWithDashes, isValidForm } from '../../../Backend/Utility';
import Date_Picker from '../../../Component/Date_Picker';
import moment from 'moment';
import LocalizedStrings from '../../../Constants/localization';
import SimpleToast from 'react-native-simple-toast';

const Step1 = () => {
  const userTypes = useSelector(store => store?.userType);
  const userDetail = useSelector(store => store?.userDetails);
  const [activeTab, setActiveTab] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState(null);
  const [error, setError] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const Dispatch = useDispatch();
  const navigation = useNavigation();
  const stepLocationRef = React.useRef(null);
  const stepHouseholdRef = React.useRef(null);

  useEffect(() => {
    if (userDetail && Object.keys(userDetail).length > 0) {
      // Basic Information
      if (userDetail?.first_name) setFirstName(userDetail.first_name);
      if (userDetail?.last_name) setLastName(userDetail.last_name);

      if (userDetail?.gender) {
        setGender({
          label:
            userDetail.gender.charAt(0).toUpperCase() +
            userDetail.gender.slice(1),
          value: userDetail.gender,
        });
      }

      if (userDetail?.dob || userDetail?.date_of_birth) {
        const dobValue = userDetail.dob || userDetail.date_of_birth;
        let parsedDate = null;
        if (
          typeof dobValue === 'string' &&
          dobValue.includes('-') &&
          !dobValue.includes('T')
        ) {
          const parsed = moment(dobValue, 'YYYY-MM-DD');
          if (parsed.isValid()) {
            parsedDate = parsed.toDate();
          }
        } else {
          const parsed = moment(dobValue);
          if (parsed.isValid()) {
            parsedDate = parsed.toDate();
          }
        }
        if (parsedDate) {
          setDob(parsedDate);
        }
      }

      // Profile Image - skip default/placeholder images from backend
      if (userDetail?.image) {
        const imgUrl = userDetail.image.toLowerCase();
        const isDefault =
          imgUrl.includes('noimage') ||
          imgUrl.includes('no_image') ||
          imgUrl.includes('no-image') ||
          imgUrl.includes('default') ||
          imgUrl.includes('placeholder');
        if (!isDefault) {
          setSelectedPhoto({
            uri: userDetail.image,
            path: userDetail.image,
          });
        }
      }
    }
  }, [userDetail]);
  const SendStepsApi = () => {
    let validationErrors = {
      firstName: validators?.checkRequire('First Name', firstName),
      lastName: validators?.checkRequire('Last Name', lastName),
      dob: validators?.checkRequire('Dob', dob),
      gender: validators?.checkRequire('Gender', gender?.value),
    };

    if (activeTab === 1 && stepLocationRef.current) {
      const isAddressValid = stepLocationRef.current.validateAddress();
      if (!isAddressValid) {
        return; // Don't proceed if address validation fails
      }
    }

    if (activeTab === 2 && stepHouseholdRef.current) {
      const isHouseholdValid = stepHouseholdRef.current.validateHousehold();
      if (!isHouseholdValid) {
        return; // Don't proceed if household validation fails
      }
    }

    setError(validationErrors);
    if (isValidForm(validationErrors)) {
      setIsLoading(true);
      const formData = new FormData();
      if (activeTab === 0) {
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('gender', gender?.value);
        formData.append('dob', moment(dob).format('YYYY-MM-DD'));
        // formData.append('user_role_id', userTypes == 0 ? 3 : 2);
        const imageUri = selectedPhoto?.path || selectedPhoto?.uri;
        if (imageUri && imageUri !== userDetail?.image && !imageUri.startsWith('http')) {
          formData.append('profile_picture', {
            uri: imageUri,
            name: selectedPhoto?.name || 'profile.jpg',
            type: selectedPhoto?.mime || 'image/jpeg',
          });
        }
      }

      // Add address data if we're on location step
      if (activeTab === 1 && stepLocationRef.current) {
        const addresses = stepLocationRef.current.getAddressData();
        // Add all addresses to formData
        addresses.forEach((address, index) => {
          formData.append(`addresses[${index}][name]`, address.name || '');
          formData.append(`addresses[${index}][street]`, address.street);
          formData.append(`addresses[${index}][city]`, address.city);
          formData.append(`addresses[${index}][state]`, address.state);
          formData.append(`addresses[${index}][pincode]`, address.pinCode);
          formData.append(`addresses[${index}][area_locality]`, address.area_locality || '');
          formData.append(`addresses[${index}][google_location]`, address.google_location || '');
          formData.append(`addresses[${index}][lat]`, address.lat || '');
          formData.append(`addresses[${index}][long]`, address.long || '');
        });
      }

      // Add household data if we're on household step
      if (activeTab === 2 && stepHouseholdRef.current) {
        formData.append('user_role_id', userTypes);
        const householdData = stepHouseholdRef.current.getHouseholdData();

        formData.append('residence_type', householdData.residence_type);
        formData.append('number_of_rooms', householdData.number_of_rooms);
        // Add languages as array
        if (householdData.languages_spoken) {
          householdData.languages_spoken.forEach((lang, index) => {
            formData.append(`languages_spoken[${index}]`, lang);
          });
        }
        formData.append('adults_count', householdData.adults_count);
        formData.append('children_count', householdData.children_count);
        formData.append('elderly_count', householdData.elderly_count);
        formData.append(
          'special_requirements',
          householdData.special_requirements,
        );

        // Add pet details as array
        if (householdData.pet_details) {
          householdData.pet_details.forEach((pet, index) => {
            formData.append(`pet_details[${index}][pet_type]`, pet.pet_type);
            formData.append(`pet_details[${index}][pet_count]`, pet.pet_count);
          });
        }
      }

      formData.append('is_edit', 0);
      // Debug FormData
      console.log('Post Profile Data:', formData);

      POST_FORM_DATA(
        PROFILE_UPDATE,
        formData,
        sucess => {
          setIsLoading(false);
          console.log('Profile update success:', sucess);
          const currentStep = sucess?.data?.step || sucess?.data?.steps;

          if (currentStep == 1 || currentStep == '1') {
            setActiveTab(0);
          } else if (currentStep == 2 || currentStep == '2') {
            setActiveTab(1);
          } else if (currentStep == 3 || currentStep == '3') {
            setActiveTab(2);
          } else if (currentStep >= 4) {
            // Navigate to home screen (TabNavigation)
            navigation.navigate('TabNavigation');
          } else {
            // Fallback: move to next tab if it stays the same
            if (activeTab < 2) setActiveTab(activeTab + 1);
            else navigation.navigate('TabNavigation');
          }
          Dispatch(userDetails(sucess?.data));
        },
        errorResponse => {
          setIsLoading(false);
          console.log('Profile update error:', errorResponse);
          let errorMsg = 'Failed to update profile';
          if (errorResponse?.data?.message) errorMsg = errorResponse.data.message;
          else if (errorResponse?.message) errorMsg = errorResponse.message;

          SimpleToast.show(errorMsg, SimpleToast.SHORT);
        },
        fail => {
          setIsLoading(false);
          console.log('Profile update fail:', fail);
          SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        },
      );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <>
            <View>
              <View style={styles.imageContainer}>
                <Image
                  source={
                    !imageLoadError &&
                    (selectedPhoto?.path || selectedPhoto?.uri) &&
                    !(selectedPhoto?.path || selectedPhoto?.uri)
                      ?.toLowerCase()
                      ?.includes('noimage')
                      ? { uri: selectedPhoto.path || selectedPhoto.uri }
                      : ImageConstant.user
                  }
                  style={styles.profileImage}
                  onError={() => setImageLoadError(true)}
                />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={() => setShowImageModal(true)}
                >
                  <Image source={ImageConstant?.Camera} />
                  <Typography
                    type={Font?.Poppins_Medium}
                    color={'#D98579'}
                    style={styles.changePhotoText}
                  >
                    {LocalizedStrings.EditProfile?.change_photo ||
                      'Change Photo'}
                  </Typography>
                </TouchableOpacity>
                {/* <Button title={"Change Photo"} linerColor={["#fff","#fff"]} title_style={{color:"#D98579"}} icon={ImageConstant?.Camera}/> */}
              </View>
            </View>
            <View style={styles.basicInfoContainer}>
              <Typography style={styles.sectionTitle}>
                {LocalizedStrings.EditProfile?.Personal_Details ||
                  'Basic Information'}
              </Typography>
              <Input
                title={
                  LocalizedStrings.EditProfile?.first_name ||
                  LocalizedStrings.EditProfile?.Name ||
                  'First Name'
                }
                value={firstName}
                onChange={text => {
                  setFirstName(text);
                  if (error?.firstName) setError({ ...error, firstName: null });
                }}
                error={error?.firstName}
              />
              <Input
                title={LocalizedStrings.EditProfile?.last_name || 'Last Name'}
                value={lastName}
                onChange={text => {
                  setLastName(text);
                  if (error?.lastName) setError({ ...error, lastName: null });
                }}
                error={error?.lastName}
              />
              <DropdownComponent
                title={LocalizedStrings.EditProfile?.Gender || 'Gender'}
                placeholder={''}
                width={'100%'}
                style_dropdown={styles.dropdownStyle}
                selectedTextStyleNew={styles.selectedTextStyle}
                marginHorizontal={0}
                value={gender?.value}
                style_title={styles.dropdownTitle}
                data={[
                  {
                    label: LocalizedStrings.EditProfile?.Male || 'Male',
                    value: 'male',
                  },
                  {
                    label: LocalizedStrings.EditProfile?.Female || 'Female',
                    value: 'female',
                  },
                  {
                    label: LocalizedStrings.EditProfile?.Other || 'Other',
                    value: 'other',
                  },
                ]}
                onChange={item => {
                  setGender(item || null);
                  if (error?.gender) setError({ ...error, gender: null });
                }}
                error={error?.gender}
              />
              <Date_Picker
                title={
                  LocalizedStrings.EditProfile?.Date_of_Birth || 'Date of Birth'
                }
                placeholder={''}
                allowFutureDates={false}
                disablePastDates={false}
                ageRestrict={true}
                onChange={d => {
                  setDob(d);
                }}
                selected_date={dob}
                onConfirm={d => {
                  setDob(d);
                  if (error?.dob) setError({ ...error, dob: null });
                }}
                error={error?.dob}
              />
            </View>
          </>
        );
      case 1:
        return (
          <>
            <StepLocation ref={stepLocationRef} />
          </>
        );
      case 2:
        return (
          <>
            <StepHousehold ref={stepHouseholdRef} />
          </>
        );

      default:
        return null;
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
        source_arrow={ImageConstant?.BackArrow}
        title={LocalizedStrings.EditProfile?.title || 'Complete Profile'}
        style_title={{ fontFamily: Font?.Manrope_SemiBold }}
        onBackPress
        onBackPressFun={() => {
          if (activeTab === 0) {
            Alert.alert(
              'Exit Profile Setup',
              'Are you sure you want to go back? Your progress will not be saved.',
              [
                { text: 'Stay', style: 'cancel' },
                {
                  text: 'Go Back',
                  style: 'destructive',
                  onPress: () => {
                    Dispatch(isAuth(false));
                    Dispatch(userDetails({}));
                  },
                },
              ],
            );
          } else {
            setActiveTab(activeTab - 1);
          }
        }}
      />
      {renderContent()}
      <ImageModal
        showModal={showImageModal}
        title={LocalizedStrings.EditProfile?.change_photo || 'Upload Photo'}
        close={() => setShowImageModal(false)}
        selected={image => {
          let obj = {
            uri: image[0]?.path,
            path: image[0]?.path,
            name: image[0]?.filename,
            type: image[0]?.mime || 'image/jpeg',
          };
          setSelectedPhoto(obj);
          setImageLoadError(false);
        }}
      />
      <Button
        title={
          activeTab === 2
            ? LocalizedStrings.EditProfile?.Save_Changes || 'Save & Proceed'
            : LocalizedStrings.Auth?.next || 'Next'
        }
        onPress={() => {
          SendStepsApi();
        }}
        style={styles.nextButton}
        loader={isLoading}
        disabled={isLoading}
      />
    </CommanView>
  );
};

export default Step1;

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: Font?.Manrope_Bold,
    fontSize: 16,
    marginBottom: 10,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImage: {
    width: 112,
    height: 112,
    borderRadius: 112,
  },
  changePhotoButton: {
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    padding: 10,
    borderRadius: 7,
    borderColor: '#EBEBEA',
  },
  changePhotoText: {
    marginLeft: 10,
  },
  basicInfoContainer: {
    flex: 1,
    borderWidth: 1,
    padding: 20,
    borderRadius: 8,
    borderColor: '#EBEBEA',
  },
  dropdownStyle: {
    marginHorizontal: 0,
  },
  selectedTextStyle: {
    marginLeft: 10,
  },
  dropdownTitle: {
    textAlign: 'left',
  },
  nextButton: {
    width: 150,
    alignSelf: 'flex-end',
  },
  tabContainer: {
    // height: 50,
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: '#f7f7f7',
    backgroundColor: '#f7f7f7',
    overflow: 'scroll',
    color: ' #8C8D8B',
    marginTop: 30,
    paddingVertical: 5,
  },
  tab: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'scroll',
  },
  tabText: {
    fontFamily: Font?.Manrope_SemiBold,
    fontSize: 14,
    color: '#666',
  },
  activeTab: {
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  activeTabText: {
    color: 'black',
  },
});
