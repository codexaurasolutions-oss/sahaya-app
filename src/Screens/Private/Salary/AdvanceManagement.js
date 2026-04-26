import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import Typography from '../../../Component/UI/Typography';
import Button from '../../../Component/Button';
import DropdownComponent from '../../../Component/DropdownComponent';
import { Font } from '../../../Constants/Font';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../../Backend/Backend';
import { AdvanceList, AdvanceStore, AdvanceDeduct, ListStaff } from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';

const DEDUCTION_TYPES = [
  { label: 'Full (Next Salary)', value: 'full' },
  { label: 'Installments (Monthly)', value: 'installment' },
  { label: 'Manual / Flexible', value: 'manual' },
];

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
];

const AdvanceManagement = ({ navigation }) => {
  const [advances, setAdvances]         = useState([]);
  const [summary, setSummary]           = useState({});
  const [loading, setLoading]           = useState(true);
  const [staffList, setStaffList]       = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  // Give Advance Modal
  const [showGiveModal, setShowGiveModal]           = useState(false);
  const [selectedStaff, setSelectedStaff]           = useState(null);
  const [advAmount, setAdvAmount]                   = useState('');
  const [deductionType, setDeductionType]           = useState('manual');
  const [installmentAmt, setInstallmentAmt]         = useState('');
  const [remarks, setRemarks]                       = useState('');
  const [submitting, setSubmitting]                 = useState(false);

  // Deduct Modal
  const [showDeductModal, setShowDeductModal]       = useState(false);
  const [selectedAdvance, setSelectedAdvance]       = useState(null);
  const [deductAmt, setDeductAmt]                   = useState('');
  const [deductNote, setDeductNote]                 = useState('');
  const [deducting, setDeducting]                   = useState(false);

  // Detail Modal
  const [showDetailModal, setShowDetailModal]       = useState(false);
  const [detailAdvance, setDetailAdvance]           = useState(null);

  useEffect(() => {
    fetchAdvances();
    fetchStaff();
  }, [statusFilter]);

  const fetchAdvances = useCallback(() => {
    setLoading(true);
    const url = statusFilter ? `${AdvanceList}?status=${statusFilter}` : AdvanceList;
    GET_WITH_TOKEN(
      url,
      res => {
        setAdvances(res?.data || []);
        setSummary(res?.summary || {});
        setLoading(false);
      },
      () => setLoading(false),
      () => setLoading(false),
    );
  }, [statusFilter]);

  const fetchStaff = () => {
    GET_WITH_TOKEN(
      ListStaff,
      res => {
        const list = (res?.data?.data || res?.data || []).map(s => ({
          label: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || 'Staff',
          value: s.id,
        }));
        setStaffList(list);
      },
      () => {},
      () => {},
    );
  };

  const handleGiveAdvance = () => {
    if (!selectedStaff) return SimpleToast.show('Select a staff member', SimpleToast.SHORT);
    if (!advAmount || parseFloat(advAmount) <= 0) return SimpleToast.show('Enter a valid amount', SimpleToast.SHORT);
    if (deductionType === 'installment' && (!installmentAmt || parseFloat(installmentAmt) <= 0))
      return SimpleToast.show('Enter installment amount', SimpleToast.SHORT);

    setSubmitting(true);
    POST_WITH_TOKEN(
      AdvanceStore,
      {
        staff_id:           selectedStaff,
        amount:             parseFloat(advAmount),
        deduction_type:     deductionType,
        installment_amount: deductionType === 'installment' ? parseFloat(installmentAmt) : undefined,
        remarks,
        given_date:         moment().format('YYYY-MM-DD'),
      },
      () => {
        setSubmitting(false);
        setShowGiveModal(false);
        resetGiveForm();
        SimpleToast.show('Advance given successfully!', SimpleToast.SHORT);
        fetchAdvances();
      },
      err => {
        setSubmitting(false);
        SimpleToast.show(err?.data?.message || 'Failed to give advance', SimpleToast.SHORT);
      },
      () => {
        setSubmitting(false);
        SimpleToast.show('Network error', SimpleToast.SHORT);
      },
    );
  };

  const handleDeduct = () => {
    if (!deductAmt || parseFloat(deductAmt) <= 0)
      return SimpleToast.show('Enter a valid deduction amount', SimpleToast.SHORT);

    setDeducting(true);
    POST_WITH_TOKEN(
      `${AdvanceDeduct}/${selectedAdvance?.id}/deduct`,
      { amount: parseFloat(deductAmt), note: deductNote },
      () => {
        setDeducting(false);
        setShowDeductModal(false);
        setDeductAmt('');
        setDeductNote('');
        SimpleToast.show('Deduction recorded!', SimpleToast.SHORT);
        fetchAdvances();
      },
      err => {
        setDeducting(false);
        SimpleToast.show(err?.data?.message || 'Failed to deduct', SimpleToast.SHORT);
      },
      () => {
        setDeducting(false);
        SimpleToast.show('Network error', SimpleToast.SHORT);
      },
    );
  };

  const resetGiveForm = () => {
    setSelectedStaff(null);
    setAdvAmount('');
    setDeductionType('manual');
    setInstallmentAmt('');
    setRemarks('');
  };

  const getStaffName = advance => {
    const s = advance?.staff;
    if (!s) return 'Staff';
    return `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || 'Staff';
  };

  const renderAdvanceCard = ({ item }) => {
    const recovered = parseFloat(item.amount) - parseFloat(item.remaining_balance);
    const pct = item.amount > 0 ? Math.round((recovered / item.amount) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { setDetailAdvance(item); setShowDetailModal(true); }}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Typography type={Font?.Poppins_SemiBold} size={18} color="#fff">
              {getStaffName(item).charAt(0).toUpperCase()}
            </Typography>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Typography type={Font?.Poppins_SemiBold} size={14}>{getStaffName(item)}</Typography>
            <Typography type={Font?.Poppins_Regular} size={11} color="#8C8D8B">
              {moment(item.given_date).format('DD MMM YYYY')} · {item.deduction_type}
            </Typography>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#EEF9F0' : '#F5F5F5' }]}>
            <Typography size={11} color={item.status === 'active' ? '#16A34A' : '#888'} type={Font?.Poppins_Medium}>
              {item.status === 'active' ? 'Active' : 'Closed'}
            </Typography>
          </View>
        </View>

        <View style={styles.amountRow}>
          <View>
            <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Total</Typography>
            <Typography size={16} type={Font?.Poppins_SemiBold}>₹{parseFloat(item.amount).toLocaleString('en-IN')}</Typography>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Recovered</Typography>
            <Typography size={16} type={Font?.Poppins_SemiBold} color="#16A34A">₹{recovered.toLocaleString('en-IN')}</Typography>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Remaining</Typography>
            <Typography size={16} type={Font?.Poppins_SemiBold} color="#D98579">₹{parseFloat(item.remaining_balance).toLocaleString('en-IN')}</Typography>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>{pct}% recovered</Typography>

        {item.status === 'active' && (
          <TouchableOpacity
            style={styles.deductBtn}
            onPress={() => { setSelectedAdvance(item); setShowDeductModal(true); }}
          >
            <Typography size={13} color="#D98579" type={Font?.Poppins_Medium}>Manual Deduct</Typography>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title="Advance Management"
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        style_title={{ fontSize: 18 }}
      />

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryBox, { backgroundColor: '#FFF4F2' }]}>
          <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Total Given</Typography>
          <Typography size={16} type={Font?.Poppins_SemiBold} color="#D98579">
            ₹{parseFloat(summary.total_given || 0).toLocaleString('en-IN')}
          </Typography>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: '#EEF9F0' }]}>
          <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Remaining</Typography>
          <Typography size={16} type={Font?.Poppins_SemiBold} color="#16A34A">
            ₹{parseFloat(summary.total_remaining || 0).toLocaleString('en-IN')}
          </Typography>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: '#F0F4FF' }]}>
          <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>Active</Typography>
          <Typography size={16} type={Font?.Poppins_SemiBold} color="#3B6EE8">
            {summary.active_count || 0}
          </Typography>
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, statusFilter === f.value && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Typography size={12} color={statusFilter === f.value ? '#fff' : '#555'} type={Font?.Poppins_Medium}>
              {f.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : (
        <FlatList
          data={advances}
          keyExtractor={item => String(item.id)}
          renderItem={renderAdvanceCard}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Typography type={Font?.Poppins_Regular} size={14} color="#8C8D8B">No advances found.</Typography>
            </View>
          )}
        />
      )}

      {/* Give Advance FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowGiveModal(true)}>
        <Typography size={28} color="#fff">+</Typography>
      </TouchableOpacity>

      {/* ── Give Advance Modal ── */}
      <Modal visible={showGiveModal} animationType="slide" transparent onRequestClose={() => setShowGiveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Typography type={Font?.Poppins_SemiBold} size={18} style={{ marginBottom: 16 }}>Give Advance</Typography>

              <Typography size={13} type={Font?.Poppins_Medium} style={{ marginBottom: 4 }}>Select Staff *</Typography>
              <DropdownComponent
                data={staffList}
                value={selectedStaff}
                onChange={v => setSelectedStaff(v?.value)}
                placeholder="Choose staff member"
                style_dropdown={{ marginHorizontal: 0 }}
                marginHorizontal={0}
              />

              <Typography size={13} type={Font?.Poppins_Medium} style={styles.label}>Advance Amount (₹) *</Typography>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5000"
                keyboardType="numeric"
                value={advAmount}
                onChangeText={setAdvAmount}
              />

              <Typography size={13} type={Font?.Poppins_Medium} style={styles.label}>Deduction Type *</Typography>
              <DropdownComponent
                data={DEDUCTION_TYPES}
                value={deductionType}
                onChange={v => setDeductionType(v?.value)}
                style_dropdown={{ marginHorizontal: 0 }}
                marginHorizontal={0}
              />

              {deductionType === 'installment' && (
                <>
                  <Typography size={13} type={Font?.Poppins_Medium} style={styles.label}>Monthly Installment (₹) *</Typography>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 1000"
                    keyboardType="numeric"
                    value={installmentAmt}
                    onChangeText={setInstallmentAmt}
                  />
                </>
              )}

              <Typography size={13} type={Font?.Poppins_Medium} style={styles.label}>Remarks (optional)</Typography>
              <TextInput
                style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
                placeholder="Any notes..."
                value={remarks}
                onChangeText={setRemarks}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Button
                  title="Cancel"
                  onPress={() => { setShowGiveModal(false); resetGiveForm(); }}
                  main_style={{ flex: 1 }}
                  linerColor={['#eee', '#eee']}
                  style_text={{ color: '#555' }}
                />
                <Button
                  title={submitting ? 'Saving...' : 'Give Advance'}
                  onPress={handleGiveAdvance}
                  main_style={{ flex: 1 }}
                  disabled={submitting}
                  loader={submitting}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Manual Deduct Modal ── */}
      <Modal visible={showDeductModal} animationType="slide" transparent onRequestClose={() => setShowDeductModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: 360 }]}>
            <Typography type={Font?.Poppins_SemiBold} size={18} style={{ marginBottom: 6 }}>Manual Deduction</Typography>
            <Typography size={12} color="#8C8D8B" type={Font?.Poppins_Regular} style={{ marginBottom: 16 }}>
              Remaining: ₹{parseFloat(selectedAdvance?.remaining_balance || 0).toLocaleString('en-IN')}
            </Typography>

            <Typography size={13} type={Font?.Poppins_Medium} style={styles.label}>Deduction Amount (₹) *</Typography>
            <TextInput style={styles.input} placeholder="e.g. 2000" keyboardType="numeric" value={deductAmt} onChangeText={setDeductAmt} />

            <Typography size={13} type={Font?.Poppins_Medium} style={styles.label}>Note (optional)</Typography>
            <TextInput style={styles.input} placeholder="Reason for deduction" value={deductNote} onChangeText={setDeductNote} />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button title="Cancel" onPress={() => setShowDeductModal(false)} main_style={{ flex: 1 }} linerColor={['#eee', '#eee']} style_text={{ color: '#555' }} />
              <Button title={deducting ? 'Saving...' : 'Deduct'} onPress={handleDeduct} main_style={{ flex: 1 }} disabled={deducting} loader={deducting} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Detail Modal ── */}
      <Modal visible={showDetailModal} animationType="slide" transparent onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '85%' }]}>
            <ScrollView>
              <Typography type={Font?.Poppins_SemiBold} size={17} style={{ marginBottom: 12 }}>
                Advance Detail — {getStaffName(detailAdvance)}
              </Typography>
              <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Total</Typography><Typography size={13} type={Font?.Poppins_SemiBold}>₹{parseFloat(detailAdvance?.amount || 0).toLocaleString('en-IN')}</Typography></View>
              <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Remaining</Typography><Typography size={13} type={Font?.Poppins_SemiBold} color="#D98579">₹{parseFloat(detailAdvance?.remaining_balance || 0).toLocaleString('en-IN')}</Typography></View>
              <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Type</Typography><Typography size={13} type={Font?.Poppins_SemiBold}>{detailAdvance?.deduction_type}</Typography></View>
              {detailAdvance?.installment_amount && (
                <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Installment</Typography><Typography size={13} type={Font?.Poppins_SemiBold}>₹{parseFloat(detailAdvance.installment_amount).toLocaleString('en-IN')}/mo</Typography></View>
              )}
              {detailAdvance?.remarks ? <View style={styles.detailRow}><Typography size={13} color="#8C8D8B">Remarks</Typography><Typography size={13}>{detailAdvance.remarks}</Typography></View> : null}

              <Typography type={Font?.Poppins_SemiBold} size={14} style={{ marginTop: 16, marginBottom: 8 }}>Deduction History</Typography>
              {(detailAdvance?.transactions || []).length === 0 ? (
                <Typography size={13} color="#8C8D8B" type={Font?.Poppins_Regular}>No deductions yet.</Typography>
              ) : (
                (detailAdvance?.transactions || []).map((t, i) => (
                  <View key={i} style={styles.txRow}>
                    <View>
                      <Typography size={13} type={Font?.Poppins_Medium}>₹{parseFloat(t.deducted_amount).toLocaleString('en-IN')}</Typography>
                      <Typography size={11} color="#8C8D8B" type={Font?.Poppins_Regular}>{moment(t.created_at).format('DD MMM YYYY')}</Typography>
                    </View>
                    <Typography size={12} color="#8C8D8B">{t.note || ''}</Typography>
                    <Typography size={12} color="#16A34A" type={Font?.Poppins_Medium}>Bal: ₹{parseFloat(t.balance_after).toLocaleString('en-IN')}</Typography>
                  </View>
                ))
              )}
              <Button title="Close" onPress={() => setShowDetailModal(false)} main_style={{ marginTop: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </CommanView>
  );
};

export default AdvanceManagement;

const styles = StyleSheet.create({
  summaryRow:     { flexDirection: 'row', gap: 8, marginVertical: 12 },
  summaryBox:     { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  filterRow:      { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterChip:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F3F3' },
  filterChipActive: { backgroundColor: '#D98579' },
  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarCircle:   { width: 42, height: 42, borderRadius: 21, backgroundColor: '#D98579', justifyContent: 'center', alignItems: 'center' },
  statusBadge:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  amountRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressBg:     { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  progressFill:   { height: 6, backgroundColor: '#16A34A', borderRadius: 3 },
  deductBtn:      { marginTop: 12, alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#D98579', borderRadius: 8 },
  empty:          { alignItems: 'center', marginTop: 60 },
  fab:            { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#D98579', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  label:          { marginTop: 14, marginBottom: 4 },
  input:          { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#FAFAFA' },
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F3F3' },
  txRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
});
