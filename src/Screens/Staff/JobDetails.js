import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import Button from '../../Component/Button';
import { ImageConstant } from '../../Constants/ImageConstant';
import LocalizedStrings from '../../Constants/localization';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../Backend/Backend';
import { ListJob, Apply_Job, SUBSCRIPTION_USER_CURRENT } from '../../Backend/api_routes';
import { useIsFocused } from '@react-navigation/native';
import Input from '../../Component/Input';
import Date_Picker from '../../Component/Date_Picker';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';

const JobDetails = ({ navigation, route }) => {
  const jobId = route?.params?.jobId;
  const jobStatus = route?.params?.jobStatus;

  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  // Apply Job Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availableFrom, setAvailableFrom] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyErrors, setApplyErrors] = useState({
    expectedSalary: '',
    availableFrom: '',
  });

  const fetchJobDetails = useCallback(() => {
    setLoading(true);
    GET_WITH_TOKEN(
      `${ListJob}/${jobId}`,
      success => {
        setJobData(success?.data);
        setLoading(false);
      },
      error => {
        setLoading(false);
      },
      fail => {
        setLoading(false);
      },
    );
  }, [jobId]);

  useEffect(() => {
    if (isFocused && jobId) {
      fetchJobDetails();
    }
  }, [fetchJobDetails, isFocused, jobId]);

  // Format compensation display
  const formatCompensation = job => {
    if (job?.compensation && job?.compensation_type) {
      return `\u20B9${job.compensation} / ${job.compensation_type}`;
    }
    return job?.expected_compensation ? `\u20B9${job.expected_compensation}` : 'Not Found';
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

  // Parse requirements from job data
  const getRequirements = job => {
    const requirements = [];
    if (job?.required_skills) {
      const skills = job.required_skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      requirements.push(...skills);
    }
    if (job?.additional_requirements) {
      requirements.push(job.additional_requirements);
    }
    // Add skills from boolean flags
    if (job?.childcare_experience) requirements.push('Childcare Experience');
    if (job?.cooking_required) requirements.push('Cooking');
    if (job?.driving_license_required) requirements.push('Driving License');
    if (job?.first_aid_certified) requirements.push('First Aid Certified');
    if (job?.pet_care_required) requirements.push('Pet Care');
    return requirements.length > 0
      ? requirements
      : ['No specific requirements listed'];
  };

  // Format working hours
  const formatWorkingHours = job => {
    if (job?.preferred_hours) {
      return job.preferred_hours;
    }
    if (job?.commitment_type) {
      return (
        job.commitment_type.charAt(0).toUpperCase() +
        job.commitment_type.slice(1)
      );
    }
    return 'Not specified';
  };

  const getOwnerResidenceSummary = job => {
    const owner = job?.owner_summary || {};
    const location = [owner.locality, owner.city, owner.state].filter(Boolean).join(', ');

    return [
      { label: 'Owner Name', value: owner.name || 'Not specified' },
      { label: 'Residence Type', value: owner.residence_type || 'Not specified' },
      { label: 'Number of Rooms', value: owner.number_of_rooms ? String(owner.number_of_rooms) : 'Not specified' },
      { label: 'Area', value: location || 'Not specified' },
    ];
  };

  // Handle Apply Job — requires an active membership. If free plan is exhausted
  // (no active subscription), route staff to the membership plan screen.
  const handleApplyJob = () => {
    if (Number(jobStatus) === 1) {
      SimpleToast.show('You have already applied for this job.',
        SimpleToast.SHORT,
      );
      return;
    }
    GET_WITH_TOKEN(
      SUBSCRIPTION_USER_CURRENT,
      success => {
        const subscription = success?.data || success?.subscription;
        const hasActiveSubscription = success?.is_active &&
          subscription &&
          (Array.isArray(subscription) ? subscription.length > 0 : true);
        if (hasActiveSubscription) {
          setShowApplyModal(true);
        } else {
          SimpleToast.show(
            'Your free plan is over. Please purchase a membership to apply for jobs.',
            SimpleToast.LONG,
          );
          navigation.navigate('ChoosePlan', { userType: 2 });
        }
      },
      () => {
        SimpleToast.show(
          'Please purchase a membership to apply for jobs.',
          SimpleToast.LONG,
        );
        navigation.navigate('ChoosePlan', { userType: 2 });
      },
      () => {
        navigation.navigate('ChoosePlan', { userType: 2 });
      },
    );
  };

  const handleCloseModal = () => {
    setShowApplyModal(false);
    setExpectedSalary('');
    setAvailableFrom(null);
    setApplyErrors({
      expectedSalary: '',
      availableFrom: '',
    });
  };

  const handleSubmitApplication = () => {
    // Validation
    const errors = {
      expectedSalary: '',
      availableFrom: '',
    };
    let hasError = false;

    if (!expectedSalary || expectedSalary.trim() === '') {
      errors.expectedSalary = 'Please enter expected salary';
      hasError = true;
    } else {
      const salaryNum = parseFloat(expectedSalary);
      if (isNaN(salaryNum) || salaryNum <= 0) {
        errors.expectedSalary =
          'Expected salary must be a valid number greater than 0';
        hasError = true;
      }
    }

    if (!availableFrom) {
      errors.availableFrom = 'Please select available from date';
      hasError = true;
    }

    setApplyErrors(errors);

    if (hasError) {
      return;
    }

    setApplyLoading(true);
    const formData = new FormData();
    formData.append('job_id', jobId.toString());
    formData.append('expected_salary', expectedSalary.trim());
    formData.append('cover_letter', 'Not applicable');

    // Format date to YYYY-MM-DD
    if (availableFrom) {
      const formattedDate = moment(availableFrom).format('YYYY-MM-DD');
      formData.append('available_from', formattedDate);
    }
    console.log('Applying for job with data:', JSON.stringify({
      job_id: jobId,
      expected_salary: expectedSalary.trim(),
      available_from: moment(availableFrom).format('YYYY-MM-DD'),
    }));

    POST_FORM_DATA(
      Apply_Job,
      formData,
      success => {
        SimpleToast.show(
          success?.message || 'Application submitted successfully!',
          SimpleToast.SHORT,
        );
        setApplyLoading(false);
        handleCloseModal();
        navigation?.goBack();
      },
      error => {
        console.log('Apply job error:', JSON.stringify(error));
        // Show specific validation errors
        const validationErrors = error?.errors || error?.data?.errors;
        if (validationErrors && typeof validationErrors === 'object') {
          const fieldErrors = Object.entries(validationErrors)
            .map(([field, messages]) => {
              const msg = Array.isArray(messages) ? messages[0] : messages;
              return `${field}: ${msg}`;
            })
            .join('\n');
          console.log('Validation errors:', fieldErrors);
          SimpleToast.show(fieldErrors, SimpleToast.LONG);
        } else {
          SimpleToast.show(
            error?.message || 'Failed to submit application',
            SimpleToast.SHORT,
          );
        }
        setApplyLoading(false);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        setApplyLoading(false);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={
          LocalizedStrings.staffSection?.JobDetails?.title || 'Job Details'
        }
        onPressLeftIcon={() => navigation?.goBack()}
        source_arrow={ImageConstant?.BackArrow}
        style_title={{ fontSize: 18 }}
        source_logo={ImageConstant?.notification}
        // Profile_icon={ImageConstant?.user}
        onPressRightIcon={() => navigation.navigate('Notifications')}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E87C6F" />
        </View>
      ) : jobData ? (
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <View style={styles.card}>
            <Typography type={Font.Poppins_SemiBold} style={styles.title}>
              {jobData.title || 'Job Title'}
            </Typography>
            <View style={styles.headerRow}>
              <View style={styles.iconCircle}>
                <Image
                  source={ImageConstant.Briefcase}
                  style={{ height: 24, width: 24, tintColor: '#D98579' }}
                />
              </View>
              <View style={styles.headerInfo}>
                <View style={styles.locationRow}>
                  <Image
                    source={ImageConstant.Location}
                    style={{
                      height: 16,
                      width: 14,
                      tintColor: '#8C8D8B',
                      marginRight: 6,
                    }}
                  />
                  <Typography
                    type={Font.Poppins_Regular}
                    style={styles.location}
                  >
                    {formatLocation(jobData)}
                  </Typography>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.infoBox, { marginRight: 6 }]}>
              <View style={styles.iconContainer}>
                <Image
                  source={ImageConstant.Dollar}
                  style={{ height: 24, width: 24, tintColor: '#FF9900' }}
                />
              </View>
              <Typography type={Font.Poppins_SemiBold} style={styles.infoValue}>
                {formatCompensation(jobData)}
              </Typography>
              <Typography type={Font.Poppins_Regular} style={styles.infoLabel}>
                {LocalizedStrings.staffSection?.JobDetails?.offered_salary ||
                  'Offered Salary'}
              </Typography>
            </View>
            <View style={[styles.infoBox, { marginLeft: 6 }]}>
              <View style={styles.iconContainer}>
                <Image
                  source={ImageConstant.Calendar}
                  style={{ height: 24, width: 24, tintColor: '#D98579' }}
                />
              </View>
              <Typography
                type={Font.Poppins_SemiBold}
                style={styles.infoValue}
                numberOfLines={2}
              >
                {formatWorkingHours(jobData)}
              </Typography>
              <Typography type={Font.Poppins_Regular} style={styles.infoLabel}>
                {LocalizedStrings.staffSection?.JobDetails?.working_hours ||
                  'Working Hours'}
              </Typography>
            </View>
          </View>

          {jobData?.stay_type && (
            <View style={[styles.infoRow, { marginTop: 0 }]}>
              <View style={[styles.infoBox, { width: '100%', marginBottom: 15 }]}>
                <View style={styles.iconCircle}>
                  <Image
                    source={ImageConstant.Briefcase}
                    style={{ height: 24, width: 24, tintColor: '#D98579' }}
                  />
                </View>
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={[styles.infoValue, { textTransform: 'capitalize' }]}
                  numberOfLines={2}
                >
                  {jobData.stay_type === 'come_and_go' ? 'Come and Go' : 'Inhouse'}
                </Typography>
                <Typography type={Font.Poppins_Regular} style={styles.infoLabel}>
                  Stay Type
                </Typography>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Image
                source={ImageConstant.lines}
                style={{
                  height: 20,
                  width: 18,
                  tintColor: '#4CAE4F',
                  marginRight: 10,
                }}
              />
              <Typography
                type={Font.Poppins_SemiBold}
                style={styles.sectionTitle}
              >
                {LocalizedStrings.staffSection?.JobDetails?.job_description ||
                  'Job Description'}
              </Typography>
            </View>
            <Typography type={Font.Poppins_Regular} style={styles.description}>
              {jobData.description || 'No description available'}
            </Typography>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Image
                  source={ImageConstant.Home}
                style={{
                  height: 20,
                  width: 20,
                  tintColor: '#D98579',
                  marginRight: 10,
                }}
              />
              <Typography
                type={Font.Poppins_SemiBold}
                style={styles.sectionTitle}
              >
                Owner Residence Summary
              </Typography>
            </View>

            {getOwnerResidenceSummary(jobData).map(item => (
              <View key={item.label} style={styles.summaryRow}>
                <Typography type={Font.Poppins_Medium} style={styles.summaryLabel}>
                  {item.label}
                </Typography>
                <Typography type={Font.Poppins_Regular} style={styles.summaryValue}>
                  {item.value}
                </Typography>
              </View>
            ))}
          </View>

          {getRequirements(jobData).length > 0 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Image
                  source={ImageConstant.lines}
                  style={{
                    height: 20,
                    width: 18,
                    tintColor: '#4CAE4F',
                    marginRight: 10,
                  }}
                />
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={styles.sectionTitle}
                >
                  {LocalizedStrings.staffSection?.JobDetails
                    ?.specific_requirements || 'Specific Requirements'}
                </Typography>
              </View>

              {getRequirements(jobData).map((requirement, index) => (
                <View key={`${requirement}-${index}`} style={styles.reqRow}>
                  <View style={styles.dot} />
                  <Typography type={Font.Poppins_Regular} style={styles.reqText}>
                    {requirement}
                  </Typography>
                </View>
              ))}
            </View>
          )}

          <Button
            title={
              LocalizedStrings.staffSection?.JobDetails?.apply_now ||
              'Apply Now'
            }
            style={styles.applyBtn}
            textStyle={styles.applyText}
            onPress={handleApplyJob}
          />
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Typography type={Font.Poppins_Regular} style={styles.errorText}>
            Job details not found
          </Typography>
        </View>
      )}

      {/* Apply Job Modal */}
      <Modal
        transparent={true}
        visible={showApplyModal}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography
                type={Font.Poppins_SemiBold}
                style={styles.modalTitle}
              >
                Apply for Job
              </Typography>
              <TouchableOpacity onPress={handleCloseModal}>
                <Image
                  source={ImageConstant.close}
                  style={{ height: 16, width: 16, tintColor: '#666' }}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              <Input
                title="Expected Salary"
                value={expectedSalary}
                onChange={value => {
                  setExpectedSalary(value);
                  if (applyErrors.expectedSalary) {
                    setApplyErrors(prev => ({ ...prev, expectedSalary: '' }));
                  }
                }}
                keyboardType="numeric"
                error={applyErrors.expectedSalary}
              />

              <Date_Picker
                title="Available From"
                placeholder="Select Date"
                selected_date={availableFrom}
                onConfirm={date => {
                  setAvailableFrom(date);
                  if (applyErrors.availableFrom) {
                    setApplyErrors(prev => ({ ...prev, availableFrom: '' }));
                  }
                }}
                allowFutureDates={true}
                disablePastDates={true}
                error={applyErrors.availableFrom}
              />

              <Button
                title={applyLoading ? 'Submitting...' : 'Submit Application'}
                onPress={handleSubmitApplication}
                style={styles.submitBtn}
                textStyle={styles.submitBtnText}
                disabled={applyLoading}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </CommanView>
  );
};

export default JobDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    color: '#222',
    marginBottom: 12,
    lineHeight: 26,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  iconContainer: {
    marginBottom: 10,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 22,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#222',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginTop: 4,
  },
  summaryRow: {
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    color: '#222',
    lineHeight: 21,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E87C6F',
    marginRight: 12,
    marginTop: 6,
  },
  reqText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  applyBtn: {
    backgroundColor: '#E87C6F',
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applyText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEA',
  },
  modalTitle: {
    fontSize: 20,
    color: '#222',
  },
  modalScrollView: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: '#E87C6F',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
