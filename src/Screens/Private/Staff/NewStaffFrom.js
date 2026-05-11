import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import HeaderForUser from '../../../Component/HeaderForUser';
import Button from '../../../Component/Button';
import DropdownComponent from '../../../Component/DropdownComponent';
import UploadBox from '../../../Component/UploadBox';
import Date_Picker from '../../../Component/Date_Picker';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { isPlaceholderImage } from '../../../Utils/ImageUtils';
import LocalizedStrings from '../../../Constants/localization';
import { POST_FORM_DATA, GET_WITH_TOKEN } from '../../../Backend/Backend';
import ImageModal from '../../../Component/Modals/ImageModal';
import { validators } from '../../../Backend/Validator';
import { fetchPincodeDetails } from '../../../Backend/Utility';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';
import { launchImageLibrary } from 'react-native-image-picker';
import { AddStaff, UpdateStaff, CATEGORY } from '../../../Backend/api_routes';

const NewStaffForm = ({ navigation, route }) => {
  const data = route?.params?.userData;
  const adharNumber = route?.params?.adharNumber;

  // Personal Details States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumberCountryCode, setPhoneNumberCountryCode] = useState('+91');
  const [aadharNumber, setAadharNumber] = useState(adharNumber || '');
  const [gender, setGender] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  // renamed to avoid confusion with React state
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [relation, setRelation] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentPickerType, setCurrentPickerType] = useState(null);

  // Work Details States
  const [roleDesignation, setRoleDesignation] = useState(null);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [joiningDate, setJoiningDate] = useState('');
  const [salary, setSalary] = useState('');
  const [upiId, setUpiId] = useState('');
  const [payFrequency, setPayFrequency] = useState(null);
  const [workingDays, setWorkingDays] = useState([]); // array of values

  // Document States
  const [staffPhoto, setStaffPhoto] = useState(null);
  const [policeClearance, setPoliceClearance] = useState(null);
  const [aadharCard, setAadharCard] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);

  // API States
  const [loading, setLoading] = useState(false);

  // Error States
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    aadharNumber: '',
    gender: '',
    dateOfBirth: '',
    street: '',
    city: '',
    stateName: '',
    pincode: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    relation: '',
    roleDesignation: '',
    joiningDate: '',
    salary: '',
    payFrequency: '',
    workingDays: '',
  });

  // Gender Options
  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  // Pay Frequency Options
  const payFrequencyOptions = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Daily', value: 'daily' },
  ];

  // Working Days Options
  const workingDaysOptions = [
    { label: 'Mon', value: 'Monday' },
    { label: 'Tue', value: 'Tuesday' },
    { label: 'Wed', value: 'Wednesday' },
    { label: 'Thu', value: 'Thursday' },
    { label: 'Fri', value: 'Friday' },
    { label: 'Sat', value: 'Saturday' },
    { label: 'Sun', value: 'Sunday' },
  ];

  // Relation Options
  const relationOptions = [
    { label: 'Brother', value: 'brother' },
    { label: 'Sister', value: 'sister' },
    { label: 'Father', value: 'father' },
    { label: 'Mother', value: 'mother' },
    { label: 'Son', value: 'son' },
    { label: 'Daughter', value: 'daughter' },
    { label: 'Spouse', value: 'spouse' },
    { label: 'Friend', value: 'friend' },
    { label: 'Other', value: 'other' },
  ];

  // Check if editing mode - only true when explicitly passed as edit
  const isEditMode = !!route?.params?.isEdit;
  const staffId = route?.params?.staffId || data?.staff_id || data?.id;

  // Populate form with existing data when editing
  useEffect(() => {
    if (data && data.id) {
      // Personal Details
      if (data.first_name) setFirstName(data.first_name);
      if (data.last_name) setLastName(data.last_name);

      // If first_name is missing but name or full_name is present (common in Aadhaar verified data), split it
      const displayName = data.name || data.full_name || data.fullname;
      if (displayName && !data.first_name && !firstName) {
        const nameParts = displayName.trim().split(/\s+/);
        if (nameParts.length > 0) {
          setFirstName(nameParts[0]);
          if (nameParts.length > 1) {
            setLastName(nameParts.slice(1).join(' '));
          }
        }
      }

      if (data.email) setEmail(data.email);
      if (data.phone_number || data.mobile) setPhoneNumber(data.phone_number || data.mobile);
      if (data.phone_number_country_code || data.country_code) {
        setPhoneNumberCountryCode(data.phone_number_country_code || data.country_code);
      }
      if (data.aadhar_number || data.aadhaar) setAadharNumber(data.aadhar_number || data.aadhaar);

      // Gender - find matching option
      const userGender = data.gender || data.sex;
      if (userGender) {
        const genderOption = genderOptions.find(
          opt =>
            opt.value === userGender ||
            opt.value.toLowerCase() === userGender.toLowerCase() ||
            opt.label.toLowerCase() === userGender.toLowerCase()
        );
        if (genderOption) {
          setGender(genderOption);
        } else {
          setGender({
            label: userGender.charAt(0).toUpperCase() + userGender.slice(1),
            value: userGender.toLowerCase(),
          });
        }
      }

      // Date of Birth
      const userDob = data.dob || data.birthdate || data.date_of_birth || data.birth_date;
      if (userDob) {
        // Handle different date formats
        const dobMoment = moment(
          userDob,
          ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY', moment.ISO_8601],
          true,
        );
        if (dobMoment.isValid()) {
          setDateOfBirth(dobMoment.format('YYYY-MM-DD'));
        } else {
          setDateOfBirth(userDob);
        }
      }

      // Address from addresses array
      if (data.addresses && data.addresses.length > 0) {
        const address = data.addresses[0];
        if (address.street) setStreet(address.street);
        if (address.city) setCity(address.city);
        if (address.state) setStateName(address.state);
        if (address.pincode) setPincode(String(address.pincode));
      }

      // Relation
      if (data.relation) {
        // Check if it's a string (name) or needs to be mapped to option
        const relationOption = relationOptions.find(
          opt => opt.value === data.relation || opt.label === data.relation,
        );
        if (relationOption) {
          setRelation(relationOption);
        } else {
          // If relation is a name string, try to find or create option
          setRelation({
            label: data.relation,
            value: data.relation.toLowerCase(),
          });
        }
      }

      // UPI ID
      if (data.upi_id) setUpiId(data.upi_id);

      if (data.user_work_info) {
        const workInfo = data.user_work_info;
        if (workInfo.emergency_contact_name) setEmergencyContactName(workInfo.emergency_contact_name);
        if (workInfo.emergency_contact_number) setEmergencyContactNumber(workInfo.emergency_contact_number);
        if (workInfo.joining_date) setJoiningDate(workInfo.joining_date);
        if (workInfo.salary) setSalary(String(workInfo.salary));
        if (workInfo.pay_frequency) {
          const freqOption = payFrequencyOptions.find(opt => opt.value === workInfo.pay_frequency);
          setPayFrequency(freqOption || { label: workInfo.pay_frequency, value: workInfo.pay_frequency });
        }
        if (workInfo.working_days) {
          try {
            const days = typeof workInfo.working_days === 'string' 
              ? JSON.parse(workInfo.working_days) 
              : workInfo.working_days;
            setWorkingDays(Array.isArray(days) ? days : []);
          } catch (e) {
            setWorkingDays([]);
          }
        }
      }

      // Images - only set if it's a real image and not a placeholder
      if (data.image && !isPlaceholderImage(data.image)) {
        setStaffPhoto({ uri: data.image });
      }
      if (data.aadhar_front && !isPlaceholderImage(data.aadhar_front)) {
        setAadharCard({ uri: data.aadhar_front });
      }
      if (data.aadhar_back && !isPlaceholderImage(data.aadhar_back)) {
        setAadharBack({ uri: data.aadhar_back });
      }
      if (
        data.verification_certificate &&
        !isPlaceholderImage(data.verification_certificate)
      ) {
        setPoliceClearance({ uri: data.verification_certificate });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Clear city and state when pincode is cleared
  useEffect(() => {
    if (!pincode || pincode.length < 6) {
      setCity('');
      setStateName('');
      setErrors(prev => ({ ...prev, city: '', stateName: '' }));
    }
  }, [pincode]);

  // Fetch pincode details and auto-fill city and state
  useEffect(() => {
    const fetchDetails = async () => {
      if (pincode && pincode.length === 6) {
        try {
          const details = await fetchPincodeDetails(pincode);
          if (details && details.city) {
            setCity(details.city);
            setErrors(prev => (prev?.city ? { ...prev, city: null } : prev));
          }
          if (details && details.state) {
            setStateName(details.state);
            setErrors(prev =>
              prev?.stateName ? { ...prev, stateName: null } : prev,
            );
          }
        } catch (error) {
          console.error('Error fetching pincode details:', error);
        }
      }
    };

    // Small delay to avoid multiple calls (matching StepLocation)
    const timer = setTimeout(() => {
      fetchDetails();
    }, 300);

    return () => clearTimeout(timer);
  }, [pincode]);

  // Fetch roles from CATEGORY API on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = () => {
    setRolesLoading(true);
    GET_WITH_TOKEN(
      CATEGORY,
      success => {
        setRolesLoading(false);
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
        }

        setRoles(rolesData);
      },
      error => {
        setRolesLoading(false);
        SimpleToast.show('Failed to load roles', SimpleToast.SHORT);
      },
    );
  };

  // Match role name to dropdown value when roles are loaded (for edit mode)
  useEffect(() => {
    if (roles.length > 0 && roleDesignation && typeof roleDesignation === 'string') {
      const roleObj = roles.find(
        role =>
          role.label === roleDesignation ||
          role.label?.toLowerCase() === roleDesignation?.toLowerCase() ||
          role.label?.includes(roleDesignation) ||
          roleDesignation?.includes(role.label),
      );
      if (roleObj) {
        setRoleDesignation(roleObj.value || roleObj.id);
      }
    }
  }, [roles]);

  // Clear error handlers
  const clearError = field => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Image picker handler
  const handleImagePicker = type => {
    setCurrentPickerType(type);
    setShowImageModal(true);
  };

  const handleImageSelected = (images) => {
    if (images && images.length > 0) {
      const asset = images[0];
      const imageData = {
        uri: asset.uri || asset.path,
        type: asset.type || asset.mime || 'image/jpeg',
        name: asset.fileName || asset.filename || `${currentPickerType}_${Date.now()}.jpg`,
        path: asset.path || asset.uri,
      };

      if (currentPickerType === 'staffPhoto') {
        setStaffPhoto(imageData);
      } else if (currentPickerType === 'policeClearance') {
        setPoliceClearance(imageData);
      } else if (currentPickerType === 'aadharCard') {
        setAadharCard(imageData);
      } else if (currentPickerType === 'aadharBack') {
        setAadharBack(imageData);
      }
    }
  };

  // toggle working day for multi-select
  const toggleWorkingDay = dayValue => {
    setWorkingDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      }
      return [...prev, dayValue];
    });
    clearError('workingDays');
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      aadharNumber: '',
      gender: '',
      dateOfBirth: '',
      street: '',
      city: '',
      stateName: '',
      pincode: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      relation: '',
      roleDesignation: '',
      joiningDate: '',
      salary: '',
      payFrequency: '',
      workingDays: '',
    };

    let hasError = false;

    // Validate First Name — use checkName (allows numbers/hyphens/apostrophes)
    // instead of checkAlphabet which rejects digits entirely
    const firstNameError = validators.checkName(
      'First Name',
      2,
      50,
      firstName,
    );
    if (firstNameError) {
      newErrors.firstName = firstNameError;
      hasError = true;
    }

    // Validate Last Name
    const lastNameError = validators.checkName(
      'Last Name',
      2,
      50,
      lastName,
    );
    if (lastNameError) {
      newErrors.lastName = lastNameError;
      hasError = true;
    }

    // Validate Email (optional - only validate format if provided)
    if (email && email.trim() !== '') {
      const emailError = validators.checkEmail('Email', email);
      if (emailError) {
        newErrors.email = emailError;
        hasError = true;
      }
    }

    // Validate Phone Number
    const phoneError = validators.checkFixPhoneNumber(
      'Phone Number',
      phoneNumber,
      10,
      10,
    );
    if (phoneError) {
      newErrors.phoneNumber = phoneError;
      hasError = true;
    }

    // Validate Aadhar Number
    if (!aadharNumber || aadharNumber.trim() === '') {
      newErrors.aadharNumber = 'Aadhar Number field is required.';
      hasError = true;
    } else if (!/^\d{12}$/.test(aadharNumber)) {
      newErrors.aadharNumber = 'Aadhar Number must be 12 digits.';
      hasError = true;
    }

    // Validate Gender
    if (!gender || (!gender?.value && !gender)) {
      newErrors.gender = 'Please select gender';
      hasError = true;
    }

    // Validate Date of Birth
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth field is required.';
      hasError = true;
    } else {
      const selectedDate = moment(
        dateOfBirth,
        ['YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601],
        true,
      );
      const today = moment();
      if (!selectedDate.isValid()) {
        newErrors.dateOfBirth = 'Invalid date format for Date of Birth.';
        hasError = true;
      } else if (selectedDate.isAfter(today)) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future.';
        hasError = true;
      }
    }

    // Validate Street
    if (!street || street.trim() === '') {
      newErrors.street = 'Street/Landmark field is required.';
      hasError = true;
    } else if (street.trim().length < 5) {
      newErrors.street = 'Street/Landmark must be at least 5 characters.';
      hasError = true;
    }

    // Validate City
    const cityError = validators.checkAlphabet('City', 2, 50, city);
    if (cityError) {
      newErrors.city = cityError;
      hasError = true;
    }

    // Validate State
    const stateError = validators.checkAlphabet('State', 2, 50, stateName);
    if (stateError) {
      newErrors.stateName = stateError;
      hasError = true;
    }

    // Validate Pincode
    if (!pincode || pincode.trim() === '') {
      newErrors.pincode = 'Pincode field is required.';
      hasError = true;
    } else if (!/^\d{6}$/.test(pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits.';
      hasError = true;
    }

    // Validate Emergency Contact Name (optional - only if provided)
    if (emergencyContactName && emergencyContactName.trim()) {
      const emergencyNameError = validators.checkAlphabet(
        'Emergency Contact Name',
        2,
        50,
        emergencyContactName,
      );
      if (emergencyNameError) {
        newErrors.emergencyContactName = emergencyNameError;
        hasError = true;
      }
    }

    // Validate Emergency Contact Number (optional - only if provided)
    if (emergencyContactNumber && emergencyContactNumber.trim()) {
      const emergencyPhoneError = validators.checkFixPhoneNumber(
        'Emergency Contact Number',
        emergencyContactNumber,
        10,
        10,
      );
      if (emergencyPhoneError) {
        newErrors.emergencyContactNumber = emergencyPhoneError;
        hasError = true;
      }
    }

    // Validate Relation (optional - only if emergency contact is provided)
    if ((emergencyContactName || emergencyContactNumber) && (!relation || (!relation?.value && !relation))) {
      newErrors.relation = 'Please select relation';
      hasError = true;
    }

    // Work details are optional (staff can be a fresher)

    // Validate Joining Date only if provided
    if (joiningDate) {
      const joinDateParsed = moment(
        joiningDate,
        ['YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601],
        true,
      );
      if (!joinDateParsed.isValid()) {
        newErrors.joiningDate = 'Invalid joining date format.';
        hasError = true;
      }
    }

    // Validate Salary only if provided
    if (salary && salary.trim() !== '') {
      const salaryError = validators.priceCheck('Salary', salary);
      if (salaryError) {
        newErrors.salary = salaryError;
        hasError = true;
      }
    }

    setErrors(newErrors);
    return !hasError;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (loading) return;

    if (!validateForm()) {
      SimpleToast.show(
        'Please fill all required fields correctly',
        SimpleToast.SHORT,
      );
      return;
    }

    setLoading(true);

    const formData = new FormData();

    // Personal Details - ensure all values are trimmed and not empty
    formData.append('first_name', firstName?.trim() || '');
    formData.append('last_name', lastName?.trim() || '');
    formData.append('email', email?.trim() || '');

    formData.append('phone_number', phoneNumber?.trim() || '');
    formData.append(
      'phone_number_country_code',
      phoneNumberCountryCode || '+91',
    );

    // Handle gender - extract value from dropdown object
    const genderValue = gender?.value || gender || '';
    formData.append('gender', genderValue);

    // Format date of birth properly - should already be in YYYY-MM-DD format from Date_Picker
    if (
      !dateOfBirth ||
      (typeof dateOfBirth === 'string' && dateOfBirth.trim() === '')
    ) {
      SimpleToast.show('Date of birth is required', SimpleToast.SHORT);
      setLoading(false);
      return;
    }
    const dobValue =
      typeof dateOfBirth === 'string'
        ? dateOfBirth.trim()
        : moment(dateOfBirth).format('YYYY-MM-DD');
    formData.append('dob', dobValue);

    formData.append('street', street?.trim() || '');
    formData.append('city', city?.trim() || '');
    formData.append('state', stateName?.trim() || '');
    formData.append('pincode', pincode?.trim() || '');
    formData.append(
      'emergency_contact_name',
      emergencyContactName?.trim() || '',
    );
    formData.append(
      'emergency_contact_number',
      emergencyContactNumber?.trim() || '',
    );

    // Handle relation - extract value from dropdown object
    const relationValue = relation?.value || relation || '';
    formData.append('relation', relationValue);

    formData.append('aadhar_number', aadharNumber?.trim() || '');

    // Work Details - all optional (staff can be a fresher)

    // Role designation - only append if selected
    if (roleDesignation) {
      const selectedRoleObj = roles.find(
        role => role.value === (roleDesignation?.value || roleDesignation) ||
                role.id === (roleDesignation?.value || roleDesignation),
      );
      const roleName = selectedRoleObj?.label || roleDesignation?.label || roleDesignation || '';
      const roleStr = typeof roleName === 'string' ? roleName.trim() : String(roleName);
      if (roleStr) {
        formData.append('role_designation[0]', roleStr);
      }
    }

    // Joining date - send default (today) if not provided, backend requires it
    if (joiningDate && (typeof joiningDate !== 'string' || joiningDate.trim() !== '')) {
      const joinDateValue =
        typeof joiningDate === 'string'
          ? joiningDate.trim()
          : moment(joiningDate).format('YYYY-MM-DD');
      formData.append('joining_date', joinDateValue);
    } else {
      formData.append('joining_date', moment().format('YYYY-MM-DD'));
    }

    // Salary - send 0 as default if not provided
    formData.append('salary', salary?.trim() || '0');

    if (upiId?.trim()) {
      formData.append('upi_id', upiId.trim());
    }

    // Pay frequency - send default if not selected
    const payFreqValue = payFrequency?.value || payFrequency || 'monthly';
    formData.append('pay_frequency', payFreqValue);

    // Working Days — always use full English names (Monday, Tuesday, …)
    // so backend comparison (strtolower) works correctly.
    // If user selected nothing, default to Mon–Sat (no Sunday).
    const daysToSend =
      Array.isArray(workingDays) && workingDays.length > 0
        ? workingDays
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    daysToSend.forEach((day, index) => {
      formData.append(`working_days[${index}]`, day);
    });

    // Documents - only send newly picked images (they have a .type from image picker)
    // Don't re-send existing server URLs as file uploads
    if (staffPhoto && staffPhoto.uri && staffPhoto.type) {
      formData.append('staff_photo', {
        uri: staffPhoto.uri,
        name: staffPhoto.name || 'staff_photo.jpg',
        type: staffPhoto.type || 'image/jpeg',
      });
    }

    if (!data?.verification_certificate && policeClearance && policeClearance.uri && policeClearance.type) {
      formData.append('police_clearance_certificate', {
        uri: policeClearance.uri,
        name: policeClearance.name || 'police_clearance_certificate.jpg',
        type: policeClearance.type || 'image/jpeg',
      });
    }

    if (!data?.aadhar_front && aadharCard && aadharCard.uri && aadharCard.type) {
      formData.append('aadhar_front', {
        uri: aadharCard.uri,
        name: aadharCard.name || 'aadhar_front.jpg',
        type: aadharCard.type || 'image/jpeg',
      });
    }

    if (!data?.aadhar_back && aadharBack && aadharBack.uri && aadharBack.type) {
      formData.append('aadhar_back', {
        uri: aadharBack.uri,
        name: aadharBack.name || 'aadhar_back.jpg',
        type: aadharBack.type || 'image/jpeg',
      });
    }

    formData.append('is_staff_added', 1);

    // If adding an existing user as staff, pass their user_id
    if (data?.id && !isEditMode) {
      formData.append('user_id', String(data.id));
    }

    // Determine API endpoint and add staff_id for update
    const apiEndpoint = isEditMode ? `${UpdateStaff}/${staffId}` : AddStaff;

    if (isEditMode) {
      formData.append('staff_id', String(staffId));
    }
    console.log('apiEndpoint----', apiEndpoint, 'user_id:', data?.id);

    POST_FORM_DATA(
      PROFILE_UPDATE,
      formData,
      success => {
        setLoading(false);
        SimpleToast.show(
          success?.message ||
          (isEditMode
            ? 'Staff updated successfully!'
            : 'Staff added successfully!'),
          SimpleToast.SHORT,
        );
        navigation.navigate('TabNavigation', {
          screen: 'Dashboard',
        });
      },
      error => {
        setLoading(false);
        console.log('API Error Full:', JSON.stringify(error));

        // Extract Laravel validation errors
        const validationErrors = error?.errors || error?.data?.errors;
        if (validationErrors && typeof validationErrors === 'object') {
          // Get first validation error message for each field
          const fieldErrors = Object.entries(validationErrors)
            .map(([field, messages]) => {
              const msg = Array.isArray(messages) ? messages[0] : messages;
              return `${field}: ${msg}`;
            })
            .join('\n');
          console.log('Validation errors:', fieldErrors);
          SimpleToast.show(fieldErrors, SimpleToast.LONG);
        } else {
          const errorMessage =
            error?.message ||
            error?.data?.message ||
            error?.response?.data?.message ||
            (isEditMode
              ? 'Failed to update staff. Please try again.'
              : 'Failed to add staff. Please try again.');
          SimpleToast.show(errorMessage, SimpleToast.LONG);
        }
      },
      fail => {
        setLoading(false);
        SimpleToast.show(
          'Network error. Please check your connection and try again.',
          SimpleToast.SHORT,
        );
        console.log('Network Error:-----', fail);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        source_arrow={ImageConstant?.BackArrow}
        title={LocalizedStrings.NewStaffForm.title}
        style_title={styles.headerTitle}
        containerStyle={styles.headerContainer}
        onPressLeftIcon={() => {
          navigation?.goBack();
        }}
      />

      <View>
        {/* Personal Details */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={ImageConstant.person}
              style={{ height: 20, width: 20, marginRight: 8 }}
              resizeMode="contain"
            />
            <Typography
              type={Font?.Poppins_SemiBold}
              style={styles.sectionTitle}
            >
              {LocalizedStrings.NewStaffForm.Personal_Details}
            </Typography>
          </View>

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.First_Name || 'First Name'
            }
            title={LocalizedStrings.NewStaffForm.First_Name || 'First Name'}
            value={firstName}
            onChange={value => {
              setFirstName(value);
              clearError('firstName');
            }}
            error={errors.firstName}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={LocalizedStrings.NewStaffForm.Last_Name || 'Last Name'}
            title={LocalizedStrings.NewStaffForm.Last_Name || 'Last Name'}
            value={lastName}
            onChange={value => {
              setLastName(value);
              clearError('lastName');
            }}
            error={errors.lastName}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.Email_Placeholder || 'Email'
            }
            title={LocalizedStrings.NewStaffForm.Email ? `${LocalizedStrings.NewStaffForm.Email} (Optional)` : 'Email (Optional)'}
            value={email}
            onChange={value => {
              setEmail(value);
              clearError('email');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.Mobile_Placeholder || '9876543210'
            }
            title={
              LocalizedStrings.NewStaffForm.Mobile_Number || 'Mobile Number'
            }
            value={phoneNumber}
            onChange={value => {
              const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 10);
              setPhoneNumber(digitsOnly);
              clearError('phoneNumber');
            }}
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phoneNumber}
          />

          <Input
            editable={false}
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.Aadhaar_Placeholder ||
              '123456789012'
            }
            title={
              LocalizedStrings.NewStaffForm.Aadhaar_Number || 'Aadhaar Number'
            }
            value={aadharNumber}
            onChange={value => {
              setAadharNumber(value);
              clearError('aadharNumber');
            }}
            keyboardType="number-pad"
            maxLength={12}
            error={errors.aadharNumber}
          />

          <DropdownComponent
            title={LocalizedStrings.NewStaffForm.Gender || 'Gender'}
            placeholder={
              LocalizedStrings.NewStaffForm.Select_Gender || 'Select Gender'
            }
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            data={genderOptions}
            value={gender}
            onChange={item => {
              setGender(item);
              clearError('gender');
            }}
            error={errors.gender}
          />

          <Date_Picker
            title={
              LocalizedStrings.NewStaffForm.Date_of_Birth || 'Date of Birth'
            }
            placeholder="DD-MM-YYYY"
            selected_date={dateOfBirth}
            onConfirm={date => {
              // Store as Date object or formatted string
              const formattedDate = moment(date).format('YYYY-MM-DD');
              setDateOfBirth(formattedDate);
              clearError('dateOfBirth');
            }}
            allowFutureDates={false}
            error={errors.dateOfBirth}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.Street_Landmark || 'Street/Landmark'
            }
            title={LocalizedStrings.NewStaffForm.Home_Address || 'Home Address'}
            value={street}
            onChange={value => {
              setStreet(value);
              clearError('street');
            }}
            style_input={{ textAlign: 'start' }}
            // style_inputContainer={{ height: 100 }}
            multiline
            numberOfLines={2}
            error={errors.street}
          />
          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.Pincode_Placeholder || '400050'
            }
            title={LocalizedStrings.NewStaffForm.Pincode || 'Pincode'}
            value={pincode}
            onChange={value => {
              // Only allow numbers and limit to 6 digits
              const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
              setPincode(numericValue);
              clearError('pincode');
            }}
            keyboardType="number-pad"
            maxLength={6}
            error={errors.pincode}
          />
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                style_title={{ color: '#8C8D8B' }}
                placeholder={LocalizedStrings.NewStaffForm.City || 'Mumbai'}
                title={LocalizedStrings.NewStaffForm.City || 'City'}
                value={city}
                onChange={value => {
                  setCity(value);
                  clearError('city');
                }}
                error={errors.city}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                style_title={{ color: '#8C8D8B' }}
                placeholder={
                  LocalizedStrings.NewStaffForm.State_Placeholder ||
                  'Maharashtra'
                }
                title={LocalizedStrings.NewStaffForm.State || 'State'}
                value={stateName}
                onChange={value => {
                  setStateName(value);
                  clearError('stateName');
                }}
                error={errors.stateName}
              />
            </View>
          </View>

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm
                .Emergency_Contact_Name_Placeholder || 'Emergency Contact Name'
            }
            title={
              LocalizedStrings.NewStaffForm.Emergency_Contact_Name ||
              'Emergency Contact Name'
            }
            value={emergencyContactName}
            onChange={value => {
              setEmergencyContactName(value);
              clearError('emergencyContactName');
            }}
            error={errors.emergencyContactName}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm
                .Emergency_Contact_Number_Placeholder || '9123456780'
            }
            title={
              LocalizedStrings.NewStaffForm.Emergency_Contact_Number ||
              'Emergency Contact Number'
            }
            value={emergencyContactNumber}
            onChange={value => {
              const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 10);
              setEmergencyContactNumber(digitsOnly);
              clearError('emergencyContactNumber');
            }}
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.emergencyContactNumber}
          />

          <DropdownComponent
            title={LocalizedStrings.AddNewMember?.relation || 'Relation'}
            placeholder={
              LocalizedStrings.AddNewMember?.select_relation ||
              'Select Relation'
            }
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            data={relationOptions}
            value={relation}
            onChange={item => {
              setRelation(item);
              clearError('relation');
            }}
            error={errors.relation}
          />
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={ImageConstant.Verify}
              style={{ height: 20, width: 20, marginRight: 8 }}
              resizeMode="contain"
            />
            <Typography
              type={Font?.Poppins_SemiBold}
              style={styles.sectionTitle}
            >
              {LocalizedStrings.NewStaffForm.Work_Details}
            </Typography>
          </View>

          <DropdownComponent
            title={LocalizedStrings.NewStaffForm.Role_Designation || 'Role/Designation'}
            placeholder={
              rolesLoading
                ? 'Loading roles...'
                : LocalizedStrings.NewStaffForm.Role_Placeholder || 'Select Role'
            }
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            value={roleDesignation}
            onChange={item => {
              setRoleDesignation(item);
              clearError('roleDesignation');
            }}
            data={roles}
            disable={rolesLoading}
            error={errors.roleDesignation}
          />

          <Date_Picker
            title={LocalizedStrings.NewStaffForm.Joining_Date || 'Joining Date'}
            placeholder="DD-MM-YYYY"
            selected_date={joiningDate}
            onConfirm={date => {
              // Store as Date object or formatted string
              const formattedDate = moment(date).format('YYYY-MM-DD');
              setJoiningDate(formattedDate);
              clearError('joiningDate');
            }}
            allowFutureDates={true}
            error={errors.joiningDate}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={
              LocalizedStrings.NewStaffForm.Salary_Placeholder || 'e.g. 10000'
            }
            title={LocalizedStrings.NewStaffForm.Salary}
            value={salary}
            onChange={value => {
              setSalary(value);
              clearError('salary');
            }}
            keyboardType="numeric"
            error={errors.salary}
          />

          <Input
            style_title={{ color: '#8C8D8B' }}
            placeholder={'e.g. name@upi'}
            title={'UPI ID'}
            value={upiId}
            onChange={value => setUpiId(value)}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <DropdownComponent
            title={LocalizedStrings.NewStaffForm.Pay_Frequency}
            placeholder={
              LocalizedStrings.NewStaffForm.Select_Frequency ||
              'Select Frequency'
            }
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            data={payFrequencyOptions}
            value={payFrequency}
            onChange={item => {
              setPayFrequency(item);
              clearError('payFrequency');
            }}
            error={errors.payFrequency}
          />

          <Typography
            type={Font?.Poppins_Bold}
            size={14}
            style={{ marginTop: 15 }}
          >
            {LocalizedStrings.NewStaffForm.Working_Days || 'Working Schedule'}
          </Typography>
          <View style={styles.daysContainer}>
            {workingDaysOptions.map((day, index) => {
              const isSelected = workingDays.includes(day.value);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayChip,
                    isSelected && styles.dayChipSelected,
                  ]}
                  onPress={() => toggleWorkingDay(day.value)}
                >
                  {isSelected && (
                    <Image
                      source={ImageConstant?.check}
                      style={{
                        width: 12,
                        height: 12,
                        tintColor: '#fff',
                        marginRight: 4,
                      }}
                    />
                  )}
                  <Text style={[
                    styles.dayChipText,
                    isSelected && styles.dayChipTextSelected,
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.workingDays ? (
            <Typography
              textAlign={'right'}
              style={{ color: 'red', fontSize: 12, marginTop: 5 }}
            >
              {errors.workingDays}
            </Typography>
          ) : null}
        </View>

        <View style={styles.section}>
          <Typography type={Font?.Poppins_SemiBold} style={styles.sectionTitle}>
            {LocalizedStrings.NewStaffForm.KYC_Documents}
          </Typography>

          {/* Staff Photo - always uploadable */}
          <View style={styles.uploadRowSingle}>
            <UploadBox
              title={LocalizedStrings.NewStaffForm.Staff_Photo}
              icon={ImageConstant.NewCamera}
              styles_container={styles.uploadBoxHalf}
              onPress={() => handleImagePicker('staffPhoto')}
              image={staffPhoto}
            />
          </View>

          {/* Police Clearance & Aadhaar - show read-only if staff already uploaded them */}
          {data?.aadhar_front || data?.verification_certificate ? (
            <>
              {data?.verification_certificate && (
                <View style={styles.readOnlyDocRow}>
                  <Typography type={Font?.Poppins_Medium} style={styles.readOnlyDocLabel}>
                    {LocalizedStrings.NewStaffForm.Police_Clearance_Certificate || 'Police Clearance'}
                  </Typography>
                  <Image
                    source={{ uri: data.verification_certificate }}
                    style={styles.readOnlyDocImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              <View style={styles.uploadRow}>
                {data?.aadhar_front ? (
                  <View style={[styles.uploadBox, styles.readOnlyDocContainer]}>
                    <Typography type={Font?.Poppins_Medium} style={styles.readOnlyDocLabel}>
                      {LocalizedStrings.NewStaffForm.Aadhaar_Card_Details || 'Aadhaar Front'}
                    </Typography>
                    <Image
                      source={{ uri: data.aadhar_front }}
                      style={styles.readOnlyDocImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <UploadBox
                    title={LocalizedStrings.NewStaffForm.Aadhaar_Card_Details || 'Aadhaar Front'}
                    icon={ImageConstant.Doc}
                    styles_container={styles.uploadBox}
                    onPress={() => handleImagePicker('aadharCard')}
                    image={aadharCard}
                  />
                )}
                {data?.aadhar_back ? (
                  <View style={[styles.uploadBox, styles.readOnlyDocContainer]}>
                    <Typography type={Font?.Poppins_Medium} style={styles.readOnlyDocLabel}>
                      {'Aadhaar Card Back'}
                    </Typography>
                    <Image
                      source={{ uri: data.aadhar_back }}
                      style={styles.readOnlyDocImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <UploadBox
                    title={'Aadhaar Card Back'}
                    icon={ImageConstant.Doc}
                    styles_container={styles.uploadBox}
                    onPress={() => handleImagePicker('aadharBack')}
                    image={aadharBack}
                  />
                )}
              </View>
            </>
          ) : (
            <>
              <View style={styles.uploadRow}>
                <UploadBox
                  title={LocalizedStrings.NewStaffForm.Police_Clearance_Certificate}
                  icon={ImageConstant.Verify}
                  styles_container={styles.uploadBox}
                  onPress={() => handleImagePicker('policeClearance')}
                  image={policeClearance}
                />
                <UploadBox
                  title={LocalizedStrings.NewStaffForm.Aadhaar_Card_Details || 'Aadhaar Front'}
                  icon={ImageConstant.Doc}
                  styles_container={styles.uploadBox}
                  onPress={() => handleImagePicker('aadharCard')}
                  image={aadharCard}
                />
              </View>
              <View style={styles.uploadRow}>
                <UploadBox
                  title={'Aadhaar Card Back'}
                  icon={ImageConstant.Doc}
                  styles_container={styles.uploadBox}
                  onPress={() => handleImagePicker('aadharBack')}
                  image={aadharBack}
                />
                <View style={styles.uploadBox} />
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.bottomButton}>
        <Button
          title={
            isEditMode
              ? LocalizedStrings.NewStaffForm.Update_Staff || 'Update Staff'
              : LocalizedStrings.NewStaffForm.Add_Staff
          }
          onPress={() => handleSubmit()}
          main_style={styles.buttonStyle}
          loader={loading}
        />
      </View>

      <ImageModal
        showModal={showImageModal}
        title={'Upload Document'}
        close={() => setShowImageModal(false)}
        selected={handleImageSelected}
        document={true}
      />
    </CommanView>
  );
};

export default NewStaffForm;

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#EBEBEA',
  },
  sectionTitle: {
    fontSize: 18,
  },
  uploadRowSingle: {
    alignItems: 'center',
    marginTop: 12,
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  uploadBoxFull: {
    width: '80%',
  },
  uploadBoxHalf: {
    width: '48%',
  },
  uploadBox: {
    flex: 1,
    marginHorizontal: 6,
  },
  readOnlyDocRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  readOnlyDocContainer: {
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
  },
  readOnlyDocLabel: {
    fontSize: 12,
    color: '#8C8D8B',
    marginBottom: 6,
    textAlign: 'center',
  },
  readOnlyDocImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    backgroundColor: '#F9F9F9',
  },
  bottomButton: {
    marginTop: 30,
    marginBottom: 30,
    alignItems: 'center',
  },
  buttonStyle: {
    width: '90%',
  },
  docBox: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    alignItems: 'center',
  },
  docLink: {
    fontSize: 13,
    color: '#D98579',
    fontFamily: Font.Poppins_SemiBold,
    marginTop: 4,
  },
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
  },
  dayChipSelected: {
    borderColor: '#D98579',
    backgroundColor: '#D98579',
  },
  dayChipText: {
    fontSize: 13,
    color: '#333',
  },
  dayChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
