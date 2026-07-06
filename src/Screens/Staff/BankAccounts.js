import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState, useCallback } from 'react';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import { POST_WITH_TOKEN, GET_WITH_TOKEN } from '../../Backend/Backend';
import {
  BankAccountList,
  BankAccountAdd,
  BankAccountUpdate,
  BankAccountDelete,
  BankAccountSetDefault,
} from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import { useIsFocused } from '@react-navigation/native';

const EMPTY_FORM = { bank_name: '', account_number: '', ifsc_code: '', bank_type: 'saving' };

const BankAccounts = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAccounts = useCallback(() => {
    setLoading(true);
    GET_WITH_TOKEN(
      BankAccountList,
      success => {
        setLoading(false);
        setAccounts(success?.data || []);
      },
      () => { setLoading(false); },
      () => { setLoading(false); SimpleToast.show('Network error', SimpleToast.SHORT); },
    );
  }, []);

  React.useEffect(() => {
    if (isFocused) fetchAccounts();
  }, [isFocused, fetchAccounts]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      bank_name: item.bank_name || '',
      account_number: item.account_number || '',
      ifsc_code: item.ifsc_code || '',
      bank_type: item.bank_type || 'saving',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.bank_name.trim()) {
      SimpleToast.show('Enter bank name', SimpleToast.SHORT);
      return;
    }
    if (!form.account_number.trim() || form.account_number.trim().length < 5) {
      SimpleToast.show('Enter valid account number (min 5 digits)', SimpleToast.SHORT);
      return;
    }
    if (!form.ifsc_code.trim() || form.ifsc_code.trim().length !== 11) {
      SimpleToast.show('Enter valid 11-character IFSC code', SimpleToast.SHORT);
      return;
    }

    setSaving(true);
    const body = {
      bank_name: form.bank_name.trim(),
      account_number: form.account_number.trim(),
      ifsc_code: form.ifsc_code.trim().toUpperCase(),
      bank_type: form.bank_type,
    };

    if (editingId) {
      POST_WITH_TOKEN(
        `${BankAccountUpdate}/${editingId}`,
        body,
        success => {
          setSaving(false);
          setShowForm(false);
          SimpleToast.show('Bank account updated', SimpleToast.SHORT);
          fetchAccounts();
        },
        error => {
          setSaving(false);
          SimpleToast.show(error?.data?.message || 'Failed to update', SimpleToast.SHORT);
        },
        () => { setSaving(false); SimpleToast.show('Network error', SimpleToast.SHORT); },
      );
    } else {
      POST_WITH_TOKEN(
        BankAccountAdd,
        body,
        success => {
          setSaving(false);
          setShowForm(false);
          SimpleToast.show('Bank account added', SimpleToast.SHORT);
          fetchAccounts();
        },
        error => {
          setSaving(false);
          SimpleToast.show(error?.data?.message || 'Failed to add', SimpleToast.SHORT);
        },
        () => { setSaving(false); SimpleToast.show('Network error', SimpleToast.SHORT); },
      );
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Bank Account',
      `Remove ${item.bank_name} (****${(item.account_number || '').slice(-4)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDeletingId(item.id);
            POST_WITH_TOKEN(
              `${BankAccountDelete}/${item.id}`,
              {},
              () => {
                setDeletingId(null);
                SimpleToast.show('Bank account deleted', SimpleToast.SHORT);
                fetchAccounts();
              },
              error => {
                setDeletingId(null);
                SimpleToast.show(error?.data?.message || 'Failed to delete', SimpleToast.SHORT);
              },
              () => { setDeletingId(null); SimpleToast.show('Network error', SimpleToast.SHORT); },
            );
          },
        },
      ],
    );
  };

  const handleSetDefault = (item) => {
    POST_WITH_TOKEN(
      `${BankAccountSetDefault}/${item.id}`,
      {},
      () => {
        SimpleToast.show('Default bank account set', SimpleToast.SHORT);
        fetchAccounts();
      },
      error => {
        SimpleToast.show(error?.data?.message || 'Failed to set default', SimpleToast.SHORT);
      },
      () => { SimpleToast.show('Network error', SimpleToast.SHORT); },
    );
  };

  const maskAccount = (num) => {
    if (!num || num.length <= 4) return num || '****';
    return '****' + num.slice(-4);
  };

  const renderItem = ({ item }) => {
    const isDefault = item.is_set === 1 || item.is_set === true;
    return (
      <View style={[styles.card, isDefault && styles.cardDefault]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Typography type={Font?.Poppins_SemiBold} size={15}>
              {item.bank_name}
            </Typography>
            <Typography type={Font?.Poppins_Regular} size={12} color="#888">
              {item.bank_type === 'saving' ? 'Savings Account' : 'Current Account'}
            </Typography>
          </View>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Typography type={Font?.Poppins_SemiBold} size={10} color="#fff">
                DEFAULT
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.detailRow}>
          <Typography type={Font?.Poppins_Regular} size={12} color="#666">
            A/C No:
          </Typography>
          <Typography type={Font?.Poppins_Medium} size={13}>
            {maskAccount(item.account_number)}
          </Typography>
        </View>

        <View style={styles.detailRow}>
          <Typography type={Font?.Poppins_Regular} size={12} color="#666">
            IFSC:
          </Typography>
          <Typography type={Font?.Poppins_Medium} size={13}>
            {item.ifsc_code}
          </Typography>
        </View>

        <View style={styles.cardActions}>
          {!isDefault && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleSetDefault(item)}
            >
              <Typography type={Font?.Poppins_Medium} size={12} color="#4CAF50">
                Set as Default
              </Typography>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openEdit(item)}
          >
            <Typography type={Font?.Poppins_Medium} size={12} color="#2196F3">
              Edit
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(item)}
            disabled={deletingId === item.id}
          >
            <Typography type={Font?.Poppins_Medium} size={12} color="#F44336">
              {deletingId === item.id ? 'Deleting...' : 'Delete'}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title="My Bank Accounts"
        isBack
        onPress={() => navigation.goBack()}
      />

      <View style={styles.container}>
        <Typography type={Font?.Poppins_Regular} size={12} color="#888" style={{ marginBottom: 12 }}>
          Add your bank account to receive salary payments directly.
        </Typography>

        {loading ? (
          <ActivityIndicator size="large" color="#D98579" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={accounts}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Typography type={Font?.Poppins_Medium} size={14} color="#999">
                  No bank accounts added yet
                </Typography>
                <Typography type={Font?.Poppins_Regular} size={12} color="#bbb" style={{ marginTop: 4 }}>
                  Tap the button below to add one
                </Typography>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.8}>
          <Typography type={Font?.Poppins_SemiBold} size={18} color="#fff">
            +
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Typography type={Font?.Poppins_SemiBold} size={16} style={{ marginBottom: 16 }}>
              {editingId ? 'Edit Bank Account' : 'Add Bank Account'}
            </Typography>

            <Typography type={Font?.Poppins_Regular} size={12} color="#666" style={{ marginBottom: 4 }}>
              Bank Name *
            </Typography>
            <TextInput
              style={styles.input}
              placeholder="e.g. SBI, HDFC, ICICI"
              placeholderTextColor="#bbb"
              value={form.bank_name}
              onChangeText={t => setForm(f => ({ ...f, bank_name: t }))}
            />

            <Typography type={Font?.Poppins_Regular} size={12} color="#666" style={{ marginBottom: 4, marginTop: 12 }}>
              Account Number *
            </Typography>
            <TextInput
              style={styles.input}
              placeholder="Enter account number"
              placeholderTextColor="#bbb"
              keyboardType="numeric"
              value={form.account_number}
              onChangeText={t => setForm(f => ({ ...f, account_number: t }))}
            />

            <Typography type={Font?.Poppins_Regular} size={12} color="#666" style={{ marginBottom: 4, marginTop: 12 }}>
              IFSC Code *
            </Typography>
            <TextInput
              style={styles.input}
              placeholder="e.g. SBIN0001234"
              placeholderTextColor="#bbb"
              autoCapitalize="characters"
              value={form.ifsc_code}
              onChangeText={t => setForm(f => ({ ...f, ifsc_code: t }))}
            />

            <Typography type={Font?.Poppins_Regular} size={12} color="#666" style={{ marginBottom: 8, marginTop: 12 }}>
              Account Type
            </Typography>
            <View style={styles.typeRow}>
              {['saving', 'current'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, form.bank_type === type && styles.typeBtnActive]}
                  onPress={() => setForm(f => ({ ...f, bank_type: type }))}
                >
                  <Typography
                    type={Font?.Poppins_Medium}
                    size={13}
                    color={form.bank_type === type ? '#fff' : '#333'}
                  >
                    {type === 'saving' ? 'Savings' : 'Current'}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowForm(false)}
              >
                <Typography type={Font?.Poppins_Medium} size={14} color="#666">
                  Cancel
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Typography type={Font?.Poppins_SemiBold} size={14} color="#fff">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add Account'}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </CommanView>
  );
};

export default BankAccounts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardDefault: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  actionBtn: {
    marginLeft: 16,
    paddingVertical: 4,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D98579',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#D98579',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
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
    paddingBottom: 36,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: Font?.Poppins_Regular,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  typeBtnActive: {
    backgroundColor: '#D98579',
    borderColor: '#D98579',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#D98579',
  },
});
