import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Typography from '../../../Component/UI/Typography';
import DropdownComponent from '../../../Component/DropdownComponent';
import { Font } from '../../../Constants/Font';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Button from '../../../Component/Button';
import HeaderForUser from '../../../Component/HeaderForUser';
import CommanView from '../../../Component/CommanView';
import LocalizedStrings from '../../../Constants/localization';
import { POST_WITH_TOKEN, GET_WITH_TOKEN, API } from '../../../Backend/Backend';
import { StaffGetAIData, CATEGORY, SUBSCRIPTION_USER_CURRENT } from '../../../Backend/api_routes';
import { isPlaceholderImage } from '../../../Utils/ImageUtils';

const EXPERIENCE_OPTIONS = [
  { label: '0-1 Years', value: '0-1' },
  { label: '1-3 Years', value: '1-3' },
  { label: '3-5 Years', value: '3-5' },
  { label: '5-10 Years', value: '5-10' },
  { label: '10+ Years', value: '10+' },
];

const VERIFICATION_OPTIONS = [
  { label: 'Verified', value: 'verified' },
  { label: 'Unverified', value: 'unverified' },
];

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const AGE_OPTIONS = [
  { label: '18-25', value: '18-25' },
  { label: '25-30', value: '25-30' },
  { label: '30-35', value: '30-35' },
  { label: '35-40', value: '35-40' },
  { label: '40-50', value: '40-50' },
  { label: '50+', value: '50+' },
];

const SALARY_OPTIONS = [
  { label: 'Below ₹5,000', value: '0-5000' },
  { label: '₹5,000 - ₹10,000', value: '5000-10000' },
  { label: '₹10,000 - ₹20,000', value: '10000-20000' },
  { label: '₹20,000 - ₹50,000', value: '20000-50000' },
  { label: 'Above ₹50,000', value: '50000+' },
];

