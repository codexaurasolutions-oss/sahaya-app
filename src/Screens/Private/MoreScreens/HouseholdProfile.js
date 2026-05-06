import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Text,
  Switch,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { useDispatch, useSelector } from 'react-redux';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import HeaderForUser from '../../../Component/HeaderForUser';
import Button from '../../../Component/Button';
import DropdownComponent from '../../../Component/DropdownComponent';
import Date_Picker from '../../../Component/Date_Picker';
import { ImageConstant } from '../../../Constants/ImageConstant';
import moment from 'moment';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../../Backend/Backend';
import { PROFILE, PROFILE_UPDATE } from '../../../Backend/api_routes';
import { userDetails } from '../../../Redux/action';
import SimpleToast from 'react-native-simple-toast';
import ImageModal from '../../../Modals/ImageModal';
import LocalizedStrings from '../../../Constants/localization';
import { formatDateWithDashes } from '../../../Backend/Utility';
import { setLanguage } from '../../../Constants/AsyncStorage';

const HouseholdProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  // Basic Information State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const userDetail = useSelector(state => state?.userDetails);

  // Address State
  const [addresses, setAddresses] = useState([
    { street: '', city: '', state: '', pincode: '' },
  ]);

  // Household Information State
  const [residenceType, setResidenceType] = useState(null);
  const [numberOfRooms, setNumberOfRooms] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState([]);
  const [adults, setAdults] = useState('');
  const [children, setChildren] = useState('');
  const [elderly, setElderly] = useState('');
  const [pets, setPets] = useState([{ type: '', count: '' }]);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const addPet = () => {
    setPets(prev => [...prev, { type: '', count: '' }]);
  };

  const removePet = index => {
    setPets(prev =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  };

  const updatePet = (index, field, value) => {
    setPets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Auto Present state
  const [autoPresent, setAutoPresent] = useState(false);
  const [autoPresentLoading, setAutoPresentLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Function to get location from coordinates using reverse geocoding
  const getLocationFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: { 'User-Agent': 'SahayaaApp/1.0' }
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        const cityName = address.city || address.town || address.village || address.suburb || '';
        const stateName = address.state || '';
        const pincode = address.postcode || '';
        
        return { city: cityName, state: stateName, pincode: pincode };
      }
      return null;
    } catch (error) {
      console.error('Error fetching location details:', error);
      return null;
    }
  };

  const captureLocationForAddress = (index) => {
    setLoadingLocation(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationDetails = await getLocationFromCoordinates(latitude, longitude);
        
        if (locationDetails) {
          const newAddresses = [...addresses];
          if (locationDetails.city) newAddresses[index].city = locationDetails.city;
          if (locationDetails.state) newAddresses[index].state = locationDetails.state;
          if (locationDetails.pincode) newAddresses[index].pincode = locationDetails.pincode;
          setAddresses(newAddresses);
          Alert.alert('Success', 'Location captured successfully!');
        } else {
          Alert.alert('Error', 'Could not fetch location details.');
        }
        setLoadingLocation(false);
      },
      (error) => {
        setLoadingLocation(false);
        Alert.alert('Error', 'Could not get your location. Please check permissions.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Language selection state
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  // Languages list
  const languagesList = [
    { label: 'English', value: 'en' },
    { label: 'Hindi', value: 'hi' },
    { label: 'Telugu', value: 'te' },
    { label: 'Tamil', value: 'ta' },
    { label: 'Kannada', value: 'kn' },
    { label: 'Malayalam', value: 'ml' },
    { label: 'Marathi', value: 'mr' },
    { label: 'Gujarati', value: 'gu' },
    { label: 'Bengali', value: 'bn' },
    { label: 'Punjabi', value: 'pa' },
    { label: 'Odia', value: 'or' },
    { label: 'Assamese', value: 'as' },
    { label: 'Urdu', value: 'ur' },
    { label: 'Nepali', value: 'ne' },
  ];

  const updateAddress = (index, field, value) => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addAddress = () => {
    setAddresses(prev => [
      ...prev,
      { street: '', city: '', state: '', pincode: '' },
    ]);
  };

  const removeAddress = index => {
    setAddresses(prev =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  };

  const loadProfileData = profileData => {
    // Basic Information
    setFirstName(profileData?.first_name || '');
    setLastName(profileData?.last_name || '');
    if (profileData?.dob) {
      // Backend stores dob as YYYY-MM-DD; handle both YYYY-MM-DD and DD-MM-YYYY
      const dobStr = String(profileData.dob);
      let parsed = null;
      if (/^\d{4}-\d{2}-\d{2}/.test(dobStr)) {
        // YYYY-MM-DD (also works with timestamps like 1995-05-15T00:00:00)
        const [y, m, d] = dobStr.substring(0, 10).split('-');
        parsed = new Date(Number(y), Number(m) - 1, Number(d));
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(dobStr)) {
        // DD-MM-YYYY
        const [d, m, y] = dobStr.split('-');
        parsed = new Date(Number(y), Number(m) - 1, Number(d));
      }
      setDob(parsed && !isNaN(parsed.getTime()) ? parsed : '');
    } else {
      setDob('');
    }
    setPhoneNumber(profileData?.phone_number || '');

    // Gender
    const genderValue = profileData?.gender;
    if (genderValue) {
      const genderOptions = [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
      ];
      const selectedGender = genderOptions.find(
        item => item.value === genderValue,
      );
      if (selectedGender) {
        setGender(selectedGender);
      }
    }

    // Address from first address
    if (profileData?.addresses && profileData.addresses.length > 0) {
      const formattedAddresses = profileData.addresses.map(addr => ({
        street: addr?.street || '',
        city: addr?.city || '',
        state: addr?.state || '',
        pincode: addr?.pincode || '',
      }));
      setAddresses(formattedAddresses);
    } else {
      setAddresses([{ street: '', city: '', state: '', pincode: '' }]);
    }

    // Household Information
    if (profileData?.household_information) {
      const household = profileData.household_information;

      if (household?.residence_type) {
        setResidenceType({
          label:
            household.residence_type.charAt(0).toUpperCase() +
            household.residence_type.slice(1),
          value: household.residence_type?.toLowerCase() || 'apartment',
        });
      }
      if (household?.number_of_rooms) {
        setNumberOfRooms(String(household.number_of_rooms));
      }
      console.log('profileData.household_information.languages_spoken====', profileData.household_information.languages_spoken);

      setLanguagesSpoken(profileData.household_information.languages_spoken || []);
      // if (household?.languages_spoken) {
      //   setLanguagesSpoken(normalizeLanguages(household.languages_spoken));
      // }
      // Use != null checks so 0 is preserved (not treated as empty)
      if (household?.adults_count != null) {
        setAdults(String(household.adults_count));
      }
      if (household?.children_count != null) {
        setChildren(String(household.children_count));
      }
      if (household?.elderly_count != null) {
        setElderly(String(household.elderly_count));
      }
      if (household?.special_requirements) {
        setSpecialRequirements(household.special_requirements);
      }
    }

    // Pet Details from pet_details array
    if (profileData?.pet_details) {
      const petArray = profileData.pet_details
        .map(pet => ({
          type: pet?.pet_type || '',
          count: pet?.pet_count ? String(pet.pet_count) : '',
        }))
        .filter(pet => pet.type || pet.count);

      setPets(petArray.length ? petArray : [{ type: '', count: '' }]);
    } else {
      setPets([{ type: '', count: '' }]);
    }

    // Profile Image - only keep for DISPLAY, never re-upload.
    // Skip placeholder/default URLs so the avatar falls back to the default.
    if (profileData?.image) {
      const imgLower = String(profileData.image).toLowerCase();
      const isPlaceholder =
        imgLower.includes('noimage') ||
        imgLower.includes('default') ||
        imgLower.includes('placeholder');
      if (!isPlaceholder) {
        // Mark as existing so handleUpdateProfile knows NOT to re-upload it
        setProfileImage({ uri: profileData.image, isExisting: true });
      } else {
        setProfileImage(null);
      }
    }

    // Auto Present
    const autoPresentValue = profileData?.auto_attendence;
    console.log('[AutoPresent] Loaded from profile:', autoPresentValue);
    setAutoPresent(autoPresentValue === 1 || autoPresentValue === '1' || autoPresentValue === true);
  };

  const handleImageSelect = (assets, source) => {
    if (assets && assets.length > 0) {
      const selectedImage = assets[0];
      const imageObj = {
        uri: selectedImage.uri || selectedImage.path,
        path: selectedImage.uri || selectedImage.path,
        name: selectedImage.fileName || selectedImage.filename || `profile_${Date.now()}.jpg`,
        type: selectedImage.type || selectedImage.mime || 'image/jpeg',
      };
      setProfileImage(imageObj);
      setShowImageModal(false);
    }
  };

  useEffect(() => {
    const Profile = () => {
      GET_WITH_TOKEN(
        PROFILE,
        success => {
          if (success?.data) {
            console.log('success?.data-----000--99-', success?.data);
            dispatch(userDetails(success?.data?.added_by_user || success?.data));
            loadProfileData(success?.data?.added_by_user || success?.data);
          }
        },
        error => {
          SimpleToast.show('Failed to load profile', SimpleToast.SHORT);
        },
        fail => {
          SimpleToast.show(
            'Network error. Please try again.',
            SimpleToast.SHORT,
          );
        },
      );
    };
    Profile();
  }, [dispatch]);

  // Handle language change
  const handleLanguageChange = async item => {
    if (item) {
      setSelectedLanguage(item);
      // Save to AsyncStorage
      await setLanguage(item.value);
      // Update LocalizedStrings immediately
      LocalizedStrings.setLanguage(item.value);
      // Show success message
      SimpleToast.show('Language changed successfully!', SimpleToast.SHORT);
    }
  };

  const handleAutoPresentToggle = value => {
    console.log('[AutoPresent] Toggle triggered, value:', value, '=> sending:', value ? 1 : 0);
    setAutoPresent(value);
    setAutoPresentLoading(true);
    const formData = new FormData();
    formData.append('auto_attendence', value ? 1 : 0);
    formData.append('is_edit', '1');
    console.log('[AutoPresent] Calling PROFILE_UPDATE with auto_present:', value ? 1 : 0);
    POST_FORM_DATA(
      PROFILE_UPDATE,
      formData,
      success => {
        console.log('[AutoPresent] SUCCESS:', JSON.stringify(success));
        setAutoPresentLoading(false);
        dispatch(userDetails(success?.data));
        SimpleToast.show(
          value ? 'Auto Present enabled' : 'Auto Present disabled',
          SimpleToast.SHORT,
        );
      },
      error => {
        console.log('[AutoPresent] ERROR:', JSON.stringify(error));
        setAutoPresentLoading(false);
        setAutoPresent(!value);
        SimpleToast.show('Failed to update setting', SimpleToast.SHORT);
      },
      fail => {
        console.log('[AutoPresent] NETWORK FAIL:', JSON.stringify(fail));
        setAutoPresentLoading(false);
        setAutoPresent(!value);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const handleUpdateProfile = () => {
    if (loading) return;
    setLoading(true);
    const formData = new FormData();
    // Basic Information
    if (firstName) formData.append('first_name', firstName);
    // formData.append('user_role_id', 3);
    if (lastName) formData.append('last_name', lastName);
    if (gender?.value) formData.append('gender', gender.value);
    if (dob) {
      // Format date properly for API
      const formattedDob = formatDateWithDashes(dob);
      formData.append('dob', formattedDob);
    }

    // Profile Image - only upload if user PICKED a NEW image.
    // If profileImage was loaded from server (isExisting=true), skip upload
    // because RN cannot re-upload a remote http:// URL as a file — backend
    // would then reject it as "not an image" and whole save fails.
    const localPath = profileImage?.path || profileImage?.uri || '';
    const isLocalFile =
      typeof localPath === 'string' &&
      (localPath.startsWith('file://') ||
        localPath.startsWith('content://') ||
        localPath.startsWith('/') ||
        localPath.startsWith('ph://'));
    if (
      profileImage &&
      !profileImage.isExisting &&
      profileImage.path &&
      isLocalFile
    ) {
      formData.append('profile_picture', {
        uri: profileImage.path,
        name: profileImage.name || `profile_${Date.now()}.jpg`,
        type: profileImage.type || profileImage.mime || 'image/jpeg',
      });
    }

    // Address
    addresses.forEach((address, index) => {
      formData.append(`addresses[${index}][street]`, address.street || '');
      formData.append(`addresses[${index}][city]`, address.city || '');
      formData.append(`addresses[${index}][state]`, address.state || '');
      formData.append(`addresses[${index}][pincode]`, address.pincode || '');
    });

    // Household Information
    if (residenceType?.value)
      formData.append('residence_type', residenceType.value);
    if (numberOfRooms) formData.append('number_of_rooms', numberOfRooms);

    // if (languagesSpoken?.length) {
    languagesSpoken.map((language, index) => {
      formData.append(`languages_spoken[${index}]`, language);
    });
    // }

    if (adults) formData.append('adults_count', adults);
    if (children) formData.append('children_count', children);
    if (elderly && elderly.trim() !== '') {
      formData.append(
        'elderly_count',
        elderly && elderly.trim() !== '' ? elderly : 0,
      );
    }

    // Pet Details
    // Only include pets with both type and count filled
    const validPets = pets.filter(
      pet => pet.type?.trim() !== '' && pet.count?.trim() !== '',
    );
    validPets.forEach((pet, index) => {
      formData.append(`pet_details[${index}][pet_type]`, pet.type);
      formData.append(`pet_details[${index}][pet_count]`, pet.count);
    });

    if (specialRequirements && specialRequirements.trim() !== '') {
      formData.append('special_requirements', specialRequirements);
    }

    formData.append('is_edit', '1');

    POST_FORM_DATA(
      PROFILE_UPDATE,
      formData,
      success => {
        SimpleToast.show('Profile updated successfully!', SimpleToast.SHORT);
        dispatch(userDetails(success?.data));
        setLoading(false);
        navigation.goBack();
      },
      error => {
        // POST_FORM_DATA passes DIFFERENT shapes depending on status:
        //  - 422/400 -> passes response body directly (e.g. {success, errors})
        //  - 500     -> passes full axios response (has .data, .status)
        // So normalize both into one source.
        const body =
          (error && error.errors) || (error && error.message) || (error && error.error)
            ? error
            : error?.data || error?.response?.data || error || {};
        let errMsg;
        if (body?.errors && typeof body.errors === 'object') {
          // Flatten field errors into readable lines
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
        } else {
          errMsg = 'Failed to update profile';
        }
        console.log(
          'PROFILE UPDATE ERROR FULL:',
          JSON.stringify(error?.data || error),
        );
        SimpleToast.show(String(errMsg).slice(0, 200), SimpleToast.LONG);
        setLoading(false);
      },
      fail => {
        console.log('PROFILE UPDATE NETWORK FAIL:', JSON.stringify(fail));
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        setLoading(false);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.EditProfile.title}
        style_title={styles.headerTitle}
        containerStyle={styles.headerContainer}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => {
          navigation?.goBack();
        }}
      />
      <View>
        <View style={styles.profileContainer}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#F7F7F7',
              width: 112,
              height: 112,
              borderWidth: 5,
              borderColor: '#EBEBEA',
              borderRadius: 112,
            }}
          >
            <Image
              source={
                profileImage?.uri &&
                  !profileImage?.uri?.toLowerCase()?.includes('noimage') &&
                  !profileImage?.uri?.toLowerCase()?.includes('default') &&
                  !profileImage?.uri?.toLowerCase()?.includes('placeholder')
                  ? { uri: profileImage.uri }
                  : userDetail?.image &&
                    !userDetail?.image?.toLowerCase()?.includes('noimage') &&
                    !userDetail?.image?.toLowerCase()?.includes('default') &&
                    !userDetail?.image?.toLowerCase()?.includes('placeholder')
                    ? { uri: userDetail.image }
                    : ImageConstant.user
              }
              style={styles.profileImage}
              resizeMode="cover"
              onError={() => setProfileImage(null)}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.changePhotoBtn,
              {
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                borderColor: '#EBEBEA',
                borderWidth: 1,
                padding: 10,
                borderRadius: 20,
              },
            ]}
            onPress={() => {
              setShowImageModal(true);
            }}
          >
            <Image
              source={ImageConstant.NewCamera}
              style={{ height: 20, width: 20, marginRight: 8 }}
              resizeMode="contain"
              tintColor={'#D98579'}
            />
            <Typography
              style={styles.changePhotoText}
              size={14}
              type={Font?.Poppins_Medium}
            >
              {LocalizedStrings.EditProfile.change_photo || 'Change Photo'}
            </Typography>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            {LocalizedStrings.EditProfile.Personal_Details}
          </Typography>
          <Input
            title={
              LocalizedStrings.EditProfile.first_name ||
              LocalizedStrings.EditProfile.Name
            }
            value={firstName}
            onChange={setFirstName}
          />
          <Input
            title={LocalizedStrings.EditProfile.last_name || 'Last Name'}
            value={lastName}
            onChange={setLastName}
          />
          <DropdownComponent
            title={LocalizedStrings.EditProfile.Gender}
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            value={gender}
            onChange={setGender}
            data={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Other', value: 'other' },
            ]}
          />
          <Date_Picker
            title={LocalizedStrings.EditProfile.Date_of_Birth}
            placeholder={'DD-MM-YYYY'}
            selected_date={dob}
            ageRestrict={true}
            onConfirm={selectedDate => {
              // Format date to YYYY-MM-DD for API
              const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
              setDob(formattedDate);
            }}
            allowFutureDates={false}
          />
        </View>
        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            {LocalizedStrings.EditProfile.Contact_Information}
          </Typography>
          <Input
            title={LocalizedStrings.EditProfile.Phone}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChange={setPhoneNumber}
            editable={false}
          />
        </View>

        {/* <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            {LocalizedStrings.Preferences?.language || 'Language Settings'}
          </Typography>
          <DropdownComponent
            title={LocalizedStrings.Preferences?.language || 'Select Language'}
            placeholder={
              LocalizedStrings.Preferences?.language || 'Select Language'
            }
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            value={selectedLanguage}
            onChange={handleLanguageChange}
            data={languagesList}
          />
        </View> */}

        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            {LocalizedStrings.EditProfile.Home_Address || 'Home Address'}
          </Typography>

          {addresses.map((address, index) => (            <View key={index} style={[styles.addressBox, { marginBottom: 10 }]}>
              <View style={styles.headerWithLocation}>
                <Typography
                  type={Font?.Poppins_SemiBold}
                  style={styles.sectionTitle}
                >
                  Address {index + 1}
                </Typography>
                <TouchableOpacity 
                  onPress={() => captureLocationForAddress(index)} 
                  style={styles.locationButton}
                  disabled={loadingLocation}
                >
                  <Image source={ImageConstant?.Location} style={styles.locationIcon} />
                  <Typography color='rgba(217, 133, 121, 1)' size={12}>
                    {loadingLocation ? 'Detecting...' : 'Use my location'}
                  </Typography>
                </TouchableOpacity>
              </View>

              <Input
                title={LocalizedStrings.EditProfile.Street || 'Street'}
                value={address.street}
                onChange={value => updateAddress(index, 'street', value)}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    title={LocalizedStrings.EditProfile.City || 'City'}
                    value={address.city}
                    onChange={value => updateAddress(index, 'city', value)}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Input
                    title={LocalizedStrings.EditProfile.State || 'State'}
                    value={address.state}
                    onChange={value => updateAddress(index, 'state', value)}
                  />
                </View>
              </View>

              <Input
                title={LocalizedStrings.EditProfile.Pincode || 'Pincode'}
                keyboardType="number-pad"
                value={address.pincode}
                onChange={value => updateAddress(index, 'pincode', value)}
              />

              {addresses.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeAddress(index)}
                  style={styles.removeAddressBtn}
                >
                  <Typography style={{ color: 'red', fontSize: 13 }}>
                    Remove Address
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity onPress={addAddress}>
            <Typography
              style={styles.addAddressBtn}
              type={Font?.Poppins_Medium}
            >
              + Add Another Address
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            {LocalizedStrings.EditProfile.Household_Information ||
              'Household Information'}
          </Typography>
          <DropdownComponent
            title={
              LocalizedStrings.EditProfile.Residence_Type || 'Residence Type'
            }
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            value={residenceType}
            onChange={setResidenceType}
            data={[
              { label: 'Apartment', value: 'apartment' },
              { label: 'House', value: 'house' },
              { label: 'Villa', value: 'villa' },
              { label: 'Other', value: 'other' },
            ]}
          />
          <Input
            title={
              LocalizedStrings.EditProfile.Number_of_Rooms || 'Number of Rooms'
            }
            keyboardType="numeric"
            value={numberOfRooms}
            onChange={setNumberOfRooms}
          />
          <Typography
            style={[styles.smallTitle, { marginTop: 12 }]}
            type={Font?.Poppins_Medium}
          >
            {LocalizedStrings.EditProfile.Languages_Spoken ||
              'Languages Spoken'}
          </Typography>
          <View style={styles.languagesWrapper}>
            {languagesList.map((languageObj, index) => {
              const language = languageObj.label;
              const isSelected = languagesSpoken.includes(language);

              return (
                <TouchableOpacity
                  key={`${languageObj.value}_${index}`}
                  onPress={() => {
                    if (isSelected) {
                      setLanguagesSpoken(prev =>
                        prev.filter(item => item !== language),
                      );
                    } else {
                      setLanguagesSpoken(prev => [...prev, language]);
                    }
                  }}
                  style={[
                    styles.languageChip,
                    { backgroundColor: isSelected ? '#D98579' : '#F3F4F6' },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: isSelected ? '#FFFFFF' : '#333',
                    }}
                  >
                    {language}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Typography style={styles.smallTitle} type={Font?.Poppins_Medium}>
            {LocalizedStrings.EditProfile.Number_of_Occupants ||
              'Number of Occupants'}
          </Typography>
          <View style={styles.row}>
            <View style={styles.flexInput}>
              <Input
                title={LocalizedStrings.EditProfile.Adults || 'Adults'}
                keyboardType="numeric"
                value={adults}
                onChange={setAdults}
              />
            </View>
            <View style={styles.flexInput}>
              <Input
                title={LocalizedStrings.EditProfile.Children || 'Children'}
                keyboardType="numeric"
                value={children}
                onChange={setChildren}
              />
            </View>
            <View style={styles.flexInput}>
              <Input
                title={LocalizedStrings.EditProfile.Elderly || 'Elderly'}
                keyboardType="numeric"
                value={elderly}
                onChange={setElderly}
              />
            </View>
          </View>
          <Typography
            type={Font?.Poppins_Medium}
            style={[styles.smallTitle, { marginTop: 10 }]}
          >
            {LocalizedStrings.EditProfile.Pet_Details || 'Pet Details'}
          </Typography>
          {pets.map((pet, index) => (
            <View
              key={`${index}_${pet.type}`}
              style={[styles.row, styles.petRow]}
            >
              <View style={styles.petField}>
                <Input
                  title={LocalizedStrings.EditProfile.Pet_Type || 'Type'}
                  value={pet.type}
                  onChange={value => updatePet(index, 'type', value)}
                />
              </View>
              <View style={styles.petCountField}>
                <Input
                  title={LocalizedStrings.EditProfile.Count || 'Count'}
                  keyboardType="numeric"
                  value={pet.count}
                  onChange={value => updatePet(index, 'count', value)}
                />
              </View>
              {pets.length > 1 && (
                <TouchableOpacity
                  style={styles.removePetButton}
                  onPress={() => removePet(index)}
                >
                  <Typography size={12} color="red">
                    {LocalizedStrings.EditProfile.Remove || 'Remove'}
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={addPet}>
            <Typography
              style={styles.addPet}
              textAlign={'center'}
              type={Font?.Poppins_Medium}
            >
              +{' '}
              {LocalizedStrings.EditProfile.Add_Another_Pet ||
                'Add Another Pet'}
            </Typography>
          </TouchableOpacity>
          <Input
            style_inputContainer={{ height: 100 }}
            style_input={{
              height: 100,
            }}
            title={
              'Additional Information'
            }
            multiline
            value={specialRequirements}
            onChange={setSpecialRequirements}
          />
        </View>

      </View>

      <View style={styles.section}>
        <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
          Auto Attendance
        </Typography>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Typography type={Font?.Poppins_Medium} size={14}>
              Auto Present
            </Typography>
            <Typography type={Font?.Poppins_Regular} style={styles.subText}>
              Automatically mark staff as present daily.
            </Typography>
          </View>
          <Switch
            value={autoPresent}
            onValueChange={handleAutoPresentToggle}
            trackColor={{ false: '#EBEBEA', true: '#D98579' }}
            thumbColor={autoPresent ? '#fff' : '#fff'}
            disabled={autoPresentLoading}
          />
        </View>
      </View>

      <View style={styles.bottomButton}>
        <Button
          title={
            loading
              ? LocalizedStrings.EditProfile.Updating || 'Updating...'
              : LocalizedStrings.EditProfile.Save_Changes
          }
          onPress={handleUpdateProfile}
          main_style={styles.buttonStyle}
          disabled={loading}
        />
      </View>

      <ImageModal
        showModal={showImageModal}
        close={() => setShowImageModal(false)}
        selected={handleImageSelect}
      />
    </CommanView>
  );
};

export default HouseholdProfile;

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImage: {
    height: 100,
    width: 100,
    borderRadius: 80,
  },
  changePhotoBtn: {
    marginTop: 10,
  },
  changePhotoText: {
    color: '#D98579',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 1,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#EBEBEA',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  smallTitle: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  addPet: {
    color: '#FF6B6B',
    padding: 10,
  },
  removePetButton: {
    justifyContent: 'center',
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  languagesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  languageChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedLanguages: {
    marginTop: 6,
    color: '#555',
  },
  petRow: {
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  petField: {
    flex: 1,
    marginRight: 8,
  },
  petCountField: {
    width: 100,
  },
  bottomButton: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buttonStyle: {
    width: '90%',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  iconSmall: {
    width: 16,
    height: 16,
    tintColor: '#555',
    marginRight: 7,
  },
  benefit: {
    fontSize: 14,
    marginVertical: 2,
  },
  subText: {
    fontSize: 12,
    color: '#666',
    width: '80%',
  },
  headerWithLocation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(217, 133, 121, 0.3)',
    backgroundColor: 'rgba(217, 133, 121, 0.05)',
  },
  locationIcon: {
    height: 14,
    width: 14,
    resizeMode: 'contain',
    marginRight: 5,
    tintColor: 'rgba(217, 133, 121, 1)',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
