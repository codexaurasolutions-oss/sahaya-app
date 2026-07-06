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
import { GET_WITH_TOKEN, POST_FORM_DATA, POST_WITH_TOKEN } from '../../Backend/Backend';
import { ListJob, Apply_Job, SUBSCRIPTION_USER_CURRENT, JOB_LIMIT_STATUS, JOB_LIMIT_CREATE_ORDER, JOB_LIMIT_VERIFY_PAYMENT } from '../../Backend/api_routes';
import { initiatePayment } from '../../Services/RazorpayService';
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

  // Credit System States
  const [limitExceededModalVisible, setLimitExceededModalVisible] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [payingLimit, setPayingLimit] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [creditsToBuy, setCreditsToBuy] = useState(10);

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

  // Handle Apply Job with credit balance check
  const handleApplyJob = () => {
    if (Number(jobStatus) === 1) {
      SimpleToast.show('You have already applied for this job.',
        SimpleToast.SHORT,
      );
      return;
    }

    setCheckingLimit(true);
    GET_WITH_TOKEN(
      JOB_LIMIT_STATUS,
      success => {
        setCheckingLimit(false);
        if (success?.status === 'success') {
          const limitData = success?.data;
          setLimitInfo(limitData);
          if (!limitData?.can_apply) {
            setLimitExceededModalVisible(true);
          } else {
            setShowApplyModal(true);
          }
        } else {
          SimpleToast.show(success?.message || 'Failed to check credit balance.', SimpleToast.SHORT);
        }
      },
      error => {
        setCheckingLimit(false);
        SimpleToast.show('Error checking credit balance. Please try again.', SimpleToast.SHORT);
      },
      fail => {
        setCheckingLimit(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      }
    );
  };

  const handlePurchaseLimit = () => {
    if (payingLimit) return;
    if (!creditsToBuy || parseInt(creditsToBuy, 10) < 1) {
      SimpleToast.show('Please enter valid credits to purchase', SimpleToast.SHORT);
      return;
    }
    setPayingLimit(true);

    POST_WITH_TOKEN(
      JOB_LIMIT_CREATE_ORDER,
      { credits_to_purchase: parseInt(creditsToBuy, 10) },
      async success => {
        if (success?.status === 'success') {
          const order = success?.data;
          const options = {
            amount: order.amount,
            currency: order.currency,
            name: 'Sahayya',
            description: order.description || `${creditsToBuy} Job Application Credits`,
            orderId: order.order_id,
            prefill: {
              name: order.prefill_name || '',
              email: order.prefill_email || '',
              contact: order.prefill_contact || '',
            },
            theme: { color: '#0d6efd' }
          };

          try {
            const paymentResult = await initiatePayment(options);
            if (paymentResult.success) {
              POST_WITH_TOKEN(
                JOB_LIMIT_VERIFY_PAYMENT,
                {
                  razorpay_order_id: paymentResult.orderId,
                  razorpay_payment_id: paymentResult.paymentId,
                  razorpay_signature: paymentResult.signature,
                  credits_to_purchase: parseInt(creditsToBuy, 10),
                },
                verifySuccess => {
                  setPayingLimit(false);
                  if (verifySuccess?.status === 'success') {
                    SimpleToast.show(`${creditsToBuy} credits purchased successfully!`, SimpleToast.LONG);
                    setLimitExceededModalVisible(false);
                    setShowApplyModal(true);
                  } else {
                    SimpleToast.show(verifySuccess?.message || 'Payment verification failed.', SimpleToast.LONG);
                  }
                },
                verifyError => {
                  setPayingLimit(false);
                  SimpleToast.show('Verification failed. Please contact support.', SimpleToast.LONG);
                }
              );
            } else {
              setPayingLimit(false);
              SimpleToast.show(paymentResult.description || 'Payment cancelled.', SimpleToast.SHORT);
            }
          } catch (paymentErr) {
            setPayingLimit(false);
            SimpleToast.show('Payment execution error.', SimpleToast.SHORT);
          }
        } else {
          setPayingLimit(false);
          SimpleToast.show(success?.message || 'Failed to initialize payment.', SimpleToast.SHORT);
        }
      },
      error => {
        setPayingLimit(false);
        SimpleToast.show('Failed to create order on server.', SimpleToast.SHORT);
      }
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
        // Handle insufficient credits — show purchase modal
        if (error?.status === 'insufficient_credits' || error?.message?.includes('insufficient')) {
          setLimitInfo(error?.data || error);
          setLimitExceededModalVisible(true);
          setApplyLoading(false);
          return;
        }
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
              checkingLimit
                ? 'Checking...'
                : (LocalizedStrings.staffSection?.JobDetails?.apply_now || 'Apply Now')
            }
            style={styles.applyBtn}
            textStyle={styles.applyText}
            disabled={checkingLimit}
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

      {/* Insufficient Credits Modal */}
      <Modal
        transparent={true}
        visible={limitExceededModalVisible}
        animationType="fade"
        onRequestClose={() => setLimitExceededModalVisible(false)}
      >
        <View style={styles.limitModalOverlay}>
          <View style={styles.limitModalContent}>
            <View style={styles.limitModalHeader}>
              <Typography type={Font.Poppins_Bold} style={styles.limitTitle}>
                Insufficient Credits
              </Typography>
            </View>

            <View style={styles.limitModalBody}>
              <Typography type={Font.Poppins_Regular} style={styles.limitDescription}>
                You need {limitInfo?.credits_per_job_application || 5} credits to apply for a job.
              </Typography>
              <Typography type={Font.Poppins_Medium} style={styles.limitSubText}>
                Your balance: {limitInfo?.wallet_balance || 0} credits
              </Typography>

              <View style={styles.creditInputRow}>
                <Typography type={Font.Poppins_Regular} style={styles.creditLabel}>
                  Credits to purchase:
                </Typography>
                <Input
                  value={String(creditsToBuy)}
                  onChange={setCreditsToBuy}
                  keyboardType="numeric"
                  style={styles.creditInput}
                />
              </View>

              <Typography type={Font.Poppins_Regular} style={styles.creditTotal}>
                Total: ₹{parseInt(creditsToBuy, 10) * (limitInfo?.credit_purchase_price || 10)}
              </Typography>
            </View>

            <View style={styles.limitBtnContainer}>
              <TouchableOpacity
                style={[styles.limitPayBtn, payingLimit && styles.disabledBtn]}
                disabled={payingLimit}
                onPress={handlePurchaseLimit}
              >
                {payingLimit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Typography type={Font.Poppins_SemiBold} style={styles.limitPayText}>
                    Purchase {creditsToBuy} Credits
                  </Typography>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.limitCancelBtn}
                disabled={payingLimit}
                onPress={() => setLimitExceededModalVisible(false)}
              >
                <Typography type={Font.Poppins_Regular} style={styles.limitCancelText}>
                  Cancel
                </Typography>
              </TouchableOpacity>
            </View>
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
  limitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  limitModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  limitModalHeader: {
    marginBottom: 16,
  },
  limitTitle: {
    fontSize: 22,
    color: '#D9534F',
    textAlign: 'center',
  },
  limitModalBody: {
    alignItems: 'center',
    marginBottom: 24,
  },
  limitDescription: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  limitSubText: {
    fontSize: 15,
    color: '#E87C6F',
    textAlign: 'center',
    lineHeight: 22,
  },
  limitBtnContainer: {
    width: '100%',
    alignItems: 'center',
  },
  limitPayBtn: {
    backgroundColor: '#E87C6F',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  limitPayText: {
    fontSize: 16,
    color: '#fff',
  },
  limitCancelBtn: {
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  limitCancelText: {
    fontSize: 15,
    color: '#888',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  creditInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  creditLabel: {
    fontSize: 14,
    color: '#555',
  },
  creditInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    color: '#333',
    paddingHorizontal: 4,
  },
  creditTotal: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
});
