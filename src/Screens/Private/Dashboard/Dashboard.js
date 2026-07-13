import {
  StyleSheet, View, Image, TouchableOpacity, FlatList, ScrollView, TextInput,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import CommanView from '../../../Component/CommanView';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Button from '../../../Component/Button';
import moment from 'moment';
import SimpleModal from '../../../Component/UI/SimpleModal';
import DropdownComponent from '../../../Component/DropdownComponent';
import Input from '../../../Component/Input';
import { useSelector } from 'react-redux';
import LocalizedStrings from '../../../Constants/localization';
import { validators } from '../../../Backend/Validator';
import { isValidForm } from '../../../Backend/Utility';
import SimpleToast from 'react-native-simple-toast';
import { isPlaceholderImage } from '../../../Utils/ImageUtils';
import { useIsFocused } from '@react-navigation/native';
import { GET_WITH_TOKEN, POST_FORM_DATA, API } from '../../../Backend/Backend';
import {
  ActiveTodayUser, HousersoldAttendance, LeaveList, ListStaff,
  ReferralCode,
} from '../../../Backend/api_routes';
import EmptyView from '../../../Component/UI/EmptyView';
import NotificationBell from '../../../Component/NotificationBell';

const getProfileImage = img => {
  if (!img || img.includes('noimage')) return null;
  if (img.startsWith('http')) return img;
  return `${API.replace('/api/', '')}${img}`;
};

const Dashboard = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [status, setStatus] = useState({});
  const [Verify, setVerify] = useState(false);
  const userDetails = useSelector(state => state?.userDetails);
  const [leaveList, setLeaveList] = useState([]);
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [leaveModal, setLeaveModal] = useState({ visible: false, type: null, staff: null, remarks: '', leaveType: null, lateDuration: null });
  const [modalErrors, setModalErrors] = useState({});
  const [activeStaff, setActiveStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Manage Staff state
  const [allStaffList, setAllStaffList] = useState([]);
  const [staffDropdownList, setStaffDropdownList] = useState([]);
  const [activeTab, setActiveTab] = useState(LocalizedStrings.MyStaff?.Active || 'Active');
  const [searchText, setSearchText] = useState('');

  const tabs = [
    LocalizedStrings.MyStaff?.Active || 'Active',
    LocalizedStrings.MyStaff?.Inactive || 'Inactive',
  ];

  useEffect(() => {
    getActiveStaff();
    fetchLeaveTypes();
    fetchStaffList();
    fetchWalletBalance();
  }, [isFocused]);

  const fetchWalletBalance = () => {
    GET_WITH_TOKEN(ReferralCode, s => setWalletBalance(s?.data?.total_earnings || '0.00'), () => {}, () => {});
  };

  const getActiveStaff = () => {
    GET_WITH_TOKEN(ActiveTodayUser, s => {
      const payload = s?.data || s;
      setActiveStaff(payload);
    }, () => {}, () => {});
  };

  const fetchStaffList = () => {
    GET_WITH_TOKEN(ListStaff, s => {
      if (s?.data) {
        const list = s?.data?.data || [];
        setAllStaffList(list);
        const allOption = { value: null, label: LocalizedStrings.Dashboard?.All_Staff || 'All Staff' };
        setStaffDropdownList([allOption, ...list.map(i => ({ value: i.id, label: i.first_name }))]);
      }
    }, () => SimpleToast.show('Failed to load staff', SimpleToast.SHORT), () => {});
  };

  const fetchLeaveTypes = () => {
    GET_WITH_TOKEN(LeaveList, s => {
      setLeaveList(s?.data?.map(i => ({ value: i.id, label: i.name })) || []);
    }, () => {}, () => {});
  };

  const getFilteredActive = () => {
    // Merge attendance info into allStaffList
    let mergedList = allStaffList.map(staff => {
      const activeMatch = (activeStaff?.active_staff || []).find(
        a => a.id === staff.id || a.staff?.id === staff.id
      );
      if (activeMatch) {
        return { ...staff, attendance_details: activeMatch.attendance_details };
      }
      return staff;
    });

    const activeTabValue = LocalizedStrings.MyStaff?.Active || 'Active';
    const inactiveTabValue = LocalizedStrings.MyStaff?.Inactive || 'Inactive';

    let list = mergedList.filter(item => {
      const itemStatus = (item.status || item.application_status || '').toLowerCase();
      if (activeTab === activeTabValue) {
        // Active tab: show only active/hired/present staff (NOT inactive or terminated)
        return itemStatus === 'active' || itemStatus === 'hired' || itemStatus === 'present' || itemStatus === 'accepted' || itemStatus === 'approved';
      }
      if (activeTab === inactiveTabValue) {
        // Inactive tab: show inactive AND terminated staff together
        return itemStatus === 'inactive' || itemStatus === 'terminated' || itemStatus === 'absent';
      }
      return true;
    });

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(item => {
        const name = (item.name || `${item.first_name || ''} ${item.last_name || ''}`).toLowerCase();
        return name.includes(q);
      });
    }

    return list;
  };

  // All staff filter (for manage section)
  const getFilteredManageStaff = () => {
    let list = allStaffList;
    if (activeTab !== (LocalizedStrings.MyStaff?.All || 'All')) {
      list = list.filter(item => {
        const st = item.status?.toLowerCase() || item.application_status?.toLowerCase();
        if (activeTab === (LocalizedStrings.MyStaff?.Active || 'Active')) return st === 'active' || st === 'present' || st === 'hired' || st === 'accepted' || st === 'approved';
        if (activeTab === (LocalizedStrings.MyStaff?.On_Leave || 'On Leave')) return st === 'on_leave' || st === 'on leave' || st === 'leave';
        if (activeTab === (LocalizedStrings.MyStaff?.Inactive || 'Inactive')) return st === 'inactive' || st === 'absent';
        if (activeTab === 'Terminated') return st === 'terminated';
        return true;
      });
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(item => {
        const name = (item.name || `${item.first_name || ''} ${item.last_name || ''}`).toLowerCase();
        const rawRole = item.user_work_info?.primary_role;
        const role = (Array.isArray(rawRole) ? rawRole.join(', ') : rawRole || '').toLowerCase();
        return name.includes(q) || role.includes(q);
      });
    }
    return list;
  };

  const getStatusColor = s => {
    switch (s?.toLowerCase()) {
      case 'active': case 'present': case 'hired': case 'accepted': case 'approved': return '#4CAF50';
      case 'on_leave': case 'on leave': case 'leave': return '#FFC107';
      case 'inactive': case 'absent': return '#F44336';
      case 'terminated': return '#7B2D2D';
      default: return '#999';
    }
  };

  const getStatusLabel = s => {
    switch (s?.toLowerCase()) {
      case 'active': case 'present': case 'hired': case 'accepted': case 'approved': return LocalizedStrings.MyStaff?.Active || 'Active';
      case 'on_leave': case 'on leave': case 'leave': return LocalizedStrings.MyStaff?.On_Leave || 'On Leave';
      case 'inactive': case 'absent': return LocalizedStrings.MyStaff?.Inactive || 'Inactive';
      case 'terminated': return 'Terminated';
      default: return s || '';
    }
  };

  const handleStatusChange = (data, newStatus) => {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const formdata = new FormData();
    formdata.append('staff_id', data?.id || data?.staff?.id);
    formdata.append('date', date);
    formdata.append('status', newStatus);
    formdata.append('check_in_time', time);
    if (newStatus === 'absent') formdata.append('leave_id', leaveModal.leaveType?.value);
    else if (newStatus === 'late') formdata.append('late_minutes', leaveModal.leaveType?.value);
    formdata.append('description', leaveModal?.remarks);
    POST_FORM_DATA(HousersoldAttendance, formdata, () => {
      getActiveStaff();
      SimpleToast.show(`Status updated to ${newStatus}`, SimpleToast.SHORT);
    }, e => console.log('error', e), () => {});
  };

  const renderActiveStaffCard = ({ item }) => {
    const itemStatus = (item.status || item.application_status || '').toLowerCase();
    const isActive = itemStatus === 'active' || itemStatus === 'hired' || itemStatus === 'present';

    return (
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.profileRow}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('StaffActionScreen', { staff: item })}
        >
          <Image source={{ uri: item.image }} style={styles.avatar} />
          <View>
            <Typography type={Font?.Poppins_SemiBold} size={16}>
              {`${item?.first_name || ''} ${item?.last_name || ''}`.trim() || item.name}
            </Typography>
            <Typography type={Font?.Poppins_Regular} size={14}>
              {item?.user_work_info?.primary_role || item?.staff?.user_work_info?.primary_role}
            </Typography>
          </View>
        </TouchableOpacity>
        <View style={[styles.dot, { backgroundColor: getStatusColor(itemStatus) }]} />
        {isActive && (
          <View style={styles.statusRow}>
            {['present', 'absent', 'late'].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusBtn,
                  (status[item.id] === s || item?.attendance_details?.status === s) && styles[`${s}Btn`]]}
                onPress={() => {
                  if (s === 'absent' || s === 'late') {
                    setLeaveModal({ visible: true, type: s, staff: item, remarks: '', leaveType: null, lateDuration: null });
                    setModalErrors({});
                  } else {
                    handleStatusChange(item, s);
                  }
                }}
              >
                <Image
                  source={s === 'present' ? ImageConstant?.present : s === 'absent' ? ImageConstant?.absent : ImageConstant?.late}
                  tintColor={(status[item.id] === s || item?.attendance_details?.status === s) ? '#fff' : '#000'}
                  style={{ width: 16, height: 16, marginRight: 6 }}
                />
                <Typography
                  type={Font?.Poppins_Medium}
                  color={(status[item.id] === s || item?.attendance_details?.status === s) ? '#fff' : '#000'}
                >
                  {s === 'present' ? LocalizedStrings.Dashboard?.Present : s === 'absent' ? LocalizedStrings.Dashboard?.Absent : LocalizedStrings.Dashboard?.Late}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderManageStaffCard = ({ item }) => {
    const rawRole = item.user_work_info?.primary_role || item.role;
    const role = Array.isArray(rawRole) ? rawRole.join(', ') : rawRole || 'Staff';
    const addr = item?.addresses?.[0] || {};
    const locationParts = [addr?.street, addr?.locality, addr?.city].filter(Boolean);
    const locationText = locationParts.join(', ') || addr?.title || '';
    return (
      <TouchableOpacity
        style={styles.manageCard}
        onPress={() => navigation.navigate('HouseHoldStaffProfile', { item })}
      >
        {getProfileImage(item?.image) ? (
          <Image source={{ uri: getProfileImage(item?.image) }} style={styles.manageAvatar} />
        ) : (
          <View style={[styles.manageAvatar, { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }]}>
            <Typography type={Font?.Poppins_Medium} size={16} color="#333">
              {item?.first_name?.charAt(0) || item?.name?.charAt(0) || '?'}
            </Typography>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Typography type={Font?.Poppins_Medium} size={15} color="#171A1F">
            {item.first_name ? `${item.first_name} ${item.last_name || ''}`.trim() : item.name}
          </Typography>
          <Typography type={Font?.Poppins_Regular} size={13} color="#6B7280" style={{ marginTop: 2 }}>
            {role}
          </Typography>
          {locationText ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#FFF5F4', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
              <Image source={ImageConstant?.Location} style={{ width: 10, height: 10, marginRight: 4, tintColor: '#D98579' }} />
              <Typography type={Font?.Poppins_Medium} size={11} color="#D98579">{locationText}</Typography>
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Typography type={Font?.Poppins_Regular} size={13} color="#444">{getStatusLabel(item.status)}</Typography>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <CommanView>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, backgroundColor: '#FFFFFF' }}>
          <TouchableOpacity onPress={() => navigation.navigate('ReferAndEarn')} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ height: 32, width: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#D98579', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
              <Typography type={Font?.Poppins_SemiBold} style={{ fontSize: 16, color: '#D98579' }}>{'\u20B9'}</Typography>
            </View>
            <View style={{ marginLeft: 6 }}>
              <Typography type={Font?.Poppins_Medium} style={{ fontSize: 11, color: '#555' }}>Wallet</Typography>
              <Typography type={Font?.Poppins_SemiBold} style={{ fontSize: 13, color: '#1a1a1a' }}>{'\u20B9'}{walletBalance || '0.00'}</Typography>
            </View>
          </TouchableOpacity>
          <Typography type={Font?.Poppins_Medium} style={{ flex: 1, textAlign: 'center', fontSize: 18, color: '#000' }}>
            {LocalizedStrings.Dashboard?.title}
          </Typography>
          <NotificationBell navigateTo="Notification" style={{marginRight: 10}} />
          <TouchableOpacity onPress={() => navigation.navigate('ProfileManagement')}>
            <Image
              source={userDetails?.image && !isPlaceholderImage(userDetails?.image) ? { uri: userDetails?.image } : ImageConstant.user}
              style={{ height: 35, width: 35, borderRadius: 40, resizeMode: 'cover' }}
            />
          </TouchableOpacity>
        </View>
        <View style={{ borderBottomWidth: 1, borderColor: '#EBEBEA' }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* ── Active Staff (Today's Attendance) ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography type={Font?.Poppins_Medium} color="#171A1F" lineHeight={30} size={20} style={{ paddingVertical: 14 }}>
              {LocalizedStrings.Dashboard?.Active_staf}
            </Typography>
            <Typography type={Font?.Poppins_Regular} color="#171A1F" lineHeight={30} size={14} style={{ paddingVertical: 14 }}>
              {moment(activeStaff?.status?.date || new Date()).format('DD/MM/YYYY')} (Today)
            </Typography>
          </View>

          <View style={styles.tabRow}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              >
                <Typography type={Font?.Poppins_Medium} size={13} color={activeTab === tab ? '#fff' : '#171A1F'}>
                  {tab}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={getFilteredActive()}
            keyExtractor={item => String(item.id)}
            renderItem={renderActiveStaffCard}
            scrollEnabled={false}
            ListEmptyComponent={() => (
              <EmptyView title={'No active staff today'} description={'No staff are marked active today.'} icon={ImageConstant?.Users} iconColor="#D98579" />
            )}
          />

        </ScrollView>
        {/* Modals */}
        <SimpleModal
          visible={leaveModal.visible}
          onClose={() => { setLeaveModal({ ...leaveModal, visible: false }); setModalErrors({}); }}
        >
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => { setLeaveModal({ ...leaveModal, visible: false }); setModalErrors({}); }}>
              <Typography size={15} type={Font?.Poppins_Bold} color="#C77166">✕</Typography>
            </TouchableOpacity>
            <Typography size={18} type={Font?.Poppins_SemiBold} style={{ marginBottom: 25, textAlign: 'center' }}>
              {leaveModal.type === 'absent' ? LocalizedStrings.Dashboard_model?.Mark_Absent : LocalizedStrings.Dashboard_model?.Mark_late}
            </Typography>
            {leaveModal.staff && (
              <View style={styles.staffInfo}>
                <Image source={{ uri: leaveModal.staff.image }} style={styles.staffAvatar} />
                <View>
                  <Typography size={16} type={Font?.Poppins_SemiBold}>{leaveModal.staff.name}</Typography>
                  <Typography size={14} type={Font?.Poppins_Regular}>{leaveModal.staff.role}</Typography>
                </View>
              </View>
            )}
            {leaveModal.type === 'absent' ? (
              <DropdownComponent
                title={LocalizedStrings.Dashboard_model?.Leave_Type}
                placeholder="Select Type"
                width={'100%'}
                style_dropdown={{ marginHorizontal: 0 }}
                selectedTextStyleNew={{ marginLeft: 10, fontFamily: Font.Poppins_Regular }}
                marginHorizontal={0}
                style_title={{ textAlign: 'left', fontFamily: Font.Poppins_Regular }}
                value={leaveModal.leaveType?.value}
                data={leaveList}
                onChange={item => { setLeaveModal(p => ({ ...p, leaveType: item || null })); if (modalErrors?.leaveType) setModalErrors({ ...modalErrors, leaveType: null }); }}
                error={modalErrors?.leaveType}
              />
            ) : (
              <DropdownComponent
                title={LocalizedStrings.Dashboard_model?.late_Short}
                placeholder="Select Hours"
                width={'100%'}
                style_dropdown={{ marginHorizontal: 0 }}
                selectedTextStyleNew={{ marginLeft: 10, fontFamily: Font.Poppins_Regular }}
                marginHorizontal={0}
                style_title={{ textAlign: 'left', fontFamily: Font.Poppins_Regular }}
                value={leaveModal.leaveType?.value}
                data={[1,2,3,4,5,6,7].map(v => ({ value: v, label: String(v) }))}
                onChange={item => { setLeaveModal(p => ({ ...p, leaveType: item || null })); if (modalErrors?.leaveType) setModalErrors({ ...modalErrors, leaveType: null }); }}
                error={modalErrors?.leaveType}
              />
            )}
            <Input
              title={LocalizedStrings.Dashboard_model?.Remarks}
              placeholder="Enter remarks"
              value={leaveModal.remarks}
              onChange={text => { setLeaveModal(p => ({ ...p, remarks: text })); if (modalErrors?.remarks) setModalErrors({ ...modalErrors, remarks: null }); }}
              multiline
              error={modalErrors?.remarks}
            />
            <Button
              title={LocalizedStrings.Dashboard_model?.Done}
              onPress={() => {
                const errors = {};
                if (leaveModal.type === 'absent') errors.leaveType = validators.checkRequire('Leave Type', leaveModal.leaveType?.value);
                setModalErrors(errors);
                if (isValidForm(errors)) {
                  setLeaveModal({ ...leaveModal, visible: false });
                  setModalErrors({});
                  handleStatusChange(leaveModal?.staff, leaveModal.type);
                }
              }}
              main_style={{ width: '100%', marginTop: 20 }}
            />
          </View>
        </SimpleModal>

        <SimpleModal visible={Verify}>
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ padding: 40 }}>
              <Image source={ImageConstant?.ic_success} style={{ width: 60, height: 60, resizeMode: 'contain' }} />
            </View>
            <Typography size={20} type={Font?.Poppins_SemiBold} textAlign="center">
              {LocalizedStrings.Dashboard_model?.Staff_Leave_Updated || 'Staff Leave Updated!'}
            </Typography>
            <Typography size={16} type={Font?.Poppins_Regular} textAlign="center" color="#8C8D8B" style={{ marginTop: 30 }}>
              {leaveModal.staff?.name || 'Staff'}'s {leaveModal.type} has been recorded successfully.
            </Typography>
            <Button title={'Done'} onPress={() => { setVerify(false); navigation.navigate('TabNavigation'); }} main_style={{ marginTop: 20, width: '100%' }} icon={ImageConstant?.Arrow} />
          </View>
        </SimpleModal>
      </CommanView>

      {/* Add New Staff & Find Staff (Sticky Bottom) */}
      <View style={{ paddingTop: 15, paddingBottom: 80, paddingHorizontal: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#eee' }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('AiCopilot')}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F3', borderWidth: 1, borderColor: '#D98579', borderRadius: 10, paddingVertical: 12, marginBottom: 12 }}>
          <Typography type={Font.Poppins_SemiBold} style={{ fontSize: 13, marginRight: 8, color: '#D98579' }}>AI</Typography>
          <Typography type={Font.Poppins_SemiBold} style={{ color: '#D98579', fontSize: 14 }}>Chat with Sahayya AI</Typography>
        </TouchableOpacity>
        <Button
          onPress={() => navigation.navigate('AllStaff')}
          title={LocalizedStrings.Dashboard?.find_staf || 'Find Staff'}
          main_style={{ width: '100%', marginBottom: 12 }}
        />
        <Button
          onPress={() => navigation.navigate('Aadhar')}
          title={'+ ' + (LocalizedStrings.MyStaff?.Add_New_Staff || 'Add New Staff')}
          main_style={{ width: '100%' }}
        />
      </View>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', padding: 15, marginHorizontal: 5, marginVertical: 10,
    borderRadius: 12, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 45, height: 45, borderRadius: 22, marginRight: 12 },
  dot: { width: 10, height: 10, position: 'absolute', borderRadius: 10, right: 10, top: 10, backgroundColor: '#ccc' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  statusBtn: {
    flex: 1, minWidth: 80, maxWidth: '32%', marginHorizontal: 3, borderWidth: 1, borderColor: '#ccc',
    borderRadius: 8, paddingVertical: 8, alignItems: 'center', flexDirection: 'row', paddingHorizontal: 6, justifyContent: 'center',
  },
  presentBtn: { backgroundColor: '#1DD75B' },
  absentBtn: { backgroundColor: '#BE615B' },
  lateBtn: { backgroundColor: '#EFB034' },
  divider: { height: 1, backgroundColor: '#EBEBEA', marginVertical: 20 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
    borderRadius: 10, paddingHorizontal: 12, marginBottom: 10, height: 44,
  },
  searchIcon: { width: 16, height: 16, tintColor: '#999', marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', fontFamily: Font.Poppins_Regular },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  tabButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F2F4F7' },
  activeTabButton: { backgroundColor: '#D98579' },
  manageCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 10, borderRadius: 12, paddingVertical: 16, marginBottom: 10,
    borderColor: '#EBEBEA', borderWidth: 2,
  },
  manageAvatar: { width: 45, height: 45, borderRadius: 30, backgroundColor: '#E0E0E0' },
  statusDot: { width: 10, height: 10, borderRadius: 10, marginRight: 6 },
  modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  closeBtn: {
    position: 'absolute', top: 0, right: 0, zIndex: 1,
    borderWidth: 2, borderColor: '#C77166', paddingHorizontal: 4.5,
  },
  staffInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  staffAvatar: { width: 45, height: 45, borderRadius: 22, marginRight: 12 },
});
