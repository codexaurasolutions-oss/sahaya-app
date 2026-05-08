import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
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
import { useIsFocused } from '@react-navigation/native';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../../Backend/Backend';
import {
  ActiveTodayUser,
  HousersoldAttendance,
  LeaveList,
  ListStaff,
  ReferralCode,
} from '../../../Backend/api_routes';
import EmptyView from '../../../Component/UI/EmptyView';

const Dashboard = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [status, setStatus] = useState({});
  const [Verify, setVerify] = useState(false);
  const userDetails = useSelector(state => state?.userDetails);
  const [leaveList, setLeaveList] = useState([]);
  const [walletBalance, setWalletBalance] = useState('0.00');

  const [leaveModal, setLeaveModal] = useState({
    visible: false,
    type: null,
    staff: null,
    remarks: '',
    leaveType: null,
    lateDuration: null,
  });
  const [modalErrors, setModalErrors] = useState({});
  const [activeStaff, setActiveStaff] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    getaAtiveStaff();
    fetchLeaveTypes();
    fetchStaffList();
    fetchWalletBalance();
  }, [isFocused]);

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

  const getaAtiveStaff = () => {
    GET_WITH_TOKEN(
      ActiveTodayUser,
      success => {
        console.log('success?.data-----000', success?.data);
        setActiveStaff(success?.data);
      },
      error => {
        // Silently ignore - no staff hired yet is normal
      },
      fail => {
        // Silently ignore network issues for active staff
      },
    );
  };

  const fetchStaffList = () => {
    GET_WITH_TOKEN(
      ListStaff,
      success => {
        if (success?.data) {
          const allOption = { value: null, label: LocalizedStrings.Dashboard?.All_Staff || 'All Staff' };
          const staffOptions = success?.data?.data?.map(item => ({
            value: item.id,
            label: item.first_name,
          }));
          setStaffList([allOption, ...(staffOptions || [])]);
        }
      },
      error => {
        SimpleToast.show('Failed to load staff list', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const getFilteredStaff = () => {
    if (!selectedStaff || selectedStaff.value === null) {
      return activeStaff?.active_staff;
    }
    return activeStaff?.active_staff?.filter(
      item => item?.staff?.id === selectedStaff.value || item?.id === selectedStaff.value,
    );
  };

  const fetchLeaveTypes = () => {
    GET_WITH_TOKEN(
      LeaveList,
      success => {
        const leaveTypes = success?.data?.map(item => ({
          value: item.id,
          label: item.name,
        }));
        setLeaveList(leaveTypes || []);
      },
      error => {
        console.log('error----', error);
        SimpleToast.show('Failed to load leave types', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const handleStatusChange = (data, newStatus) => {
    // setStatus(prev => ({ ...prev, [data?.id]: newStatus }));
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format for MySQL DATE column
    const time = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24-hour format
    });

    const formdata = new FormData();
    formdata?.append('staff_id', data?.staff?.id);
    formdata?.append('date', date);
    formdata?.append('status', newStatus);
    formdata?.append('check_in_time', time);
    if (newStatus === 'absent') {
      formdata?.append('leave_id', leaveModal.leaveType?.value);
    } else if (newStatus === 'late') {
      formdata?.append('late_minutes', leaveModal.leaveType?.value);
    }
    formdata?.append('description', leaveModal?.remarks);
    console.log('formdata', formdata);

    POST_FORM_DATA(
      HousersoldAttendance,
      formdata,
      success => {
        getaAtiveStaff();
        SimpleToast.show(
          `Your profile status is now ${newStatus}`,
          SimpleToast.SHORT,
        );
      },
      error => {
        console.log('error---', error);
      },
      fail => {},
    );
  };

  const renderStaff = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.profileRow}>
        <Image source={{ uri: item.image }} style={styles.avatar} />
        <View>
          <Typography type={Font?.Poppins_SemiBold} size={16}>
            {`${item?.first_name || ''} ${item?.last_name || ''}`.trim() || item.name}
          </Typography>

          <Typography type={Font?.Poppins_Regular} size={14}>
            {item?.staff?.user_work_info?.primary_role}
          </Typography>
        </View>
      </View>
      <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={[
            styles.statusBtn,
            (status[item.id] == 'present' ||
              item?.attendance_details?.status == 'present') &&
              styles.presentBtn,
          ]}
          onPress={() => handleStatusChange(item, 'present')}
        >
          <Image
            source={ImageConstant?.present}
            tintColor={
              status[item.id] == 'present' ||
              item?.attendance_details?.status == 'present'
                ? '#fff'
                : '#000'
            }
            style={{ width: 16, height: 16, marginRight: 6 }}
          />
          <Typography
            type={Font?.Poppins_Medium}
            color={
              status[item.id] == 'present' ||
              item?.attendance_details?.status == 'present'
                ? '#fff'
                : '#000'
            }
          >
            {LocalizedStrings.Dashboard.Present}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusBtn,
            (status[item.id] == 'absent' ||
              item?.attendance_details?.status == 'absent') &&
              styles.absentBtn,
          ]}
          onPress={() => {
            setLeaveModal({
              visible: true,
              type: 'absent',
              staff: item,
              remarks: '',
              leaveType: null,
              lateDuration: null,
            });
            setModalErrors({});
          }}
        >
          <Image
            tintColor={
              status[item.id] == 'absent' ||
              item?.attendance_details?.status == 'absent'
                ? '#fff'
                : '#000'
            }
            source={ImageConstant?.absent}
            style={{ width: 16, height: 16, marginRight: 6 }}
          />
          <Typography
            type={Font?.Poppins_Medium}
            color={
              status[item.id] == 'absent' ||
              item?.attendance_details?.status == 'absent'
                ? '#fff'
                : '#000'
            }
          >
            {LocalizedStrings.Dashboard.Absent}
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusBtn,
            (status[item.id] == 'late' ||
              item?.attendance_details?.status == 'late') &&
              styles.lateBtn,
          ]}
          onPress={() => {
            setLeaveModal({
              visible: true,
              type: 'late',
              staff: item,
              remarks: '',
              leaveType: null,
              lateDuration: null,
            });
            setModalErrors({});
          }}
        >
          <Image
            source={ImageConstant?.late}
            style={{ width: 16, height: 16, marginRight: 6 }}
            tintColor={
              status[item.id] == 'late' ||
              item?.attendance_details?.status == 'late'
                ? '#fff'
                : '#000'
            }
          />
          <Typography
            type={Font?.Poppins_Medium}
            color={
              status[item.id] == 'late' ||
              item?.attendance_details?.status == 'late'
                ? '#fff'
                : '#000'
            }
          >
            {LocalizedStrings.Dashboard.Late}
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
    <CommanView>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, backgroundColor: '#FFFFFF' }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ReferAndEarn')}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <View style={{
            height: 32, width: 32, borderRadius: 16,
            borderWidth: 1.5, borderColor: '#D98579',
            backgroundColor: '#FFFFFF',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Typography type={Font?.Poppins_SemiBold} style={{ fontSize: 16, color: '#D98579' }}>
              {'\u20B9'}
            </Typography>
          </View>
          <View style={{ marginLeft: 6 }}>
            <Typography type={Font?.Poppins_Medium} style={{ fontSize: 11, color: '#555' }}>
              Wallet
            </Typography>
            <Typography type={Font?.Poppins_SemiBold} style={{ fontSize: 13, color: '#1a1a1a' }}>
              {'\u20B9'}{walletBalance || '0.00'}
            </Typography>
          </View>
        </TouchableOpacity>

        <Typography
          type={Font?.Poppins_Medium}
          style={{ flex: 1, textAlign: 'center', fontSize: 18, color: '#000' }}
        >
          {LocalizedStrings.Dashboard.title}
        </Typography>

        <TouchableOpacity onPress={() => navigation.navigate('Notification')} style={{ marginRight: 10 }}>
          <Image source={ImageConstant?.notification} style={{ height: 30, width: 30, resizeMode: 'center' }} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ProfileManagement')}>
          <Image
            source={
              userDetails?.image && typeof userDetails?.image === 'string' && !userDetails?.image?.includes('noimage.jpg')
                ? { uri: userDetails?.image }
                : ImageConstant.user
            }
            style={{ height: 35, width: 35, borderRadius: 40, resizeMode: 'cover' }}
          />
        </TouchableOpacity>
      </View>
      <View style={{ borderBottomWidth: 1, borderColor: '#EBEBEA' }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Typography
          type={Font?.Poppins_Medium}
          color="#171A1F"
          lineHeight={30}
          size={20}
          style={{ paddingVertical: 20 }}
        >
          {LocalizedStrings.Dashboard.Active_staf}
        </Typography>
        <Typography
          type={Font?.Poppins_Regular}
          color="#171A1F"
          lineHeight={30}
          size={14}
          style={{ paddingVertical: 20 }}
        >
          {moment(activeStaff?.status?.date).format('DD/MM/YYYY')} (Today)
        </Typography>
      </View>

      <DropdownComponent
        title={LocalizedStrings.Dashboard?.Select_Staff || 'Select Staff'}
        placeholder={LocalizedStrings.Dashboard?.All_Staff || 'All Staff'}
        width={'100%'}
        style_dropdown={{ marginHorizontal: 0 }}
        selectedTextStyleNew={{
          marginLeft: 10,
          fontFamily: Font.Poppins_Regular,
        }}
        marginHorizontal={0}
        style_title={{
          textAlign: 'left',
          fontFamily: Font.Poppins_Regular,
        }}
        data={staffList}
        value={selectedStaff}
        onChange={item => {
          setSelectedStaff(item);
        }}
      />

      <FlatList
        data={getFilteredStaff()}
        keyExtractor={item => item.id}
        renderItem={renderStaff}
        ListEmptyComponent={() => (
          <EmptyView
            title={'No active staff'}
            description={'No active staff are available right now.'}
            icon={ImageConstant?.Users}
            iconColor="#D98579"
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <SimpleModal
        visible={leaveModal.visible}
        onClose={() => {
          setLeaveModal({ ...leaveModal, visible: false });
          setModalErrors({});
        }}
      >
        <View style={styles.modalBox}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              setLeaveModal({ ...leaveModal, visible: false });
              setModalErrors({});
            }}
          >
            <Typography size={15} type={Font?.Poppins_Bold} color="#C77166">
              ✕
            </Typography>
          </TouchableOpacity>

          <Typography
            size={18}
            type={Font?.Poppins_SemiBold}
            style={{ marginBottom: 25, textAlign: 'center' }}
          >
            {leaveModal.type == 'Absent'
              ? LocalizedStrings.Dashboard_model.Mark_Absent
              : LocalizedStrings.Dashboard_model.Mark_late}
          </Typography>

          {leaveModal.staff && (
            <View style={styles.staffInfo}>
              <Image
                source={{ uri: leaveModal.staff.image }}
                style={styles.staffAvatar}
              />
              <View>
                <Typography size={16} type={Font?.Poppins_SemiBold}>
                  {leaveModal.staff.name}
                </Typography>
                <Typography size={14} type={Font?.Poppins_Regular}>
                  {leaveModal.staff.role}
                </Typography>
              </View>
            </View>
          )}

          {leaveModal.type == 'absent' ? (
            <DropdownComponent
              title={LocalizedStrings.Dashboard_model.Leave_Type}
              placeholder="Select Type"
              width={'100%'}
              style_dropdown={{ marginHorizontal: 0 }}
              selectedTextStyleNew={{
                marginLeft: 10,
                fontFamily: Font.Poppins_Regular,
              }}
              marginHorizontal={0}
              style_title={{
                textAlign: 'left',
                fontFamily: Font.Poppins_Regular,
              }}
              value={leaveModal.leaveType?.value}
              data={leaveList}
              onChange={item => {
                setLeaveModal(prev => ({ ...prev, leaveType: item || null }));
                if (modalErrors?.leaveType) {
                  setModalErrors({ ...modalErrors, leaveType: null });
                }
              }}
              error={modalErrors?.leaveType}
            />
          ) : (
            <DropdownComponent
              title={LocalizedStrings.Dashboard_model.late_Short}
              placeholder="Select Hours"
              width={'100%'}
              style_dropdown={{ marginHorizontal: 0 }}
              selectedTextStyleNew={{
                marginLeft: 10,
                fontFamily: Font.Poppins_Regular,
              }}
              marginHorizontal={0}
              style_title={{
                textAlign: 'left',
                fontFamily: Font.Poppins_Regular,
              }}
              value={leaveModal.leaveType?.value}
              data={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' },
                { value: 6, label: '6' },
                { value: 7, label: '7 ' },
              ]}
              onChange={item => {
                setLeaveModal(prev => ({ ...prev, leaveType: item || null }));
                if (modalErrors?.leaveType) {
                  setModalErrors({ ...modalErrors, leaveType: null });
                }
              }}
              error={modalErrors?.leaveType}
            />
          )}

          <Input
            title={LocalizedStrings.Dashboard_model.Remarks}
            placeholder="Enter remarks"
            value={leaveModal.remarks}
            onChange={text => {
              setLeaveModal(prev => ({ ...prev, remarks: text }));
              if (modalErrors?.remarks) {
                setModalErrors({ ...modalErrors, remarks: null });
              }
            }}
            multiline
            error={modalErrors?.remarks}
          />

          <Button
            title={LocalizedStrings.Dashboard_model.Done}
            onPress={() => {
              const errors = {};
              if (leaveModal.type == 'absent') {
                errors.leaveType = validators.checkRequire(
                  LocalizedStrings.Dashboard_model.Leave_Type || 'Leave Type',
                  leaveModal.leaveType?.value,
                );
              }
              setModalErrors(errors);
              if (isValidForm(errors)) {
                setLeaveModal({ ...leaveModal, visible: false });
                setModalErrors({});
                // setVerify(true);
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
            <Image
              source={ImageConstant?.ic_success}
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
            />
          </View>
          <Typography
            size={20}
            type={Font?.Poppins_SemiBold}
            textAlign="center"
          >
            {LocalizedStrings.Dashboard_model.Staff_Leave_Updated ||
              'Staff Leave Updated!'}
          </Typography>
          <Typography
            size={16}
            type={Font?.Poppins_Regular}
            textAlign="center"
            color="#8C8D8B"
            style={{ marginTop: 30 }}
          >
            {leaveModal.staff?.name || 'Staff'}'s {leaveModal.type} has been
            recorded successfully.
          </Typography>
          <Button
            title={'Done'}
            onPress={() => {
              setVerify(false);
              navigation.navigate('TabNavigation');
            }}
            main_style={{ marginTop: 20, width: '100%' }}
            icon={ImageConstant?.Arrow}
          />
        </View>
      </SimpleModal>
      <View style={{ height: 80 }} />
    </CommanView>
    <View style={{ position: 'absolute', bottom: 75, left: 20, right: 20 }}>
      <Button
        onPress={() => {
          navigation.navigate('AllStaff');
        }}
        linerColor={['#D98579', '#C4706A']}
        title={LocalizedStrings.Dashboard.find_staf}
        main_style={{ width: '100%' }}
      />
    </View>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 5,
    marginVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 12,
  },
  dot: {
    width: 10,
    height: 10,
    position: 'absolute',
    borderRadius: 10,
    right: 10,
    top: 10,
    backgroundColor: '#ccc',
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statusBtn: {
    flex: 1,
    minWidth: 80,
    maxWidth: '32%',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  presentBtn: {
    backgroundColor: '#1DD75B',
  },
  absentBtn: {
    backgroundColor: '#BE615B',
  },
  lateBtn: {
    backgroundColor: '#EFB034',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderRadius: '50%',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#C77166',
    color: '#C77166',
    paddingHorizontal: 4.5,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  staffAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 12,
  },
});
