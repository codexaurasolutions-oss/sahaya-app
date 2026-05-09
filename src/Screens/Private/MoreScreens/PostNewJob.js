import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import React, { useEffect, useState } from 'react';
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
} from '../../../Backend/api_routes';
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

  // Compensation
  const [expectedCompensation, setExpectedCompensation] = useState('');
  const [compensationType, setCompensationType] = useState(null);

  // Location - multiple addresses
  const [addresses, setAddresses] = useState([
    { streetAddress: '', city: '', state: null, zipCode: '' },
  ]);

  // Working Schedule
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [commitment, setCommitment] = useState([]);

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
        const data = success?.data || (Array.isArray(success) ? success : []);
        const opts = data.map(r => ({
          label: r?.name || r?.category_name || String(r),
          value: r?.name || r?.category_name || String(r),
        })).filter(o => o.label);
        setRoleOptions(opts);
      },
      () => {},
      () => {},
    );
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
    setAddresses([
      {
        streetAddress: jobData.street_address || '',
        city: jobData.city || '',
        state: jobData.state || null,
        zipCode: jobData.zip_code ? String(jobData.zip_code) : '',
      },
    ]);

    // Working Schedule
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

  // Address helpers
  const updateAddress = (index, field, value) => {
    const updated = [...addresses];
    updated[index] = { ...updated[index], [field]: value };
    setAddresses(updated);
  };

  const addAddress = () => {
    setAddresses([...addresses, { streetAddress: '', city: '', state: null, zipCode: '' }]);
  };

  const removeAddress = index => {
    if (addresses.length > 1) {
      setAddresses(addresses.filter((_, i) => i !== index));
    }
  };

  // Fetch pincode details for a specific address index
  const handlePincodeChange = async (index, value) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);

    if (numericValue.length < 6) {
      setAddresses(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], zipCode: numericValue, city: '', state: null };
        return updated;
      });
      return;
    }

    if (numericValue.length === 6) {
      setAddresses(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], zipCode: numericValue };
        return updated;
      });
      try {
        const details = await fetchPincodeDetails(numericValue);
        if (details?.city || details?.state) {
          setAddresses(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              city: details?.city || updated[index].city,
              state: details?.state || updated[index].state,
            };
            return updated;
          });
        }
      } catch (error) {
        console.error('Error fetching pincode details:', error);
      }
    }
  };

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

    // Validate Description
    const descError = validators.checkRequire('Job Description', description);
    if (descError) {
      validationErrors.description = descError;
    } else if (description && description.trim().length < 20) {
      validationErrors.description =
        'Job description must be at least 20 characters';
    } else if (description && description.trim().length > 2000) {
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

    // Validate Addresses
    const firstAddr = addresses[0];
    if (!firstAddr?.streetAddress || firstAddr.streetAddress.trim().length < 5) {
      validationErrors.addresses = 'At least one address with street (min 5 chars) is required.';
    } else if (!firstAddr?.zipCode || !/^\d{6}$/.test(firstAddr.zipCode.trim())) {
      validationErrors.addresses = 'Please enter a valid 6-digit pincode for the first address.';
    } else if (!firstAddr?.city) {
      validationErrors.addresses = 'City is required for the first address.';
    } else if (!firstAddr?.state) {
      validationErrors.addresses = 'State is required for the first address.';
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

    // Validate Additional Requirements
    validationErrors.additionalRequirements = validators.checkRequire(
      'Additional Requirements',
      additionalRequirements,
    );

    // Validate Selected Skills
    if (selectedSkills.length === 0) {
      validationErrors.selectedSkills = 'Required Skills field is required.';
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

    // Location - send first address as primary
    formData.append('street_address', addresses[0].streetAddress);
    formData.append('city', addresses[0].city);
    formData.append('state', typeof addresses[0].state === 'string' ? addresses[0].state : addresses[0].state?.label || '');
    formData.append('zip_code', addresses[0].zipCode);

    // Additional addresses
    addresses.forEach((addr, index) => {
      formData.append(`addresses[${index}][street_address]`, addr.streetAddress);
      formData.append(`addresses[${index}][city]`, addr.city);
      formData.append(`addresses[${index}][state]`, typeof addr.state === 'string' ? addr.state : addr.state?.label || '');
      formData.append(`addresses[${index}][zip_code]`, addr.zipCode);
    });

    // Working Schedule
    if (commitment.length > 0) {
      const commitmentValue = commitment[0].toLowerCase().replace('-', '-');
      formData.append('commitment_type', commitmentValue);
    }
    const preferredHours = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    formData.append('preferred_hours', preferredHours);
    if (selectedDays.length > 0) {
      formData.append('preferred_days', selectedDays.join(', '));
    }

    // Status
    formData.append('status', 'pending');

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
        SimpleToast.show('Job posted successfully!', SimpleToast.SHORT);
        setLoading(false);
        handelapplication(success?.data?.id);
        navigation?.goBack();
      },
      error => {
        SimpleToast.show('Failed to post job', SimpleToast.SHORT);
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

  const handelapplication = id => {
    const body = {
      status: 'open',
    };

    POST_WITH_TOKEN(
      `${ApplicantsList}/${id}/status`,
      body,
      success => {
        // SimpleToast.show(
        //   success?.message || 'Member deleted successfully',
        //   SimpleToast.SHORT,
        // );
      },
      error => {
        // SimpleToast.show(
        //   error?.message || 'Failed to delete Member',
        //   SimpleToast.SHORT,
        // );
      },
      fail => {
        // SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

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

    // Validate Description
    const descError = validators.checkRequire('Job Description', description);
    if (descError) {
      validationErrors.description = descError;
    } else if (description && description.trim().length < 20) {
      validationErrors.description =
        'Job description must be at least 20 characters';
    } else if (description && description.trim().length > 2000) {
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

    // Validate Addresses
    const firstAddr = addresses[0];
    if (!firstAddr?.streetAddress || firstAddr.streetAddress.trim().length < 5) {
      validationErrors.addresses = 'At least one address with street (min 5 chars) is required.';
    } else if (!firstAddr?.zipCode || !/^\d{6}$/.test(firstAddr.zipCode.trim())) {
      validationErrors.addresses = 'Please enter a valid 6-digit pincode for the first address.';
    } else if (!firstAddr?.city) {
      validationErrors.addresses = 'City is required for the first address.';
    } else if (!firstAddr?.state) {
      validationErrors.addresses = 'State is required for the first address.';
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

    // Validate Additional Requirements
    validationErrors.additionalRequirements = validators.checkRequire(
      'Additional Requirements',
      additionalRequirements,
    );

    // Validate Selected Skills
    if (selectedSkills.length === 0) {
      validationErrors.selectedSkills = 'Required Skills field is required.';
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

    // Location - send first address as primary
    formData.append('street_address', addresses[0].streetAddress);
    formData.append('city', addresses[0].city);
    formData.append('state', typeof addresses[0].state === 'string' ? addresses[0].state : addresses[0].state?.label || '');
    formData.append('zip_code', addresses[0].zipCode);

    // Additional addresses
    addresses.forEach((addr, index) => {
      formData.append(`addresses[${index}][street_address]`, addr.streetAddress);
      formData.append(`addresses[${index}][city]`, addr.city);
      formData.append(`addresses[${index}][state]`, typeof addr.state === 'string' ? addr.state : addr.state?.label || '');
      formData.append(`addresses[${index}][zip_code]`, addr.zipCode);
    });

    // Working Schedule
    if (commitment.length > 0) {
      const commitmentValue = commitment[0].toLowerCase().replace('-', '-');
      formData.append('commitment_type', commitmentValue);
    }
    const preferredHours = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    formData.append('preferred_hours', preferredHours);
    if (selectedDays.length > 0) {
      formData.append('preferred_days', selectedDays.join(', '));
    }

    // Status
    formData.append('status', 'pending');

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
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <View style={{ width: '58%' }}>
              <Input
                // placeholder="Enter expected compensation"
                title={LocalizedStrings.PostNewJob.expected_compensation}
                value={expectedCompensation}
                onChange={handleCompensationChange}
                keyboardType="numeric"
                error={errors.expectedCompensation}
              />
            </View>
            <View style={{ width: '46%' }}>
              <DropdownComponent
                title={' '}
                // placeholder="Select Type"
                MainBoxStyle={{ width: '100%' }}
                style_title={{ textAlign: 'left' }}
                data={compensationTypeOptions}
                value={compensationType?.value}
                onChange={item => {
                  handleCompensationTypeChange(item);
                  if (errors.compensationType) {
                    setErrors({ ...errors, compensationType: null });
                  }
                }}
                selectedTextStyleNew={{ paddingHorizontal: 10, size: 10 }}
                marginHorizontal={0}
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
          {addresses.map((addr, index) => (
            <View key={index} style={index > 0 ? styles.addressBlock : null}>
              {index > 0 && (
                <View style={styles.addressHeader}>
                  <Typography type={Font?.Poppins_Medium} size={14} style={{ color: '#666' }}>
                    Address {index + 1}
                  </Typography>
                  <TouchableOpacity onPress={() => removeAddress(index)}>
                    <Typography style={{ color: '#D98579', fontSize: 14 }}>Remove</Typography>
                  </TouchableOpacity>
                </View>
              )}
              <Input
                title={LocalizedStrings.PostNewJob.street_address}
                value={addr.streetAddress}
                onChange={value => updateAddress(index, 'streetAddress', value)}
              />
              <Input
                title={LocalizedStrings.PostNewJob.zip_code}
                value={addr.zipCode}
                onChange={value => handlePincodeChange(index, value)}
                keyboardType="numeric"
                maxLength={6}
              />
              {addr.zipCode?.length === 6 && (
                <View style={styles.locationRow}>
                  <View style={styles.cityContainer}>
                    <Input
                      title={LocalizedStrings.PostNewJob.city}
                      value={addr.city}
                      onChange={value => updateAddress(index, 'city', value)}
                    />
                  </View>
                  <View style={styles.stateContainer}>
                    <Input
                      title={LocalizedStrings.PostNewJob.state}
                      value={typeof addr.state === 'string' ? addr.state : addr.state?.label || ''}
                      onChange={value => updateAddress(index, 'state', value)}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
          {errors.addresses && (
            <Typography
              textAlign={'right'}
              style={{ color: 'red', fontSize: 12, marginTop: 5 }}
            >
              {errors.addresses}
            </Typography>
          )}
          <TouchableOpacity style={styles.addAddressBtn} onPress={addAddress}>
            <Typography style={{ color: '#D98579', fontSize: 14 }}>+ Add Another Address</Typography>
          </TouchableOpacity>
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

        <View style={styles.card}>
          <SectionHeader
            icon={ImageConstant?.blub}
            title={LocalizedStrings.PostNewJob.requirements_skills}
          />
          <Input
            style_input={styles.inputText}
            multiline={true}
            style_inputContainer={{ height: 130 }}
            // placeholder={LocalizedStrings.PostNewJob.additional_requirements_placeholder}
            title={LocalizedStrings.PostNewJob.additional_requirements}
            value={additionalRequirements}
            onChange={value => {
              setAdditionalRequirements(value);
              if (errors.additionalRequirements) {
                setErrors({ ...errors, additionalRequirements: null });
              }
            }}
            error={errors.additionalRequirements}
          />
          <Typography
            type={Font?.Poppins_Bold}
            size={14}
            style={{ marginVertical: 10 }}
          >
            {LocalizedStrings.PostNewJob.required_skills}
          </Typography>
          {errors.selectedSkills && (
            <Typography
              textAlign={'right'}
              style={{ color: 'red', fontSize: 12, marginBottom: 5 }}
            >
              {errors.selectedSkills}
            </Typography>
          )}
          <View style={styles.skillsContainer}>
            {availableSkills.map((skill, index) => (
              <View>
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleSkill(skill)}
                  style={[
                    styles.skillChip,
                    selectedSkills.includes(skill) && styles.skillChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.skillText,
                      selectedSkills.includes(skill) &&
                        styles.skillTextSelected,
                    ]}
                  >
                    {skill}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={[styles.skillChip]} onPress={openAddSkill}>
              <Text>Add new skill</Text>
            </TouchableOpacity>
          </View>
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
      {/* Add New Skill Modal */}
      <Modal
        transparent={true}
        visible={isAddSkillVisible}
        animationType="fade"
        onRequestClose={closeAddSkill}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add new skill</Text>
            <TextInput
              placeholder="Enter skill name"
              value={newSkillName}
              onChangeText={setNewSkillName}
              style={styles.modalInput}
              placeholderTextColor={'#999'}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={closeAddSkill}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={confirmAddSkill}
              >
                <Text style={styles.modalPrimaryButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
