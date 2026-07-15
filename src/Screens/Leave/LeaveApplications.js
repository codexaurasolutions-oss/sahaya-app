import {
  ActivityIndicator,
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import LocalizedStrings from '../../Constants/localization';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../Backend/Backend';
import {
  LeaveApprove,
  LeaveListUser,
  LeaveRejectr,
} from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import { useIsFocused } from '@react-navigation/native';

export default function LeaveApplicationsScreen({ navigation, route }) {
  const [leaveList, setLeaveList] = useState([]);
  const [processingRequest, setProcessingRequest] = useState(null);
  const isFocused = useIsFocused();
  const selectedLeaveId = route?.params?.leaveRequestId;

  useEffect(() => {
    if (isFocused) {
      fetchLeaveList();
    }
  }, [isFocused]);

  const fetchLeaveList = () => {
    GET_WITH_TOKEN(
      LeaveListUser,
      success => {

        const data = success?.data;
        setLeaveList(Array.isArray(data) ? data : []);
      },
      error => {

        setLeaveList([]);
      },
      fail => {

        setLeaveList([]);
      },
    );
  };

  const manageLeaves = (type, id) => {
    if (processingRequest) return;

    const requestRoute = type === 'Approve' ? LeaveApprove : LeaveRejectr;
    setProcessingRequest({id, type});
    POST_WITH_TOKEN(
      `${requestRoute}/${id}`,
      {},
      success => {
        setProcessingRequest(null);
        fetchLeaveList();
        SimpleToast.show(
          success?.message ||
            `Leave request ${type === 'Approve' ? 'approved' : 'rejected'} successfully!`,
          SimpleToast.SHORT,
        );
      },
      error => {
        setProcessingRequest(null);
        SimpleToast.show(
          error?.data?.message || error?.message || 'Could not update leave request.',
          SimpleToast.SHORT,
        );
      },
      fail => {
        setProcessingRequest(null);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={
          LocalizedStrings.Dashboard?.Leave_Applications || 'Leave Applications'
        }
        navigation={navigation}
        showRightIcon={true}
        source_logo={ImageConstant?.notification}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        onPressRightIcon={() => navigation.navigate('Notification')}
        style_title={{ fontSize: 18 }}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 16 }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <Typography type={Font.Poppins_SemiBold} style={{ fontSize: 17 }}>
            {LocalizedStrings.Dashboard?.Recent_Requests || 'Recent Requests'}
          </Typography>
          {leaveList?.length > 0 ? (
            <Typography type={Font.Poppins_Regular}>
              ({leaveList?.length} total)
            </Typography>
          ) : (
            ''
          )}
        </View>
        {leaveList.length === 0 && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Typography size={14} color="#555" textAlign="center">
              No leave applications found.
            </Typography>
          </View>
        )}
        {leaveList.map(item => {
          const name = item?.user ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim() : item?.name || '';
          const initials = item?.user?.first_name?.charAt(0) || item?.name?.charAt(0) || '';
          const leaveType = item?.leave_type?.name || item?.leave_type || item?.description || '';
          const dates = item?.start_date && item?.end_date ? `${item.start_date} - ${item.end_date}` : item?.start_date || '';
          const reason = item?.reason || item?.description || '';
          const status = item?.status || 'Pending';

          return (
          <View
            key={item.id}
            style={[
              styles.card,
              String(selectedLeaveId || '') === String(item.id)
                ? styles.selectedCard
                : null,
            ]}
          >
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={[styles.avatarText, { textTransform: 'capitalize' }]}
                >
                  {initials}
                </Typography>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Typography type={Font.Poppins_SemiBold} style={styles.name}>
                  {name}
                </Typography>
                <Typography type={Font.Poppins_Regular} style={styles.type}>
                  {leaveType}
                </Typography>
              </View>
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor:
                      status.toLowerCase() === 'approved'
                        ? '#A7F3D0'
                        : status.toLowerCase() === 'pending'
                        ? '#FEF3C7'
                        : '#FECACA',
                  },
                ]}
              >
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={[
                    styles.statusText,
                    {
                      color:
                        status.toLowerCase() === 'approved'
                          ? '#047857'
                          : status.toLowerCase() === 'pending'
                          ? '#B45309'
                          : '#B91C1C',
                    },
                  ]}
                >
                  {status}
                </Typography>
              </View>
            </View>
            <View style={styles.row}>
              <Image
                source={ImageConstant.lines}
                style={styles.icon}
                resizeMode="contain"
              />
              <Typography type={Font.Poppins_Regular} style={styles.dates}>
                {LocalizedStrings.Dashboard?.Dates_Requested ||
                  'Dates Requested'}
                : {dates}
              </Typography>
            </View>
            <View style={styles.row}>
              <Image
                source={ImageConstant.lines}
                style={styles.icon}
                resizeMode="contain"
              />
              <Typography type={Font.Poppins_Regular} style={styles.reason}>
                {LocalizedStrings.Dashboard?.Reason || 'Reason'}: {reason}
              </Typography>
            </View>
            {status.toLowerCase() === 'pending' && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: '#D98579',
                    },
                  ]}
                  onPress={() => manageLeaves('Reject', item?.id)}
                  disabled={processingRequest !== null}
                >
                  {processingRequest?.id === item?.id &&
                  processingRequest?.type === 'Reject' ? (
                    <ActivityIndicator size="small" color="#D98579" />
                  ) : (
                    <Image
                      source={ImageConstant.X}
                      style={styles.icon}
                      resizeMode="contain"
                    />
                  )}
                  <Typography
                    type={Font.Poppins_Regular}
                    style={{ color: '#D98579', fontSize: 13, marginLeft: 4 }}
                  >
                    {LocalizedStrings.Dashboard?.Reject || 'Reject'}
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#D98579' }]}
                  onPress={() => manageLeaves('Approve', item?.id)}
                  disabled={processingRequest !== null}
                >
                  {processingRequest?.id === item?.id &&
                  processingRequest?.type === 'Approve' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Image
                      source={ImageConstant.correct}
                      style={styles.icon}
                      resizeMode="contain"
                    />
                  )}
                  <Typography
                    type={Font.Poppins_Regular}
                    style={{ color: '#FFFFFF', fontSize: 13, marginLeft: 4 }}
                  >
                    {LocalizedStrings.Dashboard?.Approve || 'Approve'}
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
          </View>
          );
        })}
      </ScrollView>
    </CommanView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  selectedCard: {
    borderColor: '#D98579',
    backgroundColor: '#FFF8F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 15, color: '#333' },
  name: { fontSize: 14, color: '#111' },
  type: { fontSize: 12, color: '#666' },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: { fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  icon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  dates: { fontSize: 12, color: '#555' },
  reason: { fontSize: 12, color: '#777' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 36,
    marginHorizontal: 5,
  },
});
