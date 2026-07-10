import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { userDetails } from '../../../Redux/action';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import DropdownComponent from '../../../Component/DropdownComponent';
import Button from '../../../Component/Button';
import {
  GET_WITH_TOKEN,
  POST_FORM_DATA,
  POST_WITH_TOKEN,
} from '../../../Backend/Backend';
import {
  AddJob,
  ApplicantsList,
  ListJob,
  CATEGORY,
  PROFILE,
  SUBSCRIPTION_CREATE_EXTRA_JOB_ORDER,
  SUBSCRIPTION_VERIFY_EXTRA_JOB_PAYMENT,
} from '../../../Backend/api_routes';
import { initiatePayment } from '../../../Services/RazorpayService';
import SimpleToast from 'react-native-simple-toast';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import LocalizedStrings from '../../../Constants/localization';
import { fetchPincodeDetails } from '../../../Backend/Utility';
import { validators } from '../../../Backend/Validator';
import { isValidForm } from '../../../Backend/Utility';

const PostNewJob = ({ navigation, route }) => {
  const editId = route?.params?.id;
  const [jobData, setJobData] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const dispatch = useDispatch();
  const userDetail = useSelector(state => state?.userDetails);
  const userAddresses = userDetail?.addresses || [];

  const getAddressKey = addr =>
    [
      addr?.id || '',
      addr?.street || addr?.streetAddress || '',
      addr?.city || '',
      typeof addr?.state === 'string' ? addr?.state : addr?.state?.label || '',
      addr?.pincode || addr?.zip_code || '',
    ]
      .join('|')
      .toLowerCase();

  // Compensation
  const [expectedCompensation, setExpectedCompensation] = useState('');
  const [compensationType, setCompensationType] = useState({ label: 'Monthly', value: 'monthly' });

  // Location
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedAddressKey, setSelectedAddressKey] = useState(null);

  const mappedAddressOptions = useMemo(() => {
    const addressOptionsList = [...userAddresses];
    if (
      selectedAddress &&
      !userAddresses.some(addr => getAddressKey(addr) === getAddressKey(selectedAddress))
    ) {
      addressOptionsList.push(selectedAddress);
    }

    return addressOptionsList.map(addr => ({
      label:
        addr?.title ||
        addr?.name ||
        `${addr?.street || addr?.streetAddress || ''}, ${addr?.city || ''}`,
      value: getAddressKey(addr),
      address: addr,
    }));
  }, [selectedAddress, userAddresses]);

  // Working Schedule
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [commitment, setCommitment] = useState([]);
  const [stayType, setStayType] = useState([]);

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  // Requirements & Skills
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [loading, setLoading] = useState(false);

  const [availableSkills, setAvailableSkills] = useState([]);

  // Role options from database
  const [roleOptions, setRoleOptions] = useState([]);

  useEffect(() => {
    GET_WITH_TOKEN(
      CATEGORY,
      success => {
        const data = success?.data || success?.roles || (Array.isArray(success) ? success : []);
        const opts = data.map(r => ({
          label: r?.name || r?.title || r?.category_name || String(r),
          value: r?.name || r?.title || r?.category_name || String(r),
        })).filter(o => o.label && o.value);
        setRoleOptions(opts);
      },
      error => {
        SimpleToast.show('Failed to load job roles', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error loading job roles', SimpleToast.SHORT);
      },
    );
  }, []);

  useEffect(() => {
    if (!userAddresses || userAddresses.length === 0) {
      GET_WITH_TOKEN(
        PROFILE,
        success => {
          if (success?.data) dispatch(userDetails(success.data));
        },
        () => {},
        () => {},
      );
    }
  }, []);

  // Add new skill modal state
  const [isAddSkillVisible, setIsAddSkillVisible] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');

  // Error states
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    expectedCompensation: '',
    compensationType: '',
    addresses: '',
    commitment: '',
    startTime: '',
    endTime: '',
    selectedDays: '',
    additionalRequirements: '',
    selectedSkills: '',
  });

  useEffect(() => {
    JobList();
  }, [editId]);

  const JobList = () => {
    GET_WITH_TOKEN(
      `${ListJob}/${editId}`,
      success => {
        setJobData(success?.data);
      },
      error => {},
      fail => {},
    );
  };

  // Populate the form when job data is loaded (editing)
  useEffect(() => {
    if (!jobData || !jobData.id) return;

    // Job Details
    setTitle(jobData.title || '');
    setDescription(jobData.description || '');

    // Compensation
    const compValue =
      jobData.expected_compensation || jobData.compensation || '';
    setExpectedCompensation(String(compValue || ''));

    // Try to map compensation type to dropdown option; fallback to raw string
    const compTypeRaw = jobData.compensation_type || '';
    const matchComp = option =>
      option.value === compTypeRaw ||
      option.label.toLowerCase() === compTypeRaw?.toLowerCase();
    const foundComp = Array.isArray(compensationTypeOptions)
      ? compensationTypeOptions.find(matchComp)
      : null;
    setCompensationType(foundComp || compTypeRaw || null);

    // Location
    if (jobData.street_address || jobData.city) {
      const matchedAddr = userAddresses.find(
        addr =>
          (addr.street || addr.streetAddress || '').toLowerCase() === (jobData.street_address || '').toLowerCase() &&
          (addr.city || '').toLowerCase() === (jobData.city || '').toLowerCase()
      );
      if (matchedAddr) {
        setSelectedAddress(matchedAddr);
        setSelectedAddressKey(getAddressKey(matchedAddr));
      } else {
        const fallbackAddr = {
          street: jobData.street_address || '',
          city: jobData.city || '',
          state: jobData.state || '',
          pincode: jobData.zip_code ? String(jobData.zip_code) : '',
        };
        setSelectedAddress(fallbackAddr);
        setSelectedAddressKey(getAddressKey(fallbackAddr));
      }
    }

    // Working Schedule
    if (jobData.stay_type) {
      setStayType([jobData.stay_type]);
    }
    const commitRaw = jobData.commitment_type || '';
    setCommitment(commitRaw ? [commitRaw] : []);
    if (jobData.preferred_hours) {
      const timeParts = jobData.preferred_hours.split(' - ');
      if (timeParts.length === 2) {
        const parsedStart = moment(timeParts[0].trim(), ['h:mm A', 'HH:mm']);
        const parsedEnd = moment(timeParts[1].trim(), ['h:mm A', 'HH:mm']);
        if (parsedStart.isValid()) setStartTime(parsedStart.toDate());
        if (parsedEnd.isValid()) setEndTime(parsedEnd.toDate());
      }
    }
    if (jobData.preferred_days) {
      const days = jobData.preferred_days.split(',').map(d => d.trim()).filter(d => d);
      setSelectedDays(days);
    }

    // Skills from boolean flags
    const skillSelections = [];
    if (jobData.childcare_experience)
      skillSelections.push('Childcare Experience');
    if (jobData.cooking_required) skillSelections.push('Cooking');
    if (jobData.driving_license_required)
      skillSelections.push('Driving License');
    if (jobData.first_aid_certified)
      skillSelections.push('First Aid Certified');
    if (jobData.pet_care_required) skillSelections.push('Pet Care');

    // Merge custom skills from comma-separated required_skills
    const requiredSkillsStr = jobData.required_skills || '';
    const extraSkills = requiredSkillsStr
      .split(',')
      .map(s => s.trim())
      .filter(s => !!s);

    // Add missing customs to selections (case-insensitive dedupe)
    const seenLc = new Set(skillSelections.map(s => s.toLowerCase()));
    extraSkills.forEach(s => {
      if (!seenLc.has(s.toLowerCase())) {
        skillSelections.push(s);
      }
    });

    // Ensure chips exist for custom skills
    const availMap = new Map(availableSkills.map(s => [s.toLowerCase(), s]));
    extraSkills.forEach(s => {
      const k = s.toLowerCase();
      if (!availMap.has(k)) {
        availMap.set(k, s);
      }
    });
    const mergedAvailable = Array.from(availMap.values());
    if (mergedAvailable.length !== availableSkills.length) {
      setAvailableSkills(mergedAvailable);
    }

    // Final unique selections preserving order
    const finalSeen = new Set();
    const finalSelected = [];
    skillSelections.forEach(s => {
      const k = s.toLowerCase();
      if (!finalSeen.has(k)) {
        finalSeen.add(k);
        finalSelected.push(s);
      }
    });
    setSelectedSkills(finalSelected);

    // Additional Requirements
    setAdditionalRequirements(jobData.additional_requirements || '');
  }, [jobData]);

  const toggleSkill = skill => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(item => item !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
    // Clear error when skill is selected
    if (errors.selectedSkills) {
      setErrors({ ...errors, selectedSkills: null });
    }
  };

  const stateOptions = [
    { label: 'Andhra Pradesh', value: 'andhra_pradesh' },
    { label: 'Arunachal Pradesh', value: 'arunachal_pradesh' },
    { label: 'Assam', value: 'assam' },
    { label: 'Bihar', value: 'bihar' },
    { label: 'Chhattisgarh', value: 'chhattisgarh' },
    { label: 'Goa', value: 'goa' },
    { label: 'Gujarat', value: 'gujarat' },
    { label: 'Haryana', value: 'haryana' },
    { label: 'Himachal Pradesh', value: 'himachal_pradesh' },
    { label: 'Jharkhand', value: 'jharkhand' },
    { label: 'Karnataka', value: 'karnataka' },
    { label: 'Kerala', value: 'kerala' },
    { label: 'Madhya Pradesh', value: 'madhya_pradesh' },
    { label: 'Maharashtra', value: 'maharashtra' },
    { label: 'Manipur', value: 'manipur' },
    { label: 'Meghalaya', value: 'meghalaya' },
    { label: 'Mizoram', value: 'mizoram' },
    { label: 'Nagaland', value: 'nagaland' },
    { label: 'Odisha', value: 'odisha' },
    { label: 'Punjab', value: 'punjab' },
    { label: 'Rajasthan', value: 'rajasthan' },
    { label: 'Sikkim', value: 'sikkim' },
    { label: 'Tamil Nadu', value: 'tamil_nadu' },
    { label: 'Telangana', value: 'telangana' },
    { label: 'Tripura', value: 'tripura' },
    { label: 'Uttar Pradesh', value: 'uttar_pradesh' },
    { label: 'Uttarakhand', value: 'uttarakhand' },
    { label: 'West Bengal', value: 'west_bengal' },
  ];

  // Toggle day selection
  const toggleDay = day => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
    if (errors.selectedDays) {
      setErrors(prev => ({ ...prev, selectedDays: '' }));
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    return moment(time).format('h:mm A');
  };

  const openAddSkill = () => {
    setNewSkillName('');
    setIsAddSkillVisible(true);
  };

  const closeAddSkill = () => {
    setIsAddSkillVisible(false);
  };

  const confirmAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) {
      return setIsAddSkillVisible(false);
    }
    // Avoid duplicates (case-insensitive)
    const exists = availableSkills.some(
      s => s.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!exists) {
      const updated = [...availableSkills, trimmed];
      setAvailableSkills(updated);
    }
    // Select it
    if (!selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setIsAddSkillVisible(false);
  };

  // Clear error handlers
  const handleTitleChange = value => {
    setTitle(value);
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  };

  const handleDescriptionChange = value => {
    setDescription(value);
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  };

  const handleCompensationChange = value => {
    setExpectedCompensation(value);
    if (errors.expectedCompensation) {
      setErrors(prev => ({ ...prev, expectedCompensation: '' }));
    }
  };

  const handleCompensationTypeChange = value => {
    setCompensationType(value);
    if (errors.compensationType) {
      setErrors(prev => ({ ...prev, compensationType: '' }));
    }
  };


  const toggleCommitment = option => {
    // Only allow one commitment type at a time
    if (commitment.includes(option)) {
      setCommitment([]);
    } else {
      setCommitment([option]);
    }
    if (errors.commitment) {
      setErrors(prev => ({ ...prev, commitment: '' }));
    }
  };

  const handlePostJob = () => {
    if (loading) return;

    // Validate all fields using validators
    const validationErrors = {};

    // Validate Title
    const titleError = validators.checkRequire('Job Title', title);
    if (titleError) {
      validationErrors.title = titleError;
    } else if (title && title.trim().length < 3) {
      validationErrors.title = 'Job title must be at least 3 characters';
    } else if (title && title.trim().length > 100) {
      validationErrors.title = 'Job title must not exceed 100 characters';
    }

    // Validate Description (Optional)
    if (description && description.trim().length > 2000) {
      validationErrors.description =
        'Job description must not exceed 2000 characters';
    }

    // Validate Expected Compensation
    const compError = validators.checkRequire(
      'Expected Compensation',
      expectedCompensation,
    );
    if (compError) {
      validationErrors.expectedCompensation = compError;
    } else if (
      expectedCompensation &&
      (isNaN(parseFloat(expectedCompensation)) ||
        parseFloat(expectedCompensation) <= 0)
    ) {
      validationErrors.expectedCompensation =
        'Compensation must be a valid number greater than 0';
    }

    // Validate Compensation Type
    validationErrors.compensationType = validators.checkRequire(
      'Compensation Type',
      compensationType?.value || compensationType || 'monthly',
    );

    // Validate Address
    if (!selectedAddress) {
      validationErrors.selectedAddress = 'Please select a location for this job.';
    }

    // Validate Commitment Type
    if (commitment.length === 0) {
      validationErrors.commitment = 'Commitment Type field is required.';
    }

    // Validate Start Time
    if (!startTime) {
      validationErrors.startTime = 'Start Time field is required.';
    }

    // Validate End Time
    if (!endTime) {
      validationErrors.endTime = 'End Time field is required.';
    }

    // Validate Selected Days
    if (selectedDays.length === 0) {
      validationErrors.selectedDays = 'Please select at least one working day.';
    }

    setErrors(validationErrors);

    if (!isValidForm(validationErrors)) {
      SimpleToast.show('Please fill all required fields', SimpleToast.SHORT);
      return;
    }

    setLoading(true);
    const formData = new FormData();

    // Job Details
    formData.append('title', title);
    formData.append('description', description);

    // Compensation
    formData.append('compensation', expectedCompensation);
    formData.append(
      'compensation_type',
      compensationType?.value || compensationType,
    );

    // Location
    if (selectedAddress) {
      formData.append('street_address', selectedAddress.street || '');
      formData.append('city', selectedAddress.city || '');
      formData.append('state', typeof selectedAddress.state === 'string' ? selectedAddress.state : selectedAddress.state?.label || '');
      formData.append('zip_code', selectedAddress.pincode || selectedAddress.zip_code || '');
      formData.append('area_locality', selectedAddress.area_locality || '');
      formData.append('google_location', selectedAddress.google_location || '');
      formData.append('latitude', selectedAddress.latitude || selectedAddress.lat || '');
      formData.append('longitude', selectedAddress.longitude || selectedAddress.long || '');
    }

    // Working Schedule
    if (commitment.length > 0) {
      const commitmentValue = commitment[0].toLowerCase().replace('-', '-');
      formData.append('commitment_type', commitmentValue);
    }
    if (stayType.length > 0) {
      formData.append('stay_type', stayType[0]);
    }
    const preferredHours = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    formData.append('preferred_hours', preferredHours);
    if (selectedDays.length > 0) {
      formData.append('preferred_days', selectedDays.join(', '));
    }

    // Status
    formData.append('status', 'open');

    // Skills & Requirements
    selectedSkills.forEach((skill, index) => {
      const skillMap = {
        'Childcare Experience': { key: 'childcare_experience', value: '1' },
        Cooking: { key: 'cooking_required', value: '1' },
        'Driving License': { key: 'driving_license_required', value: '1' },
        'First Aid Certified': { key: 'first_aid_certified', value: '1' },
        'Pet Care': { key: 'pet_care_required', value: '1' },
      };

      const skillData = skillMap[skill];
      if (skillData) {
        formData.append(skillData.key, skillData.value);
      }
    });

    // Additional Requirements
    if (additionalRequirements) {
      formData.append('additional_requirements', additionalRequirements);
    }

    // Required Skills
    if (selectedSkills.length > 0) {
      const skillsString = selectedSkills.join(', ');
      formData.append('required_skills', skillsString);
    }

    POST_FORM_DATA(
      AddJob,
      formData,
      success => {
        if (success?.success === false) {
          setLoading(false);
          if (success?.error_code === 'LIMIT_EXCEEDED') {
            const price = success?.extra_job_price || 500;
            Alert.alert(
              'Job Limit Exceeded',
              `Your subscription's monthly job limit has been reached. Would you like to post an extra job for ₹${price}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Pay & Post',
                  onPress: () => processExtraJobPayment(price, formData),
                },
              ],
              { cancelable: true }
            );
          } else if (success?.error_code === 'UPGRADE_REQUIRED') {
            Alert.alert(
              'Upgrade Required',
              success?.message || 'Please upgrade your plan to post jobs.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Upgrade Plan',
                  onPress: () => navigation.navigate('HouseholdManager'),
                },
              ],
              {cancelable: true},
            );
          } else {
            SimpleToast.show(success?.message || 'Failed to post job', SimpleToast.SHORT);
          }
          return;
        }
        SimpleToast.show('Job posted successfully!', SimpleToast.SHORT);
        setLoading(false);
        navigation?.goBack();
      },
      error => {
        console.log('Job Post Error:', JSON.stringify(error, null, 2));
        const errMsg = error?.message || error?.error || error?.errors?.title?.[0] || 'Failed to post job';
        SimpleToast.show(errMsg, SimpleToast.SHORT);
        setLoading(false);
      },
      fail => {
        console.log('Job Post Network Fail:', fail?.code, fail?.message);
        SimpleToast.show(
          'Network error. Please try again.',
          SimpleToast.SHORT,
        );
        setLoading(false);
      },
    );
  };

  const processExtraJobPayment = (price, originalFormData) => {
    setLoading(true);
    POST_WITH_TOKEN(
      SUBSCRIPTION_CREATE_EXTRA_JOB_ORDER,
      { amount: price },
      async success => {
        if ((success?.success || success?.status) && success?.free) {
          POST_FORM_DATA(
            AddJob,
            originalFormData,
            () => {
              setLoading(false);
              SimpleToast.show('Extra job limit added. Job posted successfully!', SimpleToast.SHORT);
              navigation?.goBack();
            },
            () => {
              setLoading(false);
              SimpleToast.show('Extra job limit added. Please try posting the job again.', SimpleToast.SHORT);
            },
            () => {
              setLoading(false);
              SimpleToast.show('Extra job limit added. Please try posting the job again.', SimpleToast.SHORT);
            }
          );
          return;
        }

        if ((!success?.success && !success?.status) || !success?.order_id) {
          setLoading(false);
          SimpleToast.show(success?.message || 'Failed to create payment order', SimpleToast.SHORT);
          return;
        }

        try {
          const result = await initiatePayment({
            amount: success.amount,
            currency: success.currency,
            orderId: success.order_id,
            description: 'Extra Job Post Purchase',
            prefill: {
              name: userDetail?.first_name ? `${userDetail.first_name} ${userDetail.last_name || ''}` : userDetail?.name || '',
              email: userDetail?.email || '',
              contact: userDetail?.phone || userDetail?.mobile || '',
            },
          });

          if (result.success) {
            verifyExtraJobPayment(result, originalFormData);
          } else {
            setLoading(false);
            if (result.code === 0 || result.code === 2) {
              SimpleToast.show('Payment cancelled', SimpleToast.SHORT);
            } else {
              SimpleToast.show(result.description || 'Payment failed. Please try again.', SimpleToast.SHORT);
            }
          }
        } catch (paymentErr) {
          setLoading(false);
          SimpleToast.show('Payment checkout error. Please try again.', SimpleToast.SHORT);
        }
      },
      error => {
        setLoading(false);
        SimpleToast.show(error?.message || 'Failed to initialize payment', SimpleToast.SHORT);
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error during payment initialization', SimpleToast.SHORT);
      }
    );
  };

  const verifyExtraJobPayment = (paymentResult, originalFormData) => {
    POST_WITH_TOKEN(
      SUBSCRIPTION_VERIFY_EXTRA_JOB_PAYMENT,
      {
        razorpay_order_id: paymentResult.orderId,
        razorpay_payment_id: paymentResult.paymentId,
        razorpay_signature: paymentResult.signature,
      },
      success => {
        if (success?.success || success?.status) {
          SimpleToast.show('Payment verified! Posting your job...', SimpleToast.SHORT);
          POST_FORM_DATA(
            AddJob,
            originalFormData,
            postSuccess => {
              SimpleToast.show('Job posted successfully!', SimpleToast.SHORT);
              setLoading(false);
              navigation?.goBack();
            },
            postErr => {
              setLoading(false);
              SimpleToast.show('Failed to post job after payment', SimpleToast.SHORT);
            },
            postFail => {
              setLoading(false);
              SimpleToast.show('Network error posting job after payment', SimpleToast.SHORT);
            }
          );
        } else {
          setLoading(false);
          SimpleToast.show(success?.message || 'Payment verification failed', SimpleToast.SHORT);
        }
      },
      error => {
        setLoading(false);
        SimpleToast.show(error?.message || 'Payment verification failed', SimpleToast.SHORT);
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error verifying payment', SimpleToast.SHORT);
      }
    );
  };

  // handelapplication removed as status is now correctly set to 'open' upon creation

  const UpdatePostJob = () => {
    if (loading) return;

    // Validate all fields using validators
    const validationErrors = {};

    // Validate Title
    const titleError = validators.checkRequire('Job Title', title);
    if (titleError) {
      validationErrors.title = titleError;
    } else if (title && title.trim().length < 3) {
      validationErrors.title = 'Job title must be at least 3 characters';
    } else if (title && title.trim().length > 100) {
      validationErrors.title = 'Job title must not exceed 100 characters';
    }

    // Validate Description (Optional)
    if (description && description.trim().length > 2000) {
      validationErrors.description =
        'Job description must not exceed 2000 characters';
    }

    // Validate Expected Compensation
    const compError = validators.checkRequire(
      'Expected Compensation',
      expectedCompensation,
    );
    if (compError) {
      validationErrors.expectedCompensation = compError;
    } else if (
      expectedCompensation &&
      (isNaN(parseFloat(expectedCompensation)) ||
        parseFloat(expectedCompensation) <= 0)
    ) {
      validationErrors.expectedCompensation =
        'Compensation must be a valid number greater than 0';
    }

    // Validate Compensation Type
    validationErrors.compensationType = validators.checkRequire(
      'Compensation Type',
      compensationType?.value || compensationType,
    );

    // Validate Address
    if (!selectedAddress) {
      validationErrors.selectedAddress = 'Please select a location for this job.';
    }

    // Validate Commitment Type
    if (commitment.length === 0) {
      validationErrors.commitment = 'Commitment Type field is required.';
    }

    // Validate Start Time
    if (!startTime) {
      validationErrors.startTime = 'Start Time field is required.';
    }

    // Validate End Time
    if (!endTime) {
      validationErrors.endTime = 'End Time field is required.';
    }

    // Validate Selected Days
    if (selectedDays.length === 0) {
      validationErrors.selectedDays = 'Please select at least one working day.';
    }

    // Validate Additional Requirements (Non-mandatory)
    // No validation required for additionalRequirements

    // Validate Selected Skills (Removed)

    setErrors(validationErrors);

    if (!isValidForm(validationErrors)) {
      SimpleToast.show('Please fill all required fields', SimpleToast.SHORT);
      return;
    }

    setLoading(true);
    const formData = new FormData();

    // Job Details
    formData.append('title', title);
    formData.append('description', description);

    // Compensation
    formData.append('compensation', expectedCompensation);
    formData.append(
      'compensation_type',
      compensationType?.value || compensationType,
    );

    // Location
    if (selectedAddress) {
      formData.append('street_address', selectedAddress.street || '');
      formData.append('city', selectedAddress.city || '');
      formData.append('state', typeof selectedAddress.state === 'string' ? selectedAddress.state : selectedAddress.state?.label || '');
      formData.append('zip_code', selectedAddress.pincode || selectedAddress.zip_code || '');
      formData.append('area_locality', selectedAddress.area_locality || '');
      formData.append('google_location', selectedAddress.google_location || '');
      formData.append('latitude', selectedAddress.latitude || selectedAddress.lat || '');
      formData.append('longitude', selectedAddress.longitude || selectedAddress.long || '');
    }

    // Working Schedule
    if (commitment.length > 0) {
      const commitmentValue = commitment[0].toLowerCase().replace('-', '-');
      formData.append('commitment_type', commitmentValue);
    }
    if (stayType.length > 0) {
      formData.append('stay_type', stayType[0]);
    }
    const preferredHours = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    formData.append('preferred_hours', preferredHours);
    if (selectedDays.length > 0) {
      formData.append('preferred_days', selectedDays.join(', '));
    }

    // Status
    formData.append('status', 'open');

    // Skills & Requirements
    selectedSkills.forEach((skill, index) => {
      const skillMap = {
        'Childcare Experience': { key: 'childcare_experience', value: '1' },
        Cooking: { key: 'cooking_required', value: '1' },
        'Driving License': { key: 'driving_license_required', value: '1' },
        'First Aid Certified': { key: 'first_aid_certified', value: '1' },
        'Pet Care': { key: 'pet_care_required', value: '1' },
      };

      const skillData = skillMap[skill];
      if (skillData) {
        formData.append(skillData.key, skillData.value);
      }
    });

    // Additional Requirements
    if (additionalRequirements) {
      formData.append('additional_requirements', additionalRequirements);
    }

    // Required Skills
    if (selectedSkills.length > 0) {
      const skillsString = selectedSkills.join(', ');
      formData.append('required_skills', skillsString);
    }

    POST_FORM_DATA(
      `${AddJob}/${editId}`,
      formData,
      success => {
        SimpleToast.show('Job updated successfully!', SimpleToast.SHORT);
        setLoading(false);
        navigation?.goBack();
      },
      error => {
        SimpleToast.show('Failed to update job', SimpleToast.SHORT);
        setLoading(false);
      },
      fail => {
        SimpleToast.show(
          'Network error. Please try again.',
          SimpleToast.SHORT,
        );
        setLoading(false);
      },
    );
  };

  const compensationTypeOptions = [
    // { label: 'Hourly', value: 'hourly' },
    { label: 'Monthly', value: 'monthly' },
    // { label: 'Weekly', value: 'weekly' },
    // { label: 'Daily', value: 'daily' },
    { label: 'Year', value: 'Year' },
  ];

  return (
    <CommanView>
      <HeaderForUser
        source_arrow={ImageConstant?.BackArrow}
        title={LocalizedStrings.PostNewJob.title}
        onPressLeftIcon={() => navigation?.goBack()}
        style_title={{ fontSize: 18 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.card}>
          <SectionHeader
            icon={ImageConstant?.Briefcase}
            title={LocalizedStrings.PostNewJob.job_details}
          />
          <DropdownComponent
            title={LocalizedStrings.PostNewJob.job_role_title}
            placeholder={LocalizedStrings.PostNewJob.job_role_placeholder || "Select Role"}
            data={roleOptions}
            value={title}
            onChange={item => handleTitleChange(item?.value || item)}
            error={errors.title}
            marginHorizontal={0}
            MainBoxStyle={{ width: '100%' }}
          />
          <Input
            style_input={styles.inputText}
            multiline={true}
            style_inputContainer={{ height: 130 }}
            // placeholder="Enter job description"
            title={LocalizedStrings.PostNewJob.job_description}
            value={description}
            onChange={handleDescriptionChange}
            error={errors.description}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon={ImageConstant?.Dollar}
            title={LocalizedStrings.PostNewJob.compensation}
          />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', width: '100%' }}>
            <View style={{ flex: 1 }}>
              <Input
                // placeholder="Enter expected compensation"
                title={LocalizedStrings.PostNewJob.expected_compensation}
                value={expectedCompensation}
                onChange={handleCompensationChange}
                keyboardType="numeric"
                error={errors.expectedCompensation}
                prefixText={"\u20B9"}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <DropdownComponent
                title={' '}
                // placeholder="Select Type"
                MainBoxStyle={{ width: '100%' }}
                style_title={{ textAlign: 'left' }}
                data={compensationTypeOptions}
                value={compensationType?.value || compensationType}
                onChange={item => handleCompensationTypeChange(item)}
                disable={false}
                marginHorizontal={0}
                style_dropdown={{ marginHorizontal: 0 }}
                selectedTextStyleNew={{ fontSize: 14, paddingLeft: 12 }}
                error={errors.compensationType}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon={ImageConstant?.Location}
            title={LocalizedStrings.PostNewJob.location_details}
          />
          <DropdownComponent
            title="Select Address"
            placeholder={userAddresses.length === 0 ? "Add address in Profile first" : "Choose an address"}
            source={ImageConstant?.Location}
            data={mappedAddressOptions}
            value={selectedAddressKey}
            onChange={item => {
              setSelectedAddress(item.address);
              setSelectedAddressKey(item.value);
              if (errors.selectedAddress) {
                setErrors({ ...errors, selectedAddress: null });
              }
            }}
            error={errors.selectedAddress}
            marginHorizontal={0}
            MainBoxStyle={{ width: '100%' }}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon={ImageConstant?.Calendar}
            title={LocalizedStrings.PostNewJob.working_schedule}
          />
          <View style={styles.timeRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Typography style={styles.timeLabel}>Start Time</Typography>
              <TouchableOpacity
                style={[styles.timePickerBox, errors.startTime && { borderColor: 'red' }]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Typography style={{ fontSize: 14, color: startTime ? '#000' : '#999', fontFamily: Font.Poppins_Medium, paddingLeft: 15 }}>
                  {startTime ? formatTime(startTime) : 'Select Time'}
                </Typography>
                <Image source={ImageConstant?.Calendar} style={styles.timeIcon} />
              </TouchableOpacity>
              {errors.startTime ? (
                <Typography textAlign={'right'} style={styles.timeError}>{errors.startTime}</Typography>
              ) : null}
              <DatePicker
                modal
                open={showStartTimePicker}
                date={startTime || new Date()}
                mode="time"
                onConfirm={(date) => {
                  setShowStartTimePicker(false);
                  setStartTime(date);
                  if (errors.startTime) setErrors(prev => ({ ...prev, startTime: '' }));
                }}
                onCancel={() => setShowStartTimePicker(false)}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Typography style={styles.timeLabel}>End Time</Typography>
              <TouchableOpacity
                style={[styles.timePickerBox, errors.endTime && { borderColor: 'red' }]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Typography style={{ fontSize: 14, color: endTime ? '#000' : '#999', fontFamily: Font.Poppins_Medium, paddingLeft: 15 }}>
                  {endTime ? formatTime(endTime) : 'Select Time'}
                </Typography>
                <Image source={ImageConstant?.Calendar} style={styles.timeIcon} />
              </TouchableOpacity>
              {errors.endTime ? (
                <Typography textAlign={'right'} style={styles.timeError}>{errors.endTime}</Typography>
              ) : null}
              <DatePicker
                modal
                open={showEndTimePicker}
                date={endTime || new Date()}
                mode="time"
                onConfirm={(date) => {
                  setShowEndTimePicker(false);
                  setEndTime(date);
                  if (errors.endTime) setErrors(prev => ({ ...prev, endTime: '' }));
                }}
                onCancel={() => setShowEndTimePicker(false)}
              />
            </View>
          </View>

          <Typography
            type={Font?.Poppins_Bold}
            size={14}
            style={{ marginTop: 15 }}
          >
            {'Working Days'}
          </Typography>
          <View style={styles.daysContainer}>
            {daysOfWeek.map((day, index) => {
              const isSelected = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayChip,
                    isSelected && styles.dayChipSelected,
                  ]}
                  onPress={() => toggleDay(day)}
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
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.selectedDays && (
            <Typography
              textAlign={'right'}
              style={{ color: 'red', fontSize: 12, marginTop: 5 }}
            >
              {errors.selectedDays}
            </Typography>
          )}

          <Typography
            type={Font?.Poppins_Bold}
            size={14}
            style={{ marginTop: 15 }}
          >
            Stay Type
          </Typography>
          {[
            'Inhouse (Live-in)',
            'Come and Go (Outhouse)'
          ].map((option, index) => {
            const val = index === 0 ? 'inhouse' : 'come_and_go';
            const isSelected = stayType.includes(val);

            return (
              <TouchableOpacity
                key={index}
                style={styles.checkboxRow}
                onPress={() => setStayType([val])}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <View style={styles.checkboxInner} />}
                </View>
                <Typography size={14}>{option}</Typography>
              </TouchableOpacity>
            );
          })}

          <Typography
            type={Font?.Poppins_Bold}
            size={14}
            style={{ marginTop: 15 }}
          >
            {LocalizedStrings.PostNewJob.commitment_type}
          </Typography>
          {[
            LocalizedStrings.PostNewJob.full_time,
            LocalizedStrings.PostNewJob.part_time,
            LocalizedStrings.PostNewJob.flexible,
          ].map((option, index) => {
            const isSelected = commitment.some(
              item => item.toLowerCase() === option.toLowerCase(),
            );

            return (
              <TouchableOpacity
                key={index}
                style={styles.checkboxRow}
                onPress={() => toggleCommitment(option)}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}
                >
                  {isSelected && (
                    <Image
                      source={ImageConstant?.check}
                      style={{
                        width: 15,
                        height: 15,
                        position: 'absolute',
                        tintColor: '#fff',
                        zIndex: 99,
                      }}
                    />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{option}</Text>
              </TouchableOpacity>
            );
          })}
          {errors.commitment && (
            <Typography
              textAlign={'right'}
              style={{ color: 'red', fontSize: 12, marginTop: 5 }}
            >
              {errors.commitment}
            </Typography>
          )}
        </View>
      </ScrollView>

      <Button
        title={
          loading ? 'Posting...' : LocalizedStrings.PostNewJob.post_job_listing
        }
        onPress={editId ? UpdatePostJob : handlePostJob}
        style={{ marginTop: 20 }}
        disabled={loading}
      />
    </CommanView>
  );
};

export default PostNewJob;

const SectionHeader = ({ icon, title }) => (
  <View
    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
  >
    <Image
      source={icon}
      tintColor={'#D98579'}
      style={{ width: 19, height: 19, resizeMode: 'contain' }}
    />
    <Typography type={Font?.Poppins_Bold} size={18} style={{ marginLeft: 10 }}>
      {title}
    </Typography>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#EBEBEA',
    padding: 20,
    marginTop: 20,
  },
  inputText: {
    color: '#000',
    height: 130,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#D98579',
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#D98579',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  /* Location Row */
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cityContainer: {
    flex: 1,
    marginRight: 8,
  },
  stateContainer: {
    flex: 1,
    marginLeft: 8,
  },
  /* Address */
  addressBlock: {
    borderTopWidth: 1,
    borderTopColor: '#EBEBEA',
    marginTop: 15,
    paddingTop: 10,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  addAddressBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D98579',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  /* Time Row */
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    color: '#565D6D',
    fontSize: 15,
    fontFamily: Font.Poppins_Medium,
    marginBottom: 6,
    marginTop: 10,
  },
  timePickerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    height: 60,
  },
  timeIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: 'gray',
    marginRight: 10,
  },
  timeError: {
    color: 'red',
    fontSize: 11,
    paddingTop: 8,
  },
  /* Days */
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
  /* Skills */
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillChip: {
    borderWidth: 1,
    borderColor: '#EBEBEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    margin: 4,
  },
  skillChipSelected: {
    borderColor: '#D98579',
    backgroundColor: '#FFF5F3',
  },
  skillText: {
    fontSize: 13,
    color: '#333',
  },
  skillTextSelected: {
    color: '#D98579',
    fontWeight: '600',
  },
  /* Add Skill Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  modalButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  modalButtonText: {
    color: '#555',
    fontSize: 14,
  },
  modalPrimaryButton: {
    backgroundColor: '#D98579',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

