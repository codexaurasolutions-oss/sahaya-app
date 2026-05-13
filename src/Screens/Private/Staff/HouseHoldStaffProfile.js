import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Modal,
} from 'react-native';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';
import SimpleToast from 'react-native-simple-toast';
import Button from '../../../Component/Button';
// SimpleModal replaced with full-screen Modal
import DropdownComponent from '../../../Component/DropdownComponent';
import Input from '../../../Component/Input';
import UploadBox from '../../../Component/UploadBox';
import { POST_FORM_DATA, POST_WITH_TOKEN, GET_WITH_TOKEN, API } from '../../../Backend/Backend';
import { ReviewStore, StaffAvailableDetail, TerminateStaff } from '../../../Backend/api_routes';
import Date_Picker from '../../../Component/Date_Picker';
import moment from 'moment';
import { launchImageLibrary } from 'react-native-image-picker';
import { isPlaceholderImage } from '../../../Utils/ImageUtils';

const terminationReasons = [
  { label: 'No longer required', value: 'no_longer_required' },
  { label: 'Poor performance', value: 'poor_performance' },
  { label: 'Misbehavior', value: 'misbehavior' },
  { label: 'Theft', value: 'theft' },
  { label: 'Attendance issues', value: 'attendance_issues' },
  { label: 'Other', value: 'other' },
];

const getProfileImage = (img) => {
  if (isPlaceholderImage(img)) return null;
  if (img.startsWith('http')) return img;
  const baseUrl = API.replace('/api/', '');
  return `${baseUrl}${img}`;
};

