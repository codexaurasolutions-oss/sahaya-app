import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import { GET_WITH_TOKEN } from '../../Backend/Backend';
import { MyAdvances } from '../../Backend/api_routes';
import moment from 'moment';

const StaffAdvanceView = ({ navigation }) => {
  const [advances, setAdvances]   = useState([]);
  const [summary, setSummary]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [detail, setDetail]       = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { fetchMyAdvances(); }, []);

  const fetchMyAdvances = () => {
    setLoading(true);
    GET_WITH_TOKEN(
      MyAdvances,
      res => {
        setAdvances(res?.data || []);
        setSummary(res?.summary || {});
        setLoading(false);
      },
      () => setLoading(false),
      () => setLoading(false),
    );
  };

  const getEmployerName = adv => {
    const e = adv?.employer;
    if (!e) return 'Employer';
    return `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name || 'Employer';
  };

  const renderAdvanceCard = ({ item }) => {
    const recovered = parseFloat(item.amount) - parseFloat(item.remaining_balance);
    const pct = item.amount > 0 ? Math.round((recovered / item.amount) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { setDetail(item); setShowDetail(true); }}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Typography type={Font?.Poppins_SemiBold} size={16} color="#fff">₹</Typography>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Typography type={Font?.Poppins_SemiBold} size={14}>
              ₹{parseFloat(item.amount).toLocaleString('en-IN')} Advance
            </Typography>
            <Typography type={Font?.Poppins_Regular} size={11} color="#8C8D8B">
              From: {getEmployerName(item)} · {moment(item.given_date).format('DD MMM YYYY')}
            </Typography>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#EEF9F0' : '#F5F5F5' }]}>
            <Typography size={11} color={item.status === 'active' ? '#16A34A' : '#888'} type={Font?.Poppins_Medium}>
              {item.status === 'active' ? 'Active' : 'Cleared'}
            </Typography>
          </View>
        </View>

        <View style={styles.amountRow}>
          <View>
            <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Received</Typography>
            <Typography size={15} type={Font?.Poppins_SemiBold}>₹{parseFloat(item.amount).toLocaleString('en-IN')}</Typography>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Deducted</Typography>
            <Typography size={15} type={Font?.Poppins_SemiBold} color="#D98579">₹{recovered.toLocaleString('en-IN')}</Typography>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Remaining</Typography>
            <Typography size={15} type={Font?.Poppins_SemiBold} color="#16A34A">
              ₹{parseFloat(item.remaining_balance).toLocaleString('en-IN')}
            </Typography>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>{pct}% recovered</Typography>
          <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>
            {item.deduction_type === 'installment'
              ? `₹${parseFloat(item.installment_amount || 0).toLocaleString('en-IN')}/mo`
              : item.deduction_type}
          </Typography>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title="My Advances"
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        style_title={{ fontSize: 18 }}
      />

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryBox, { backgroundColor: '#FFF4F2' }]}>
          <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Total Received</Typography>
          <Typography size={16} type={Font?.Poppins_SemiBold} color="#D98579">
            ₹{parseFloat(summary.total_given || 0).toLocaleString('en-IN')}
          </Typography>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: '#EEF9F0' }]}>
          <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Recovered</Typography>
          <Typography size={16} type={Font?.Poppins_SemiBold} color="#16A34A">
            ₹{parseFloat(summary.total_recovered || 0).toLocaleString('en-IN')}
          </Typography>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: '#F5F0FF' }]}>
          <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Still Owed</Typography>
          <Typography size={16} type={Font?.Poppins_SemiBold} color="#7C3AED">
            ₹{parseFloat(summary.total_remaining || 0).toLocaleString('en-IN')}
          </Typography>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : (
        <FlatList
          data={advances}
          keyExtractor={item => String(item.id)}
          renderItem={renderAdvanceCard}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Typography type={Font?.Poppins_Regular} size={14} color="#8C8D8B">No advances received yet.</Typography>
            </View>
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent onRequestClose={() => setShowDetail(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '85%' }]}>
            <ScrollView>
              <Typography type={Font?.Poppins_SemiBold} size={17} style={{ marginBottom: 12 }}>Advance Details</Typography>

              <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">From</Typography><Typography size={13} type={Font?.Poppins_SemiBold}>{getEmployerName(detail)}</Typography></View>
              <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Date</Typography><Typography size={13}>{moment(detail?.given_date).format('DD MMM YYYY')}</Typography></View>
              <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Amount</Typography><Typography size={13} type={Font?.Poppins_SemiBold}>₹{parseFloat(detail?.amount || 0).toLocaleString('en-IN')}</Typography></View>
              <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Remaining</Typography><Typography size={13} type={Font?.Poppins_SemiBold} color="#D98579">₹{parseFloat(detail?.remaining_balance || 0).toLocaleString('en-IN')}</Typography></View>
              <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Deduction Type</Typography><Typography size={13}>{detail?.deduction_type}</Typography></View>
              {detail?.installment_amount ? (
                <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Monthly</Typography><Typography size={13}>₹{parseFloat(detail.installment_amount).toLocaleString('en-IN')}</Typography></View>
              ) : null}
              {detail?.remarks ? (
                <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Remarks</Typography><Typography size={13}>{detail.remarks}</Typography></View>
              ) : null}

              <Typography type={Font?.Poppins_SemiBold} size={14} style={{ marginTop: 18, marginBottom: 8 }}>Deduction History</Typography>
              {(detail?.transactions || []).length === 0 ? (
                <Typography size={13} color="#8C8D8B" type={Font?.Poppins_Regular}>No deductions yet.</Typography>
              ) : (
                (detail?.transactions || []).map((t, i) => (
                  <View key={i} style={styles.txRow}>
                    <View>
                      <Typography size={13} type={Font?.Poppins_Medium} color="#D98579">-₹{parseFloat(t.deducted_amount).toLocaleString('en-IN')}</Typography>
                      <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>{moment(t.created_at).format('DD MMM YYYY')}</Typography>
                    </View>
                    <Typography size={12} color="#8C8D8B">{t.note || ''}</Typography>
                    <Typography size={12} type={Font?.Poppins_Medium}>Bal: ₹{parseFloat(t.balance_after).toLocaleString('en-IN')}</Typography>
                  </View>
                ))
              )}

              <Button title="Close" onPress={() => setShowDetail(false)} main_style={{ marginTop: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </CommanView>
  );
};

export default StaffAdvanceView;

const styles = StyleSheet.create({
  summaryRow:       { flexDirection: 'row', gap: 8, marginVertical: 12 },
  summaryBox:       { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  card:             { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarCircle:     { width: 42, height: 42, borderRadius: 21, backgroundColor: '#D98579', justifyContent: 'center', alignItems: 'center' },
  statusBadge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  amountRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressBg:       { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  progressFill:     { height: 6, backgroundColor: '#D98579', borderRadius: 3 },
  empty:            { alignItems: 'center', marginTop: 60 },
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox:         { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  detailRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F3F3' },
  txRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
});
