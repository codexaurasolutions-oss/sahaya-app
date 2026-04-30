import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Text,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import { ImageConstant } from '../../Constants/ImageConstant';
import { Font } from '../../Constants/Font';
import DropdownComponent from '../../Component/DropdownComponent';
import Input from '../../Component/Input';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import UploadBox from '../../Component/UploadBox';
import { useSelector, useDispatch } from 'react-redux';
import { userDetails } from '../../Redux/action';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../Backend/Backend';
import {
  PROFILE,
  PROFILE_UPDATE,
  CATEGORY,
  SUB_CATEGORY,
} from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import { formatDateWithDashes } from '../../Backend/Utility';
import Date_Picker from '../../Component/Date_Picker';
import moment from 'moment';
import ImageModal from '../../Component/Modals/ImageModal';
import LocalizedStrings from '../../Constants/localization';
import {
  getLanguage,
  setLanguage as setNewLang,
} from '../../Constants/AsyncStorage';

const EditProfile = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const userDetail = useSelector(store => store?.userDetails);
  const isFirstTime = route?.params?.isFirstTime || false;

  // State for all form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Current Address
  const [currentStreet, setCurrentStreet] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [currentPincode, setCurrentPincode] = useState('');

  // Permanent Address
  const [permanentStreet, setPermanentStreet] = useState('');
  const [permanentCity, setPermanentCity] = useState('');
  const [permanentState, setPermanentState] = useState('');
  const [permanentPincode, setPermanentPincode] = useState('');

  // Work Info
  const [selectedRole, setSelectedRole] = useState(null);
  const [skills, setSkills] = useState([]);
  const [language, setLanguage] = useState('');
  const [totalExperience, setTotalExperience] = useState(null);

  // Roles and Skills from API
  const [roles, setRoles] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Last Work Experience
  const [lastRole, setLastRole] = useState('');
  const [joinDate, setJoinDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [salary, setSalary] = useState('');

  // Images
  const [profileImage, setProfileImage] = useState(null);
  const [policeVerification, setPoliceVerification] = useState(null);
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);

  // Image modal states
  const [currentImageType, setCurrentImageType] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);

  // Update profile state
  const [updating, setUpdating] = useState(false);

  // Language selection state
  const [currentLanguage, setCurrentLanguage] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  // Languages list
  const languagesList = [
    { label: 'English', value: 'en' },
    { label: 'हिंदी (Hindi)', value: 'hi' },
    { label: 'తెలుగు (Telugu)', value: 'te' },
    { label: 'தமிழ் (Tamil)', value: 'ta' },
    { label: 'ಕನ್ನಡ (Kannada)', value: 'kn' },
    { label: 'മലയാളം (Malayalam)', value: 'ml' },
    { label: 'मराठी (Marathi)', value: 'mr' },
    { label: 'ગુજરાતી (Gujarati)', value: 'gu' },
    { label: 'বাংলা (Bengali)', value: 'bn' },
    { label: 'ਪੰਜਾਬੀ (Punjabi)', value: 'pa' },
    { label: 'ଓଡ଼ିଆ (Odia)', value: 'or' },
    { label: 'অসমীয়া (Assamese)', value: 'as' },
    { label: 'اردو (Urdu)', value: 'ur' },
    { label: 'नेपाली (Nepali)', value: 'ne' },
  ];

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
    fetchRoles();
    loadCurrentLanguage();
  }, []);

  // Load current language from AsyncStorage
  const loadCurrentLanguage = async () => {
    try {
      const langCode = await getLanguage();

      if (langCode) {
        const langObj = languagesList.find(lang => lang.value === langCode);

        if (langObj) {
          setCurrentLanguage(langObj);
          setSelectedLanguage(langObj);
        } else {
          // Default to English if not found
          const defaultLang = languagesList[0];
          setCurrentLanguage(defaultLang);
          setSelectedLanguage(defaultLang);
        }
      } else {
        // Default to English if no language stored
        const defaultLang = languagesList[0];
        setCurrentLanguage(defaultLang);
        setSelectedLanguage(defaultLang);
      }
    } catch (error) {
      const defaultLang = languagesList[0];
      setCurrentLanguage(defaultLang);
      setSelectedLanguage(defaultLang);
    }
  };

  // Handle language change
  const handleLanguageChange = async item => {
    if (item) {
      setSelectedLanguage(item);
      // Save to AsyncStorage
      setLanguage('hi');
      await setNewLang(item.value);
      // Update LocalizedStrings immediately
      // alert (item.value)
      // setLanguage(item.value);
      LocalizedStrings.setLanguage(item.value);
      // Show success message
      SimpleToast.show('Language changed successfully!', SimpleToast.SHORT);
    }
  };

  // Load data from userDetails when available
  useEffect(() => {
    if (userDetail && Object.keys(userDetail).length > 0) {
      loadProfileData();
    }
  }, [userDetail, roles]); // Also depend on roles so it can match role when roles are loaded

  const fetchProfile = () => {
    GET_WITH_TOKEN(
      PROFILE,
      success => {
        if (success?.data) {
          dispatch(userDetails(success.data));
        }
      },
      error => {
      },
      fail => {
      },
    );
  };

  const loadProfileData = () => {
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



    if (userDetail?.dob) {
      const parsedDate = moment(userDetail.dob).toDate();

      setDob(parsedDate);
    }
    if (userDetail?.phone_number) {
      const countryCode = userDetail?.country_code || '+91';
      setPhoneNumber(`${countryCode} ${userDetail.phone_number}`);
    }
    if (userDetail?.email) setEmail(userDetail.email);

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
        setProfileImage({ uri: userDetail.image });
      }
    }

    // Current Address
    const addresses = userDetail?.addresses || [];
    if (addresses.length > 0) {
      const currentAddr = addresses[0];
      if (currentAddr?.street) setCurrentStreet(currentAddr.street);
      if (currentAddr?.city) setCurrentCity(currentAddr.city);
      if (currentAddr?.state) setCurrentState(currentAddr.state);
      if (currentAddr?.pincode) setCurrentPincode(currentAddr.pincode);
    }

    // Permanent Address
    if (addresses.length > 1) {
      const permanentAddr = addresses[1];
      if (permanentAddr?.street) setPermanentStreet(permanentAddr.street);
      if (permanentAddr?.city) setPermanentCity(permanentAddr.city);
      if (permanentAddr?.state) setPermanentState(permanentAddr.state);
      if (permanentAddr?.pincode) setPermanentPincode(permanentAddr.pincode);
    }

    // Work Info
    const workInfo = userDetail?.user_work_info || userDetail?.work_info || {};
    if (workInfo?.primary_role) {
      // Find matching role from API roles
      const matchingRole = roles.find(
        role =>
          role.label === workInfo.primary_role ||
          role.value === workInfo.primary_role ||
          role.id === workInfo.primary_role,
      );
      if (matchingRole) {
        setSelectedRole(matchingRole);
        // Fetch skills for this role
        const roleId = matchingRole.value || matchingRole.id;
        if (roleId) {
          fetchSkills(roleId);
        }
      } else {
        // Fallback if role not found in API
        setSelectedRole({
          label: workInfo.primary_role,
          value: workInfo.primary_role,
        });
      }
    }
    if (workInfo?.skills) {
      const skillsList = Array.isArray(workInfo.skills)
        ? workInfo.skills.filter(skill => skill)
        : typeof workInfo.skills === 'string'
          ? workInfo.skills
            .split(',')
            .map(s => s.trim())
            .filter(s => s)
          : [];
      setSkills(skillsList);
    }
    if (workInfo?.languages_spoken) setLanguage(workInfo.languages_spoken);
    if (workInfo?.total_experience)
      setTotalExperience({
        label: `${workInfo.total_experience} Years`,
        value: workInfo.total_experience,
      });

    // Last Work Experience
    const lastExp = userDetail?.last_exp || {};
    if (lastExp?.role) setLastRole(lastExp.role);
    if (lastExp?.join_date) {
      const parsedDate = moment(lastExp.join_date, [
        'YYYY-MM-DD',
        'DD/MM/YY',
      ]).toDate();
      if (parsedDate && !isNaN(parsedDate.getTime())) setJoinDate(parsedDate);
    }
    if (lastExp?.end_date) {
      const parsedDate = moment(lastExp.end_date, [
        'YYYY-MM-DD',
        'DD/MM/YY',
      ]).toDate();
      if (parsedDate && !isNaN(parsedDate.getTime())) setEndDate(parsedDate);
    }
    if (lastExp?.salary) setSalary(String(lastExp.salary));

    // KYC Documents - check top-level user fields first, then kyc_information
    const kycInfo = userDetail?.kyc_information || {};

    // Helper function to check if path is valid
    const isValidPath = path => {
      return (
        path &&
        typeof path === 'string' &&
        path.trim().length > 0 &&
        path !== 'null' &&
        path !== 'undefined'
      );
    };

    // Verification Certificate
    if (isValidPath(userDetail?.verification_certificate)) {
      setPoliceVerification({ uri: userDetail.verification_certificate });
    } else if (isValidPath(kycInfo?.verification_certificate)) {
      setPoliceVerification({ uri: kycInfo.verification_certificate });
    } else if (isValidPath(kycInfo?.police_clearance_certificate_path)) {
      setPoliceVerification({ uri: kycInfo.police_clearance_certificate_path });
    } else if (isValidPath(kycInfo?.police_verification_path)) {
      setPoliceVerification({ uri: kycInfo.police_verification_path });
    }
    // Aadhaar Front
    if (isValidPath(userDetail?.aadhar_front)) {
      setAadhaarFront({ uri: userDetail.aadhar_front });
    } else if (isValidPath(kycInfo?.aadhar_front)) {
      setAadhaarFront({ uri: kycInfo.aadhar_front });
    } else if (isValidPath(kycInfo?.adharfront_path)) {
      setAadhaarFront({ uri: kycInfo.adharfront_path });
    } else if (isValidPath(kycInfo?.aadhaar_front_path)) {
      setAadhaarFront({ uri: kycInfo.aadhaar_front_path });
    }
    // Aadhaar Back
    if (isValidPath(userDetail?.aadhar_back)) {
      setAadhaarBack({ uri: userDetail.aadhar_back });
    } else if (isValidPath(kycInfo?.aadhar_back)) {
      setAadhaarBack({ uri: kycInfo.aadhar_back });
    } else if (isValidPath(kycInfo?.adharbackend_path)) {
      setAadhaarBack({ uri: kycInfo.adharbackend_path });
    } else if (isValidPath(kycInfo?.aadhaar_back_path)) {
      setAadhaarBack({ uri: kycInfo.aadhaar_back_path });
    }
  };

  // Toggle skill selection
  const toggleSkill = skill => {
    if (skills.includes(skill)) {
      // Remove skill if already selected
      setSkills(skills.filter(s => s !== skill));
    } else {
      // Add skill if not selected
      setSkills([...skills, skill]);
    }
  };

  // Fetch roles from CATEGORY API
  const fetchRoles = () => {
    setRolesLoading(true);
    GET_WITH_TOKEN(
      CATEGORY,
      success => {
        setRolesLoading(false);
        // Handle different possible response structures
        let rolesData = [];

        if (success?.data && Array.isArray(success.data)) {
          rolesData = success.data.map(role => ({
            label:
              role?.name ||
              role?.title ||
              role?.category_name ||
              role?.category ||
              String(role),
            value: role?.id || role?.value || role?.role_id || role?.name,
            id: role?.id || role?.value || role?.role_id,
          }));
        } else if (success?.roles && Array.isArray(success.roles)) {
          rolesData = success.roles.map(role => ({
            label:
              role?.name ||
              role?.title ||
              role?.category_name ||
              role?.category ||
              String(role),
            value: role?.id || role?.value || role?.role_id || role?.name,
            id: role?.id || role?.value || role?.role_id,
          }));
        } else if (Array.isArray(success)) {
          rolesData = success.map(role => ({
            label:
              role?.name ||
              role?.title ||
              role?.category_name ||
              role?.category ||
              String(role),
            value: role?.id || role?.value || role?.role_id || role?.name,
            id: role?.id || role?.value || role?.role_id,
          }));
        } else {
        }

        setRoles(rolesData);
      },
      error => {
        setRolesLoading(false);
      },
      fail => {
        setRolesLoading(false);
      },
    );
  };

  // Fetch skills based on selected role_id using SUB_CATEGORY API
  const fetchSkills = roleId => {
    if (!roleId) {
      setAvailableSkills([]);
      return;
    }

    setSkillsLoading(true);
    // Use SUB_CATEGORY API with parent_id parameter
    const skillsRoute = `${SUB_CATEGORY}?parent_id=${roleId}`;

    GET_WITH_TOKEN(
      skillsRoute,
      success => {
        setSkillsLoading(false);
        // Handle different possible response structures
        if (success?.data && Array.isArray(success.data)) {
          const skillNames = success.data.map(skill => {
            return (
              skill?.name ||
              skill?.title ||
              skill?.category_name ||
              skill?.category ||
              skill?.subcategory_name ||
              skill?.skill_name ||
              String(skill)
            );
          });
          setAvailableSkills(skillNames);
        } else if (success?.skills && Array.isArray(success.skills)) {
          const skillNames = success.skills.map(skill => {
            return (
              skill?.name ||
              skill?.title ||
              skill?.category_name ||
              skill?.category ||
              skill?.subcategory_name ||
              skill?.skill_name ||
              String(skill)
            );
          });
          setAvailableSkills(skillNames);
        } else if (
          success?.subcategories &&
          Array.isArray(success.subcategories)
        ) {
          const skillNames = success.subcategories.map(skill => {
            return (
              skill?.name ||
              skill?.title ||
              skill?.category_name ||
              skill?.category ||
              skill?.subcategory_name ||
              skill?.skill_name ||
              String(skill)
            );
          });
          setAvailableSkills(skillNames);
        } else if (Array.isArray(success)) {
          const skillNames = success.map(skill => {
            return (
              skill?.name ||
              skill?.title ||
              skill?.category_name ||
              skill?.category ||
              skill?.subcategory_name ||
              skill?.skill_name ||
              String(skill)
            );
          });
          setAvailableSkills(skillNames);
        } else {
          setAvailableSkills([]);
        }
      },
      error => {
        setSkillsLoading(false);
        setAvailableSkills([]);
      },
      fail => {
        setSkillsLoading(false);
        setAvailableSkills([]);
      },
    );
  };

  // Handle role selection
  const handleRoleChange = item => {
    if (item) {
      setSelectedRole(item);
      // Fetch skills when role is selected
      const roleId = item.value || item.id || item.role_id;
      if (roleId) {
        fetchSkills(roleId);
      }
      // Clear skills when role changes
      setSkills([]);
    }
  };

  // Handle image selection
  const handleImageSelection = imageType => {
    setCurrentImageType(imageType);
    setShowImageModal(true);
  };

  // Handle profile photo selection
  const handleProfilePhotoSelection = () => {
    setCurrentImageType('profile_photo');
    setShowImageModal(true);
  };

  // Handle image selection from modal
  const handleImageSelected = images => {
    if (images && images.length > 0) {
      const selectedImage = images[0];
      const imageObj = {
        uri: selectedImage?.path || selectedImage?.uri,
        path: selectedImage?.path,
        name: selectedImage?.filename || `${currentImageType}.jpg`,
        type: selectedImage?.mime || 'image/jpeg',
      };

      // Set image based on type
      switch (currentImageType) {
        case 'profile_photo':
          setProfileImage(imageObj);
          break;
        case 'verification_certificate':
          setPoliceVerification(imageObj);
          break;
        case 'aadhar_front':
          setAadhaarFront(imageObj);
          break;
        case 'aadhar_back':
          setAadhaarBack(imageObj);
          break;
        default:
          break;
      }
    }
    setShowImageModal(false);
  };

  // Render image preview
  const renderImagePreview = imageType => {
    let image = null;
    switch (imageType) {
      case 'verification_certificate':
        image = policeVerification;
        break;
      case 'aadhar_front':
        image = aadhaarFront;
        break;
      case 'aadhar_back':
        image = aadhaarBack;
        break;
      default:
        break;
    }

    if (image) {
      const imageUri = image.uri || image.path || image.source?.uri;

      // Check if URI is valid (not empty, null, or undefined)
      if (
        imageUri &&
        typeof imageUri === 'string' &&
        imageUri.trim().length > 0 &&
        imageUri !== 'null' &&
        imageUri !== 'undefined'
      ) {
        const isNewImage = !!image.path;
        return (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            {isNewImage && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  switch (imageType) {
                    case 'verification_certificate':
                      setPoliceVerification(null);
                      break;
                    case 'aadhar_front':
                      setAadhaarFront(null);
                      break;
                    case 'aadhar_back':
                      setAadhaarBack(null);
                      break;
                    default:
                      break;
                  }
                }}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }
    }
    return null;
  };

  // Handle update profile
  const handleUpdateProfile = () => {
    if (updating) return;

    setUpdating(true);
    const formData = new FormData();

    // Basic Information
    if (firstName) formData.append('first_name', firstName);
    if (lastName) formData.append('last_name', lastName);
    if (gender?.value) formData.append('gender', gender.value);
    if (dob) {
      const formattedDob = formatDateWithDashes(dob);
      formData.append('dob', formattedDob);
    }
    if (email && email.trim() !== '') {
      formData.append('email', email.trim());
    }

    // Profile Image (only if new image selected, not a remote URL)
    if (profileImage?.path && !profileImage.path.startsWith('http')) {
      formData.append('profile_picture', {
        uri: profileImage.path || profileImage.uri,
        name: profileImage.name || `profile_${Date.now()}.jpg`,
        type: profileImage.type || profileImage.mime || 'image/jpeg',
      });
    }

    // Current Address
    const addresses = [];
    if (currentStreet || currentCity || currentState || currentPincode) {
      addresses.push({
        street: currentStreet || '',
        city: currentCity || '',
        state: currentState || '',
        pincode: currentPincode || '',
      });
    }

    // Permanent Address
    if (
      permanentStreet ||
      permanentCity ||
      permanentState ||
      permanentPincode
    ) {
      addresses.push({
        street: permanentStreet || '',
        city: permanentCity || '',
        state: permanentState || '',
        pincode: permanentPincode || '',
      });
    }

    // Append addresses
    addresses.forEach((address, index) => {
      formData.append(`addresses[${index}][street]`, address.street);
      formData.append(`addresses[${index}][city]`, address.city);
      formData.append(`addresses[${index}][state]`, address.state);
      formData.append(`addresses[${index}][pincode]`, address.pincode);
    });

    // Work Info - using same PROFILE_UPDATE API
    if (selectedRole?.value) {
      // Use role name/label from selectedRole
      const primaryRoleName = selectedRole.label || selectedRole.value;
      formData.append('primary_role', primaryRoleName);
    }
    if (skills && skills.length > 0) {
      // Use skills[0], skills[1] format like StepWokInfo
      skills.forEach((skill, index) => {
        formData.append(`skills[${index}]`, skill);
      });
    }
    if (language) {
      // Split by comma and send as array
      const languages =
        typeof language === 'string'
          ? language
            .split(',')
            .map(lang => lang.trim())
            .filter(lang => lang)
          : Array.isArray(language)
            ? language
            : [language];

      languages.forEach(lang => {
        formData.append('languages_spoken[]', lang);
      });
    }
    if (totalExperience?.value)
      formData.append('total_experience', totalExperience.value);

    // Last Work Experience
    if (lastRole) formData.append('role', lastRole);
    if (joinDate) {
      const formattedJoinDate = moment(joinDate).format('DD/MM/YY');
      formData.append('join_date', formattedJoinDate);
    }
    if (endDate) {
      const formattedEndDate = moment(endDate).format('DD/MM/YY');
      formData.append('end_date', formattedEndDate);
    }
    if (salary) formData.append('salary', salary);

    // KYC Documents (only if new images selected)
    if (policeVerification && policeVerification.path) {
      formData.append('verification_certificate', {
        uri: policeVerification.path || policeVerification.uri,
        name:
          policeVerification.name || `verification_certificate_${Date.now()}.jpg`,
        type: policeVerification.type || 'image/jpeg',
      });
    }
    if (aadhaarFront && aadhaarFront.path) {
      formData.append('aadhar_front', {
        uri: aadhaarFront.path || aadhaarFront.uri,
        name: aadhaarFront.name || `aadhar_front_${Date.now()}.jpg`,
        type: aadhaarFront.type || 'image/jpeg',
      });
    }
    if (aadhaarBack && aadhaarBack.path) {
      formData.append('aadhar_back', {
        uri: aadhaarBack.path || aadhaarBack.uri,
        name: aadhaarBack.name || `aadhar_back_${Date.now()}.jpg`,
        type: aadhaarBack.type || 'image/jpeg',
      });
    }

    // Add is_edit flag
    formData.append('is_edit', '1');


    POST_FORM_DATA(
      PROFILE_UPDATE,
      formData,
      success => {
        SimpleToast.show('Profile updated successfully!', SimpleToast.SHORT);
        if (success?.data) {
          dispatch(userDetails(success.data));
        }
        setUpdating(false);
        fetchProfile(); // Refresh profile data
        navigation.goBack();
      },
      error => {
        SimpleToast.show('Failed to update profile', SimpleToast.SHORT);
        setUpdating(false);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        setUpdating(false);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.EditProfile?.title || 'Edit Profile'}
        style_title={styles.headerTitle}
        containerStyle={styles.headerContainer}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => {
          navigation?.goBack();
        }}
      />
      <View>
        <View style={styles.profileContainer}>
          <View style={styles.profileWrapper}>
            <Image
              source={
                profileImage?.uri
                  ? { uri: profileImage.path || profileImage.uri }
                  : ImageConstant.user
              }
              style={styles.profileImage}
              onError={() => setProfileImage(null)}
            />
          </View>
          <TouchableOpacity
            style={styles.changePhotoBtn}
            onPress={handleProfilePhotoSelection}
          >
            <Image source={ImageConstant?.Camera} style={styles.changePhotoIcon} />
            <Typography
              type={Font?.Poppins_Medium}
              color={'#D98579'}
              style={styles.changePhotoText}
            >
              {LocalizedStrings.EditProfile?.change_photo || 'Change Photo'}
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            Basic Information
          </Typography>
          <Input
            placeholder=""
            title="First Name"
            value={firstName}
            onChange={text => setFirstName(text)}
          />
          <Input
            placeholder=""
            title="Last Name"
            value={lastName}
            onChange={text => setLastName(text)}
          />
          <DropdownComponent
            title="Gender"
            placeholder=""
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            value={gender}
            onChange={item => setGender(item)}
            data={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Other', value: 'other' },
            ]}
          />
          <Date_Picker
            title="DOB"
            placeholder=""
            selected_date={dob}
            allowFutureDates={false}
            disablePastDates={false}
            onConfirm={date => setDob(date)}
          />
        </View>

        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            Contact
          </Typography>
          <Input
            placeholder=""
            title="Mobile Number"
            keyboardType="phone-pad"
            value={phoneNumber}
            editable={false}
            style={{ opacity: 0.6 }}
          />
          <Input
            placeholder=""
            title="Email (Optional)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChange={text => setEmail(text)}
          />
        </View>

        <View style={styles.section}>
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
        </View>

        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            Current Address
          </Typography>
          <Input
            placeholder=""
            title="Street"
            value={currentStreet}
            onChange={text => setCurrentStreet(text)}
          />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                placeholder=""
                title="City"
                value={currentCity}
                onChange={text => setCurrentCity(text)}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                placeholder=""
                title="State"
                value={currentState}
                onChange={text => setCurrentState(text)}
              />
            </View>
          </View>
          <Input
            placeholder=""
            title="Pincode"
            keyboardType="number-pad"
            value={currentPincode}
            onChange={text => setCurrentPincode(text)}
          />
        </View>

        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            Permanent Address
          </Typography>
          <Input
            placeholder=""
            title="Street"
            value={permanentStreet}
            onChange={text => setPermanentStreet(text)}
          />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                placeholder=""
                title="City"
                value={permanentCity}
                onChange={text => setPermanentCity(text)}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                placeholder=""
                title="State"
                value={permanentState}
                onChange={text => setPermanentState(text)}
              />
            </View>
          </View>
          <Input
            placeholder=""
            title="Pincode"
            keyboardType="number-pad"
            value={permanentPincode}
            onChange={text => setPermanentPincode(text)}
          />
        </View>

        <View style={styles.container}>
          <View style={styles.rowBetween}>
            <Typography
              style={styles.sectionTitle}
              type={Font?.Poppins_Bold}
              size={18}
            >
              Work Info
            </Typography>
            <Image source={ImageConstant?.house} style={styles.closeIcon} />
          </View>

          <DropdownComponent
            title="Primary Role/Service"
            placeholder="Select Role"
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            value={selectedRole}
            onChange={handleRoleChange}
            data={roles}
            loading={rolesLoading}
          />

          <Typography style={styles.sectionTitle} type={Font?.Poppins_Medium}>
            Skills & Specialties
          </Typography>

          <View style={styles.skillContainer}>
            {skillsLoading ? (
              <Typography
                style={styles.loadingText}
                type={Font?.Poppins_Regular}
                size={14}
              >
                Loading skills...
              </Typography>
            ) : availableSkills.length > 0 ? (
              availableSkills.map((skill, index) => {
                const isSelected = skills.includes(skill);
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleSkill(skill)}
                    style={[
                      styles.skillChip,
                      isSelected && styles.skillChipSelected,
                    ]}
                  >
                    <Typography
                      style={[
                        styles.skillText,
                        isSelected && styles.skillTextSelected,
                      ]}
                      type={Font?.Manrope_SemiBold}
                    >
                      {skill}
                    </Typography>
                    {isSelected && (
                      <Image
                        source={ImageConstant?.X}
                        style={styles.closeIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : selectedRole ? (
              <Typography
                style={styles.noSkillsText}
                type={Font?.Poppins_Regular}
                size={14}
              >
                No skills available for this role
              </Typography>
            ) : (
              <Typography
                style={styles.noSkillsText}
                type={Font?.Poppins_Regular}
                size={14}
              >
                Please select a role to view skills
              </Typography>
            )}
          </View>

          {/* <Input
            title="Languages Spoken"
            placeholder=""
            value={language}
            onChange={(text) => setLanguage(text)}
            style={styles.input}
          /> */}

          <DropdownComponent
            title="Total Experience"
            placeholder=""
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            value={totalExperience}
            onChange={item => setTotalExperience(item)}
            data={[
              { label: '1 Year', value: '1' },
              { label: '2 Years', value: '2' },
              { label: '3 Years', value: '3' },
              { label: '4 Years', value: '4' },
              { label: '5 Years', value: '5' },
              { label: '6 Years', value: '6' },
              { label: '7 Years', value: '7' },
              { label: '8 Years', value: '8' },
              { label: '9 Years', value: '9' },
              { label: '10 Years', value: '10' },
            ]}
          />
        </View>

        <View style={styles.container}>
          <View style={{ flexDirection: 'row' }}>
            <Image
              source={ImageConstant?.Briefcase}
              style={styles.briefcaseIcon}
            />
            <Typography
              style={styles.sectionTitle}
              type={Font?.Poppins_SemiBold}
              size={18}
            >
              Last Work Experience (Optional)
            </Typography>
          </View>
          <Input
            title={'Role/Designation (Optional)'}
            placeholder={''}
            value={lastRole}
            onChange={text => setLastRole(text)}
          />
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Date_Picker
                title={'Joining Date (Optional)'}
                placeholder={''}
                selected_date={joinDate}
                allowFutureDates={false}
                disablePastDates={false}
                onConfirm={date => setJoinDate(date)}
              />
            </View>
            <View style={styles.halfInput}>
              <Date_Picker
                title={'End Date (Optional)'}
                placeholder={''}
                selected_date={endDate}
                allowFutureDates={false}
                disablePastDates={false}
                onConfirm={date => setEndDate(date)}
              />
            </View>
          </View>
          <Input
            title={'Salary (Optional)'}
            placeholder={''}
            value={salary}
            onChange={text => setSalary(text)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row' }}>
            <Image source={ImageConstant?.lines} style={styles.briefcaseIcon} />
            <Typography
              style={styles.sectionTitle}
              type={Font?.Poppins_SemiBold}
              size={18}
            >
              KYC Documents
            </Typography>
          </View>
          <View style={styles.docRowThree}>
            <View style={styles.uploadWrapperThree}>
              <UploadBox
                icon={ImageConstant.Verify}
                title="Verification Certificate"
                onPress={() => handleImageSelection('verification_certificate')}
              />
              {renderImagePreview('verification_certificate')}
            </View>
            <View style={styles.uploadWrapperThree}>
              <UploadBox
                icon={ImageConstant.Doc}
                title="Aadhaar Front"
                onPress={() => handleImageSelection('aadhar_front')}
              />
              {renderImagePreview('aadhar_front')}
            </View>
            <View style={styles.uploadWrapperThree}>
              <UploadBox
                icon={ImageConstant.Doc}
                title="Aadhaar Back"
                onPress={() => handleImageSelection('aadhar_back')}
              />
              {renderImagePreview('aadhar_back')}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomButton}>
        <Button
          title={updating ? 'Updating...' : 'Update Profile'}
          onPress={handleUpdateProfile}
          main_style={styles.buttonStyle}
          disabled={updating}
        />
      </View>

      <ImageModal
        showModal={showImageModal}
        title={'Upload Document'}
        close={() => setShowImageModal(false)}
        selected={handleImageSelected}
      />
    </CommanView>
  );
};

export default EditProfile;

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
  profileWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    width: 112,
    height: 112,
    borderWidth: 5,
    borderColor: '#EBEBEA',
    borderRadius: 112,
  },
  profileImage: {
    height: 80,
    width: 80,
    borderRadius: 40,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#EBEBEA',
    borderWidth: 1,
    padding: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  changePhotoIcon: {
    height: 20,
    width: 20,
    marginRight: 8,
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
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addPet: {
    color: '#FF6B6B',
    padding: 10,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  docRowThree: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  uploadWrapper: {
    width: '48%',
    alignItems: 'center',
  },
  uploadWrapperThree: {
    width: '31%',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    marginTop: 8,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomButton: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buttonStyle: { width: '90%' },
  container: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  halfInput: { flex: 1 },
  input: { marginTop: 16 },
  skillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 14,
    color: '#333',
  },
  skillChipSelected: {
    backgroundColor: '#D98579',
    opacity: 0.7,
  },
  skillTextSelected: {
    color: '#fff',
  },
  noSkillsText: {
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  loadingText: {
    color: '#666',
    marginTop: 8,
  },
  closeIcon: {
    width: 14,
    height: 14,
    marginLeft: 6,
    tintColor: '#555',
  },
  briefcaseIcon: {
    height: 23,
    width: 20,
    marginRight: 5,
  },
  updateBtn: {
    marginTop: 30,
  },
});
