import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import Typography from '../../Component/UI/Typography';
import DropdownComponent from '../../Component/DropdownComponent';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import Button from '../../Component/Button';
import HeaderForUser from '../../Component/HeaderForUser';
import CommanView from '../../Component/CommanView';
import { POST_WITH_TOKEN } from '../../Backend/Backend';
import { JobGetAIData } from '../../Backend/api_routes';

const COMPENSATION_TYPE_OPTIONS = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Hourly', value: 'hourly' },
];

const COMMITMENT_OPTIONS = [
  { label: 'Full Time', value: 'full-time' },
  { label: 'Part Time', value: 'part-time' },
  { label: 'Live In', value: 'live-in' },
];

const SALARY_OPTIONS = [
  { label: 'Below ₹5,000', value: '0-5000' },
  { label: '₹5,000 - ₹10,000', value: '5000-10000' },
  { label: '₹10,000 - ₹20,000', value: '10000-20000' },
  { label: '₹20,000 - ₹50,000', value: '20000-50000' },
  { label: 'Above ₹50,000', value: '50000+' },
];

const AIJobResults = ({ navigation, route }) => {
  const description = route?.params?.description || '';
  const userDetails = useSelector(state => state?.userDetails);
  const userCity = userDetails?.addresses?.[0]?.city || userDetails?.city || '';
  const userState = userDetails?.addresses?.[0]?.state || userDetails?.state || '';
  
  console.log('AIJobResults - Received description:', description);
  const [allJobs, setAllJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filterRole, setFilterRole] = useState(null);
  const [filterLocation, setFilterLocation] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [filterCompType, setFilterCompType] = useState(null);
  const [filterCommitment, setFilterCommitment] = useState(null);
  const [filterSalary, setFilterSalary] = useState(null);

  useEffect(() => {
    fetchJobs();
    // Search parameters are fixed for this result-screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCompensation = (job) => {
    const amount = job?.expected_compensation || job?.compensation;
    if (amount && job?.compensation_type) {
      return `₹${Number(amount).toLocaleString('en-IN')} / ${job.compensation_type}`;
    }
    return amount ? `₹${Number(amount).toLocaleString('en-IN')}` : '';
  };

  const formatLocation = (job) => {
    if (job?.city && job?.state) {
      return `${job.city}, ${job.state}`;
    }
    return job?.city || job?.state || job?.street_address || '';
  };

  const fetchJobs = () => {
    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage('');

    POST_WITH_TOKEN(
      JobGetAIData,
      {
        query: description,
        query_text: description,
        user_city: userCity,
        user_state: userState,
      },
      (response) => {
        console.log('AIJobResults - API Response:', JSON.stringify(response));
        if (response?.success === false) {
          setErrorMessage(response?.message || 'Something went wrong. Please try again.');
          setJobs([]);
          setAllJobs([]);
          setIsLoading(false);
          return;
        }
        const data = response?.data || [];
        const list = Array.isArray(data) ? data : [];

        const mapped = list.map((item) => ({
          id: item?.id,
          title: item?.title || 'Untitled Job',
          description: item?.description || '',
          location: formatLocation(item),
          city: item?.city || '',
          state: item?.state || '',
          compensation: Number(item?.expected_compensation || item?.compensation) || 0,
          compensationDisplay: formatCompensation(item),
          compensationType: item?.compensation_type || '',
          commitmentType: item?.commitment_type || '',
          requiredSkills: item?.required_skills || '',
          additionalRequirements: item?.additional_requirements || '',
          preferredHours: item?.preferred_hours || '',
          raw: item,
        }));

        const finalList = mapped;

        const backendMessage = response?.message || '';
        setStatusMessage(
          finalList.length === 0
            ? (backendMessage || 'No matching jobs found. Try adjusting your search.')
            : (response?.fallback ? backendMessage : '')
        );
        setAllJobs(finalList);
        setJobs(finalList);
        setIsLoading(false);
      },
      (error) => {
        console.log('AIJobResults - API Error:', JSON.stringify(error));
        setErrorMessage(
          error?.data?.message ||
            error?.data?.error ||
            'Could not load jobs right now. Please try again.'
        );
        setJobs([]);
        setAllJobs([]);
        setIsLoading(false);
      },
      (fail) => {
        console.log('AIJobResults - API Fail:', JSON.stringify(fail));
        setErrorMessage('Network error. Please check your connection and try again.');
        setJobs([]);
        setAllJobs([]);
        setIsLoading(false);
      },
    );
  };

  const roleOptions = React.useMemo(() => {
    const roles = new Set();
    allJobs.forEach(j => {
      if (j.title) roles.add(j.title);
    });
    return [...roles].filter(Boolean).map(r => ({ label: r, value: r }));
  }, [allJobs]);

  const locationOptions = React.useMemo(() => {
    const locations = new Set();
    allJobs.forEach(j => {
      if (j.location) locations.add(j.location);
    });
    return [...locations].filter(Boolean).map(r => ({ label: r, value: r }));
  }, [allJobs]);

  const applyFilters = () => {
    let filtered = [...allJobs];

    if (filterRole) {
      filtered = filtered.filter(j => j.title && j.title.toLowerCase().includes(filterRole.toLowerCase()));
    }

    if (filterLocation) {
      filtered = filtered.filter(j => {
        const loc = String(j.location || '');
        const city = String(j.city || '');
        const state = String(j.state || '');
        const pincode = String(j.raw?.pincode || j.raw?.zip || j.raw?.postal_code || '');
        const search = filterLocation.toLowerCase();
        return loc.toLowerCase().includes(search) || city.toLowerCase().includes(search) || state.toLowerCase().includes(search) || pincode.includes(filterLocation);
      });
    }

    if (filterCompType) {
      filtered = filtered.filter(j => j.compensationType && j.compensationType.toLowerCase() === filterCompType.toLowerCase());
    }

    if (filterCommitment) {
      filtered = filtered.filter(j => j.commitmentType && j.commitmentType.toLowerCase() === filterCommitment.toLowerCase());
    }

    if (filterSalary) {
      filtered = filtered.filter(j => {
        if (!j.compensation) return false;
        if (filterSalary === '50000+') return j.compensation >= 50000;
        const [min, max] = filterSalary.split('-').map(Number);
        return j.compensation >= min && j.compensation <= max;
      });
    }

    setJobs(filtered);
  };

  const resetFilters = () => {
    setFilterRole(null);
    setFilterLocation('');
    setLocationInput('');
    setFilterCompType(null);
    setFilterCommitment(null);
    setFilterSalary(null);
    setJobs(allJobs);
    setShowFilters(false);
  };

  const dropdownProps = {
    style_dropdown: { marginHorizontal: 0, width: '100%' },
    selectedTextStyleNew: { marginLeft: 4, fontSize: 14 },
    style_title: { textAlign: 'left' },
    marginHorizontal: 0,
  };

  return (
    <CommanView>
      <HeaderForUser
        title={'Matching Jobs'}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        source_logo={ImageConstant?.notification}
        style_title={{ fontSize: 18 }}
        onPressRightIcon={() => navigation.navigate('Notifications')}
      />

      {/* Filter Toggle Button */}
      <TouchableOpacity
        style={styles.filterToggleBtn}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Image 
          source={ImageConstant?.Briefcase} 
          style={{ 
            width: 16, 
            height: 16, 
            tintColor: showFilters ? '#fff' : '#D98579', 
            marginRight: 8 
          }} 
        />
        <Typography 
          color={showFilters ? '#fff' : '#D98579'} 
          type={Font?.Poppins_Medium}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Typography>
        {(filterRole || filterLocation || filterCompType || filterCommitment || filterSalary) && (
          <View style={styles.filterActiveDot} />
        )}
      </TouchableOpacity>

      {showFilters && (
      <View style={styles.filterCard}>
        <Typography
          type={Font?.Poppins_SemiBold}
          size={16}
          style={{ marginBottom: 10 }}
        >
          Filter Options
        </Typography>

        <View style={styles.filterRow}>
          <DropdownComponent
            leftIcons={ImageConstant?.Briefcase}
            leftIconsShow
            size={30}
            placeholder={'Job Role'}
            data={roleOptions}
            value={filterRole}
            onChange={(item) => setFilterRole(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginRight: 6 }}
          />
          <TouchableOpacity
            style={[styles.modalFilterBtn, { flex: 1, marginLeft: 6 }]}
            activeOpacity={0.7}
            onPress={() => {
              setLocationInput(filterLocation || '');
              setShowLocationModal(true);
            }}
          >
            <View style={styles.modalFilterLeftIcon}>
              <Image source={ImageConstant?.Location} style={styles.modalFilterIconImg} />
            </View>
            <Typography size={14} color={filterLocation ? '#000' : 'gray'} style={{ flex: 1, marginLeft: 4 }} numberOfLines={1}>
              {filterLocation || 'Location'}
            </Typography>
            <View style={styles.modalFilterRightIcon}>
              <Image source={ImageConstant.BackArrow} style={styles.modalFilterArrow} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <DropdownComponent
            leftIcons={ImageConstant?.Calendar}
            leftIconsShow
            size={30}
            placeholder={'Work Type'}
            data={COMMITMENT_OPTIONS}
            value={filterCommitment}
            onChange={(item) => setFilterCommitment(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginRight: 6 }}
          />
          <DropdownComponent
            leftIcons={ImageConstant?.Dollar}
            leftIconsShow
            size={30}
            placeholder={'Salary Range'}
            data={SALARY_OPTIONS}
            value={filterSalary}
            onChange={(item) => setFilterSalary(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginLeft: 6 }}
          />
        </View>

        <View style={styles.filterRow}>
          <DropdownComponent
            leftIcons={ImageConstant?.Dollar}
            leftIconsShow
            size={30}
            placeholder={'Pay Type'}
            data={COMPENSATION_TYPE_OPTIONS}
            value={filterCompType}
            onChange={(item) => setFilterCompType(item.value)}
            {...dropdownProps}
            MainBoxStyle={{ flex: 1, marginRight: 6 }}
          />
          <View style={{ flex: 1, marginLeft: 6 }} />
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
            <Typography color="#000" type={Font?.Poppins_Medium}>
              Reset Filters
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
            <Typography color="#fff" type={Font?.Poppins_Medium}>
              Apply Filters
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
      )}

      {/* Jobs */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D98579" />
          <Typography size={14} style={{ marginTop: 10 }} color="#555">
            Finding matching jobs...
          </Typography>
        </View>
      ) : (
        <>
          <Typography size={14} style={{ marginVertical: 20 }}>
            {jobs.length} Matching Jobs
          </Typography>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Typography size={14} color="#D98579" textAlign="center">
                {errorMessage}
              </Typography>
            </View>
          ) : statusMessage ? (
            <View style={styles.emptyContainer}>
              <Typography size={14} color="#555" textAlign="center">
                {statusMessage}
              </Typography>
            </View>
          ) : jobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Typography size={14} color="#555" textAlign="center">
                No matching jobs found. Try adjusting your search.
              </Typography>
            </View>
          ) : null}

          {jobs.map(j => (
            <View key={j.id} style={styles.card}>
              <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                <View style={styles.iconCircle}>
                  <Image
                    source={ImageConstant.Briefcase}
                    style={{ height: 24, width: 24, tintColor: '#D98579' }}
                  />
                </View>
                <View style={{ justifyContent: 'center', marginLeft: 12, flex: 1 }}>
                  <Typography type={Font?.Poppins_SemiBold} size={17}>
                    {j.title}
                  </Typography>
                  {j.commitmentType ? (
                    <View style={styles.commitmentBadge}>
                      <Typography size={11} color="#D98579">
                        {j.commitmentType}
                      </Typography>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Skills Tags */}
              {j.requiredSkills ? (
                <View style={styles.tagRow}>
                  {j.requiredSkills.split(',').map((skill, i) => (
                    <View key={i} style={styles.tag}>
                      <Typography size={11}>{skill.trim()}</Typography>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Info with Icons */}
              <View style={[styles.infoRow, { marginTop: 15 }]}>
                <Image source={ImageConstant.Location} style={styles.icon} />
                <Typography margin={3} size={14}>
                  {j.location || 'Not Available'}
                </Typography>
              </View>

              {j.compensationDisplay ? (
                <View style={styles.infoRow}>
                  <Image source={ImageConstant.Dollar} style={styles.icon} />
                  <Typography margin={3} size={14} color="#E87C6F" type={Font?.Poppins_SemiBold}>
                    {j.compensationDisplay}
                  </Typography>
                </View>
              ) : null}

              {j.preferredHours ? (
                <View style={styles.infoRow}>
                  <Image source={ImageConstant.Calendar} style={styles.icon} />
                  <Typography margin={3} size={14}>
                    {j.preferredHours}
                  </Typography>
                </View>
              ) : null}

              {j.description ? (
                <Typography size={12} color="#666" style={{ marginTop: 8, marginBottom: 15, paddingHorizontal: 4 }}>
                  {j.description.length > 120 ? j.description.substring(0, 120) + '...' : j.description}
                </Typography>
              ) : null}

              <Button
                title={'View Details'}
                style={{ width: '90%', margin: 'auto' }}
                onPress={() => navigation.navigate('JobDetails', { jobId: j.id })}
              />
            </View>
          ))}
        </>
      )}
      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Typography type={Font?.Poppins_SemiBold} size={16} style={{ marginBottom: 16 }}>
              Location
            </Typography>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter Area, City or Pincode"
              value={locationInput}
              onChangeText={setLocationInput}
              keyboardType="default"
              autoFocus
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.resetBtn, { marginRight: 10 }]}
                onPress={() => {
                  setLocationInput('');
                  setFilterLocation('');
                  setShowLocationModal(false);
                }}
              >
                <Typography color="#000" type={Font?.Poppins_Medium} size={14}>
                  Clear
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setFilterLocation(locationInput.trim());
                  setShowLocationModal(false);
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

export default AIJobResults;

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
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commitmentBadge: {
    backgroundColor: '#FFF0EE',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
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
