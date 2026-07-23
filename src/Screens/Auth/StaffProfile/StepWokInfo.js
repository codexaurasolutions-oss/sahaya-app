import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import DropdownComponent from '../../../Component/DropdownComponent';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../../Backend/Backend';
import { CATEGORY, SUB_CATEGORY, WORK_INFO } from '../../../Backend/api_routes';
import { validators } from '../../../Backend/Validator';
import { isValidForm } from '../../../Backend/Utility';
import SimpleToast from 'react-native-simple-toast';
import { useSelector } from 'react-redux';
import LocalizedStrings from '../../../Constants/localization';

const StepWokInfo = forwardRef(({ navigation }, ref) => {
  const userDetail = useSelector(store => store?.userDetails);
  const [availableSkills, setAvailableSkills] = useState([]); // All skills from API
  const [selectedSkills, setSelectedSkills] = useState([]); // User selected skills
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles, setRoles] = useState([]); // Store roles from API
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]); // Selected languages (array)
  const [totalExperience, setTotalExperience] = useState(null); // Total experience
  const [education, setEducation] = useState(''); // Education/Qualification
  const [additionalInfo, setAdditionalInfo] = useState(''); // Additional info
  const [voiceNote, setVoiceNote] = useState(null); // Voice note (optional)
  const [workingDays, setWorkingDays] = useState([]); // Selected working days
  const [stayType, setStayType] = useState([]); // Stay type
  const [errors, setErrors] = useState({}); // Validation errors
  const [loader, setLoader] = useState(false); // Loading state
  const [emergencyContactName, setEmergencyContactName] = useState(''); // Emergency Contact Name
  const [emergencyContactNumber, setEmergencyContactNumber] = useState(''); // Emergency Contact Number
  const [upiId, setUpiId] = useState(''); // UPI ID

  const DAYS_OPTIONS = [
    { label: 'Mon', value: 'Monday' },
    { label: 'Tue', value: 'Tuesday' },
    { label: 'Wed', value: 'Wednesday' },
    { label: 'Thu', value: 'Thursday' },
    { label: 'Fri', value: 'Friday' },
    { label: 'Sat', value: 'Saturday' },
    { label: 'Sun', value: 'Sunday' },
  ];

  const toggleDay = (day) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleSkill = skill => {
    if (selectedSkills.includes(skill)) {
      // Remove skill if already selected
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      // Add skill if not selected
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Toggle language selection
  const toggleLanguage = language => {
    if (selectedLanguages.includes(language)) {
      // Remove language if already selected
      setSelectedLanguages(selectedLanguages.filter(l => l !== language));
    } else {
      // Add language if not selected
      setSelectedLanguages([...selectedLanguages, language]);
    }
    // Clear error when language is selected/deselected
    if (errors.selectedLanguages) {
      setErrors({ ...errors, selectedLanguages: null });
    }
  };

  // Memoize work info string to prevent unnecessary re-renders
  const workInfoString = useMemo(() => {
    return JSON.stringify(
      userDetail?.user_work_info || userDetail?.work_info || {},
    );
  }, [userDetail?.user_work_info, userDetail?.work_info]);

  // Fetch roles from CATEGORY API on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Load existing work info from userDetail (load all fields immediately)
  useEffect(() => {
    const workInfo = userDetail?.user_work_info || userDetail?.work_info || {};

    if (workInfo && Object.keys(workInfo).length > 0) {
      // Load skills - API returns array format like ["Healthcare2222"]
      if (workInfo.skills && workInfo.skills.length > 0) {
        // Handle both array and comma-separated string
        const skillsList = Array.isArray(workInfo.skills)
          ? workInfo.skills.filter(skill => skill) // Filter out null/undefined
          : typeof workInfo.skills === 'string'
          ? workInfo.skills
              .split(',')
              .map(s => s.trim())
              .filter(s => s)
          : [];
        if (skillsList.length > 0) {
          setSelectedSkills(skillsList);
        }
      }

      // Load languages - API returns array or comma-separated string
      if (workInfo.languages_spoken) {
        // Handle both array and comma-separated string
        const languagesList = Array.isArray(workInfo.languages_spoken)
          ? workInfo.languages_spoken.filter(lang => lang) // Filter out null/undefined
          : typeof workInfo.languages_spoken === 'string'
          ? workInfo.languages_spoken
              .split(',')
              .map(l => l.trim())
              .filter(l => l)
          : [];
        if (languagesList.length > 0) {
          setSelectedLanguages(languagesList);
        }
      }

      // Load experience - API returns string like "1"
      if (workInfo.total_experience) {
        setTotalExperience(workInfo.total_experience);
      }

      // Load education - API returns string like "Dxcv"
      if (workInfo.education) {
        setEducation(workInfo.education);
      }

      // Load additional info - API returns string like "Hvbjvh"
      if (workInfo.additional_info) {
        setAdditionalInfo(workInfo.additional_info);
      }

      // Load voice note (if available) - API returns null or file path
      if (workInfo.voice_note) {
        // If it's a URL/URI, set it directly
        if (typeof workInfo.voice_note === 'string') {
          setVoiceNote({
            uri: workInfo.voice_note,
            name: 'voice_note.mp3',
            mime: 'audio/mpeg',
          });
        } else {
          setVoiceNote(workInfo.voice_note);
        }
      }

      if (workInfo.emergency_contact_name) {
        setEmergencyContactName(workInfo.emergency_contact_name);
      }
      if (workInfo.emergency_contact_number) {
        setEmergencyContactNumber(workInfo.emergency_contact_number);
      }
      if (workInfo?.stay_type) {
        setStayType([workInfo.stay_type]);
      }
      if (workInfo.upi_id || userDetail?.upi_id) {
        setUpiId(workInfo.upi_id || userDetail?.upi_id);
      }
    } else {
    }
  }, [userDetail?.user_work_info, userDetail?.work_info]);

  // Match and load role when both workInfo and roles are available
  useEffect(() => {
    const workInfo = userDetail?.user_work_info || userDetail?.work_info || {};

    if (workInfo?.primary_role && roles.length > 0) {
      // Find role ID by matching the role name (e.g., "Spa", "Cook")
      const roleObj = roles.find(
        role =>
          role.label === workInfo.primary_role ||
          role.label?.toLowerCase() === workInfo.primary_role?.toLowerCase() ||
          role.label?.includes(workInfo.primary_role) ||
          workInfo.primary_role?.includes(role.label),
      );

      if (roleObj) {
        const roleId = roleObj.value || roleObj.id;
        setSelectedRole(roleId);
      } else {
      }
    } else if (workInfo?.primary_role && roles.length === 0) {
    }
  }, [roles, userDetail?.user_work_info, userDetail?.work_info]);

  // Fetch skills when role is selected AND don't clear skills if they're already loaded from user_work_info
  useEffect(() => {
    if (selectedRole && roles.length > 0) {
      // Check if selectedRole is a role ID or name and find the ID
      const roleObj = roles.find(
        role =>
          role.label === selectedRole ||
          role.value === selectedRole ||
          role.id === selectedRole ||
          selectedRole === role.value ||
          selectedRole === role.id,
      );

      if (roleObj) {
        const roleId = roleObj.value || roleObj.id;
        // Only fetch skills if we don't already have selected skills from user_work_info
        if (selectedSkills.length === 0) {
          fetchSkills(roleId);
        }
        // Set selectedRole to the ID for proper dropdown value
        if (selectedRole !== roleId) {
          setSelectedRole(roleId);
        }
      } else if (
        typeof selectedRole === 'string' &&
        selectedRole.match(/^\d+$/)
      ) {
        // If it's a numeric string (likely an ID) and no skills loaded yet
        if (selectedSkills.length === 0) {
          fetchSkills(selectedRole);
        }
      }
    } else if (!selectedRole) {
      // Clear available skills if no role is selected (but keep selectedSkills if loaded from API)
      setAvailableSkills([]);
    }
  }, [selectedRole, roles]);

  // Fetch roles from CATEGORY API (without role_id)
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
        SimpleToast.show(
          LocalizedStrings.Auth?.failed_to_load_roles || 'Failed to load roles',
          SimpleToast.SHORT,
        );
      },
    );
  };

  // Fetch skills based on selected role_id using SUB_CATEGORY API
  const fetchSkills = roleId => {
    if (!roleId) {
      return;
    }

    setLoading(true);
    // Use SUB_CATEGORY API with parent_id parameter
    const skillsRoute = `${SUB_CATEGORY}?parent_id=${roleId}`;

    GET_WITH_TOKEN(
      skillsRoute,
      success => {
        setLoading(false);
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
        setLoading(false);
        setAvailableSkills([]);
      },
    );
  };

  // Handle role selection
  const handleRoleChange = item => {
    if (item) {
      // item.value should be the role_id
      const roleId = item.value || item.id || item.role_id;
      setSelectedRole(roleId);
    }
  };

  // Languages list from Langvage.js
  const languagesList = [
    'English',
    ' Hindi',
    'Telugu',
    'Tamil',
    'Kannada',
    'Malayalam',
    'Marathi',
    'Gujarati',
    'Bengali',
    'Punjabi',
    'Odia',
    'Assamese',
    'Urdu',
    'Nepali',
  ];

  // Convert languages to dropdown format (not needed for multi-select, but keeping for reference)
  const languagesDropdownData = languagesList.map((lang, index) => ({
    label: lang,
    value: lang,
    id: index,
  }));

  // Handle experience selection
  const handleExperienceChange = item => {
    if (item) {
      setTotalExperience(item.value || item);
    }
  };

  // Save work info function
  const saveWorkInfo = () => {
    // Validate required fields (excluding optional voice note)
    const error = {
      selectedRole: validators?.checkRequire('Primary Role', selectedRole),
      // selectedSkills: selectedSkills.length === 0 ? 'Skills field is required.' : null,
      // selectedLanguages: selectedLanguages.length === 0 ? 'Languages field is required.' : null,
      totalExperience: validators?.checkRequire(
        'Total Experience',
        totalExperience,
      ),
      // education: validators?.checkRequire('Education', education),
      // additionalInfo: validators?.checkRequire('Additional Info', additionalInfo),
    };

    setErrors(error);

    // Check if there are any errors using isValidForm
    if (!isValidForm(error)) {
      return Promise.reject(new Error('Validation failed'));
    }

    // Build form data - matching Postman format
    const formData = new FormData();

    // Primary Role/Service - find role name from roles array
    if (selectedRole) {
      const selectedRoleObj = roles.find(
        role => role.value === selectedRole || role.id === selectedRole,
      );
      const primaryRoleName = selectedRoleObj?.label || selectedRole;
      formData.append('primary_role', primaryRoleName);
    }

    // Skills as array: skills[0], skills[1], etc.
    if (selectedSkills.length > 0) {
      selectedSkills.forEach((skill, index) => {
        formData.append(`skills[${index}]`, skill);
      });
    }

    // Languages Spoken as comma-separated string (API expects string format)
      
      
    // console.log('----languagesString-',selectedLanguages);
    
    if (selectedLanguages.length > 0) {
      // const languagesString = selectedLanguages.join(',');
      // formData.append('languages_spoken', languagesString);

       selectedLanguages.forEach((lang, index) => {
          formData.append(`languages_spoken[${index}]`, lang);
        });

    }



    // Total Experience
    if (totalExperience) {
      formData.append('total_experience', totalExperience);
    }

    // Education
    if (education) {
      formData.append('education', education);
    }

    // Additional Info (if needed by API)
    if (additionalInfo) {
      formData.append('additional_info', additionalInfo);
    }

    // Working Days
    if (workingDays.length > 0) {
      workingDays.forEach((day, index) => {
        formData.append(`working_days[${index}]`, day);
      });
    }
    
    if (stayType.length > 0) {
      formData.append('stay_type', stayType[0]);
    }

    // Voice Note (optional) - if provided
    if (voiceNote && voiceNote.uri) {
      formData.append('voice_note', {
        uri: voiceNote.path || voiceNote.uri,
        name: voiceNote.name || 'voice_note.mp3',
        type: voiceNote.mime || 'audio/mpeg',
      });
    }

    if (emergencyContactName) {
      formData.append('emergency_contact_name', emergencyContactName);
    }
    if (emergencyContactNumber) {
      formData.append('emergency_contact_number', emergencyContactNumber);
    }
    if (upiId) {
      formData.append('upi_id', upiId);
    }

    setLoader(true);

    console.log('formData-----',formData);
    return new Promise((resolve, reject) => {
      POST_FORM_DATA(
        WORK_INFO,
        formData,
        success => {
          setLoader(false);
          SimpleToast.show(
            LocalizedStrings.Auth?.work_info_saved ||
              'Work information saved successfully',
            SimpleToast.SHORT,
          );
          resolve(success);
        },
        error => {
          setLoader(false);
          const errorMessage =
            error?.message ||
            error?.error ||
            error?.data?.message ||
            LocalizedStrings.Auth?.failed_to_save_work_info ||
            'Failed to save work information';
          SimpleToast.show(errorMessage, SimpleToast.SHORT);
          reject(error);
        },
        fail => {
          setLoader(false);
          const failMessage =
            fail?.message ||
            fail?.error ||
            LocalizedStrings.Auth?.network_error ||
            'Network error. Please try again.';
          SimpleToast.show(failMessage, SimpleToast.SHORT);
          reject(fail);
        },
      );
    });
  };

  // Handle voice note file selection
  const handleVoiceNoteSelection = () => {
    launchImageLibrary(
      {
        mediaType: 'audio',
        quality: 1,
      },
      response => {
        if (response.didCancel) {
        } else if (response.errorMessage) {
          SimpleToast.show(
            LocalizedStrings.Auth?.error_selecting_audio ||
              'Error selecting audio file',
            SimpleToast.SHORT,
          );
        } else if (response.assets && response.assets.length > 0) {
          const audioFile = response.assets[0];
          setVoiceNote({
            uri: audioFile.uri,
            path: audioFile.uri,
            name: audioFile.fileName || 'voice_note.mp3',
            type: audioFile.type || 'audio/mpeg',
            mime: audioFile.type || 'audio/mpeg',
          });
          SimpleToast.show(
            LocalizedStrings.Auth?.audio_file_selected || 'Audio file selected',
            SimpleToast.SHORT,
          );
        }
      },
    );
  };

  // Handle voice note deletion
  const handleDeleteVoiceNote = () => {
    Alert.alert(
      LocalizedStrings.Auth?.delete_voice_note || 'Delete Voice Note',
      LocalizedStrings.Auth?.delete_voice_note_message ||
        'Are you sure you want to delete this voice note?',
      [
        {
          text: LocalizedStrings.EditProfile?.Cancel || 'Cancel',
          style: 'cancel',
        },
        {
          text: LocalizedStrings.Auth?.delete || 'Delete',
          style: 'destructive',
          onPress: () => {
            setVoiceNote(null);
            SimpleToast.show(
              LocalizedStrings.Auth?.voice_note_deleted || 'Voice note deleted',
              SimpleToast.SHORT,
            );
          },
        },
      ],
    );
  };

  // Expose saveWorkInfo function to parent component
  useImperativeHandle(ref, () => ({
    saveWorkInfo: saveWorkInfo,
  }));

  return (
    <>
      <View
        style={{
          borderWidth: 1,
          paddingHorizontal: 10,
          borderRadius: 10,
          borderColor: '#EBEBEA',
          marginTop: 10,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            style={styles.sectionTitle}
            type={Font?.Poppins_Bold}
            size={20}
          >
            {LocalizedStrings.NewStaffForm?.Work_Details || 'Work Info'}
          </Typography>
          <Image
            source={ImageConstant?.house}
            style={[styles.closeIcon, { height: 18, width: 18 }]}
          />
        </View>

        <DropdownComponent
          title={
            LocalizedStrings.NewStaffForm?.Role_Designation ||
            'Primary Role/Service'
          }
          placeholder={
            rolesLoading
              ? LocalizedStrings.Auth?.loading || 'Loading roles...'
              : LocalizedStrings.NewStaffForm?.Select_Role || 'Select Role'
          }
          width={'100%'}
          style_dropdown={{ marginHorizontal: 0 }}
          selectedTextStyleNew={{ marginLeft: 10 }}
          marginHorizontal={0}
          style_title={{ textAlign: 'left' }}
          value={selectedRole}
          onChange={handleRoleChange}
          data={roles}
          disable={rolesLoading}
          error={errors.selectedRole}
        />

        <Typography
          style={[styles.sectionTitle, { marginBottom: 8 }]}
          type={Font.Poppins_Medium}
          size={16}
        >
          {LocalizedStrings.PostNewJob?.required_skills ||
            'Skills & Specialties'}
        </Typography>

        {errors.selectedSkills && (
          <Typography style={styles.errorText} type={Font?.Poppins_Regular}>
            {errors.selectedSkills}
          </Typography>
        )}

        {loading ? (
          <Typography style={styles.loadingText} type={Font?.Poppins_Regular}>
            {LocalizedStrings.Auth?.loading || 'Loading skills...'}
          </Typography>
        ) : availableSkills.length > 0 ? (
          <DropdownComponent
            placeholder={LocalizedStrings.Auth?.select_skills || 'Select Skills'}
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0, marginBottom: 10 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            value={null}
            onChange={(item) => {
              if (item && item.value && !selectedSkills.includes(item.value)) {
                toggleSkill(item.value);
              }
            }}
            data={availableSkills.map((skill, index) => ({
              label: skill,
              value: skill,
              id: index,
            }))}
            disable={false}
          />
        ) : selectedRole ? (
          <Typography
            style={styles.noSkillsText}
            type={Font?.Poppins_Regular}
          >
            {LocalizedStrings.Auth?.no_skills_available ||
              'No skills available for this role'}
          </Typography>
        ) : (
          <Typography
            style={styles.noSkillsText}
            type={Font?.Poppins_Regular}
          >
            {LocalizedStrings.Auth?.select_role_to_view_skills ||
              'Please select a role to view skills'}
          </Typography>
        )}

        {selectedSkills.length > 0 && (
          <View style={styles.skillContainer}>
            {selectedSkills.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleSkill(item)}
                style={[styles.skillChip, styles.skillChipSelected]}
              >
                <Typography
                  style={[styles.skillText, styles.skillTextSelected]}
                  type={Font?.Manrope_SemiBold}
                >
                  {item}
                </Typography>
                <Image source={ImageConstant?.X} style={styles.closeIcon} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View
        style={{
          borderWidth: 1,
          paddingHorizontal: 10,
          borderRadius: 10,
          borderColor: '#EBEBEA',
          marginTop: 10,
        }}
      >
        <Typography
          style={[styles.sectionTitle, { marginBottom: 8 }]}
          type={Font.Poppins_Medium}
          size={16}
        >
          {LocalizedStrings.EditProfile?.Languages_Spoken || 'Languages Spoken'}
        </Typography>

        {errors.selectedLanguages && (
          <Typography style={styles.errorText} type={Font?.Poppins_Regular}>
            {errors.selectedLanguages}
          </Typography>
        )}

        <View style={styles.skillContainer}>
          {languagesList.length > 0 ? (
            languagesList.map((language, index) => {
              const isSelected = selectedLanguages.includes(language);
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleLanguage(language)}
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
                    {language}
                  </Typography>
                  {isSelected && (
                    <Image source={ImageConstant?.X} style={styles.closeIcon} />
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <Typography
              style={styles.noSkillsText}
              type={Font?.Poppins_Regular}
            >
              {LocalizedStrings.Auth?.no_languages_available ||
                'No languages available'}
            </Typography>
          )}
        </View>
      </View>

      {/* Working Days */}
      <View
        style={{
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingBottom: 10,
          borderRadius: 10,
          borderColor: '#EBEBEA',
          marginTop: 10,
        }}
      >
        <Typography
          style={[styles.sectionTitle, { marginBottom: 8 }]}
          type={Font.Poppins_Medium}
          size={16}
        >
          {'Working Days'}
        </Typography>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {DAYS_OPTIONS.map((day) => {
            const isSelected = workingDays.includes(day.value);
            return (
              <TouchableOpacity
                key={day.value}
                onPress={() => toggleDay(day.value)}
                style={[
                  styles.skillChip,
                  isSelected && styles.skillChipSelected,
                  { marginBottom: 8 },
                ]}
              >
                <Typography
                  style={[
                    styles.skillText,
                    isSelected && styles.skillTextSelected,
                  ]}
                  type={Font?.Manrope_SemiBold}
                >
                  {day.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Stay Type Checkboxes */}
        <Typography type={Font?.Poppins_Bold} size={14} style={{ marginTop: 15 }}>
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
      </View>

      <Input
        title={'Emergency Contact Name'}
        placeholder={'Enter emergency contact name'}
        value={emergencyContactName}
        onChange={text => setEmergencyContactName(text)}
        showTitle={true}
      />

      <Input
        title={'Emergency Contact Number'}
        placeholder={'Enter emergency contact number'}
        value={emergencyContactNumber}
        onChange={text => {
          const num = text.replace(/[^0-9]/g, '');
          setEmergencyContactNumber(num);
        }}
        keyboardType="phone-pad"
        maxLength={10}
        showTitle={true}
      />

      <Input
        title={'UPI ID'}
        placeholder={'e.g. name@bank'}
        value={upiId}
        onChange={text => setUpiId(text)}
        autoCapitalize="none"
        keyboardType="email-address"
        showTitle={true}
      />

      <Input
        title={LocalizedStrings.StaffProfile?.Experience || 'Total Experience'}
        placeholder={'Enter years'}
        value={totalExperience ? String(totalExperience) : ''}
        onChange={text => {
          const num = text.replace(/[^0-9.]/g, '');
          setTotalExperience(num);
        }}
        keyboardType="numeric"
        maxLength={4}
        error={errors.totalExperience}
        showTitle={true}
        rightAccessory={<Typography size={14} color="#666" style={{marginRight: 12}}>Years</Typography>}
      />

      <Input
        title={
          LocalizedStrings.PostNewJob?.additional_requirements ||
          'Additional Info'
        }
        placeholder={
          LocalizedStrings.PostNewJob?.additional_requirements_placeholder ||
          "I'm a hardworking professional..."
        }
        value={additionalInfo}
        onChange={text => {
          setAdditionalInfo(text);
          if (errors.additionalInfo)
            setErrors({ ...errors, additionalInfo: null });
        }}
        multiline={true}
        style_inputContainer={{ height: 100 }}
        style_input={{ height: 100 }}
        error={errors.additionalInfo}
      />

      <View style={styles.voiceNoteContainer}>
        <Typography
          style={styles.voiceNoteTitle}
          type={Font?.Poppins_Medium}
          size={16}
        >
          {LocalizedStrings.NewStaffForm?.Voice_Note || 'Voice Note (Optional)'}
        </Typography>

        {voiceNote ? (
          <View style={styles.voiceNotePreview}>
            <View style={styles.voiceNoteInfo}>
              <Image source={ImageConstant?.Doc} style={styles.audioIcon} />
              <View style={styles.voiceNoteDetails}>
                <Typography
                  type={Font?.Poppins_Medium}
                  size={14}
                  numberOfLines={1}
                >
                  {voiceNote.name || 'voice_note.mp3'}
                </Typography>
                <Typography type={Font?.Poppins_Regular} size={12} color="#666">
                  {LocalizedStrings.Auth?.audio_file_selected ||
                    'Audio file selected'}
                </Typography>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleDeleteVoiceNote}
              style={styles.deleteButton}
            >
              <Image source={ImageConstant?.X} style={styles.deleteIcon} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.voiceNoteButton}
            onPress={handleVoiceNoteSelection}
            activeOpacity={0.7}
          >
            <Image source={ImageConstant?.Doc} style={styles.uploadIcon} />
            <Typography type={Font?.Poppins_Regular} size={14} color="#666">
              {LocalizedStrings.NewStaffForm?.Upload_Voice_Note ||
                'Upload Voice Note'}
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
});

export default StepWokInfo;

const styles = StyleSheet.create({
  sectionTitle: {
    marginVertical: 16,
  },
  input: {
    marginTop: 16,
  },
  skillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillChipSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  skillText: {
    color: '#333',
    fontSize: 13,
  },
  skillTextSelected: {
    color: '#3B82F6',
  },
  selectedSkillsContainer: {
    marginTop: 10,
    marginBottom: 16,
  },
  selectedSkillsTitle: {
    marginBottom: 8,
    color: '#374151',
  },
  selectedSkillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedSkillText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  closeIcon: {
    width: 14,
    height: 14,
    marginLeft: 6,
    tintColor: '#555',
  },
  updateBtn: {
    marginTop: 30,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  noSkillsText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorText: {
    color: 'red',
    fontSize: 11,
    marginBottom: 5,
    fontFamily: Font?.Poppins_Regular,
  },
  voiceNoteContainer: {
    marginTop: 16,
  },
  voiceNoteTitle: {
    marginBottom: 10,
    color: '#333',
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FAFAFA',
  },
  uploadIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    tintColor: '#666',
  },
  voiceNotePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#F9F9F9',
  },
  voiceNoteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    tintColor: '#3B82F6',
  },
  voiceNoteDetails: {
    flex: 1,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  deleteIcon: {
    width: 18,
    height: 18,
    tintColor: '#EF4444',
  },
});
