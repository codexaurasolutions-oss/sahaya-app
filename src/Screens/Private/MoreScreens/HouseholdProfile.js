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
import React, { useEffect, useState, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { useDispatch, useSelector } from 'react-redux';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import HeaderForUser from '../../../Component/HeaderForUser';
import DropdownComponent from '../../../Component/DropdownComponent';
import Date_Picker from '../../../Component/Date_Picker';
import { ImageConstant } from '../../../Constants/ImageConstant';
import GooglePlacesInput from '../../../Component/GooglePlacesInput';
import moment from 'moment';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../../Backend/Backend';
import { PROFILE, PROFILE_UPDATE } from '../../../Backend/api_routes';
import { userDetails } from '../../../Redux/action';
import SimpleToast from 'react-native-simple-toast';
import ImageModal from '../../../Modals/ImageModal';
import LocalizedStrings from '../../../Constants/localization';
import { fetchPincodeDetails, formatDateWithDashes } from '../../../Backend/Utility';
import { setLanguage } from '../../../Constants/AsyncStorage';

const createEmptyAddress = () => ({
  name: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
  area_locality: '',
  google_location: '',
  lat: '',
  long: '',
  household: {
    residence_type: null,
    number_of_rooms: '',
    languages_spoken: [],
    adults_count: '',
    children_count: '',
    elderly_count: '',
    special_requirements: '',
  },
  pets: [{ pet_type: '', pet_count: '' }],
});

const HouseholdProfile = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const [addressY, setAddressY] = useState(0);
  const [autoAttendanceY, setAutoAttendanceY] = useState(0);
  // Basic Information State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const userDetail = useSelector(state => state?.userDetails);

  // Address State (each address carries its own household + pets)
  const [addresses, setAddresses] = useState([createEmptyAddress()]);

  // Household Information State
  const [residenceType, setResidenceType] = useState(null);
  const [numberOfRooms, setNumberOfRooms] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState([]);
  const [adults, setAdults] = useState('');
  const [children, setChildren] = useState('');
  const [elderly, setElderly] = useState('');
  const [pets, setPets] = useState([{ type: '', count: '' }]);

  const [specialRequirements, setSpecialRequirements] = useState('');

  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Auto Present state — initialize from Redux so it matches ProfileManagement page
  const [autoPresent, setAutoPresent] = useState(
    userDetail?.auto_attendence === 1 || userDetail?.auto_attendence === '1' || userDetail?.auto_attendence === true
  );
  const [autoPresentLoading, setAutoPresentLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Function to get location from coordinates using reverse geocoding
  const getLocationFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`,
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
        
        return {
          city: cityName,
          state: stateName,
          pincode: pincode,
          areaLocality:
            address.suburb ||
            address.neighbourhood ||
            address.city_district ||
            address.county ||
            '',
        };
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
          if (locationDetails.areaLocality) {
            newAddresses[index].area_locality = locationDetails.areaLocality;
          }
          newAddresses[index].lat = String(latitude);
          newAddresses[index].long = String(longitude);
          newAddresses[index].google_location = `https://maps.google.com/?q=${latitude},${longitude}`;
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
      { 
        enableHighAccuracy: false, 
        timeout: 60000, 
        maximumAge: 60000 
      }
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

  const handlePincodeChange = async (index, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');

    setAddresses(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        pincode: numericValue,
        city: numericValue.length < 6 ? '' : updated[index].city,
        state: numericValue.length < 6 ? '' : updated[index].state,
      };
      return updated;
    });

    if (numericValue.length === 6) {
      try {
        const details = await fetchPincodeDetails(numericValue);
        setAddresses(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            pincode: numericValue,
            city: details?.city || '',
            state: details?.state || '',
          };
          return updated;
        });
      } catch (e) {
        console.error('Owner address pincode lookup failed:', e);
      }
    }
  };

  const addAddress = () => {
    setAddresses(prev => [
      ...prev,
      createEmptyAddress(),
    ]);
  };

  const addAddressFromHouseholdSection = () => {
    addAddress();
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(addressY - 16, 0), animated: true });
    }, 150);
  };

  const removeAddress = index => {
    setAddresses(prev =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  };

  const updateAddressHousehold = (index, field, value) => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        household: { ...updated[index].household, [field]: value },
      };
      return updated;
    });
  };

  const toggleAddressLanguage = (addrIndex, language) => {
    setAddresses(prev => {
      const updated = [...prev];
      const current = updated[addrIndex].household.languages_spoken || [];
      const next = current.includes(language)
        ? current.filter(l => l !== language)
        : [...current, language];
      updated[addrIndex] = {
        ...updated[addrIndex],
        household: { ...updated[addrIndex].household, languages_spoken: next },
      };
      return updated;
    });
  };

  const addAddressPet = addrIndex => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[addrIndex] = {
        ...updated[addrIndex],
        pets: [...updated[addrIndex].pets, { pet_type: '', count: '' }],
      };
      return updated;
    });
  };

  const removeAddressPet = (addrIndex, petIndex) => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[addrIndex] = {
        ...updated[addrIndex],
        pets: updated[addrIndex].pets.filter((_, i) => i !== petIndex),
      };
      return updated;
    });
  };

  const updateAddressPet = (addrIndex, petIndex, field, value) => {
    setAddresses(prev => {
      const updated = [...prev];
      const pets = [...updated[addrIndex].pets];
      pets[petIndex] = { ...pets[petIndex], [field]: value };
      updated[addrIndex] = { ...updated[addrIndex], pets };
      return updated;
    });
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
    setEmail(profileData?.email || '');

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

    // Address from profile — each address now has household_information + pet_details
    if (profileData?.addresses && profileData.addresses.length > 0) {
      const formattedAddresses = profileData.addresses.map(addr => {
        const hh = addr?.household_information || {};
        const rawPets = addr?.pet_details || [];
        const pets = rawPets.length > 0
          ? rawPets.map(p => ({ pet_type: p?.pet_type || '', count: p?.pet_count ? String(p.pet_count) : '' }))
          : [{ pet_type: '', count: '' }];
        return {
          name: addr?.name || '',
          street: addr?.street || '',
          city: addr?.city || '',
          state: addr?.state || '',
          pincode: addr?.pincode || '',
          area_locality: addr?.area_locality || '',
          google_location: addr?.google_location || '',
          lat: addr?.lat || addr?.latitude || '',
          long: addr?.long || addr?.longitude || '',
          household: {
            residence_type: hh.residence_type
              ? { label: String(hh.residence_type).charAt(0).toUpperCase() + String(hh.residence_type).slice(1), value: hh.residence_type }
              : null,
            number_of_rooms: hh.number_of_rooms ? String(hh.number_of_rooms) : '',
            languages_spoken: hh.languages_spoken || [],
            adults_count: hh.adults_count != null ? String(hh.adults_count) : '',
            children_count: hh.children_count != null ? String(hh.children_count) : '',
            elderly_count: hh.elderly_count != null ? String(hh.elderly_count) : '',
            special_requirements: hh.special_requirements || '',
          },
          pets,
        };
      });
      setAddresses(formattedAddresses);

      // Also set the standalone state for backward compat (first address)
      const firstHH = formattedAddresses[0]?.household;
      if (firstHH) {
        setResidenceType(firstHH.residence_type);
        setNumberOfRooms(firstHH.number_of_rooms);
        setLanguagesSpoken(firstHH.languages_spoken);
        setAdults(firstHH.adults_count);
        setChildren(firstHH.children_count);
        setElderly(firstHH.elderly_count);
        setSpecialRequirements(firstHH.special_requirements);
      }
      const firstPets = formattedAddresses[0]?.pets;
      if (firstPets) setPets(firstPets);
    } else {
      setAddresses([createEmptyAddress()]);
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

  // Real-time toggle: immediately save to backend and Redux (same as ProfileManagement.js)
  const handleAutoPresentToggle = value => {
    setAutoPresent(value);
    setAutoPresentLoading(true);
    const formData = new FormData();
    formData.append('auto_attendence', value ? 1 : 0);
    formData.append('is_edit', '1');
    POST_FORM_DATA(
      PROFILE_UPDATE,
      formData,
      success => {
        setAutoPresentLoading(false);
        dispatch(userDetails(success?.data));
        SimpleToast.show(
          value ? 'Auto Present enabled' : 'Auto Present disabled',
          SimpleToast.SHORT,
        );
      },
      error => {
        setAutoPresentLoading(false);
        setAutoPresent(!value); // revert on error
        SimpleToast.show('Failed to update setting', SimpleToast.SHORT);
      },
      fail => {
        setAutoPresentLoading(false);
        setAutoPresent(!value); // revert on network fail
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
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
  
  // Handle focus section scrolling
  useEffect(() => {
    if (route?.params?.focusSection === 'address' && addressY > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: addressY, animated: true });
      }, 500);
    }
  }, [route?.params?.focusSection, addressY]);

  useEffect(() => {
    if (route?.params?.focusSection === 'autoAttendance' && autoAttendanceY > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: autoAttendanceY, animated: true });
      }, 500);
    }
  }, [route?.params?.focusSection, autoAttendanceY]);

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

  const handleUpdateProfile = () => {
    if (loading) return;
    console.log('HOUSEHOLD PROFILE SAVE PRESSED');

    for (const address of addresses) {
      if (!address.street || !address.city || !address.pincode) {
        Alert.alert('Missing address', 'Please fill street, city and pincode before saving.');
        return;
      }
      if (!address.area_locality?.trim()) {
        Alert.alert('Missing area', 'Please fill area / locality before saving.');
        return;
      }
    }

    setLoading(true);
    SimpleToast.show('Saving changes...', SimpleToast.SHORT);
    const formData = new FormData();
    // Basic Information
    if (firstName) formData.append('first_name', firstName);
    // formData.append('user_role_id', 3);
    if (lastName) formData.append('last_name', lastName);
    if (gender?.value) formData.append('gender', gender.value);
    if (email) formData.append('email', email);
    formData.append('auto_attendence', autoPresent ? 1 : 0);
    if (dob) {
      // Format date properly for API
      const formattedDob = formatDateWithDashes(dob);
      if (formattedDob) formData.append('dob', formattedDob);
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

    // Address + per-address household + pets
    addresses.forEach((address, index) => {
      if (address.title || address.name) {
        formData.append(`addresses[${index}][title]`, address.title || address.name);
      }
      formData.append(`addresses[${index}][street]`, address.street || '');
      formData.append(`addresses[${index}][city]`, address.city || '');
      formData.append(`addresses[${index}][state]`, address.state || '');
      formData.append(`addresses[${index}][pincode]`, address.pincode || '');
      formData.append(`addresses[${index}][area_locality]`, address.area_locality || '');
      formData.append(`addresses[${index}][google_location]`, address.google_location || '');
      formData.append(`addresses[${index}][lat]`, address.lat || '');
      formData.append(`addresses[${index}][long]`, address.long || '');

      // Household info — send as JSON string so Laravel can json_decode it reliably
      const hh = address.household || {};
      const householdPayload = {
        residence_type: hh.residence_type?.value || null,
        number_of_rooms: hh.number_of_rooms || null,
        languages_spoken: hh.languages_spoken || [],
        adults_count: hh.adults_count || null,
        children_count: hh.children_count || null,
        elderly_count: hh.elderly_count || null,
        special_requirements: hh.special_requirements || null,
      };
      formData.append(`addresses[${index}][household]`, JSON.stringify(householdPayload));

      // Pets — send as JSON string so Laravel can json_decode it reliably
      const validPets = (address.pets || []).filter(p => p.pet_type?.trim() !== '' && (p.count?.trim() !== '' || p.pet_count?.trim() !== ''));
      const petsPayload = validPets.map(pet => ({
        pet_type: pet.pet_type,
        pet_count: pet.count || pet.pet_count,
      }));
      formData.append(`addresses[${index}][pets]`, JSON.stringify(petsPayload));
    });

    formData.append('is_edit', '1');

    const hasNewProfileImage =
      profileImage &&
      !profileImage.isExisting &&
      profileImage.path &&
      isLocalFile;
    const jsonPayload = {
      auto_attendence: autoPresent ? 1 : 0,
      is_edit: 1,
      addresses: addresses.map(address => {
        const hh = address.household || {};
        const residenceTypeValue =
          hh.residence_type && typeof hh.residence_type === 'object'
            ? hh.residence_type.value
            : hh.residence_type || null;
        const validPets = (address.pets || []).filter(p => {
          const petType = String(p.pet_type || p.type || '').trim();
          const petCount = String(p.count || p.pet_count || '').trim();
          return petType !== '' && petCount !== '';
        });

        return {
          title: address.title || address.name || '',
          name: address.name || address.title || '',
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          pincode: address.pincode || '',
          area_locality: address.area_locality || '',
          google_location: address.google_location || '',
          lat: address.lat || '',
          long: address.long || '',
          household: {
            residence_type: residenceTypeValue,
            number_of_rooms: hh.number_of_rooms || null,
            languages_spoken: hh.languages_spoken || [],
            adults_count: hh.adults_count || null,
            children_count: hh.children_count || null,
            elderly_count: hh.elderly_count || null,
            special_requirements: hh.special_requirements || null,
          },
          pets: validPets.map(pet => ({
            pet_type: pet.pet_type || pet.type,
            pet_count: pet.count || pet.pet_count,
          })),
        };
      }),
    };
    if (firstName) jsonPayload.first_name = firstName;
    if (lastName) jsonPayload.last_name = lastName;
    if (gender?.value) jsonPayload.gender = gender.value;
    if (email) jsonPayload.email = email;
    if (dob) {
      const formattedDob = formatDateWithDashes(dob);
      if (formattedDob) jsonPayload.dob = formattedDob;
    }
    const requestBody = hasNewProfileImage ? formData : jsonPayload;

    POST_FORM_DATA(
      PROFILE_UPDATE,
      requestBody,
      success => {
        dispatch(userDetails(success?.data));
        setLoading(false);
        Alert.alert('Saved', 'Profile updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
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
      <ScrollView 
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
          <Input
            title="Email"
            keyboardType="email-address"
            value={email}
            onChange={setEmail}
            placeholder="Enter your email"
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

        <View 
          style={styles.section}
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            setAddressY(layout.y);
          }}
        >
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            {LocalizedStrings.EditProfile.Home_Address || 'Home Address'}
          </Typography>

          {addresses.map((address, index) => (
            <View key={index} style={[styles.addressBox, { marginBottom: 10 }]}>
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
                title={LocalizedStrings.EditProfile.Address_Name || 'Address Name / Heading'}
                placeholder="e.g. Home, Office, Work"
                value={address.title || address.name}
                onChange={value => updateAddress(index, 'title', value)}
              />

              <Input
                title={LocalizedStrings.EditProfile.Street || 'Street'}
                value={address.street}
                onChange={value => updateAddress(index, 'street', value)}
              />

              <Input
                title="Area / Locality"
                placeholder="e.g. Phase 1, Model Town"
                value={address.area_locality || ''}
                onChange={value => updateAddress(index, 'area_locality', value)}
              />

              <View style={{ zIndex: 100 - index }}>
                <GooglePlacesInput
                  title="Search Google Location (Mandatory)"
                  placeholder="Search for your location on Google Maps..."
                  onPlaceSelected={(location) => {
                    updateAddress(index, 'google_location', location?.google_location || '');
                    updateAddress(index, 'lat', location?.lat || '');
                    updateAddress(index, 'long', location?.long || '');

                    if (location?.hasExtractedData) {
                      if (!address.street && location.street) updateAddress(index, 'street', location.street);
                      if (!address.city && location.city) updateAddress(index, 'city', location.city);
                      if (!address.state && location.state) updateAddress(index, 'state', location.state);
                      if (!address.pincode && location.pincode) updateAddress(index, 'pincode', location.pincode);
                    }
                  }}
                />
              </View>

              {address.google_location ? (
                <View style={{ marginBottom: 15 }}>
                  <Typography size={12} color="green">Location Selected</Typography>
                  <Typography size={11} color="gray">{address.google_location}</Typography>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    title={LocalizedStrings.EditProfile.City || 'City'}
                    value={address.city}
                    editable={false}
                    borderColor="#E5E7EB"
                    style_input={styles.disabledInputText}
                    style_inputContainer={styles.disabledInputContainer}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Input
                    title={LocalizedStrings.EditProfile.State || 'State'}
                    value={address.state}
                    editable={false}
                    borderColor="#E5E7EB"
                    style_input={styles.disabledInputText}
                    style_inputContainer={styles.disabledInputContainer}
                  />
                </View>
              </View>

              <Input
                title={LocalizedStrings.EditProfile.Pincode || 'Pincode'}
                keyboardType="number-pad"
                value={address.pincode}
                onChange={value => handlePincodeChange(index, value)}
                maxLength={6}
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

              <View style={styles.divider} />
              <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
                Household Information
              </Typography>

              <DropdownComponent
                title={LocalizedStrings.EditProfile.Residence_Type || 'Residence Type'}
                width={'100%'}
                style_dropdown={{ marginHorizontal: 0 }}
                selectedTextStyleNew={{ marginLeft: 10 }}
                marginHorizontal={0}
                style_title={{ textAlign: 'left' }}
                value={address.household?.residence_type}
                onChange={val => updateAddressHousehold(index, 'residence_type', val)}
                data={[
                  { label: 'Apartment', value: 'apartment' },
                  { label: 'House', value: 'house' },
                  { label: 'Villa', value: 'villa' },
                  { label: 'Other', value: 'other' },
                ]}
              />
              <Input
                title={LocalizedStrings.EditProfile.Number_of_Rooms || 'Number of Rooms'}
                keyboardType="numeric"
                value={address.household?.number_of_rooms || ''}
                onChange={val => updateAddressHousehold(index, 'number_of_rooms', val)}
              />

              <Typography
                style={[styles.smallTitle, { marginTop: 12 }]}
                type={Font?.Poppins_Medium}
              >
                {LocalizedStrings.EditProfile.Languages_Spoken || 'Languages Spoken'}
              </Typography>
              <View style={styles.languagesWrapper}>
                {languagesList.map((languageObj, li) => {
                  const language = languageObj.label;
                  const isSelected = (address.household?.languages_spoken || []).includes(language);
                  return (
                    <TouchableOpacity
                      key={`${languageObj.value}_${li}`}
                      onPress={() => toggleAddressLanguage(index, language)}
                      style={[
                        styles.languageChip,
                        { backgroundColor: isSelected ? '#D98579' : '#F3F4F6' },
                      ]}
                    >
                      <Text style={{ fontSize: 14, color: isSelected ? '#FFFFFF' : '#333' }}>
                        {language}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Typography style={styles.smallTitle} type={Font?.Poppins_Medium}>
                {LocalizedStrings.EditProfile.Number_of_Occupants || 'Number of Occupants'}
              </Typography>
              <View style={styles.row}>
                <View style={styles.flexInput}>
                  <Input
                    title={LocalizedStrings.EditProfile.Adults || 'Adults'}
                    keyboardType="numeric"
                    value={address.household?.adults_count || ''}
                    onChange={val => updateAddressHousehold(index, 'adults_count', val)}
                  />
                </View>
                <View style={styles.flexInput}>
                  <Input
                    title={LocalizedStrings.EditProfile.Children || 'Children'}
                    keyboardType="numeric"
                    value={address.household?.children_count || ''}
                    onChange={val => updateAddressHousehold(index, 'children_count', val)}
                  />
                </View>
                <View style={styles.flexInput}>
                  <Input
                    title={LocalizedStrings.EditProfile.Elderly || 'Elderly'}
                    keyboardType="numeric"
                    value={address.household?.elderly_count || ''}
                    onChange={val => updateAddressHousehold(index, 'elderly_count', val)}
                  />
                </View>
              </View>

              <Typography
                type={Font?.Poppins_Medium}
                style={[styles.smallTitle, { marginTop: 10 }]}
              >
                {LocalizedStrings.EditProfile.Pet_Details || 'Pet Details'}
              </Typography>
              {(address.pets || []).map((pet, pi) => (
                <View
                  key={`${index}_${pi}`}
                  style={[styles.row, styles.petRow]}
                >
                  <View style={styles.petField}>
                    <Input
                      title={LocalizedStrings.EditProfile.Pet_Type || 'Type'}
                      value={pet.pet_type || pet.type || ''}
                      onChange={value => updateAddressPet(index, pi, 'pet_type', value)}
                    />
                  </View>
                  <View style={styles.petCountField}>
                    <Input
                      title={LocalizedStrings.EditProfile.Count || 'Count'}
                      keyboardType="numeric"
                      value={pet.count || pet.pet_count || ''}
                      onChange={value => updateAddressPet(index, pi, 'count', value)}
                    />
                  </View>
                  {(address.pets.length > 1 || pet.pet_type || pet.type || pet.count) && (
                    <TouchableOpacity
                      style={styles.removePetButton}
                      onPress={() => removeAddressPet(index, pi)}
                    >
                      <Typography size={12} color="red">
                        {LocalizedStrings.EditProfile.Remove || 'Remove'}
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={() => addAddressPet(index)}>
                <Typography
                  style={styles.addPet}
                  textAlign={'center'}
                  type={Font?.Poppins_Medium}
                >
                  + {LocalizedStrings.EditProfile.Add_Another_Pet || 'Add Another Pet'}
                </Typography>
              </TouchableOpacity>

              <Input
                style_inputContainer={{ height: 80 }}
                style_input={{ height: 80 }}
                title={'Special Requirements / Additional Info'}
                multiline
                value={address.household?.special_requirements || ''}
                onChange={val => updateAddressHousehold(index, 'special_requirements', val)}
              />
            </View>
          ))}

          <TouchableOpacity onPress={addAddress} style={styles.addButton}>
            <Typography color="#D98579" type={Font?.Poppins_Medium} size={14}>
              + Add Another Address
            </Typography>
          </TouchableOpacity>
        </View>

      <View style={styles.bottomButton}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleUpdateProfile}
          disabled={loading}
          style={[styles.directSaveButton, loading && styles.disabledButton]}
        >
          <Typography color="#FFFFFF" type={Font?.Poppins_SemiBold} size={16}>
            {loading
              ? LocalizedStrings.EditProfile.Updating || 'Updating...'
              : LocalizedStrings.EditProfile.Save_Changes || 'Save Changes'}
          </Typography>
        </TouchableOpacity>
      </View>

      <ImageModal
        showModal={showImageModal}
        close={() => setShowImageModal(false)}
        selected={handleImageSelect}
      />
    </ScrollView>
    </CommanView>
  );
};

export default HouseholdProfile;

const styles = StyleSheet.create({
  addressBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#D98579',
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  removeAddressBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineAddAddressBtn: {
    color: '#D98579',
    fontSize: 13,
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
  directSaveButton: {
    width: '90%',
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#D98579',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.5,
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
  disabledInputContainer: {
    backgroundColor: '#F9FAFB',
  },
  disabledInputText: {
    color: '#6B7280',
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
