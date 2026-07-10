import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Colors } from '../../Constants/Colors';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import { EarningSummary as EarningSummaryRoute, myWork, AttendanceStaff } from '../../Backend/api_routes';
import { POST_FORM_DATA, GET_WITH_TOKEN } from '../../Backend/Backend';
import PaymentReceipt from '../../Component/PaymentReceipt';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

const EarningSummary = ({ route }) => {
  const navigation = useNavigation();
  const jobID = route?.params?.id;
  const isFocused = useIsFocused();
  const userDetail = useSelector(store => store?.userDetails);

  const [summary2, setSummary2] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [attendanceSummary, setAttendanceSummary] = useState({ totalWorked: 0, daysInMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() });
  const [advanceBalance, setAdvanceBalance] = useState(0);

  const retryCountRef = useRef(0);
  const retriedJobIdRef = useRef(false);
  const mountedRef = useRef(true);

  const currencySymbol = summary2?.currency_symbol || '\u20B9';

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const fetchAttendanceSummary = (staffId) => {
    if (!staffId) return;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();

    const formData = new FormData();
    formData.append('id', staffId);
    formData.append('month', month);
    formData.append('year', year);

    POST_FORM_DATA(
      AttendanceStaff,
      formData,
      success => {
        if (!mountedRef.current) return;
        const records = success?.data?.attendance || success?.data || [];
        let totalWorked = 0;
        if (Array.isArray(records)) {
          records.forEach(record => {
            const status = record?.status?.toLowerCase();
            if (status === 'present' || status === 'late') {
              totalWorked++;
            }
          });
        }
        setAttendanceSummary({ totalWorked, daysInMonth });
      },
      () => {},
    );
  };

  const fetchAdvanceBalance = () => {
    GET_WITH_TOKEN(
      'my-advances',
      success => {
        if (!mountedRef.current) return;
        const totalRemaining = success?.summary?.total_remaining || 0;
        setAdvanceBalance(totalRemaining);
      },
      () => {},
      () => {},
    );
  };

  const loadEarnings = (id) => {
    const month = getCurrentMonth();
    const hasValidJobId = id !== undefined && id !== null && id !== '' && id !== 'null' && id !== 'undefined' && Number(id) > 0;
    const url = hasValidJobId
      ? `${EarningSummaryRoute}?job_id=${id}&month=${month}`
      : `${EarningSummaryRoute}?month=${month}`;

    GET_WITH_TOKEN(
      url,
      success => {
        if (!mountedRef.current) return;
        setIsLoading(false);
        retryCountRef.current = 0;
        const data = success?.data;
        if (Array.isArray(data) && data.length > 0) {
          setSummary2(data[0]);
        } else if (data && !Array.isArray(data)) {
          setSummary2(data);
        } else {
          setSummary2(null);
        }
      },
      error => {
        if (!mountedRef.current) return;
        const statusCode = error?.status || error?.data?.status;
        const message = error?.data?.message || error?.response?.data?.message || '';

        if (statusCode === 429 && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          setTimeout(() => {
            if (mountedRef.current) loadEarnings(id);
          }, RETRY_DELAY * retryCountRef.current);
          return;
        }

        const validationError = message === 'Validation error';

        if (validationError && hasValidJobId && !retriedJobIdRef.current) {
          retriedJobIdRef.current = true;
          retryCountRef.current = 0;
          setTimeout(() => {
            if (mountedRef.current) loadEarnings(null);
          }, 300);
          return;
        }

        setIsLoading(false);
        if (statusCode === 429) {
          setErrorMessage('Too many requests. Please wait a moment and try again.');
        } else {
          setErrorMessage(message || 'Unable to load earnings right now.');
        }
      },
      () => {
        if (!mountedRef.current) return;
        setIsLoading(false);
      },
    );
  };

  const fetchSummary = () => {
    setIsLoading(true);
    setErrorMessage('');
    retryCountRef.current = 0;
    retriedJobIdRef.current = false;

    if (jobID) {
      loadEarnings(jobID);
    } else {
      GET_WITH_TOKEN(
        myWork,
        success => {
          if (!mountedRef.current) return;
          const data = success?.data;
          const myWorkData = Array.isArray(data) ? data[0] : data;
          const jobApps = success?.jobApplications || myWorkData?.jobApplications || success?.job_applications || [];
          const jobAppsArr = Array.isArray(jobApps) ? jobApps : [];
          const activeJob = jobAppsArr.find(app => {
            const status = (app?.status || app?.application_status || '').toLowerCase();
            return status === 'accepted' || status === 'approved' || status === 'active';
          });
          const resolvedJobId = activeJob?.job_id || myWorkData?.job_id || null;

          if (resolvedJobId) {
            loadEarnings(resolvedJobId);
          } else if (myWorkData) {
            loadEarnings(null);
          } else {
            setIsLoading(false);
            setErrorMessage('No approved jobs found.');
          }
        },
        error => {
          if (!mountedRef.current) return;
          setIsLoading(false);
          const message = error?.data?.message || error?.response?.data?.message || 'Unable to load earnings right now.';
          if ((error?.status === 429 || error?.data?.status === 429) && retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            setTimeout(() => {
              if (mountedRef.current) fetchSummary();
            }, RETRY_DELAY * retryCountRef.current);
            return;
          }
          setErrorMessage(message);
        },
        () => {
          if (!mountedRef.current) return;
          setIsLoading(false);
        },
      );
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchSummary();
      if (userDetail?.id) {
        fetchAttendanceSummary(userDetail.id);
      }
      fetchAdvanceBalance();
    }
  }, [isFocused, jobID, userDetail?.id]);

  const paymentHistory = summary2?.payment_history || [];

  const formatCurrency = amount => {
    if (amount === undefined || amount === null || amount === '') {
      return `${currencySymbol}0`;
    }
    const value = Number(amount);
    if (Number.isNaN(value)) {
      return amount;
    }
    const rounded = Math.round(value);
    return `${currencySymbol}${rounded.toLocaleString('en-IN')}`;
  };

  const formatDate = dateValue => {
    if (!dateValue) return '--';
    const dateObj = new Date(dateValue);
    if (!Number.isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateValue;
  };

  const statusLabel =
    summary2?.payment_status ||
    (summary2 ? 'Paid' : 'Pending');

  const statusStyle =
    statusLabel?.toLowerCase() === 'paid'
      ? styles.statusPaid
      : styles.statusPending;

  const totalPayableAmount =
    Number(summary2?.total_payable_amount) > 0
      ? Number(summary2?.total_payable_amount)
      : 0;

  const staffName = userDetail?.name || (userDetail?.first_name ? `${userDetail.first_name} ${userDetail.last_name || ''}`.trim() : 'Staff Member');
  const employerDisplayName = summary2?.employer || userDetail?.employer_name || userDetail?.added_by_user?.name || (userDetail?.added_by_user?.first_name ? `${userDetail.added_by_user.first_name} ${userDetail.added_by_user.last_name || ''}`.trim() : null) || 'Employer';
  const monthlySalary = Number(summary2?.salary_summary?.current_monthly_salary || 0);
  const advanceRepayment = Number(summary2?.deductions?.advance_repayment?.amount || 0);

  return (
    <CommanView>
      <HeaderForUser
        title="My Salary"
        onPressLeftIcon={() => navigation?.goBack()}
        source_arrow={ImageConstant?.BackArrow}
        style_title={styles.headerTitle}
      />

      <View style={styles.spacing} />

      {isLoading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : (
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Typography size={13} color={Colors.red}>
            {errorMessage}
          </Typography>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSummary}>
            <Typography size={13} color="#fff" type={Font.Poppins_SemiBold}>
              Retry
            </Typography>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Main Salary Card */}
      <View style={styles.mainCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Typography type={Font.Poppins_SemiBold} size={13} color="#666">
            {summary2?.employer || userDetail?.employer_name || 'Employer'}
          </Typography>
          <View style={[styles.statusPill, statusStyle]}>
            <Typography
              type={Font.Poppins_SemiBold}
              size={12}
              color={statusLabel?.toLowerCase() === 'paid' ? '#0F5132' : '#92400E'}
            >
              {statusLabel ? statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1) : 'Pending'}
            </Typography>
          </View>
        </View>

        <Typography type={Font.Poppins_Bold} size={34} color={Colors.black}>
          {formatCurrency(totalPayableAmount)}
        </Typography>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <View>
            <Typography size={11} color="#999">Salary</Typography>
            <Typography type={Font.Poppins_SemiBold} size={13}>
              {formatCurrency(monthlySalary)}/month
            </Typography>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Typography size={11} color="#999">Days Worked</Typography>
            <Typography type={Font.Poppins_SemiBold} size={13} color="#4CAF50">
              {attendanceSummary.totalWorked} of {attendanceSummary.daysInMonth}
            </Typography>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Typography size={11} color="#999">Next Pay</Typography>
            <Typography type={Font.Poppins_SemiBold} size={13}>
              {formatDate(summary2?.payment_date)}
            </Typography>
          </View>
        </View>
      </View>

      {/* Advance Balance (if any) */}
      {advanceBalance > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Typography type={Font.Poppins_SemiBold} size={13} color="#9A3412">
                Advance Taken
              </Typography>
              <Typography size={11} color="#B45309" style={{ marginTop: 2 }}>
                Will be deducted from salary
              </Typography>
            </View>
            <Typography type={Font.Poppins_Bold} size={18} color="#9A3412">
              {formatCurrency(advanceBalance)}
            </Typography>
          </View>
        </View>
      )}

      {/* Simple Earnings Breakdown */}
      <View style={styles.sectionCard}>
        <Typography type={Font.Poppins_SemiBold} size={14} style={{ marginBottom: 12 }}>
          This Month's Salary
        </Typography>

        <View style={styles.breakdownRow}>
          <Typography size={13} color="#666">Base Salary</Typography>
          <Typography type={Font.Poppins_Medium} size={13}>
            {formatCurrency(summary2?.earnings_breakdown?.base_salary?.amount)}
          </Typography>
        </View>

        {Number(summary2?.earnings_breakdown?.performance_bonus?.amount) > 0 && (
          <View style={styles.breakdownRow}>
            <Typography size={13} color="#666">Bonus</Typography>
            <Typography type={Font.Poppins_Medium} size={13} color="#4CAF50">
              +{formatCurrency(summary2?.earnings_breakdown?.performance_bonus?.amount)}
            </Typography>
          </View>
        )}

        {Number(summary2?.earnings_breakdown?.overtime_pay?.amount) > 0 && (
          <View style={styles.breakdownRow}>
            <Typography size={13} color="#666">Overtime</Typography>
            <Typography type={Font.Poppins_Medium} size={13} color="#4CAF50">
              +{formatCurrency(summary2?.earnings_breakdown?.overtime_pay?.amount)}
            </Typography>
          </View>
        )}

        {advanceRepayment > 0 && (
          <View style={styles.breakdownRow}>
            <Typography size={13} color="#666">Advance Deducted</Typography>
            <Typography type={Font.Poppins_Medium} size={13} color={Colors.red}>
              -{formatCurrency(advanceRepayment)}
            </Typography>
          </View>
        )}

        <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12, marginTop: 4 }]}>
          <Typography type={Font.Poppins_SemiBold} size={14}>You Will Receive</Typography>
          <Typography type={Font.Poppins_Bold} size={16} color="#4CAF50">
            {formatCurrency(totalPayableAmount)}
          </Typography>
        </View>
      </View>

      {/* Payment History */}
      <View style={styles.sectionCard}>
        <Typography type={Font.Poppins_SemiBold} size={14} style={{ marginBottom: 12 }}>
          Payment History
        </Typography>
        {paymentHistory.length > 0 ? (
          paymentHistory.map((entry, index) => (
            <TouchableOpacity
              key={`${entry?.month || 'entry'}-${index}`}
              style={[
                styles.historyRow,
                index !== paymentHistory.length - 1 && styles.historyRowBorder,
              ]}
              onPress={() => {
                setSelectedPayment({
                  ...entry,
                  staff_name: summary2?.staff_name || staffName,
                  salary_period: entry?.month,
                  monthly_salary: summary2?.salary_summary?.current_monthly_salary,
                  attendance_summary: summary2?.attendance_summary,
                });
                setShowReceipt(true);
              }}
            >
              <View style={{ flex: 1 }}>
                <Typography type={Font.Poppins_Medium} size={13}>
                  {entry?.month || '--'}
                </Typography>
                <Typography size={11} color="#999">
                  Paid on {formatDate(entry?.paid_on)}
                </Typography>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Typography type={Font.Poppins_SemiBold} size={14}>
                  {formatCurrency(entry?.amount)}
                </Typography>
                <Typography size={10} color="#D98579" style={{ marginTop: 2 }}>
                  View Slip
                </Typography>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Typography size={13} color="#999">
              No payment history yet.
            </Typography>
          </View>
        )}
      </View>

      </ScrollView>
      )}

      <PaymentReceipt
        visible={showReceipt}
        onClose={() => { setShowReceipt(false); setSelectedPayment(null); }}
        paymentData={selectedPayment}
        userDetails={userDetail}
        employerName={employerDisplayName}
        attendanceSummary={attendanceSummary}
      />

      <View style={styles.bottomSpacing} />
    </CommanView>
  );
};

export default EarningSummary;

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
  },
  spacing: {
    height: 20,
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  errorBox: {
    backgroundColor: Colors.light_red,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border_red,
  },
  retryButton: {
    backgroundColor: '#D98579',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  mainCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.lightgrey,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 16,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: '#D1E7DD',
    borderColor: '#A3CFBB',
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: '#FCE5CD',
    borderColor: '#F5C185',
    borderWidth: 1,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.lightgrey,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightgrey,
  },
  bottomSpacing: {
    height: 40,
  },
});
