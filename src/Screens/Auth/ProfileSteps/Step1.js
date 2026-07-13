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
  const [addressCount, setAddressCount] = useState(1);
  const Dispatch = useDispatch();
  const navigation = useNavigation();
  const stepLocationRef = React.useRef(null);
  const stepHouseholdRef = React.useRef(null);
  const savedAddressDataRef = React.useRef(null);

  const getFirstValidationMessage = errorsObj => {
    const firstMessage = Object.values(errorsObj || {}).find(Boolean);
    return firstMessage || 'Please complete the required fields.';
  };

  const toIntOrNull = value => {
    const text = String(value ?? '').trim();
    if (!text) return null;
    const parsed = Number.parseInt(text, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const normalizeAddress = address => ({
    name: address?.name || address?.title || '',
    street: address?.street || '',
    city: address?.city || '',
    state: address?.state || '',
    pincode: address?.pinCode || address?.pincode || '',
    area_locality: address?.area_locality || address?.areaLocality || '',
    google_location: address?.google_location || address?.googleLocation || '',
    lat: address?.lat || address?.latitude || '',
    long: address?.long || address?.longitude || '',
  });

  const hasCompleteAddress = address =>
    ['street', 'city', 'state', 'pincode'].every(key =>
      String(address?.[key] ?? '').trim(),
    );

  const normalizeHousehold = household => ({
    residence_type: household?.residence_type || null,
    number_of_rooms: toIntOrNull(household?.number_of_rooms),
    languages_spoken: Array.isArray(household?.languages_spoken)
      ? household.languages_spoken
      : [],
    adults_count: toIntOrNull(household?.adults_count),
    children_count: toIntOrNull(household?.children_count),
    elderly_count: toIntOrNull(household?.elderly_count),
    special_requirements: household?.special_requirements || null,
  });

  const normalizePets = household =>
    (household?.pet_details || [])
      .filter(pet => pet?.pet_type && String(pet?.pet_count ?? '').trim())
      .map(pet => ({
        pet_type: pet.pet_type,
        pet_count: toIntOrNull(pet.pet_count),
      }));

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

      const profileStep = Number(userDetail?.step ?? userDetail?.steps);
      if (!Number.isNaN(profileStep) && profileStep > 0 && profileStep < 4) {
        if (profileStep <= 1) setActiveTab(0);
        else if (profileStep === 2) setActiveTab(1);
        else if (profileStep === 3) setActiveTab(2);
      }

      if (Array.isArray(userDetail?.addresses) && userDetail.addresses.length) {
        const savedAddresses = userDetail.addresses
          .map(normalizeAddress)
          .filter(hasCompleteAddress);

        if (savedAddresses.length) {
          savedAddressDataRef.current = savedAddresses;
          setAddressCount(savedAddresses.length);
        }
      }
    }
  }, [userDetail]);
  const SendStepsApi = async () => {
    if (isLoading) return;

    try {
      if (activeTab === 1 && stepLocationRef.current) {
        const isAddressValid = stepLocationRef.current.validateAddress();
        if (!isAddressValid) {
          SimpleToast.show('Please complete the highlighted address fields.', SimpleToast.SHORT);
          return;
        }
      }

      if (activeTab === 2 && stepHouseholdRef.current) {
        const isHouseholdValid = stepHouseholdRef.current.validateHousehold();
        if (!isHouseholdValid) {
          SimpleToast.show('Please complete the highlighted household fields.', SimpleToast.SHORT);
          return;
        }
      }

      let validationErrors = {};
      if (activeTab === 0) {
        validationErrors = {
          firstName: validators?.checkRequire('First Name', firstName),
          lastName: validators?.checkRequire('Last Name', lastName),
          dob: validators?.checkRequire('Dob', dob),
          gender: validators?.checkRequire('Gender', gender?.value),
        };
        setError(validationErrors);
        if (!isValidForm(validationErrors)) {
          SimpleToast.show(getFirstValidationMessage(validationErrors), SimpleToast.SHORT);
          return;
        }
      }

      setIsLoading(true);

      const onSuccess = (sucess) => {
          setIsLoading(false);
          const currentStep = Number(sucess?.data?.step ?? sucess?.data?.steps);

          if (activeTab === 2 && currentStep < 4) {
            SimpleToast.show('Please save your address first, then save household details.', SimpleToast.SHORT);
            setActiveTab(1);
          } else if (currentStep === 1) {
            setActiveTab(0);
          } else if (currentStep === 2) {
            setActiveTab(1);
          } else if (currentStep === 3) {
            setActiveTab(2);
          } else if (currentStep >= 4) {
            navigation.navigate('TabNavigation');
          } else {
            if (activeTab < 2) setActiveTab(activeTab + 1);
            else navigation.navigate('TabNavigation');
          }
          Dispatch(userDetails(sucess?.data));
      };

      const onError = (errorResponse) => {
          setIsLoading(false);
          let errorMsg = 'Failed to update profile';
          const responseErrors = errorResponse?.errors || errorResponse?.data?.errors;
          if (responseErrors) {
            errorMsg = getFirstValidationMessage(
              Object.fromEntries(
                Object.entries(responseErrors).map(([key, value]) => [
                  key,
                  Array.isArray(value) ? value[0] : value,
                ]),
              ),
            );
          } else if (errorResponse?.data?.message) errorMsg = errorResponse.data.message;
          else if (errorResponse?.message) errorMsg = errorResponse.message;
          SimpleToast.show(errorMsg, SimpleToast.SHORT);
      };

      const onFail = (fail) => {
          setIsLoading(false);
          SimpleToast.show(fail?.msg || fail?.message || 'Network error. Please try again.', SimpleToast.SHORT);
      };

      if (activeTab === 0) {
        const imageUri = selectedPhoto?.path || selectedPhoto?.uri;
        const hasNewPhoto = imageUri && imageUri !== userDetail?.image && !imageUri.startsWith('http');
        if (hasNewPhoto) {
          const formData = new FormData();
          formData.append('first_name', firstName);
          formData.append('last_name', lastName);
          formData.append('gender', gender?.value);
          formData.append('dob', moment(dob).format('YYYY-MM-DD'));
          formData.append('profile_picture', {
            uri: imageUri,
            name: selectedPhoto?.name || 'profile.jpg',
            type: selectedPhoto?.type || selectedPhoto?.mime || 'image/jpeg',
          });
          formData.append('is_edit', '0');
          POST_FORM_DATA(PROFILE_UPDATE, formData, onSuccess, onError, onFail);
        } else {
          POST_WITH_TOKEN(PROFILE_UPDATE, {
            first_name: firstName,
            last_name: lastName,
            gender: gender?.value,
            dob: moment(dob).format('YYYY-MM-DD'),
            is_edit: '0',
          }, onSuccess, onError, onFail);
        }
      } else if (activeTab === 1) {
        const addressPayload = (stepLocationRef.current?.getAddressData() || [])
          .map(normalizeAddress)
          .filter(hasCompleteAddress);

        if (!addressPayload.length) {
          setIsLoading(false);
          SimpleToast.show('Please complete the address before continuing.', SimpleToast.SHORT);
          return;
        }

        savedAddressDataRef.current = addressPayload;
        setAddressCount(addressPayload.length);
        POST_WITH_TOKEN(PROFILE_UPDATE, {
          addresses: addressPayload,
          is_edit: '0',
        }, onSuccess, onError, onFail);
      } else if (activeTab === 2) {
        const householdDataArray = stepHouseholdRef.current?.getHouseholdData() || [];
        const addressPayload = (
          savedAddressDataRef.current ||
          stepLocationRef.current?.getAddressData() ||
          []
        )
          .map(normalizeAddress)
          .filter(hasCompleteAddress);

        if (!addressPayload.length) {
          setIsLoading(false);
          SimpleToast.show('Please save your address first.', SimpleToast.SHORT);
          setActiveTab(1);
          return;
        }

        const addressesWithHousehold = addressPayload.map((address, index) => {
          const household = householdDataArray[index] || householdDataArray[0] || {};
          return {
            ...address,
            household: normalizeHousehold(household),
            pets: normalizePets(household),
          };
        });

        POST_WITH_TOKEN(PROFILE_UPDATE, {
          addresses: addressesWithHousehold,
          is_edit: '0',
        }, onSuccess, onError, onFail);
      }
    } catch (err) {
      console.error('[Step1] SendStepsApi CRASHED:', err?.message, err?.stack);
      setIsLoading(false);
      SimpleToast.show('Something went wrong. Please try again.', SimpleToast.SHORT);
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
                    selectedPhoto?.path || selectedPhoto?.uri
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
            <StepLocation ref={stepLocationRef} onAddressCountChange={setAddressCount} />
          </>
        );
      case 2:
        return (
          <>
            <StepHousehold ref={stepHouseholdRef} addressCount={addressCount} />
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