const parseCoordinateValue = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const FindStaff = ({ navigation, route }) => {
  const isFocused = useIsFocused();
  const description = route?.params?.description || '';
  const userDetails = useSelector(state => state?.userDetails);
  const userCity = userDetails?.addresses?.[0]?.city || userDetails?.city || '';
  const userState = userDetails?.addresses?.[0]?.state || userDetails?.state || '';
  const searchCoordinates = React.useMemo(() => {
    const primaryAddress = userDetails?.addresses?.[0] || {};
    const lat = primaryAddress?.lat ?? primaryAddress?.latitude ?? userDetails?.lat ?? userDetails?.latitude;
    const long = primaryAddress?.long ?? primaryAddress?.longitude ?? userDetails?.long ?? userDetails?.longitude;
    const parsedLat = parseCoordinateValue(lat);
    const parsedLong = parseCoordinateValue(long);

    if (parsedLat === null || parsedLong === null) {
      return null;
    }

    return { lat: parsedLat, long: parsedLong };
  }, [userDetails]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failedImages, setFailedImages] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [isPremium, setIsPremium] = useState(false);

  const [filterRole, setFilterRole] = useState(null);
  const [filterExperience, setFilterExperience] = useState(null);
  const [filterRegion, setFilterRegion] = useState('');
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [regionInput, setRegionInput] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [filterVerification, setFilterVerification] = useState(null);
  const [filterGender, setFilterGender] = useState(null);
  const [filterAge, setFilterAge] = useState(null);
  const [filterSalary, setFilterSalary] = useState(null);
  const [filterStayType, setFilterStayType] = useState(null);

  useEffect(() => {
    fetchCandidates();
    fetchRoleOptions();
    checkSubscription();
    // Search parameters are fixed for this result-screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFocused) {
      checkSubscription();
    }
  }, [isFocused]);

  const checkSubscription = () => {
    GET_WITH_TOKEN(
      SUBSCRIPTION_USER_CURRENT,
      res => {
        const sub = res?.subscription;
        const active = res?.is_active;

        const nestedPlan = sub?.subscription;
        const planPrice = nestedPlan?.price ? parseFloat(nestedPlan.price) : 0;
        const paidAmount = sub?.amount ? parseFloat(sub.amount) : 0;
        const paymentStatus = String(sub?.payment_status || '').toLowerCase();
        const subStatus = String(sub?.status || '').toLowerCase();

        const hasActiveRecord = sub && (subStatus === 'active');
        const hasPaidPrice = planPrice > 0;
        const hasPaidAmount = paidAmount > 0;
        const hasPaidPayment = paymentStatus === 'paid' || paymentStatus === 'completed';

        if (active && hasActiveRecord && (hasPaidPrice || hasPaidAmount || hasPaidPayment)) {
          setIsPremium(true);
        } else {
          setIsPremium(false);
        }
      },
      () => {
        setIsPremium(false);
      },
      () => {
        setIsPremium(false);
      }
    );
  };

  const showUpgradeAlert = () => {
    Alert.alert(
      'Upgrade to Premium Plan',
      'You are currently on the Standard (Free) plan. Upgrade to Premium to view staff profiles and connect with them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade Now',
          onPress: () => navigation.navigate('HouseholdManager'),
        },
      ],
      { cancelable: true }
    );
  };

  const fetchRoleOptions = () => {
    GET_WITH_TOKEN(
      CATEGORY,
      success => {
        const data = success?.data || success?.roles || (Array.isArray(success) ? success : []);
        const options = data.map(role => ({
          label: role?.name || role?.title || role?.category_name || String(role),
          value: role?.name || role?.title || role?.category_name || String(role),
        })).filter(o => o.label);
        setRoleOptions(options);
      },
      () => {},
      () => {},
    );
  };

  const getImageUrl = (img) => {
    if (!img || isPlaceholderImage(img)) return null;
    if (typeof img === 'string' && img.startsWith('http')) return img;
    const baseUrl = API.replace('/api/', '');
    return `${baseUrl}${img}`;
  };

  const getCandidateImage = item => {
    return (
      getImageUrl(item?.image) ||
      getImageUrl(item?.profile_picture) ||
      getImageUrl(item?.user_detail?.image) ||
      getImageUrl(item?.user_detail?.profile_picture) ||
      getImageUrl(item?.staff?.image) ||
      getImageUrl(item?.staff?.profile_picture) ||
      getImageUrl(item?.user?.image) ||
      getImageUrl(item?.user?.profile_picture)
    );
  };

  const formatSalary = (salary) => {
    if (!salary) return '';
    const num = Number(salary);
    if (isNaN(num)) return salary;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const getAge = (dob) => {
    if (!dob) return '';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age <= 0) return '';
    const lower = Math.floor(age / 5) * 5;
    const upper = lower + 5;
    return `${lower}-${upper}`;
  };

  const fetchCandidates = () => {
    setIsLoading(true);
    setErrorMessage('');

    const normalizedQuery = String(description).toLowerCase();
    const isNearbyQuery = normalizedQuery.includes('near me') || normalizedQuery.includes('nearby');
    const requestPayload = { query: description, query_text: description };

    if (userCity) {
      requestPayload.user_city = userCity;
    }

    if (userState) {
      requestPayload.user_state = userState;
    }

    if (searchCoordinates) {
      requestPayload.lat = searchCoordinates.lat;
      requestPayload.long = searchCoordinates.long;
    }

    if (isNearbyQuery) {
      requestPayload.radius_km = 50;
    }

    POST_WITH_TOKEN(
      StaffGetAIData,
      requestPayload,
      (response) => {

        if (response?.success === false) {
          setErrorMessage(response?.message || 'Something went wrong. Please try again.');
          setCandidates([]);
          setIsLoading(false);
          return;
        }
        const data = response?.data || [];
        const list = Array.isArray(data) ? data : [];

        const mapped = list.map((item) => {
          const workInfo = item?.user_work_info || {};
          return {
            id: item?.id,
            name: `${item?.first_name || ''} ${item?.last_name || ''}`.trim() || item?.name || 'Unknown',
            role: Array.isArray(workInfo?.primary_role) ? workInfo.primary_role.join(', ') : (workInfo?.primary_role || ''),
            tags: Array.isArray(workInfo?.skills) ? workInfo.skills : [],
            location: item?.addresses?.[0]?.city || item?.location || item?.city || item?.address?.city || item?.current_address?.city || item?.region || '',
            preferredLocation: item?.preferred_work_location || item?.user_work_info?.preferred_work_location || item?.work_info?.preferred_work_location || '',
            pincode: item?.addresses?.[0]?.pincode || item?.addresses?.[0]?.zip || item?.addresses?.[0]?.postal_code || item?.pincode || '',
            experience: workInfo?.total_experience || workInfo?.experience || (item?.year_of_experience ? `${item.year_of_experience} Years Experience` : ''),
            verified: item?.is_verified || false,
            policeVerified: !!(
              item?.kycInformation?.police_verification_path ||
              item?.kyc_information?.police_verification_path ||
              item?.kycInformation?.police_clearance_certificate_path ||
              item?.kyc_information?.police_clearance_certificate_path ||
              item?.kycInformation?.verification_certificate ||
              item?.kyc_information?.verification_certificate ||
              item?.verification_certificate ||
              item?.police_verified === true
            ),
            gender: item?.gender || '',
            age: getAge(item?.dob),
            salaryNum: Number(workInfo?.salary) || 0,
            salary: formatSalary(workInfo?.salary),
            image: getCandidateImage(item),
            stayType: workInfo?.stay_type || item?.stay_type || '',
            isJobSeeking: (item?.is_job_seeking === true || item?.is_job_seeking === 1 || item?.is_available === true || item?.is_available === 1),
            distanceKm: parseCoordinateValue(item?._distance_km ?? item?.distance_km ?? item?.distanceKm),
            _similarity: item?._similarity || 0,
            raw: item,
          };
        }).filter(c => c.isJobSeeking);

        // Role and location matching is already applied by the backend. Keeping
        // one source of truth prevents correct candidates from being removed twice.
        const finalList = mapped.filter(c => c.role || c.location);

        setAllCandidates(finalList);
        setCandidates(finalList);
        setIsLoading(false);
      },
      (error) => {
        console.log('FindStaff API ERROR:', JSON.stringify(error?.data || error));
        const apiMsg =
          error?.data?.message ||
          error?.data?.error ||
          (error?.data?.errors && JSON.stringify(error.data.errors)) ||
          'Could not load staff. Please try again.';
        setErrorMessage(String(apiMsg));
        setCandidates([]);
        setAllCandidates([]);
        setIsLoading(false);
      },
      (fail) => {
        console.log('FindStaff NETWORK FAIL:', JSON.stringify(fail));
        setErrorMessage('Network error. Please check your connection and try again.');
        setCandidates([]);
        setAllCandidates([]);
        setIsLoading(false);
      },
    );
  };

  const regionOptions = React.useMemo(() => {
    const regions = new Set();
    allCandidates.forEach(c => {
      if (c.location) regions.add(c.location);
    });
    return [...regions].filter(Boolean).map(r => ({ label: r, value: r }));
  }, [allCandidates]);

  const parseExpYears = (exp) => {
    if (!exp) return 0;
    const match = String(exp).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const applyFilters = () => {
    let filtered = [...allCandidates];

    if (filterRole) {
      filtered = filtered.filter(c => c.role && typeof c.role === 'string' && c.role.toLowerCase().includes(filterRole.toLowerCase()));
    }

    if (filterExperience) {
      filtered = filtered.filter(c => {
        const years = parseExpYears(c.experience);
        if (filterExperience === '10+') return years >= 10;
        const [min, max] = filterExperience.split('-').map(Number);
        return years >= min && years <= max;
      });
    }

    if (filterRegion) {
      filtered = filtered.filter(c => {
        const loc = String(c.location || '');
        const region = String(c.raw?.addresses?.[0]?.state || c.raw?.region || '');
        return loc.toLowerCase().includes(filterRegion.toLowerCase()) || region.toLowerCase().includes(filterRegion.toLowerCase());
      });
    }

    if (filterArea) {
      filtered = filtered.filter(c => {
        const pin = String(c.pincode || '');
        const loc = String(c.location || '');
        return pin.includes(filterArea) || loc.toLowerCase().includes(filterArea.toLowerCase());
      });
    }

    if (filterVerification) {
      filtered = filtered.filter(c =>
        filterVerification === 'verified' ? c.policeVerified : !c.policeVerified
      );
    }

    if (filterGender) {
      filtered = filtered.filter(c => c.gender && c.gender.toLowerCase() === filterGender.toLowerCase());
    }

    if (filterStayType) {
      filtered = filtered.filter(c => c.raw?.stay_type === filterStayType || c.raw?.user_work_info?.stay_type === filterStayType);
    }

    if (filterAge) {
      filtered = filtered.filter(c => {
        if (!c.age) return false;
        if (filterAge === '50+') {
          const lower = parseInt(c.age.split('-')[0], 10);
          return lower >= 50;
        }
        const [fMin, fMax] = filterAge.split('-').map(Number);
        const ageLower = parseInt(c.age.split('-')[0], 10);
        return ageLower >= fMin && ageLower < fMax;
      });
    }

    if (filterSalary) {
      filtered = filtered.filter(c => {
        if (!c.salaryNum) return false;
        if (filterSalary === '50000+') return c.salaryNum >= 50000;
        const [min, max] = filterSalary.split('-').map(Number);
        return c.salaryNum >= min && c.salaryNum <= max;
      });
    }

    setCandidates(filtered);
  };

  const resetFilters = () => {
    setFilterRole(null);
    setFilterExperience(null);
    setFilterRegion('');
    setRegionInput('');
    setFilterArea('');
    setPincodeInput('');
    setFilterVerification(null);
    setFilterGender(null);
    setFilterAge(null);
    setFilterSalary(null);
    setFilterStayType(null);
    setCandidates(allCandidates);
  };

  const dropdownProps = {
    style_dropdown: { marginHorizontal: 0, width: '100%' },
    selectedTextStyleNew: { marginLeft: 4 , fontSize: 14 },
    style_title: { textAlign: 'left' },
    marginHorizontal: 0,
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.FindStaff.title}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        source_logo={ImageConstant?.notification}
        style_title={{ fontSize: 18 }}
        onPressRightIcon={() => navigation.navigate('Notification')}
      />

      {/* Filter Toggle Button */}
      <TouchableOpacity
        style={styles.filterToggleBtn}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Image source={ImageConstant?.Briefcase} style={{ width: 16, height: 16, tintColor: showFilters ? '#fff' : '#D98579', marginRight: 8 }} />
        <Typography color={showFilters ? '#fff' : '#D98579'} type={Font?.Poppins_Medium}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Typography>
        {(filterRole || filterExperience || filterRegion || filterArea || filterVerification || filterGender || filterAge || filterSalary || filterStayType) && (
          <View style={styles.filterActiveDot} />
        )}
      </TouchableOpacity>

      {/* Collapsible Filters */}
      {showFilters && (
      <View style={styles.filterCard}>
        <View style={styles.filterRow}>
          <DropdownComponent
            leftIcons={ImageConstant?.Briefcase}
            leftIconsShow
            size={30}
            placeholder={LocalizedStrings.FindStaff.Job_Role}
            data={roleOptions}
            value={filterRole}
            onChange={(item) => setFilterRole(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginRight: 6 }}
          />
          <DropdownComponent
            leftIcons={ImageConstant?.Calendar}
            leftIconsShow
            size={30}
            placeholder={LocalizedStrings.FindStaff.Experience}
            data={EXPERIENCE_OPTIONS}
            value={filterExperience}
            onChange={(item) => setFilterExperience(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginLeft: 6 }}
          />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.modalFilterBtn, { flex: 1, marginRight: 6 }]}
            activeOpacity={0.7}
            onPress={() => { setRegionInput(filterRegion || ''); setShowRegionModal(true); }}
          >
            <View style={styles.modalFilterLeftIcon}>
              <Image source={ImageConstant?.Location} style={styles.modalFilterIconImg} />
            </View>
            <Typography size={14} color={filterRegion ? '#000' : 'gray'} style={{ flex: 1, marginLeft: 4 }} numberOfLines={1}>
              {filterRegion || LocalizedStrings.FindStaff.Region}
            </Typography>
            <View style={styles.modalFilterRightIcon}>
              <Image source={ImageConstant.BackArrow} style={styles.modalFilterArrow} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalFilterBtn, { flex: 1, marginLeft: 6 }]}
            activeOpacity={0.7}
            onPress={() => { setPincodeInput(filterArea || ''); setShowPincodeModal(true); }}
          >
            <View style={styles.modalFilterLeftIcon}>
              <Image source={ImageConstant?.Location} style={styles.modalFilterIconImg} />
            </View>
            <Typography size={14} color={filterArea ? '#000' : 'gray'} style={{ flex: 1, marginLeft: 4 }} numberOfLines={1}>
              {filterArea || LocalizedStrings.FindStaff.Area_Pincode}
            </Typography>
            <View style={styles.modalFilterRightIcon}>
              <Image source={ImageConstant.BackArrow} style={styles.modalFilterArrow} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <DropdownComponent
            leftIcons={ImageConstant?.Verify}
            leftIconsShow
            size={30}
            placeholder={LocalizedStrings.FindStaff.Verification}
            data={VERIFICATION_OPTIONS}
            value={filterVerification}
            onChange={(item) => setFilterVerification(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginRight: 6 }}
          />
          <DropdownComponent
            leftIcons={ImageConstant?.Users}
            leftIconsShow
            size={30}
            placeholder={LocalizedStrings.FindStaff.Gender}
            data={GENDER_OPTIONS}
            value={filterGender}
            onChange={(item) => setFilterGender(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginLeft: 6 }}
          />
        </View>

        <View style={styles.filterRow}>
          <DropdownComponent
            leftIcons={ImageConstant?.Calendar}
            leftIconsShow
            size={30}
            placeholder={LocalizedStrings.FindStaff.Age_Range}
            data={AGE_OPTIONS}
            value={filterAge}
            onChange={(item) => setFilterAge(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginRight: 6 }}
          />
          <DropdownComponent
            leftIcons={ImageConstant?.Dollar}
            leftIconsShow
            size={30}
            placeholder={LocalizedStrings.FindStaff.Expected_Salary}
            data={SALARY_OPTIONS}
            value={filterSalary}
            onChange={(item) => setFilterSalary(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginLeft: 6 }}
          />
        </View>

        <View style={styles.filterRow}>
          <DropdownComponent
            leftIcons={ImageConstant?.Briefcase}
            leftIconsShow
            size={30}
            placeholder="Stay Type"
            data={[
              { label: 'Inhouse', value: 'inhouse' },
              { label: 'Come and Go', value: 'come_and_go' },
            ]}
            value={filterStayType}
            onChange={(item) => setFilterStayType(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginRight: 6 }}
          />
          <View style={{ flex: 1, marginLeft: 6 }} />
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
            <Typography color="#000" type={Font?.Poppins_Medium}>
              {LocalizedStrings.FindStaff.Reset_Filters}
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={() => { applyFilters(); setShowFilters(false); }}>
            <Typography color="#fff" type={Font?.Poppins_Medium}>
              {LocalizedStrings.FindStaff.Apply_Filters}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
      )}

      {/* Candidates */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#379AE6" />
          <Typography size={14} style={{ marginTop: 10 }} color="#555">
            Finding matching staff...
          </Typography>
        </View>
      ) : (
        <>
          <Typography size={14} style={{ marginVertical: 20 }}>
            {candidates.length} {LocalizedStrings.FindStaff.Matching_Candidates}
          </Typography>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Typography size={14} color="#D98579" textAlign="center">
                {errorMessage}
              </Typography>
            </View>
          ) : candidates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Typography size={14} color="#555" textAlign="center">
                No matching candidates found. Try adjusting your search.
              </Typography>
            </View>
          ) : null}

          {candidates.map(c => (
            <View key={c.id} style={styles.card}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, paddingHorizontal: 20 }}>
                  <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                    <Image
                      source={
                        c.image && !failedImages[c.id]
                          ? { uri: c.image }
                          : ImageConstant.user
                      }
                      defaultSource={ImageConstant.user}
                      onError={() => setFailedImages(prev => ({ ...prev, [c.id]: true }))}
                      style={styles.avatar}
                    />
                    <View style={{ justifyContent: 'center', marginLeft: 8 }}>
                      <Typography type={Font?.Poppins_SemiBold} size={17}>
                        {c.name}
                      </Typography>
                      <Typography size={13} color="#555">
                        {c.role}
                      </Typography>
                    </View>
                  </View>

                  {/* Tags */}
                  {c.tags && c.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {c.tags.map((tag, i) => (
                        <View key={i} style={styles.tag}>
                          <Typography size={11}>{tag}</Typography>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Info with Icons */}
                  <View style={[styles.infoRow, { marginTop: 15 }]}>
                    <Image source={ImageConstant.Location} style={styles.icon} />
                    <View style={{ flex: 1 }}>
                      <Typography margin={3} size={14}>
                        Current: {c.location || 'Not Available'}
                      </Typography>
                      {c.preferredLocation ? (
                        <Typography margin={3} size={12} color="#D98579" type={Font.Poppins_Medium}>
                          Ready to work in: {c.preferredLocation}
                        </Typography>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Image source={ImageConstant.Briefcase} style={styles.icon} />
                    <Typography margin={3} size={14}>
                      {c.experience || 'Not Available'}
                    </Typography>
                  </View>

                  {c.stayType ? (
                    <View style={styles.infoRow}>
                      <Image source={ImageConstant.Location} style={styles.icon} />
                      <Typography margin={3} size={14} color="#D98579" type={Font.Poppins_Medium}>
                        Stay Type: {c.stayType === 'come_and_go' ? 'Come and Go' : 'Inhouse'}
                      </Typography>
                    </View>
                  ) : null}

                  <View style={styles.infoRow}>
                    <Image source={ImageConstant.Verify} style={styles.icon} />
                    <Typography margin={3} size={14}>
                      {LocalizedStrings.FindStaff.Police_Verification}:{' '}
                      <Typography color={c.policeVerified ? 'green' : '#FF9800'}>
                        {c.policeVerified ? LocalizedStrings.FindStaff.Verified : 'Not Uploaded'}
                      </Typography>
                    </Typography>
                  </View>

                  {(c.gender || c.age) ? (
                    <View style={[styles.infoRow, { justifyContent: 'space-between' }]}>
                      {c.gender ? (
                        <View style={styles.infoRow}>
                          <Image source={ImageConstant.Users} style={styles.icon} />
                          <Typography margin={3} size={14}>
                            {c.gender}
                          </Typography>
                        </View>
                      ) : null}
                      {c.age ? (
                        <View style={styles.infoRow}>
                          <Image source={ImageConstant.Calendar} style={styles.icon} />
                          <Typography margin={3} size={14}>
                            {c.age}
                          </Typography>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {c.salary ? (
                    <View style={[styles.infoRow, { marginBottom: 15 }]}>
                      <Image source={ImageConstant.Dollar} style={styles.icon} />
                      <Typography margin={3} size={14}>
                        {c.salary}
                      </Typography>
                    </View>
                  ) : null}
                </View>
              </View>
              <Button
                title={LocalizedStrings.FindStaff.Contact || 'Connect'}
                style={{ width: '90%', margin: 'auto' }}
                onPress={() => {
                  if (!isPremium) {
                    showUpgradeAlert();
                  } else {
                    navigation.navigate('HouseHoldStaffProfile', { item: c.raw, fromFindStaffAI: true });
                  }
                }}
              />
            </View>
          ))}
        </>
      )}
      {/* Region Modal */}
      <Modal
        visible={showRegionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRegionModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Typography type={Font?.Poppins_SemiBold} size={16} style={{ marginBottom: 16 }}>
              {LocalizedStrings.FindStaff.Region}
            </Typography>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter Region"
              value={regionInput}
              onChangeText={setRegionInput}
              keyboardType="default"
              autoFocus
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.resetBtn, { marginRight: 10 }]}
                onPress={() => {
                  setRegionInput('');
                  setFilterRegion('');
                  setShowRegionModal(false);
                }}
              >
                <Typography color="#000" type={Font?.Poppins_Medium} size={14}>
                  Clear
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setFilterRegion(regionInput.trim());
                  setShowRegionModal(false);
                }}
              >
                <Typography color="#fff" type={Font?.Poppins_Medium} size={14}>
                  Apply
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pincode Modal */}
      <Modal
        visible={showPincodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPincodeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPincodeModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Typography type={Font?.Poppins_SemiBold} size={16} style={{ marginBottom: 16 }}>
              {LocalizedStrings.FindStaff.Area_Pincode}
            </Typography>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter Area or Pincode"
              value={pincodeInput}
              onChangeText={setPincodeInput}
              keyboardType="default"
              autoFocus
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.resetBtn, { marginRight: 10 }]}
                onPress={() => {
                  setPincodeInput('');
                  setFilterArea('');
                  setShowPincodeModal(false);
                }}
              >
                <Typography color="#000" type={Font?.Poppins_Medium} size={14}>
                  Clear
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setFilterArea(pincodeInput.trim());
                  setShowPincodeModal(false);
                }}
              >
                <Typography color="#fff" type={Font?.Poppins_Medium} size={14}>
                  Apply
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </CommanView>
  );
};

export default FindStaff;

const styles = StyleSheet.create({
  filterCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#FFF0EE',
    borderWidth: 1,
    borderColor: '#D98579',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  filterActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D98579',
    marginLeft: 6,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  resetBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 10,
    borderColor: '#D98579',
    borderWidth: 1,
    height: 40,
  },
  applyBtn: {
    backgroundColor: '#D98579',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 16,
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 30,
    paddingHorizontal: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  tag: {
    backgroundColor: '#eee',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 6,
    resizeMode: 'contain',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  modalFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    height: 60,
    marginVertical: 10,
  },
  modalFilterLeftIcon: {
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFilterIconImg: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
  },
  modalFilterRightIcon: {
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFilterArrow: {
    height: 15,
    width: 8,
    resizeMode: 'contain',
    tintColor: '#979797',
    transform: [{ rotate: '-90deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF5F4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D98579',
    marginTop: 10,
    paddingHorizontal: 16,
  },
});
