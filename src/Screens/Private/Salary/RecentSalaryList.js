import {
  StyleSheet,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';
import { useIsFocused } from '@react-navigation/native';
import { GET_WITH_TOKEN, PUT_WITH_TOKEN } from '../../../Backend/Backend';
import { SalaryList, SalaryUpdateStatus } from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';
import { useSelector } from 'react-redux';
import PaymentReceipt from '../../../Component/PaymentReceipt';
import { getAsyncStorage } from '../../../Utils/AsyncStorage';

const PAGE_SIZE = 10;
const STATUS_FILTERS = ['all', 'Paid', 'Pending', 'Advance'];

const RecentSalaryList = ({ navigation }) => {
  const isFocused = useIsFocused();
  const userDetails = useSelector(state => state?.userDetails);
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState(null);

  const markAsPaid = useCallback((paymentId) => {
    setIsMarkingPaid(true);
    PUT_WITH_TOKEN(
      `${SalaryUpdateStatus}/${paymentId}/status`,
      { status: 'paid' },
      () => {
        setIsMarkingPaid(false);
        setSalaryRecords(prev =>
          prev.map(item =>
            item.payment_id === paymentId ? { ...item, status: 'Paid' } : item,
          ),
        );
        setSelectedPayment(prev =>
          prev && prev.payment_id === paymentId ? { ...prev, status: 'Paid' } : prev,
        );
        SimpleToast.show('Payment marked as paid', SimpleToast.SHORT);
        fetchSalaryList();
      },
      error => {
        setIsMarkingPaid(false);
        SimpleToast.show(
          error?.data?.message || 'Failed to update status',
          SimpleToast.SHORT,
        );
      },
      () => {
        setIsMarkingPaid(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  }, [fetchSalaryList]);

  const fetchSalaryList = useCallback(async () => {
    setIsRefreshing(true);

    // Load local storage payments
    let localRecords = [];
    try {
      const stored = await getAsyncStorage('payment_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        localRecords = parsed.map((item, index) => ({
          payment_id: `local_${index}_${item.date}`,
          amount: item.amount || 0,
          net_salary: item.amount || 0,
          status: item.type === 'advance' ? 'Advance' : (item.status || 'Paid'),
          payment_mode: item.payment_mode || 'cash',
          created_at: item.date,
          type: item.type,
          processed_by: { name: userDetails?.name || userDetails?.first_name || 'Employer' },
          staff_name: item.staff_name || 'Staff Member',
          staff_member: { name: item.staff_name || 'Staff Member' },
          is_local: true,
        }));
      }
    } catch (e) {
      console.log('Error loading local payments', e);
    }

    GET_WITH_TOKEN(
      SalaryList,
      success => {
        const data = success?.data ?? [];
        const allRecords = [...data, ...localRecords];
        const sorted = allRecords.sort(
          (a, b) => new Date(b?.created_at) - new Date(a?.created_at),
        );
        setSalaryRecords(sorted);
        setVisibleCount(PAGE_SIZE);
        setIsRefreshing(false);
      },
      error => {
        // Still show local records if API fails
        if (localRecords.length > 0) {
          setSalaryRecords(localRecords.sort(
            (a, b) => new Date(b?.created_at) - new Date(a?.created_at),
          ));
        }
        setIsRefreshing(false);
        SimpleToast.show('Failed to load salary list', SimpleToast.SHORT);
      },
      fail => {
        if (localRecords.length > 0) {
          setSalaryRecords(localRecords.sort(
            (a, b) => new Date(b?.created_at) - new Date(a?.created_at),
          ));
        }
        setIsRefreshing(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchSalaryList();
    }
  }, [isFocused, fetchSalaryList]);

  const getStatusColor = status => {
    if (status?.toLowerCase() === 'paid') return '#0A8F08';
    if (status?.toLowerCase() === 'advance') return '#D98579';
    return '#FF9800';
  };

  const filteredRecords = useMemo(() => {
    if (selectedStatus === 'all') {
      return salaryRecords;
    }
    if (selectedStatus === 'Advance') {
      return salaryRecords.filter(
        item => item?.type === 'advance' || item?.status?.toLowerCase() === 'advance',
      );
    }
    return salaryRecords.filter(
      item => item?.status?.toLowerCase() === selectedStatus.toLowerCase() && item?.type !== 'advance',
    );
  }, [salaryRecords, selectedStatus]);

  const visibleRecords = useMemo(
    () => filteredRecords.slice(0, visibleCount),
    [filteredRecords, visibleCount],
  );

  const handleLoadMore = () => {
    if (isLoadingMore) {
      return;
    }
    if (visibleCount >= filteredRecords.length) {
      return;
    }
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + PAGE_SIZE);
      setIsLoadingMore(false);
    }, 250);
  };

  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchSalaryList();
    }
  };

  const handleStatusChange = useCallback(status => {
    setSelectedStatus(status);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const getFilterLabel = useCallback(status => {
    if (status === 'Paid') {
      return LocalizedStrings.SalaryManagement.status_paid;
    }
    if (status === 'Pending') {
      return LocalizedStrings.SalaryManagement.status_pending;
    }
    if (status === 'Advance') {
      return 'Advance';
    }
    return LocalizedStrings.SalaryManagement.status_all ?? 'All';
  }, []);

  const headerComponent = useMemo(
    () => (
      <View style={styles.filterContainer}>
        {STATUS_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedStatus === filter && styles.filterChipActive,
            ]}
            onPress={() => handleStatusChange(filter)}
          >
            <Typography
              type={Font.Poppins_Regular}
              style={[
                styles.filterLabel,
                selectedStatus === filter && styles.filterLabelActive,
              ]}
            >
              {getFilterLabel(filter)}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    ),
    [selectedStatus, handleStatusChange, getFilterLabel],
  );

  const footerComponent = useMemo(
    () =>
      isLoadingMore ? <ActivityIndicator style={styles.footerLoader} /> : null,
    [isLoadingMore],
  );

  const emptyComponent = useMemo(() => {
    if (isRefreshing) {
      return null;
    }
    return (
      <Typography type={Font.Poppins_Regular} style={styles.emptyText}>
        No payment history found.
      </Typography>
    );
  }, [isRefreshing]);

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.paymentRow}
      activeOpacity={0.7}
      onPress={() => setSelectedPayment(item)}
    >
      <View style={styles.paymentLeft}>
        <Image
          source={ImageConstant.lines}
          style={styles.paymentHistoryIcon}
          resizeMode="contain"
        />

        <View style={styles.paymentDetails}>
          <Typography type={Font.Poppins_Regular} style={styles.paymentDate}>
            {item?.created_at
              ? moment(item.created_at).format('DD-MM-YYYY')
              : '--'}
          </Typography>

          <Typography type={Font.Poppins_Regular} style={styles.paymentAmount}>
            ₹{Number(item?.amount ?? 0).toFixed(2)}
          </Typography>

          <Typography type={Font.Poppins_Regular} style={styles.paymentStaff}>
            {item?.type === 'advance'
              ? `Advance to ${item.staff_name || item.staff_member?.name || 'Staff'}`
              : `${LocalizedStrings.SalaryManagement.status_paid} to ${item.staff_name || item.staff_member?.name || 'Staff'}`}
          </Typography>
        </View>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Typography
          type={Font.Poppins_SemiBold}
          style={[styles.paymentStatus, { color: getStatusColor(item?.status) }]}
        >
          {item?.status ?? '--'}
        </Typography>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => setReceiptPayment(item)}
        >
          <Image
            source={ImageConstant.fileText}
            style={styles.downloadIcon}
            resizeMode="contain"
          />
          <Typography
            type={Font.Poppins_Regular}
            style={styles.downloadText}
          >
            Receipt
          </Typography>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.SalaryManagement.recent_payments}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        style_title={styles.headerTitle}
        onPressRightIcon={() => navigation.navigate('Notification')}
      />

      <View style={styles.screenWrapper}>
        <Typography type={Font.Poppins_SemiBold} style={styles.sectionTitle}>
          All Payments
        </Typography>

        <FlatList
          data={visibleRecords}
          keyExtractor={item => item?.payment_id?.toString()}
          renderItem={renderItem}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={headerComponent}
          ListFooterComponent={footerComponent}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={emptyComponent}
        />
        <Modal
          visible={!!selectedPayment}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPayment(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Typography
                type={Font.Poppins_SemiBold}
                style={styles.modalTitle}
              >
                Payment Details
              </Typography>

              <View style={styles.modalRow}>
                <Typography type={Font.Poppins_Regular} style={styles.modalKey}>
                  Amount
                </Typography>
                <Typography type={Font.Poppins_SemiBold}>
                  ₹{Number(selectedPayment?.amount ?? 0).toFixed(2)}
                </Typography>
              </View>

              <View style={styles.modalRow}>
                <Typography type={Font.Poppins_Regular} style={styles.modalKey}>
                  Status
                </Typography>
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={{ color: getStatusColor(selectedPayment?.status) }}
                >
                  {selectedPayment?.status ?? '--'}
                </Typography>
              </View>

              <View style={styles.modalRow}>
                <Typography type={Font.Poppins_Regular} style={styles.modalKey}>
                  Staff
                </Typography>
                <Typography type={Font.Poppins_Regular}>
                  {selectedPayment?.staff_name || selectedPayment?.staff_member?.name || 'Staff Member'}
                </Typography>
              </View>

              <View style={styles.modalRow}>
                <Typography type={Font.Poppins_Regular} style={styles.modalKey}>
                  Date
                </Typography>
                <Typography type={Font.Poppins_Regular}>
                  {selectedPayment?.created_at
                    ? moment(selectedPayment?.created_at).format('DD-MM-YYYY')
                    : '--'}
                </Typography>
              </View>

              {!!selectedPayment?.payment_method && (
                <View style={styles.modalRow}>
                  <Typography
                    type={Font.Poppins_Regular}
                    style={styles.modalKey}
                  >
                    Method
                  </Typography>
                  <Typography type={Font.Poppins_Regular}>
                    {selectedPayment?.payment_method}
                  </Typography>
                </View>
              )}

              <TouchableOpacity
                style={styles.receiptButton}
                onPress={() => {
                  setSelectedPayment(null);
                  setTimeout(() => setReceiptPayment(selectedPayment), 300);
                }}
                activeOpacity={0.8}
              >
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={styles.modalButtonText}
                >
                  Download / Share Receipt
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setSelectedPayment(null)}
                activeOpacity={0.8}
              >
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={styles.modalButtonText}
                >
                  Close
                </Typography>
              </TouchableOpacity>

              {selectedPayment?.status?.toLowerCase() === 'pending' && (
                <TouchableOpacity
                  style={styles.markPaidButton}
                  onPress={() => markAsPaid(selectedPayment?.payment_id)}
                  activeOpacity={0.8}
                  disabled={isMarkingPaid}
                >
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={styles.markPaidButtonText}
                  >
                    {isMarkingPaid ? 'Updating...' : 'Mark as Paid'}
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </View>

      <PaymentReceipt
        visible={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        paymentData={receiptPayment}
        userDetails={userDetails}
      />
    </CommanView>
  );
};

export default RecentSalaryList;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
  },
  screenWrapper: {
    padding: 16,
    marginTop: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#fff5ee',
    borderColor: '#D98579',
  },
  filterLabel: {
    fontSize: 12,
    color: '#555',
  },
  filterLabelActive: {
    color: '#D98579',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    alignItems: 'center',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDetails: {
    marginLeft: 8,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 3,
  },
  paymentStaff: {
    fontSize: 12,
    color: '#555',
  },
  paymentDate: {
    fontSize: 12,
    color: '#888',
  },
  paymentStatus: {
    fontSize: 12,
    textAlign: 'right',
  },
  paymentHistoryIcon: {
    width: 20,
    height: 20,
    tintColor: '#555',
  },
  listContent: {
    paddingBottom: 140,
  },
  footerLoader: {
    marginVertical: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalKey: {
    color: '#777',
  },
  modalButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#D98579',
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
  },
  markPaidButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0A8F08',
  },
  markPaidButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
  },
  receiptButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#D98579',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#FFF5EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D98579',
  },
  downloadIcon: {
    width: 14,
    height: 14,
    tintColor: '#D98579',
    marginRight: 4,
  },
  downloadText: {
    fontSize: 10,
    color: '#D98579',
  },
});