const HouseHoldStaffProfile = ({ navigation, route }) => {
  const paramData = route?.params?.item || {};
  const fromFindStaffAI = route?.params?.fromFindStaffAI || false;
  const [data, setData] = useState(paramData);
  const [modalMode, setModalMode] = useState(null);
  const [reason, setReason] = useState(null);
  const [rating, setRating] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [policeStationName, setPoliceStationName] = useState('');
  const [policeStationContact, setPoliceStationContact] = useState('');
  const [policeStationAddress, setPoliceStationAddress] = useState('');
  const [firPhoto, setFirPhoto] = useState(null);
  const [terminationDate, setTerminationDate] = useState(null);
  const [noticePeriodDays, setNoticePeriodDays] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [newSalary, setNewSalary] = useState('');
  const [profileImageToUpload, setProfileImageToUpload] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [newUpi, setNewUpi] = useState('');
  const [isBlacklist, setIsBlacklist] = useState(false);

  useEffect(() => {
    if (paramData?.id) {
      GET_WITH_TOKEN(
        `${StaffAvailableDetail}/${paramData.id}`,
        success => {
          console.log('StaffAvailableDetail response:', JSON.stringify(success));
          // Handle nested response structures: data.data, data.staff, data.user, or data directly
          const raw = success?.data;
          const fetched = (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data))
            ? raw.data
            : (raw?.staff && typeof raw.staff === 'object')
              ? raw.staff
              : (raw?.user && typeof raw.user === 'object')
                ? raw.user
                : raw;
          if (fetched && typeof fetched === 'object') {
            setData(prev => ({ ...prev, ...fetched }));
          }
        },
        () => {},
        () => {},
      );
    }
  }, [paramData?.id]);

  const profileImageUrl = getProfileImage(data?.image);
  const fullName = `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || data?.name || 'User';

  // Address: try addresses array, then single address object, then nested structures, then flat fields
  const addr = data?.addresses?.[0]
    || data?.address
    || data?.user_detail?.addresses?.[0]
    || data?.staff?.addresses?.[0]
    || data?.user_addresses?.[0]
    || data?.current_address
    || {};
  const addrStreet = addr?.street || data?.street || data?.street_address || '';
  const addrLocality = addr?.locality || addr?.area || data?.locality || data?.area || '';
  const addrCity = addr?.city || data?.city || data?.location || data?.city_name || data?.region || '';
  const addrState = addr?.state || data?.state || data?.state_name || '';
  const addrPincode = addr?.pincode || addr?.zip || data?.pincode || data?.zip_code || data?.postal_code || '';

  const maskAadhar = num => num ? num.replace(/\d(?=\d{4})/g, 'x') : '';

  // KYC Document image URLs
  const kycInfo = data?.kyc_information || {};
  const getDocUrl = (path) => {
    if (isPlaceholderImage(path)) {
      return null;
    }
    if (path.startsWith('http')) return path;
    const baseUrl = API.replace('/api/', '');
    return `${baseUrl}${path}`;
  };

  const aadhaarFrontUrl = getDocUrl(data?.aadhar_front) || getDocUrl(kycInfo?.aadhar_front) || getDocUrl(kycInfo?.adharfront_path) || getDocUrl(data?.user_detail?.aadhar_front);
  const aadhaarBackUrl = getDocUrl(data?.aadhar_back) || getDocUrl(kycInfo?.aadhar_back) || getDocUrl(kycInfo?.adharbackend_path) || getDocUrl(data?.user_detail?.aadhar_back);
  const verificationCertUrl = getDocUrl(data?.verification_certificate) || getDocUrl(kycInfo?.verification_certificate) || getDocUrl(kycInfo?.police_clearance_certificate_path) || getDocUrl(data?.user_detail?.verification_certificate);

  const openWhatsApp = async number => {
    if (!number) {
      SimpleToast.show('Phone number not available', SimpleToast.SHORT);
      return;
    }
    const phone = number.replace(/\D/g, '');
    const url = `whatsapp://send?phone=91${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      SimpleToast.show('WhatsApp not installed', SimpleToast.SHORT);
      return;
    }
    Linking.openURL(url);
  };

  const handleCall = number => {
    if (!number) {
      SimpleToast.show('Phone number not available', SimpleToast.SHORT);
      return;
    }
    Linking.openURL(`tel:+91${number}`);
  };

  const resetModal = () => {
    setModalMode(null);
    setReason(null);
    setRating(0);
    setRemarks('');
    setPoliceStationName('');
    setPoliceStationContact('');
    setPoliceStationAddress('');
    setFirPhoto(null);
    setTerminationDate(null);
    setNoticePeriodDays('');
    setSubmitLoading(false);
    setIsBlacklist(false);
  };

  const handlePickFirPhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      } else if (response.errorMessage) {
        SimpleToast.show('Error picking image', SimpleToast.SHORT);
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setFirPhoto({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `fir_photo_${Date.now()}.jpg`,
          path: asset.uri,
        });
      }
    });
  };
  
  const handlePickProfileImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        SimpleToast.show('Error picking image', SimpleToast.SHORT);
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const imageObj = {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `staff_photo_${Date.now()}.jpg`,
        };
        handleUpdateProfileImage(imageObj);
      }
    });
  };

  const handleUpdateProfileImage = (imageObj) => {
    setSubmitLoading(true);
    const formData = new FormData();
    formData.append('image', imageObj);
    
    // We can use UpdateStaff route or dedicated image update if exists
    POST_FORM_DATA(
      `${UpdateStaff}/${data?.id}`,
      formData,
      res => {
        setSubmitLoading(false);
        SimpleToast.show('Profile image updated successfully', SimpleToast.SHORT);
        // Refresh local data or update image in state
        if (res?.data?.image || res?.user?.image) {
          const newImg = res?.data?.image || res?.user?.image;
          setData(prev => ({ ...prev, image: newImg }));
        } else {
          // If response doesn't have image, update with local uri temporarily
          setData(prev => ({ ...prev, image: imageObj.uri }));
        }
      },
      err => {
        setSubmitLoading(false);
        SimpleToast.show(err?.message || 'Failed to update image', SimpleToast.SHORT);
      }
    );
  };

  const submitReview = () => {
    if (rating <= 0) return;
    const formData = new FormData();
    formData.append('staff_id', data?.id);
    formData.append('rating', rating);
    if (remarks) formData.append('review', remarks);
    POST_FORM_DATA(ReviewStore, formData);
  };

  const handleSubmitTerminate = () => {
    if (!reason) {
      SimpleToast.show('Please select a reason', SimpleToast.SHORT);
      return;
    }
    setSubmitLoading(true);

    const formData = new FormData();
    formData.append('user_id', String(data?.id));
    formData.append('reason', reason);
    if (terminationDate) formData.append('termination_date', moment(terminationDate).format('YYYY-MM-DD'));
    if (noticePeriodDays) formData.append('notice_period_days', noticePeriodDays);
    formData.append('status', 'pending');
    if (remarks) formData.append('remarks', remarks);
    if (isBlacklist) {
      formData.append('is_blacklist', '1');
      if (firPhoto) {
        formData.append('fir_photo', firPhoto);
      }
      if (policeStationName) formData.append('police_station_name', policeStationName);
      if (policeStationContact) formData.append('police_station_contact', policeStationContact);
    }

    console.log('--- admin/terminations payload --- (FormData with FIR if applicable)');

    if (rating > 0) submitReview();

    POST_FORM_DATA(
      TerminateStaff,
      formData,
      res => {
        console.log('--- admin/terminations SUCCESS ---', JSON.stringify(res, null, 2));
        setSubmitLoading(false);
        SimpleToast.show(isBlacklist ? 'Staff reported and blacklisted' : 'Employee terminated successfully', SimpleToast.SHORT);
        resetModal();
        navigation.goBack();
      },
      err => {
        console.log('--- admin/terminations ERROR ---', JSON.stringify(err?.data || err, null, 2));
        setSubmitLoading(false);
        SimpleToast.show(
          err?.data?.message || 'Something went wrong',
          SimpleToast.SHORT,
        );
      },
      () => {
        console.log('--- admin/terminations FAIL (network) ---');
        setSubmitLoading(false);
      },
    );
  };


  const handleUpdateSalary = () => {
    if (!newSalary || isNaN(newSalary)) {
      SimpleToast.show('Please enter a valid salary amount', SimpleToast.SHORT);
      return;
    }

    setSubmitLoading(true);
    POST_WITH_TOKEN(
      `${UpdateStaff}/${data?.id}`,
      { salary: newSalary },
      res => {
        setSubmitLoading(false);
        setIsEditingSalary(false);
        SimpleToast.show('Salary updated successfully', SimpleToast.SHORT);
        // Update local state
        setData(prev => ({
          ...prev,
          user_work_info: {
            ...prev.user_work_info,
            salary: newSalary
          }
        }));
      },
      err => {
        setSubmitLoading(false);
        SimpleToast.show(err?.message || 'Failed to update salary', SimpleToast.SHORT);
      }
    );
  };
 
  const handlePickDocument = (field) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };
 
    launchImageLibrary(options, response => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        SimpleToast.show('Error picking image', SimpleToast.SHORT);
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const imageObj = {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `${field}_${Date.now()}.jpg`,
        };
        handleUploadStaffDocument(field, imageObj);
      }
    });
  };
 
  const handleUploadStaffDocument = (field, imageObj) => {
    setUploadingDoc(field);
    const formData = new FormData();
    formData.append(field, imageObj);
    
    POST_FORM_DATA(
      `${UpdateStaff}/${data?.id}`,
      formData,
      res => {
        setUploadingDoc(null);
        SimpleToast.show('Document updated successfully', SimpleToast.SHORT);
        // Refresh local data
        if (res?.data) {
          setData(prev => ({ ...prev, ...res.data }));
        } else if (res?.staff) {
          setData(prev => ({ ...prev, ...res.staff }));
        }
      },
      err => {
        setUploadingDoc(null);
        SimpleToast.show(err?.message || 'Failed to upload document', SimpleToast.SHORT);
      }
    );
  };
 
  const handleUpdateUpi = () => {
    if (!newUpi || !newUpi.includes('@')) {
      SimpleToast.show('Please enter a valid UPI ID', SimpleToast.SHORT);
      return;
    }
 
    setSubmitLoading(true);
    POST_WITH_TOKEN(
      `${UpdateStaff}/${data?.id}`,
      { upi_id: newUpi },
      res => {
        setSubmitLoading(false);
        setIsEditingUpi(false);
        SimpleToast.show('UPI ID updated successfully', SimpleToast.SHORT);
        setData(prev => ({ ...prev, upi_id: newUpi }));
      },
      err => {
        setSubmitLoading(false);
        SimpleToast.show(err?.message || 'Failed to update UPI ID', SimpleToast.SHORT);
      }
    );
  };

  console.log('data------', data);

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.StaffProfile.title}
        source_logo={ImageConstant?.notification}
        style_title={styles.headerTitle}
        onPressRightIcon={() => navigation.navigate('Notification')}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={() => setPreviewImage(profileImageUrl)}>
              <Image
                source={profileImageUrl ? { uri: profileImageUrl } : ImageConstant.user}
                style={styles.profileImage}
              />
              <View style={styles.enlargeHint}>
                <Image source={ImageConstant.Zoom || ImageConstant.eye} style={styles.enlargeIcon} />
                <Typography style={styles.enlargeText}>Tap to enlarge</Typography>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.editImageBtn}
              onPress={handlePickProfileImage}
              activeOpacity={0.8}
            >
              <Image source={ImageConstant.NewCamera} style={styles.editImageIcon} />
            </TouchableOpacity>
          </View>
          <Typography style={styles.name} size={22}>
            {fullName}
          </Typography>
          <Typography style={styles.role}>
            {data?.user_work_info?.primary_role}
          </Typography>

          <View style={styles.flexRow}>
            <Image source={ImageConstant.phone} style={styles.icon} />
            <Typography style={styles.info}>
              {data?.phone_number
                ? `${data?.phone_number_prefix || '+91'} ${data.phone_number}`
                : 'Not Available'}
            </Typography>
          </View>
          <View style={styles.flexRow}>
            <Image source={ImageConstant.Location} style={styles.icon} />
            <Typography style={styles.info}>
              {addrCity || 'Not Available'} {addrState}
            </Typography>
          </View>
          <View style={styles.flexRow}>
            <Image source={ImageConstant.mail} style={styles.icon} />
            <Typography style={styles.info}>{data?.email || 'Not Available'}</Typography>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleCall(data?.phone_number)}
            >
              <Image source={ImageConstant.phone} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => openWhatsApp(data?.phone_number)}
            >
              <Image source={ImageConstant.WhatsApp} style={styles.icon} />
            </TouchableOpacity>
          </View>
          {!fromFindStaffAI && (
            <Button
              onPress={() => navigation.navigate('AttendanceScreen', {
                staffId: data?.id,
                staffName: fullName,
              })}
              style={styles.attendanceBtn}
              title={'Attendance Statistics'}
              main_style={styles.attendanceBtnMain}
            />
          )}
        </View>
        <View style={styles.card}>
          <Typography style={styles.cardTitle}>
            {LocalizedStrings.StaffProfile.Personal_Information}
          </Typography>
          <View style={styles.row}>
            <Image source={ImageConstant.date} style={styles.icon} />
            <View style={styles.textBox}>
              <Typography style={styles.label}>
                {LocalizedStrings.StaffProfile.Date_of_Birth}
              </Typography>
              <Typography style={styles.value}>{data?.dob || 'Not Available'}</Typography>
            </View>
          </View>
          <View style={styles.row}>
            <Image source={ImageConstant.person} style={styles.icon} />
            <View style={styles.textBox}>
              <Typography style={styles.label}>
                {LocalizedStrings.StaffProfile.Gender}
              </Typography>
              <Typography style={styles.value}>{data?.gender || 'Not Available'}</Typography>
            </View>
          </View>
          <View style={styles.row}>
            <Image source={ImageConstant.person} style={styles.icon} />
            <View style={styles.textBox}>
              <Typography style={styles.label}>
                Emergency Contact Name
              </Typography>
              <Typography style={styles.value}>
                {data?.user_work_info?.emergency_contact_name || 'Not Available'}
              </Typography>
            </View>
          </View>
          <View style={styles.rowNoBorder}>
            <Image source={ImageConstant.phone} style={styles.icon} />
            <View style={styles.textBox}>
              <Typography style={styles.label}>
                Emergency Contact Number
              </Typography>
              <Typography style={styles.value}>
                {data?.user_work_info?.emergency_contact_number
                  ? `+91 ${data.user_work_info.emergency_contact_number}`
                  : 'Not Available'}
              </Typography>
            </View>
          </View>
          <View style={styles.rowNoBorder}>
            <Image source={ImageConstant.upi} style={styles.icon} />
            <View style={styles.textBox}>
              <Typography style={styles.label}>
                UPI ID
              </Typography>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '90%' }}>
                <Typography style={styles.value}>
                  {data?.upi_id || 
                   data?.user_work_info?.upi_id || 
                   data?.work_info?.upi_id || 
                   data?.user_detail?.upi_id ||
                   data?.staff?.upi_id ||
                   'Not Available'}
                </Typography>
                <TouchableOpacity
                  onPress={() => {
                    setNewUpi(data?.upi_id || data?.user_work_info?.upi_id || '');
                    setIsEditingUpi(true);
                  }}
                  style={{ padding: 5 }}
                >
                  <Image
                    source={ImageConstant.pencle}
                    style={{ width: 14, height: 14, tintColor: '#D98579' }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>


        {data?.user_work_info && (
          <View style={styles.card}>
            <Typography style={styles.cardTitle}>
              Work Information
            </Typography>
            {data?.user_work_info?.primary_role && (
              <View style={styles.row}>
                <Image source={ImageConstant.Briefcase} style={styles.icon} />
                <View style={styles.textBox}>
                  <Typography style={styles.label}>Role</Typography>
                  <Typography style={styles.value}>
                    {Array.isArray(data.user_work_info.primary_role)
                      ? data.user_work_info.primary_role.join(', ')
                      : data.user_work_info.primary_role}
                  </Typography>
                </View>
              </View>
            )}
            {data?.user_work_info?.salary && (
              <View style={styles.row}>
                <Image source={ImageConstant.Dollar} style={styles.icon} />
                <View style={styles.textBox}>
                  <Typography style={styles.label}>Salary</Typography>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '95%' }}>
                    <Typography style={styles.value}>
                      ₹{Number(data.user_work_info.salary).toLocaleString('en-IN')}
                    </Typography>
                    <TouchableOpacity
                      onPress={() => {
                        setNewSalary(data.user_work_info.salary.toString());
                        setIsEditingSalary(true);
                      }}
                      style={{ padding: 5 }}
                    >
                      <Image
                        source={ImageConstant.pencle}
                        style={{ width: 14, height: 14, tintColor: '#D98579' }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            {data?.user_work_info?.pay_frequency && (
              <View style={styles.row}>
                <Image source={ImageConstant.Calendar} style={styles.icon} />
                <View style={styles.textBox}>
                  <Typography style={styles.label}>Pay Frequency</Typography>
                  <Typography style={[styles.value, { textTransform: 'capitalize' }]}>
                    {data.user_work_info.pay_frequency}
                  </Typography>
                </View>
              </View>
            )}
            {data?.user_work_info?.working_days && (
              <View style={styles.rowNoBorder}>
                <Image source={ImageConstant.Calendar} style={styles.icon} />
                <View style={styles.textBox}>
                  <Typography style={styles.label}>Working Days</Typography>
                  <Typography style={styles.value}>
                    {Array.isArray(data.user_work_info.working_days)
                      ? data.user_work_info.working_days.join(', ')
                      : data.user_work_info.working_days}
                  </Typography>
                </View>
              </View>
            )}
            {data?.user_work_info?.joining_date && (
              <View style={styles.rowNoBorder}>
                <Image source={ImageConstant.Calendar} style={styles.icon} />
                <View style={styles.textBox}>
                  <Typography style={styles.label}>Joining Date</Typography>
                  <Typography style={styles.value}>
                    {moment(data.user_work_info.joining_date).format('DD MMM YYYY')}
                  </Typography>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Typography style={styles.cardTitle}>
            {LocalizedStrings.StaffProfile.Aadhaar_Details}
          </Typography>
          <View style={styles.row}>
            <Image source={ImageConstant.hash} style={styles.icon} />
            <View style={styles.textBox}>
              <Typography style={styles.label}>
                {LocalizedStrings.StaffProfile.Aadhaar_Number}
              </Typography>
              <Typography style={styles.value}>
                {maskAadhar(data?.aadhar_number)}
              </Typography>
            </View>
          </View>
          <View style={styles.row}>
            <Image source={ImageConstant.person} style={styles.icon} />
            <View style={styles.textBox}>
              <Typography style={styles.label}>
                {LocalizedStrings.StaffProfile.Aadhaar_Name}
              </Typography>
              <Typography style={styles.value}>{fullName}</Typography>
            </View>
          </View>
          <View style={styles.rowNoBorder}>
            <Image source={ImageConstant.Calendar} style={styles.icon} />
            <View style={styles.textBox}>
              <Typography style={styles.label}>
                {LocalizedStrings.StaffProfile.Issued_By}
              </Typography>
              <Typography style={styles.value}>UIDAI</Typography>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Typography style={styles.cardTitle}>
            {LocalizedStrings.StaffProfile.Residential_Address}
          </Typography>
          {[
            {
              label: LocalizedStrings.StaffProfile.Street,
              value: addrStreet || 'Not Available',
            },
            {
              label: LocalizedStrings.StaffProfile.Locality,
              value: addrLocality || addrCity || 'Not Available',
            },
            {
              label: LocalizedStrings.StaffProfile.City,
              value: addrCity || 'Not Available',
            },
            {
              label: LocalizedStrings.StaffProfile.State,
              value: addrState || 'Not Available',
            },
            {
              label: LocalizedStrings.StaffProfile.Pincode,
              value: addrPincode || 'Not Available',
            },
          ].map((item, idx, arr) => (
            <View
              key={item.label}
              style={idx === arr.length - 1 ? styles.rowNoBorder : styles.row}
            >
              <Image source={ImageConstant.Location} style={styles.icon} />
              <View style={styles.textBox}>
                <Typography style={styles.label}>{item.label}</Typography>
                <Typography style={styles.value}>{item.value}</Typography>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Typography style={styles.cardTitle}>
            {LocalizedStrings.StaffProfile.KYC_Status}
          </Typography>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 10,
              borderBottomWidth: 0.2,
              borderBottomColor: '#EBEBEA',
              paddingBottom: 20,
            }}
          >
            <Image source={ImageConstant.Verify} style={styles.icon} />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '88%',
              }}
            >
              <Typography style={[styles.label, { color: 'black' }]}>
                {LocalizedStrings.NewStaffForm.Aadhaar_Card_Details ||
                  'Aadhaar Card'}
              </Typography>
              <View
                style={[
                  styles.kycBadge,
                  {
                    backgroundColor:
                      data?.aadhar__verify == 1 ? '#E6F7EC' : '#FEF9C3',
                  },
                ]}
              >
                <Typography
                  style={[
                    styles.kycText,
                    {
                      color: data?.aadhar__verify == 1 ? '#28A745' : '#854D0E',
                    },
                  ]}
                >
                  {data?.aadhar__verify == 1
                    ? LocalizedStrings.FindStaff.Verified || 'Verified'
                    : LocalizedStrings.LeaveApplications.Pending || 'Pending'}
                </Typography>
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 10,
            }}
          >
            <Image source={ImageConstant.lines} style={styles.icon} />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '88%',
              }}
            >
              <Typography style={[styles.label, { color: 'black' }]}>
                {LocalizedStrings.FindStaff.Police_Verification ||
                  'Police Verification'}
              </Typography>
              <View
                style={[
                  styles.kycBadge,
                  {
                    backgroundColor:
                      data?.aadhar__verify == 1 ? '#E6F7EC' : '#FEF9C3',
                  },
                ]}
              >
                <Typography
                  style={[
                    styles.kycText,
                    {
                      color: data?.aadhar__verify == 1 ? '#28A745' : '#854D0E',
                    },
                  ]}
                >
                  {LocalizedStrings.LeaveApplications.Pending || 'Pending'}
                </Typography>
              </View>
            </View>
          </View>
        </View>

        {(aadhaarFrontUrl || aadhaarBackUrl || verificationCertUrl) && (
          <View style={styles.card}>
            <Typography style={styles.cardTitle}>
              KYC Documents
            </Typography>
            <View style={styles.docGrid}>
              {aadhaarFrontUrl && (
                <TouchableOpacity
                  style={styles.docItem}
                  onPress={() => setPreviewImage(aadhaarFrontUrl)}
                >
                  <Image
                    source={{ uri: aadhaarFrontUrl }}
                    style={styles.docImage}
                    resizeMode="cover"
                  />
                  <Typography style={styles.docLabel}>Aadhaar Front</Typography>
                </TouchableOpacity>
              )}
              {aadhaarBackUrl && (
                <TouchableOpacity
                  style={styles.docItem}
                  onPress={() => setPreviewImage(aadhaarBackUrl)}
                >
                  <Image
                    source={{ uri: aadhaarBackUrl }}
                    style={styles.docImage}
                    resizeMode="cover"
                  />
                  <Typography style={styles.docLabel}>Aadhaar Back</Typography>
                </TouchableOpacity>
              )}
              {verificationCertUrl && (
                <TouchableOpacity
                  style={styles.docItem}
                  onPress={() => setPreviewImage(verificationCertUrl)}
                >
                  <Image
                    source={{ uri: verificationCertUrl }}
                    style={styles.docImage}
                    resizeMode="cover"
                  />
                  <Typography style={styles.docLabel}>Police Certificate</Typography>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
 
        <View style={[styles.card, { marginTop: 20, borderColor: '#D98579', borderStyle: 'dashed' }]}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 8, marginBottom: 12 }}>
             <Typography type={Font.Poppins_Bold} size={16} color="#D98579">
               Private Documents (Only visible to you)
             </Typography>
             <Image source={ImageConstant.Verify} style={{ width: 16, height: 16, tintColor: '#D98579' }} />
           </View>
           
           <Typography size={12} color="#888" style={{ marginBottom: 15 }}>
             Manage documents specifically for your records. These changes will not affect the staff's global profile.
           </Typography>
 
           <View style={styles.docGrid}>
              {[
                { label: 'Aadhaar Front', field: 'employer_aadhar_front', url: getDocUrl(data?.employer_aadhar_front) },
                { label: 'Aadhaar Back', field: 'employer_aadhar_back', url: getDocUrl(data?.employer_aadhar_back) },
                { label: 'Police Verification', field: 'employer_police_verification', url: getDocUrl(data?.employer_police_verification) },
                { label: 'Contract/Other', field: 'employer_other_doc', url: getDocUrl(data?.employer_other_doc) },
              ].map((doc) => (
                <View key={doc.field} style={styles.docItem}>
                   <TouchableOpacity
                    style={[styles.docImage, { justifyContent: 'center', alignItems: 'center' }]}
                    onPress={() => doc.url ? setPreviewImage(doc.url) : handlePickDocument(doc.field)}
                   >
                    {doc.url ? (
                      <Image source={{ uri: doc.url }} style={styles.docImage} resizeMode="cover" />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        {uploadingDoc === doc.field ? (
                          <ActivityIndicator size="small" color="#D98579" />
                        ) : (
                          <Image source={ImageConstant.NewCamera} style={{ width: 24, height: 24, tintColor: '#ccc' }} />
                        )}
                        <Typography size={10} color="#999" style={{ marginTop: 4 }}>Tap to upload</Typography>
                      </View>
                    )}
                    {doc.url && (
                       <TouchableOpacity 
                         style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#fff', borderRadius: 10, padding: 2, elevation: 2 }}
                         onPress={() => handlePickDocument(doc.field)}
                       >
                         <Image source={ImageConstant.pencle} style={{ width: 12, height: 12, tintColor: '#D98579' }} />
                       </TouchableOpacity>
                    )}
                   </TouchableOpacity>
                   <Typography style={styles.docLabel}>{doc.label}</Typography>
                </View>
              ))}
           </View>
        </View>

        {!fromFindStaffAI && (
          <View style={styles.actionFooter}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionBorder]}
              onPress={() => {
                setIsBlacklist(false);
                setModalMode('terminate');
              }}>
              <Typography style={styles.actionButtonText}>
                Terminate Employee
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.blacklistButton]}
              onPress={() => {
                setIsBlacklist(true);
                setModalMode('terminate');
              }}>
              <Typography style={styles.blacklistButtonText}>
                Report & Blacklist Staff
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Terminate Modal - Centered popup dialog */}
      <Modal
        visible={modalMode === 'terminate'}
        animationType="fade"
        transparent={true}
        onRequestClose={resetModal}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <TouchableOpacity onPress={resetModal} style={styles.dialogCloseBtn}>
              <Typography size={18} color="#D98579">{'\u2715'}</Typography>
            </TouchableOpacity>

            <Typography type={Font.Poppins_SemiBold} size={17} style={{ textAlign: 'center', marginBottom: 16, color: isBlacklist ? '#DE3B40' : '#000' }}>
              {isBlacklist ? 'Report & Blacklist Staff' : 'Terminate Employee'}
            </Typography>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Image
                source={profileImageUrl ? { uri: profileImageUrl } : ImageConstant.user}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
              <View style={{ marginLeft: 12 }}>
                <Typography type={Font.Poppins_SemiBold} size={15}>
                  {fullName}
                </Typography>
                <Typography type={Font.Poppins_Regular} size={12} color="#888">
                  {data?.user_work_info?.primary_role || 'Staff'}
                </Typography>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            <DropdownComponent
              title="Termination Reason"
              data={terminationReasons}
              value={reason}
              onChange={item => setReason(item.value)}
              style_dropdown={styles.dropdown}
              selectedTextStyleNew={{ marginLeft: 10 }}
              style_title={styles.dropdownTitle}
              marginHorizontal={0}
              placeholder="Select a reason"
            />

            <Date_Picker
              title="Termination Date"
              placeholder="Select termination date"
              selected_date={terminationDate}
              onConfirm={date => setTerminationDate(date)}
              disablePastDates={false}
              allowFutureDates={true}
            />

            <Input
              title="Notice Period (Days)"
              placeholder="Enter notice period in days"
              value={noticePeriodDays}
              onChange={setNoticePeriodDays}
              keyboardType="numeric"
              mainStyle={{ marginVertical: 5 }}
            />

            <Typography type={Font.Poppins_Medium} size={14} style={{ marginTop: 12, marginBottom: 6 }}>
              Rating
            </Typography>
            <View style={styles.modalRatingRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Typography style={[styles.starText, { color: star <= rating ? '#F5A623' : '#D1D5DB' }]}>
                    {star <= rating ? '\u2605' : '\u2606'}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            {isBlacklist && (
              <View style={{ marginTop: 15 }}>
                <Typography type={Font.Poppins_SemiBold} size={14} style={{ marginBottom: 10 }}>
                  Police Station Details & FIR
                </Typography>
                <Input
                  placeholder="Police Station Name"
                  value={policeStationName}
                  onChange={setPoliceStationName}
                  mainStyle={{ marginVertical: 5 }}
                />
                <Input
                  placeholder="Police Station Contact"
                  value={policeStationContact}
                  onChange={setPoliceStationContact}
                  keyboardType="numeric"
                  mainStyle={{ marginVertical: 5 }}
                />
                
                <Typography size={12} color="#888" style={{ marginTop: 10, marginBottom: 5 }}>
                  Upload FIR Document / Proof
                </Typography>
                <UploadBox
                  title={firPhoto ? "FIR Uploaded" : "Upload FIR Photo"}
                  onPress={handlePickFirPhoto}
                  imageUri={firPhoto?.uri}
                  style={{ marginBottom: 15 }}
                />
              </View>
            )}

            <Button
              onPress={handleSubmitTerminate}
              title={isBlacklist ? "Confirm & Blacklist" : "Confirm Termination"}
              loader={submitLoading}
              main_style={{ width: '100%', marginTop: 16, marginBottom: 10, backgroundColor: isBlacklist ? '#DE3B40' : '#D98579' }}
            />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Salary Modal */}
      <Modal
        visible={isEditingSalary}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditingSalary(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <TouchableOpacity onPress={() => setIsEditingSalary(false)} style={styles.dialogCloseBtn}>
              <Typography size={18} color="#D98579">{'\u2715'}</Typography>
            </TouchableOpacity>

            <Typography type={Font.Poppins_SemiBold} size={17} style={{ textAlign: 'center', marginBottom: 16 }}>
              Edit Monthly Salary
            </Typography>

            <Input
              title="Salary (₹)"
              placeholder="Enter new salary"
              value={newSalary}
              onChange={setNewSalary}
              keyboardType="numeric"
              mainStyle={{ marginVertical: 15 }}
            />

            <Typography size={12} color="#888" style={{ marginBottom: 20, textAlign: 'center' }}>
              Updating this will change the base salary for all future payments.
            </Typography>

            <Button
              onPress={handleUpdateSalary}
              title="Save Changes"
              loader={submitLoading}
              main_style={{ width: '100%', marginBottom: 10 }}
            />
          </View>
        </View>
      </Modal>
 
      {/* Edit UPI Modal */}
      <Modal
        visible={isEditingUpi}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditingUpi(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <TouchableOpacity onPress={() => setIsEditingUpi(false)} style={styles.dialogCloseBtn}>
              <Typography size={18} color="#D98579">{'\u2715'}</Typography>
            </TouchableOpacity>
 
            <Typography type={Font.Poppins_SemiBold} size={17} style={{ textAlign: 'center', marginBottom: 16 }}>
              Edit UPI ID
            </Typography>
 
            <Input
              title="UPI ID"
              placeholder="e.g. staff@upi"
              value={newUpi}
              onChange={setNewUpi}
              mainStyle={{ marginVertical: 15 }}
            />
 
            <Typography size={12} color="#888" style={{ marginBottom: 20, textAlign: 'center' }}>
              This UPI ID will be used for direct salary payments.
            </Typography>
 
            <Button
              onPress={handleUpdateUpi}
              title="Save UPI ID"
              loader={submitLoading}
              main_style={{ width: '100%', marginBottom: 10 }}
            />
          </View>
        </View>
      </Modal>

      {/* Full-screen Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewClose}
            onPress={() => setPreviewImage(null)}
          >
            <Typography size={22} color="#fff">{'\u2715'}</Typography>
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.imagePreviewFull}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </CommanView>
  );
};

export default HouseHoldStaffProfile;

const styles = StyleSheet.create({
  container: { paddingVertical: 16 },
  headerTitle: { fontSize: 18 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageBtn: {
    position: 'absolute',
    bottom: 5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  editImageIcon: {
    width: 18,
    height: 18,
    tintColor: '#D98579',
  },
  profileImage: {
    height: 90,
    width: 90,
    borderRadius: 45,
    marginBottom: 10,
  },
  enlargeHint: {
    position: 'absolute',
    bottom: 5,
    right: -25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  enlargeIcon: {
    height: 12,
    width: 12,
    resizeMode: 'contain',
    tintColor: '#fff',
    marginRight: 4,
  },
  enlargeText: {
    fontFamily: Font.Poppins_Regular,
    fontSize: 10,
    color: '#fff',
  },
  name: {
    fontFamily: Font.Poppins_Bold,
    marginBottom: 2,
  },
  role: {
    fontFamily: Font.Poppins_Regular,
    color: '#666',
    marginBottom: 12,
  },
  info: {
    fontFamily: Font.Poppins_Medium,
    fontSize: 15,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    width: '80%',
  },
  icon: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
    marginRight: 10,
    tintColor: '#8C8D8B',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginVertical: 12,
  },
  iconBtn: {
    backgroundColor: '#f2f2f2',
    width: '47%',
    height: 40,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D98579',
    alignItems: 'center',
    justifyContent: 'center',
  },
  findStaffBtn: { height: 42 },
  findStaffMain: {
    width: '92%',
    marginTop: 10,
  },
  attendanceBtn: { height: 42 },
  attendanceBtnMain: {
    width: '92%',
    marginTop: 5,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  cardTitle: {
    fontFamily: Font.Poppins_Bold,
    fontSize: 18,
    marginBottom: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#EBEBEA',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#EBEBEA',
  },
  rowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  textBox: { marginLeft: 10 },
  label: {
    fontFamily: Font.Poppins_Regular,
    fontSize: 13,
    color: '#888',
  },
  value: {
    fontFamily: Font.Poppins_SemiBold,
    fontSize: 14,
    marginTop: 2,
  },
  professionalBox: { paddingVertical: 15 },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noBorder: {
    borderColor: 'white',
    marginBottom: 0,
  },
  kycBadge: {
    backgroundColor: '#E6F7EC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  kycText: {
    color: '#28A745',
    fontFamily: Font.Poppins_Medium,
  },

  actionFooter: {
    marginTop: 20,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBorder: {
    borderColor: '#FFD7D7',
    borderWidth: 1.5,
    backgroundColor: '#FFF5F5',
  },
  mt12: { marginTop: 12 },
  actionButtonText: {
    color: '#DE3B40',
    fontSize: 15,
    fontFamily: Font.Poppins_SemiBold,
  },
  blacklistButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DE3B40',
    marginTop: 12,
  },
  blacklistButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Font.Poppins_SemiBold,
  },

  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  dialogBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
  },
  dialogCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 10,
    padding: 4,
  },
  dropdown: {
    marginHorizontal: 0,
    height: 43,
  },
  dropdownTitle: {
    textAlign: 'left',
    fontFamily: Font.Poppins_Regular,
  },
  modalRatingRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  starText: {
    fontSize: 32,
    marginRight: 6,
  },
  input: { height: 43 },
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  docItem: {
    width: '30%',
    alignItems: 'center',
  },
  docImage: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  docLabel: {
    fontFamily: Font.Poppins_Medium,
    fontSize: 11,
    color: '#555',
    marginTop: 6,
    textAlign: 'center',
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  imagePreviewFull: {
    width: '90%',
    height: '70%',
  },
});
