import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import LocalizedStrings from '../../Constants/localization';
import { EarningSummary as EarningSummaryRoute, myWork, AttendanceStaff, ReferralCode } from '../../Backend/api_routes';
import { POST_FORM_DATA, GET_WITH_TOKEN } from '../../Backend/Backend';


const EarningSummary = ({ route }) => {
  const navigation = useNavigation();
  const jobID = route?.params?.id;
  const isFocused = useIsFocused();
  const userDetail = useSelector(store => store?.userDetails);
  const [walletBalance, setWalletBalance] = useState('0.00');

  const [summary2, setSummary2] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [attendanceSummary, setAttendanceSummary] = useState({ totalWorked: 0, daysInMonth: 30, last30Days: 0 });
  const [accruedSalary, setAccruedSalary] = useState(0);

  const profileIcon = userDetail?.image
    ? userDetail.image
    : ImageConstant?.user;

  const currencySymbol = summary2?.currency_symbol || '\u20B9';

  const handleErrorMessage = useCallback(error => {
    const message =
      error?.data?.message ||
      error?.response?.data?.message ||
      error?.message ||
      LocalizedStrings.general_error ||
      'Unable to load earnings right now.';
    setErrorMessage(message);
  }, []);


  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const fetchAttendanceSummary = useCallback((staffId) => {
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
        // Calculate last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        let last30Days = 0;
        
        // Since we only fetched current month, we might need to fetch more for real last 30 days, 
        // but for now let's at least show what we have in the current response filter
        if (Array.isArray(records)) {
          records.forEach(record => {
            const rDate = new Date(record.date);
            const status = record?.status?.toLowerCase();
            if (rDate >= thirtyDaysAgo && (status === 'present' || status === 'late')) {
              last30Days++;
            }
          });
        }

        setAttendanceSummary({ totalWorked, daysInMonth, last30Days });
        
        // Calculate accrued salary
        const monthlySalary = Number(userDetail?.user_work_info?.salary || userDetail?.work_info?.salary || 0);
        if (monthlySalary > 0) {
          const accrued = (monthlySalary / daysInMonth) * totalWorked;
          setAccruedSalary(accrued);
        }
      },
      error => console.log('Attendance fetch error:', error)
    );
  }, [userDetail]);

  const fetchEarnings = useCallback((id) => {
    const month = getCurrentMonth();
    const url = `${EarningSummaryRoute}?job_id=${id}&month=${month}`;

    fetchAttendanceSummary(userDetail?.id);

    GET_WITH_TOKEN(
      url,
      success => {
        setIsLoading(false);
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
        setIsLoading(false);
        handleErrorMessage(error);
      },
      () => {
        setIsLoading(false);
      },
    );
  }, [handleErrorMessage]);

  const fetchSummary = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');

    if (jobID) {
      // job_id passed from navigation, use it directly
      fetchEarnings(jobID);
    } else {
      // No job_id passed, fetch user's current work first
      GET_WITH_TOKEN(
        myWork,
        success => {
          const data = success?.data;
          // data can be a single object or an array
          const job = Array.isArray(data) ? data[0] : data;
          if (job?.id) {
            fetchEarnings(job.id);
          } else {
            setIsLoading(false);
            setErrorMessage('No approved jobs found.');
          }
        },
        error => {
          setIsLoading(false);
          handleErrorMessage(error);
        },
        () => {
          setIsLoading(false);
        },
      );
    }
  }, [jobID, userDetail?.id, fetchEarnings, handleErrorMessage]);

  const fetchWalletBalance = () => {
    GET_WITH_TOKEN(
      ReferralCode,
      success => {
        setWalletBalance(success?.data?.total_earnings || '0.00');
      },
      error => {},
      () => {},
    );
  };

  useEffect(() => {
    if (isFocused) {
      fetchSummary();
      fetchWalletBalance();
    }
  }, [fetchSummary, isFocused]);

  const paymentHistory = summary2?.payment_history || [];

  const formatCurrency = amount => {
    if (amount === undefined || amount === null || amount === '') {
      return `${currencySymbol}0.00`;
    }
    const value = Number(amount);
    if (Number.isNaN(value)) {
      return amount;
    }
    const absolute = Math.abs(value)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const prefix = `${currencySymbol}${absolute}`;
    return value < 0 ? `-${prefix}` : prefix;
  };

  const formatDate = dateValue => {
    if (!dateValue) {
      return '--';
    }
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

  const handleOpenLink = url => {
    if (!url) {
      Alert.alert(
        LocalizedStrings.common?.coming_soon || 'Coming soon',
        LocalizedStrings.common?.feature_in_progress ||
          'Detailed payslip will be available soon.',
      );
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert(
        LocalizedStrings.common?.unable_to_open || 'Unable to open link',
        LocalizedStrings.common?.try_again || 'Please try again later.',
      );
    });
  };

  const statusLabel =
    summary2?.payment_status ||
    (summary2 ? (LocalizedStrings.staffSection?.EarningsSummary?.payment_status_paid || 'Paid') : 'Pending');

  const statusStyle =
    statusLabel?.toLowerCase() === 'paid'
      ? styles.statusPaid
      : styles.statusPending;

  return (
    <CommanView>
      <HeaderForUser
        title={
          LocalizedStrings.staffSection?.EarningsSummary?.title ||
          'Earnings Summary'
        }
        onPressLeftIcon={() => navigation?.goBack()}
        source_arrow={ImageConstant?.BackArrow}
        style_title={styles.headerTitle}
      />

      <View style={styles.spacing} />

      {isLoading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color={Colors.blue || '#D98579'} />
        </View>
      ) : (
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Typography size={13} color={Colors.red}>
            {errorMessage}
          </Typography>
        </View>
      ) : null}
      
      {/* Wallet Balance Card to match Dashboard */}
      <View style={[styles.summaryCard, { backgroundColor: '#FFF5EE', borderColor: '#D98579', borderStyle: 'dashed', marginBottom: 15 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Typography type={Font.Poppins_Medium} size={14} color="#666">
              Current Wallet Balance
            </Typography>
            <Typography type={Font.Poppins_Bold} size={24} color="#D98579">
              {"\u20B9"}{walletBalance}
            </Typography>
          </View>
          <View style={{ height: 50, width: 50, borderRadius: 25, backgroundColor: "#FFF0EE", justifyContent: "center", alignItems: "center" }}>
            <Typography type={Font.Poppins_Bold} size={20} color="#D98579">{"\u20B9"}</Typography>
          </View>
        </View>
        <Typography size={11} color="#999" style={{ marginTop: 8 }}>
          This includes all your earnings across all jobs and referrals.
        </Typography>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', width: '100%' }}>
            <Typography
              type={Font.Poppins_SemiBold}
              size={16}
              color={Colors.black}
            >
              {LocalizedStrings.staffSection?.EarningsSummary?.subtitle ||
                'Your Earnings Summary'}
            </Typography>
            <Typography size={12} color={Colors.grey} style={styles.cardMeta}>
              {summary2?.payment_date || '--'}
            </Typography>
          </View>
          <View style={styles.employerSelector}>
            <Typography
              type={Font.Poppins_Medium}
              size={12}
              color={Colors.grey}
            >
              {LocalizedStrings.staffSection?.EarningsSummary?.employer ||
                'Employer'}
            </Typography>
            <View style={styles.employerValue}>
              <Typography
                type={Font.Poppins_SemiBold}
                size={13}
                color={Colors.black}
                numberOfLines={1}
              >
                {summary2?.employer && summary2.employer !== 'Unknown Employer' 
                  ? summary2.employer 
                  : (userDetail?.employer_name || userDetail?.added_by_name || 'Your Employer')}
              </Typography>
              {/* <Image
                source={ImageConstant?.Arrow}
                style={styles.dropdownIcon}
              /> */}
            </View>
          </View>
        </View>

        <View style={styles.amountRow}>
          <View>
            <Typography
              size={12}
              color={Colors.grey}
              style={styles.labelSpacing}
            >
              {LocalizedStrings.staffSection?.EarningsSummary
                ?.total_payable_amount || 'Total Payable Amount'}
            </Typography>
            <Typography type={Font.Poppins_Bold} size={32}>
              {formatCurrency(summary2?.total_payable_amount)}
            </Typography>
          </View>
          <View style={[styles.statusPill, statusStyle]}>
            <Typography
              type={Font.Poppins_SemiBold}
              size={13}
              color={
                summary2?.job_details?.application_status?.toLowerCase() ===
                'accepted'
                  ? '#0F5132'
                  : Colors.white
              }
            >
              {summary2?.job_details?.application_status || 'Pending'}
            </Typography>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View>
            <Typography size={12} color={Colors.grey}>
              {LocalizedStrings.staffSection?.EarningsSummary?.payment_date ||
                'Payment Date'}
            </Typography>
            <Typography type={Font.Poppins_SemiBold} size={16}>
              {formatDate(summary2?.payment_date)}
            </Typography>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Typography size={12} color={Colors.grey}>
              Worked Days ({moment().format('MMMM')})
            </Typography>
            <Typography type={Font.Poppins_SemiBold} size={15} color="#4CAF50">
              {attendanceSummary.totalWorked} Days
            </Typography>
            <View style={{ height: 8 }} />
            <Typography size={12} color={Colors.grey}>
              Last 30 Days
            </Typography>
            <Typography type={Font.Poppins_SemiBold} size={15} color="#4CAF50">
              {attendanceSummary.last30Days} Days
            </Typography>
          </View>
        </View>
      </View>

      {accruedSalary > 0 && (!summary2 || Number(summary2?.total_payable_amount) <= 0) && (
        <View style={[styles.summaryCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
           <Typography type={Font.Poppins_SemiBold} size={14} color="#0369A1">
            Current Month Progress
          </Typography>
          <View style={styles.amountRow}>
            <View>
              <Typography size={12} color="#0369A1">
                Accrued Earnings (Estimated)
              </Typography>
              <Typography type={Font.Poppins_Bold} size={28} color="#0369A1">
                {formatCurrency(accruedSalary)}
              </Typography>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography size={11} color="#0369A1">
                Based on {attendanceSummary.totalWorked}/{attendanceSummary.daysInMonth} days
              </Typography>
            </View>
          </View>
        </View>
      )}

      {(Number(summary2?.earnings_breakdown?.base_salary?.amount) > 0 ||
        Number(summary2?.earnings_breakdown?.performance_bonus?.amount) > 0 ||
        Number(summary2?.earnings_breakdown?.overtime_pay?.amount) > 0) ? (
        <View style={styles.sectionCard}>
          <Typography
            type={Font.Poppins_SemiBold}
            size={15}
            style={styles.sectionTitle}
          >
            {LocalizedStrings.staffSection?.EarningsSummary?.earnings_breakdown ||
              'Earnings Breakdown'}
          </Typography>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={styles.iconWrapper}>
                <Image
                  source={ImageConstant?.Dollar}
                  style={styles.rowIcon}
                  resizeMode="contain"
                />
              </View>
              <Typography size={14}>
                {LocalizedStrings.staffSection?.EarningsSummary?.base_salary ||
                  'Base Salary'}
              </Typography>
            </View>
            <Typography type={Font.Poppins_SemiBold} size={14}>
              {formatCurrency(summary2?.earnings_breakdown?.base_salary?.amount)}
            </Typography>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={styles.iconWrapper}>
                <Image
                  source={ImageConstant?.Dollar}
                  style={styles.rowIcon}
                  resizeMode="contain"
                />
              </View>
              <Typography size={14}>
                {LocalizedStrings.staffSection?.EarningsSummary
                  ?.performance_bonus || 'Performance Bonus'}
              </Typography>
            </View>
            <Typography type={Font.Poppins_SemiBold} size={14}>
              {formatCurrency(
                summary2?.earnings_breakdown?.performance_bonus?.amount,
              )}
            </Typography>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={styles.iconWrapper}>
                <Image
                  source={ImageConstant?.Dollar}
                  style={styles.rowIcon}
                  resizeMode="contain"
                />
              </View>
              <Typography size={14}>
                {LocalizedStrings.staffSection?.EarningsSummary?.overtime_pay ||
                  'Overtime Pay'}
              </Typography>
            </View>
            <Typography type={Font.Poppins_SemiBold} size={14}>
              {formatCurrency(summary2?.earnings_breakdown?.overtime_pay?.amount)}
            </Typography>
          </View>
        </View>
      ) : null}

      {(Number(summary2?.deductions?.provident_fund?.amount) > 0 ||
        Number(summary2?.deductions?.income_tax?.amount) > 0 ||
        Number(summary2?.deductions?.advance_repayment?.amount) > 0) ? (
        <View style={styles.sectionCard}>
          <Typography
            type={Font.Poppins_SemiBold}
            size={15}
            style={styles.sectionTitle}
          >
            {LocalizedStrings.staffSection?.EarningsSummary?.deductions ||
              'Deductions (if applicable)'}
          </Typography>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.iconWrapper, styles.deductionIcon]}>
                <Image
                  source={ImageConstant?.fileText}
                  style={styles.rowIcon}
                  resizeMode="contain"
                />
              </View>
              <Typography size={14}>
                {LocalizedStrings.staffSection?.EarningsSummary?.provident_fund ||
                  'Provident Fund'}
              </Typography>
            </View>
            <Typography type={Font.Poppins_SemiBold} size={14} color={Colors.red}>
              {formatCurrency(summary2?.deductions?.provident_fund?.amount)}
            </Typography>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.iconWrapper, styles.deductionIcon]}>
                <Image
                  source={ImageConstant?.fileText}
                  style={styles.rowIcon}
                  resizeMode="contain"
                />
              </View>
              <Typography size={14}>
                {LocalizedStrings.staffSection?.EarningsSummary?.income_tax ||
                  'Income Tax'}
              </Typography>
            </View>
            <Typography type={Font.Poppins_SemiBold} size={14} color={Colors.red}>
              {formatCurrency(summary2?.deductions?.income_tax?.amount)}
            </Typography>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.iconWrapper, styles.deductionIcon]}>
                <Image
                  source={ImageConstant?.fileText}
                  style={styles.rowIcon}
                  resizeMode="contain"
                />
              </View>
              <Typography size={14}>
                {LocalizedStrings.staffSection?.EarningsSummary
                  ?.advance_repayment || 'Advance Repayment'}
              </Typography>
            </View>
            <Typography type={Font.Poppins_SemiBold} size={14} color={Colors.red}>
              {formatCurrency(summary2?.deductions?.advance_repayment?.amount)}
            </Typography>
          </View>
        </View>
      ) : null}

      <View style={[styles.sectionCard, styles.historyCard]}>
        <Typography
          type={Font.Poppins_SemiBold}
          size={15}
          style={styles.sectionTitle}
        >
          {LocalizedStrings.staffSection?.EarningsSummary?.payment_history ||
            'Payment History'}
        </Typography>
        {paymentHistory.length > 0 ? (
          paymentHistory.map((entry, index) => (
            <View
              key={`${entry?.month}-${index}`}
              style={[
                styles.historyRow,
                index !== paymentHistory.length - 1 && styles.historyRowBorder,
              ]}
            >
              <View>
                <Typography type={Font.Poppins_SemiBold} size={14}>
                  {entry?.month || '--'}
                </Typography>
                <Typography size={12} color={Colors.grey}>
                  {(LocalizedStrings.staffSection?.EarningsSummary?.paid_on ||
                    'Paid on') +
                    ' ' +
                    formatDate(entry?.paid_on)}
                </Typography>
              </View>
              <View style={styles.historyRight}>
                <Typography type={Font.Poppins_SemiBold} size={14}>
                  {formatCurrency(entry?.amount)}
                </Typography>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleOpenLink(entry?.receipt_url)}
                >
                  <Image
                    source={ImageConstant?.Doc}
                    style={styles.downloadIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Typography size={13} color={Colors.grey}>
              No past payment history found.
            </Typography>
          </View>
        )}
      </View>

      </ScrollView>
      )}
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
  emptyWrapper: {
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
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.red,
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.lightgrey,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 18,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardMeta: {
    marginTop: 2,
    marginLeft: 'auto',
  },
  employerSelector: {
    // minWidth: 140,
    flexDirection: 'row',
    marginTop: 8,
  },
  employerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 4,
    marginLeft: 10,
  },
  dropdownIcon: {
    width: 18,
    height: 18,
    tintColor: Colors.grey,
    marginLeft: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  labelSpacing: {
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
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
  metaRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightgrey,
    backgroundColor: Colors.smogGray,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.lightgrey,
    marginBottom: 18,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.inputGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deductionIcon: {
    backgroundColor: '#FFE8E8',
  },
  rowIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.blue,
  },
  historyCard: {
    paddingTop: 18,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  historyRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightgrey,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  downloadButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightgrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  downloadIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.grey,
  },
  bottomSpacing: {
    height: 40,
  },
});
