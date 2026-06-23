import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import Button from '../../Component/Button';
import { ImageConstant } from '../../Constants/ImageConstant';
import LocalizedStrings from '../../Constants/localization';
import { GET_WITH_TOKEN } from '../../Backend/Backend';
import { ListJob } from '../../Backend/api_routes';
import { useIsFocused } from '@react-navigation/native';
import EmptyView from '../../Component/UI/EmptyView';
import { useSelector } from 'react-redux';

const SORT_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Title (A-Z)', value: 'title_asc' },
  { label: 'Title (Z-A)', value: 'title_desc' },
  { label: 'Salary (High to Low)', value: 'salary_desc' },
  { label: 'Salary (Low to High)', value: 'salary_asc' },
];

const JobsList = ({ navigation }) => {
  const [jobData, setJobData] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const userDetail = useSelector(state => state?.userDetails);

  const [searchText, setSearchText] = useState('');
  const [selectedSort, setSelectedSort] = useState('default');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedCompTypes, setSelectedCompTypes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get staff's primary role and location from profile
  const staffRole = (() => {
    const role = userDetail?.user_work_info?.primary_role;
    if (Array.isArray(role)) return role[0] || '';
    return role || '';
  })();
  const staffCity = userDetail?.addresses?.[0]?.city || userDetail?.city || '';
  const staffState = userDetail?.addresses?.[0]?.state || userDetail?.state || '';

  useEffect(() => {
    if (isFocused) {
      JobList();
    }
  }, [isFocused]);

  const JobList = () => {
    setLoading(true);

    // Build query params for role + location based filtering
    let route = ListJob;
    const params = [];
    if (staffRole) params.push(`role=${encodeURIComponent(staffRole)}`);
    if (staffCity) params.push(`city=${encodeURIComponent(staffCity)}`);
    if (staffState) params.push(`state=${encodeURIComponent(staffState)}`);
    if (params.length > 0) route = `${ListJob}?${params.join('&')}`;

    GET_WITH_TOKEN(
      route,
      success => {
        const rawData = success?.data;
        const jobs = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        const allJobs = Array.isArray(jobs) ? jobs : [];

        // Client-side fallback filter by role and location
        const filtered = allJobs.filter(job => {
          const jobTitle = (job?.title || job?.role || '').toLowerCase();
          const jobCity = (job?.city || '').toLowerCase();
          const jobState = (job?.state || '').toLowerCase();

          const roleMatch = staffRole
            ? jobTitle.includes(staffRole.toLowerCase()) || staffRole.toLowerCase().includes(jobTitle)
            : true;
          const locationMatch = (staffCity || staffState)
            ? jobCity.includes(staffCity.toLowerCase()) ||
              jobState.includes(staffState.toLowerCase()) ||
              (staffCity && jobCity.includes(staffCity.toLowerCase())) ||
              (staffState && jobState.includes(staffState.toLowerCase()))
            : true;

          return roleMatch && locationMatch;
        });

        // If filtered results exist use them, else show all (graceful fallback)
        setJobData(filtered.length > 0 ? filtered : allJobs);
        setLoading(false);
      },
      error => {
        setLoading(false);
      },
      fail => {
        setLoading(false);
      },
    );
  };

  // Extract unique locations and compensation types for filter options
  const getFilterOptions = () => {
    const locations = [];
    const compTypes = [];
    jobData.forEach(job => {
      const loc = job?.city || job?.state;
      if (loc && !locations.includes(loc)) {
        locations.push(loc);
      }
      const ct = job?.compensation_type;
      if (ct && !compTypes.includes(ct)) {
        compTypes.push(ct);
      }
    });
    return { locations, compTypes };
  };
  const filterOptions = getFilterOptions();

  // Filtered and sorted jobs
  const getFilteredJobs = () => {
    let result = [...jobData];

    // Search filter
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      result = result.filter(job => {
        const title = (job?.title || '').toLowerCase();
        const city = (job?.city || '').toLowerCase();
        const state = (job?.state || '').toLowerCase();
        const desc = (job?.description || '').toLowerCase();
        return title.includes(query) || city.includes(query) || state.includes(query) || desc.includes(query);
      });
    }

    // Location filter
    if (selectedLocations.length > 0) {
      result = result.filter(job => {
        const loc = job?.city || job?.state || '';
        return selectedLocations.includes(loc);
      });
    }

    // Compensation type filter
    if (selectedCompTypes.length > 0) {
      result = result.filter(job => {
        return selectedCompTypes.includes(job?.compensation_type);
      });
    }

    // Sort
    if (selectedSort === 'title_asc') {
      result.sort((a, b) => (a?.title || '').localeCompare(b?.title || ''));
    } else if (selectedSort === 'title_desc') {
      result.sort((a, b) => (b?.title || '').localeCompare(a?.title || ''));
    } else if (selectedSort === 'salary_desc') {
      result.sort((a, b) => {
        const salA = Number(a?.expected_compensation || a?.compensation || 0);
        const salB = Number(b?.expected_compensation || b?.compensation || 0);
        return salB - salA;
      });
    } else if (selectedSort === 'salary_asc') {
      result.sort((a, b) => {
        const salA = Number(a?.expected_compensation || a?.compensation || 0);
        const salB = Number(b?.expected_compensation || b?.compensation || 0);
        return salA - salB;
      });
    }

    return result;
  };
  const filteredJobs = getFilteredJobs();

  // Format compensation display
  const formatCompensation = job => {
    const amount = job?.expected_compensation || job?.compensation;
    if (amount && job?.compensation_type) {
      return `₹${amount} / ${job.compensation_type}`;
    }
    return amount ? `₹${amount}` : 'Not Found';
  };

  // Format location display
  const formatLocation = job => {
    if (job?.city && job?.state) {
      return `${job.city}, ${job.state}`;
    }
    return (
      job?.city || job?.state || job?.street_address || 'Location not specified'
    );
  };

  // Get description preview
  const getDescriptionPreview = description => {
    if (!description) return 'No description available...';
    return description.length > 50
      ? description.substring(0, 50) + '...'
      : description;
  };

  const toggleLocation = (loc) => {
    setSelectedLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc],
    );
  };

  const toggleCompType = (ct) => {
    setSelectedCompTypes(prev =>
      prev.includes(ct) ? prev.filter(c => c !== ct) : [...prev, ct],
    );
  };

  const clearFilters = () => {
    setSelectedLocations([]);
    setSelectedCompTypes([]);
    setShowFilterModal(false);
  };

  const hasActiveFilters = selectedLocations.length > 0 || selectedCompTypes.length > 0;

  // Split jobs into featured (first 4) and recent (rest)
  const jobsFeatured = filteredJobs.slice(0, 4);
  const jobsRecent = filteredJobs.slice(4);

  const renderJobCard = (job) => (
    <View key={job.id} style={styles.jobCard}>
      <View style={styles.iconCircle}>
        <Image
          source={ImageConstant.Briefcase}
          style={{ height: 20, width: 20, tintColor: '#FF5833' }}
        />
      </View>
      <Typography
        type={Font.Poppins_SemiBold}
        style={styles.jobTitle}
      >
        {job.title}
      </Typography>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 7,
        }}
      >
        <Image
          source={ImageConstant.Location}
          style={{ height: 15, width: 13, marginRight: 5 }}
        />
        <Typography
          type={Font.Poppins_Regular}
          style={styles.jobLocation}
        >
          {formatLocation(job)}
        </Typography>
      </View>
      {job.stay_type && (
        <Typography type={Font.Poppins_Medium} style={{fontSize: 12, color: '#D98579', marginBottom: 5, textAlign: 'center'}}>
          {job.stay_type === 'come_and_go' ? 'Come and Go' : 'Inhouse'}
        </Typography>
      )}
      <Typography type={Font.Poppins_Bold} style={styles.jobPay}>
        {formatCompensation(job)}
      </Typography>
      <Typography
        type={Font.Poppins_Regular}
        style={styles.jobLocation}
      >
        {getDescriptionPreview(job.description)}
      </Typography>
      <Button
        title={
          LocalizedStrings.staffSection?.ActiveJobs
            ?.view_details || 'View Details'
        }
        style={styles.button}
        textStyle={styles.buttonText}
        onPress={() =>
          navigation.navigate('JobDetails', {
            jobId: job.id,
            jobStatus: job?.is_applied,
          })
        }
      />
    </View>
  );

  return (
    <CommanView>
      <HeaderForUser
        title={
          LocalizedStrings.staffSection?.ActiveJobs?.title || 'Active Jobs'
        }
        onPressLeftIcon={() => navigation?.goBack()}
        source_arrow={ImageConstant?.BackArrow}
        style_title={{ fontSize: 18 }}
        source_logo={ImageConstant?.notification}
        onPressRightIcon={() => navigation.navigate('Notifications')}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E87C6F" />
        </View>
      ) : jobData.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <EmptyView
            title={
              LocalizedStrings.staffSection?.ActiveJobs?.no_jobs ||
              'No Jobs Available'
            }
            description={
              LocalizedStrings.staffSection?.ActiveJobs?.no_jobs_desc ||
              'There are no job listings available at the moment. Please check back later.'
            }
            icon={ImageConstant?.joblisting}
            iconColor="#D98579"
          />
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View style={styles.searchRow}>
            <TextInput
              placeholder={
                LocalizedStrings.staffSection?.ActiveJobs?.search_placeholder ||
                'Search for roles...'
              }
              placeholderTextColor="#888"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity
              style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <Typography type={Font.Poppins_Medium} style={[styles.filterText, hasActiveFilters && styles.filterTextActive]}>
                {LocalizedStrings.staffSection?.ActiveJobs?.filter || 'Filter'}
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, selectedSort !== 'default' && styles.filterBtnActive]}
              onPress={() => setShowSortModal(true)}
            >
              <Typography type={Font.Poppins_Medium} style={[styles.filterText, selectedSort !== 'default' && styles.filterTextActive]}>
                {LocalizedStrings.staffSection?.ActiveJobs?.sort || 'Sort'}
              </Typography>
            </TouchableOpacity>
          </View>

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
            {hasActiveFilters && (
              <View style={styles.filterActiveDot} />
            )}
          </TouchableOpacity>

          {showFilters && (
            <View style={styles.inlineFilterCard}>
               <Typography type={Font.Poppins_SemiBold} size={15} style={{ marginBottom: 10 }}>
                  Quick Filters
               </Typography>
               <View style={styles.chipContainer}>
                  {filterOptions.locations.map(loc => (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.chip,
                        selectedLocations.includes(loc) && styles.chipActive,
                      ]}
                      onPress={() => toggleLocation(loc)}
                    >
                      <Typography
                        type={Font.Poppins_Regular}
                        size={12}
                        color={selectedLocations.includes(loc) ? '#fff' : '#333'}
                      >
                        {loc}
                      </Typography>
                    </TouchableOpacity>
                  ))}
               </View>
               <View style={styles.chipContainer}>
                  {filterOptions.compTypes.map(ct => (
                    <TouchableOpacity
                      key={ct}
                      style={[
                        styles.chip,
                        selectedCompTypes.includes(ct) && styles.chipActive,
                      ]}
                      onPress={() => toggleCompType(ct)}
                    >
                      <Typography
                        type={Font.Poppins_Regular}
                        size={12}
                        color={selectedCompTypes.includes(ct) ? '#fff' : '#333'}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {ct}
                      </Typography>
                    </TouchableOpacity>
                  ))}
               </View>
               {hasActiveFilters && (
                 <TouchableOpacity 
                   style={{ alignSelf: 'flex-end', marginTop: 5 }} 
                   onPress={clearFilters}
                 >
                    <Typography color="#D98579" size={12} type={Font.Poppins_Medium}>Clear Filters</Typography>
                 </TouchableOpacity>
               )}
            </View>
          )}

          {filteredJobs.length === 0 ? (
            <View style={styles.noResultsWrapper}>
              <Typography type={Font.Poppins_Medium} size={15} color="#999">
                No jobs match your search
              </Typography>
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => {
                  setSearchText('');
                  clearFilters();
                  setSelectedSort('default');
                }}
              >
                <Typography type={Font.Poppins_Medium} size={14} color="#E87C6F">
                  Clear All
                </Typography>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {jobsFeatured.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Typography
                      type={Font.Poppins_Bold}
                      style={styles.sectionTitle}
                    >
                      {LocalizedStrings.staffSection?.ActiveJobs?.featured_jobs ||
                        'Featured Jobs'}
                    </Typography>
                  </View>

                  <View style={styles.grid}>
                    {jobsFeatured.map(renderJobCard)}
                  </View>
                </>
              )}

              {jobsRecent.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Typography
                      type={Font.Poppins_Bold}
                      style={styles.sectionTitle}
                    >
                      {LocalizedStrings.staffSection?.ActiveJobs?.recently_added ||
                        'Recently Added'}
                    </Typography>
                  </View>
                  <View style={styles.grid}>
                    {jobsRecent.map(renderJobCard)}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Typography type={Font.Poppins_SemiBold} size={17} style={styles.modalTitle}>
              Sort By
            </Typography>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  selectedSort === option.value && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSelectedSort(option.value);
                  setShowSortModal(false);
                }}
              >
                <Typography
                  type={selectedSort === option.value ? Font.Poppins_SemiBold : Font.Poppins_Regular}
                  size={14}
                  color={selectedSort === option.value ? '#E87C6F' : '#333'}
                >
                  {option.label}
                </Typography>
                {selectedSort === option.value && (
                  <View style={styles.radioSelected} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Typography type={Font.Poppins_SemiBold} size={17}>
                Filter Jobs
              </Typography>
              {hasActiveFilters && (
                <TouchableOpacity onPress={clearFilters}>
                  <Typography type={Font.Poppins_Medium} size={13} color="#E87C6F">
                    Clear All
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            {filterOptions.locations.length > 0 && (
              <>
                <Typography type={Font.Poppins_SemiBold} size={14} style={styles.filterSectionTitle}>
                  Location
                </Typography>
                <View style={styles.chipContainer}>
                  {filterOptions.locations.map(loc => (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.chip,
                        selectedLocations.includes(loc) && styles.chipActive,
                      ]}
                      onPress={() => toggleLocation(loc)}
                    >
                      <Typography
                        type={Font.Poppins_Regular}
                        size={13}
                        color={selectedLocations.includes(loc) ? '#fff' : '#333'}
                      >
                        {loc}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {filterOptions.compTypes.length > 0 && (
              <>
                <Typography type={Font.Poppins_SemiBold} size={14} style={styles.filterSectionTitle}>
                  Pay Type
                </Typography>
                <View style={styles.chipContainer}>
                  {filterOptions.compTypes.map(ct => (
                    <TouchableOpacity
                      key={ct}
                      style={[
                        styles.chip,
                        selectedCompTypes.includes(ct) && styles.chipActive,
                      ]}
                      onPress={() => toggleCompType(ct)}
                    >
                      <Typography
                        type={Font.Poppins_Regular}
                        size={13}
                        color={selectedCompTypes.includes(ct) ? '#fff' : '#333'}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {ct}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {filterOptions.locations.length === 0 && filterOptions.compTypes.length === 0 && (
              <Typography type={Font.Poppins_Regular} size={14} color="#999" style={{ textAlign: 'center', marginVertical: 20 }}>
                No filter options available
              </Typography>
            )}

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => setShowFilterModal(false)}
            >
              <Typography type={Font.Poppins_SemiBold} size={14} color="#fff">
                Apply Filters
              </Typography>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </CommanView>
  );
};

export default JobsList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    height: 40,
    marginRight: 8,
    fontFamily: Font.Poppins_Regular,
    color: '#333',
  },
  filterBtn: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 5,
  },
  filterBtnActive: {
    backgroundColor: '#E87C6F',
  },
  filterText: {
    fontSize: 13,
    color: '#333',
  },
  filterTextActive: {
    color: '#fff',
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
    marginTop: 8,
    marginBottom: 10,
  },
  filterActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D98579',
    marginLeft: 6,
  },
  inlineFilterCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#333',
  },
  viewAll: {
    fontSize: 13,
    color: '#E87C6F',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  jobCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFECE9',
    alignSelf: 'center',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 17,
    color: '#222',
    textAlign: 'center',
  },
  jobPay: {
    fontSize: 18,
    color: '#E87C6F',
    marginVertical: 2,
    textTransform: 'capitalize',
  },
  jobLocation: {
    fontSize: 12,
    color: 'gray',
  },
  button: {
    backgroundColor: '#E87C6F',
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 6,
    height: 37,
    width: '90%',
  },
  buttonText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsWrapper: {
    alignItems: 'center',
    marginTop: 60,
  },
  clearSearchBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E87C6F',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    marginBottom: 16,
    color: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  sortOptionActive: {
    backgroundColor: '#FFF0EE',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E87C6F',
  },
  filterSectionTitle: {
    color: '#333',
    marginBottom: 10,
    marginTop: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipActive: {
    backgroundColor: '#E87C6F',
    borderColor: '#E87C6F',
  },
  applyFilterBtn: {
    backgroundColor: '#E87C6F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
});
