import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import { GET_WITH_TOKEN } from '../../Backend/Backend';
import { EarningSummary } from '../../Backend/api_routes';
import { useIsFocused } from '@react-navigation/native';
import moment from 'moment';
import PaymentReceipt from '../../Component/PaymentReceipt';
import { useSelector } from 'react-redux';

const STATUS_FILTERS = ['All', 'Paid', 'Pending', 'Advance'];

const StaffPaymentHistory = ({ navigation }) => {
  const isFocused = useIsFocused();
  const userDetail = useSelector(state => state?.userDetails);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [receiptPayment, setReceiptPayment] = useState(null);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    // Fetch last 12 months of earnings
    const now = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Fetch current month first to get job_id
    GET_WITH_TOKEN(
      `${EarningSummary}?month=${months[0]}`,
      success => {
        const data = success?.data;
        const earningData = Array.isArray(data) && data.length > 0 ? data[0] : (data && !Array.isArray(data) ? data : null);
        const jobId = earningData?.job_id || earningData?.job_details?.id;

        if (!jobId) {
          // No job — try to get payment history from summary directly
          const history = earningData?.payment_history || [];
          setRecords(history.map(normalizeRecord));
          setLoading(false);
          return;
        }

        // Fetch all months with job_id
        const allRecords = [];
        let completed = 0;

        months.forEach(month => {
          GET_WITH_TOKEN(
            `${EarningSummary}?job_id=${jobId}&month=${month}`,
            res => {
              const d = res?.data;
              const ed = Array.isArray(d) && d.length > 0 ? d[0] : (d && !Array.isArray(d) ? d : null);
              if (ed) {
                // Add monthly salary record
                if (ed.net_salary || ed.base_salary) {
                  allRecords.push({
                    id: `salary_${month}`,
                    amount: ed.net_salary || ed.base_salary || 0,
                    status: ed.payment_status || ed.status || 'Pending',
                    type: 'salary',
                    month: month,
                    date: ed.payment_date || ed.paid_on || `${month}-01`,
                    paid_by: ed.employer || ed.employer_name || 'Employer',
                    payment_mode: ed.payment_mode || 'cash',
                    raw: ed,
                  });
                }
                // Add payment history entries
                const ph = ed.payment_history || [];
                ph.forEach((p, i) => {
                  allRecords.push({
                    id: `ph_${month}_${i}`,
                    amount: p.amount || p.net_salary || 0,
                    status: p.status || 'Paid',
                    type: p.type || 'salary',
                    month: p.month || month,
                    date: p.paid_on || p.date || p.created_at || `${month}-01`,
                    paid_by: p.paid_by || ed.employer || 'Employer',
                    payment_mode: p.payment_mode || 'cash',
                    raw: p,
                  });
                });
              }
              completed++;
              if (completed === months.length) {
                // Sort by date descending
                const sorted = allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
                // Deduplicate by id
                const seen = new Set();
                const unique = sorted.filter(r => {
                  if (seen.has(r.id)) return false;
                  seen.add(r.id);
                  return true;
                });
                setRecords(unique);
                setLoading(false);
              }
            },
            () => {
              completed++;
              if (completed === months.length) {
                const sorted = allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
                setRecords(sorted);
                setLoading(false);
              }
            },
            () => {
              completed++;
              if (completed === months.length) {
                setRecords(allRecords);
                setLoading(false);
              }
            },
          );
        });
      },
      () => { setLoading(false); },
      () => { setLoading(false); },
    );
  }, []);

  React.useEffect(() => {
    if (isFocused) fetchHistory();
  }, [isFocused, fetchHistory]);

  const normalizeRecord = (p, i) => ({
    id: `norm_${i}`,
    amount: p.amount || p.net_salary || 0,
    status: p.status || 'Paid',
    type: p.type || 'salary',
    month: p.month || '',
    date: p.paid_on || p.date || p.created_at || '',
    paid_by: p.paid_by || 'Employer',
    payment_mode: p.payment_mode || 'cash',
    raw: p,
  });

  const getStatusColor = status => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return '#0A8F08';
    if (s === 'advance') return '#D98579';
    return '#FF9800';
  };

  const filteredRecords = useMemo(() => {
    if (selectedStatus === 'All') return records;
    return records.filter(r => r.status?.toLowerCase() === selectedStatus.toLowerCase() || r.type?.toLowerCase() === selectedStatus.toLowerCase());
  }, [records, selectedStatus]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() => setReceiptPayment(item?.raw || item)}
    >
      <View style={styles.iconCircle}>
        <Typography type={Font?.Poppins_SemiBold} size={14} color="#D98579">₹</Typography>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Typography type={Font?.Poppins_SemiBold} size={14}>
          ₹{Number(item.amount || 0).toLocaleString('en-IN')}
        </Typography>
        <Typography type={Font?.Poppins_Regular} size={12} color="#888">
          {item.type === 'advance' ? 'Advance' : `Salary — ${item.month || ''}`}
        </Typography>
        <Typography type={Font?.Poppins_Regular} size={11} color="#aaa">
          {item.date ? moment(item.date).format('DD MMM YYYY') : '--'}
        </Typography>
        <Typography type={Font?.Poppins_Regular} size={11} color="#aaa">
          Paid by: {item.paid_by || 'Employer'} · {item.payment_mode}
        </Typography>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Typography type={Font?.Poppins_SemiBold} size={11} color={getStatusColor(item.status)}>
            {item.status || 'Paid'}
          </Typography>
        </View>
        <TouchableOpacity
          style={styles.receiptBtn}
          onPress={() => setReceiptPayment(item?.raw || item)}
        >
          <Image source={ImageConstant?.fileText} style={styles.receiptIcon} />
          <Typography size={10} color="#D98579">Receipt</Typography>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <CommanView>
      <HeaderForUser
        title="Payment History"
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        style_title={{ fontSize: 18 }}
      />

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, selectedStatus === f && styles.chipActive]}
            onPress={() => setSelectedStatus(f)}
          >
            <Typography
              type={Font?.Poppins_Regular}
              size={12}
              color={selectedStatus === f ? '#D98579' : '#555'}
            >
              {f}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Typography type={Font?.Poppins_Regular} size={14} color="#888">
                No payment history found.
              </Typography>
            </View>
          )}
        />
      )}

      <PaymentReceipt
        visible={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        paymentData={receiptPayment}
        userDetails={userDetail}
      />
    </CommanView>
  );
};

export default StaffPaymentHistory;

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: {
    borderColor: '#D98579',
    backgroundColor: '#FFF5EE',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D98579',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D98579',
  },
  receiptIcon: {
    width: 12,
    height: 12,
    tintColor: '#D98579',
    marginRight: 4,
    resizeMode: 'contain',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
});
