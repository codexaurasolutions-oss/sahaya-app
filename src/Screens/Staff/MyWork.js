import { StyleSheet, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import LocalizedStrings from '../../Constants/localization';
import { GET_WITH_TOKEN } from '../../Backend/Backend';
import { myWork, EarningSummary as EarningSummaryRoute } from '../../Backend/api_routes';

const formatDate = (dateString) => {
  if (!dateString || dateString === 'null' || dateString === 'undefined') return 'Not Found';
  try {
    const d = moment(dateString);
    if (!d.isValid()) return 'Not Found';
    return d.format('MMMM D, YYYY');
  } catch (e) {
    return 'Not Found';
  }
};

const MyWork = () => {
  const navigation = useNavigation();
  const userDetail = useSelector(store => store?.userDetails);
  const [workData, setWorkData] = useState(null);
  const [jobApplications, setJobApplications] = useState([]);
  const [hasActiveJob, setHasActiveJob] = useState(false);
  const [earningSummary, setEarningSummary] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState([]);
  const [employerName, setEmployerName] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  // Safe name builder — never returns "null" or "undefined" strings
  const buildName = (obj) => {
    if (!obj) return null;
    const first = (obj?.first_name || obj?.employer_first_name || obj?.fname || '').trim();
    const last = (obj?.last_name || obj?.employer_last_name || obj?.lname || '').trim();
    const name = (obj?.name || '').trim();
    
    // Prioritize first + last name
    let full = (first || last) ? `${first} ${last}`.trim() : name;
    
    // Filter out generic/null strings
    if (!full || full === 'null' || full === 'undefined' || full.toLowerCase() === 'user') {
      return null;
    }
    return full;
  };

  const fetchEarningSummary = (jobId) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    GET_WITH_TOKEN(
      `${EarningSummaryRoute}?job_id=${jobId}&month=${month}`,
      success => {
        const rawData = success?.data;
        const earningData = Array.isArray(rawData) ? rawData[0] : rawData;
        if (earningData) {
          setEarningSummary(earningData);
          if (!employerName) {
            const name =
              buildName(earningData?.employer_details) ||
              buildName(earningData?.houseowner) ||
              (earningData?.employer_name && earningData.employer_name !== 'User' ? earningData.employer_name : null) ||
              (earningData?.employer && earningData.employer !== 'User' ? earningData.employer : null);
            if (name) setEmployerName(name);
          }
        }
      },
      () => {},
      () => {},
    );
  };

  const fetchMyWork = () => {
    setLoading(true);
    GET_WITH_TOKEN(
      myWork,
      success => {
        setLoading(false);
        if (!success) return;

        const jobApps = success?.jobApplications || userDetail?.applications || success?.job_applications || [];
        const jobAppsArr = Array.isArray(jobApps) ? jobApps : [];
        setJobApplications(jobAppsArr);

        // Extract and set work data
        const myWorkData = success?.data || success;
        setWorkData(myWorkData);

        // Set summaries
        if (success?.attendanceSummary) {
          setAttendanceSummary(Array.isArray(success.attendanceSummary) ? success.attendanceSummary : []);
        }
        if (success?.leaveSummary || myWorkData?.leaveSummary) {
          setLeaveSummary(Array.isArray(success.leaveSummary || myWorkData.leaveSummary) ? (success.leaveSummary || myWorkData.leaveSummary) : []);
        }

        // Determine if staff has an active job
        const activeJob = jobAppsArr.find(app => {
          const status = (app?.status || app?.application_status || '').toLowerCase();
          return status === 'accepted' || status === 'approved' || status === 'active';
        });

        const directlyAdded =
          !!myWorkData?.houseowner ||
          !!myWorkData?.employer_details ||
          !!myWorkData?.added_by_user ||
          !!myWorkData?.employer ||
          !!myWorkData?.workplace ||
          !!success?.houseowner ||
          !!success?.employer ||
          !!success?.workplace ||
          !!success?.current_employer ||
          !!userDetail?.added_by;

        const hasJob = !!activeJob || directlyAdded;
        setHasActiveJob(hasJob);

        // Determine employer name
        const empName =
          buildName(myWorkData?.houseowner) ||
          buildName(myWorkData?.employer_details) ||
          buildName(myWorkData?.added_by_user) ||
          buildName(success?.houseowner) ||
          buildName(success?.employer) ||
          buildName(success?.current_employer) ||
          buildName(jobAppsArr?.[0]?.job?.user) ||
          buildName(jobAppsArr?.[0]?.job?.houseowner) ||
          buildName(jobAppsArr?.[0]?.employer) ||
          userDetail?.added_by_name;

        if (empName) setEmployerName(empName);

        // Fetch earning summary if we have a job ID
        const jobId = activeJob?.job_id || myWorkData?.job_id || myWorkData?.id;
        if (jobId) {
          fetchEarningSummary(jobId);
        }
      },
      error => {
        setLoading(false);
      },
      fail => {
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    if (isFocused) {
      fetchMyWork();
    }
  }, [isFocused]);

  const getAttendanceCount = (status) => {
    const item = attendanceSummary.find(a => a.status === status);
    return item?.total || 0;
  };

  const activeJobApplication = jobApplications.find(app => {
    const status = (app?.status || app?.application_status || '').toLowerCase();
    return status === 'accepted' || status === 'approved' || status === 'active';
  });

  // Get user profile image from userDetails, fallback to default icon
  const profileIcon = userDetail?.image
    ? userDetail.image
    : ImageConstant?.user;

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.staffSection?.MyWork?.title || 'My Work'}
        onPressLeftIcon={() => navigation?.goBack()}
        source_arrow={ImageConstant?.BackArrow}
        style_title={styles.headerTitle}
        source_logo={ImageConstant?.notification}
        Profile_icon={profileIcon}
        onPressRightIcon={() => navigation.navigate('Notifications')}
      />
      <View style={styles.spacer} />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : !workData ? (
        <View style={styles.emptyContainer}>
          <Typography type={Font.Poppins_Medium} size={15} color="#999">
            {LocalizedStrings.staffSection?.MyWork?.no_jobs || 'No jobs found'}
          </Typography>
        </View>
      ) : (
        <>
          {hasActiveJob ? (
          <>
          {/* Current Employer Section - only when staff has an active job */}
          <View style={styles.card}>
            <View
              style={[
                styles.titleRow,
                { borderColor: 'white', marginTop: 0, paddingTop: 0 },
              ]}
            >
              <Image source={ImageConstant?.lines} style={styles.titleIcon} />
              <Typography
                type={Font.Poppins_SemiBold}
                size={17}
                style={styles.title}
              >
                {LocalizedStrings.staffSection?.MyWork?.current_employer ||
                  'Current Employer'}
              </Typography>
            </View>
            <View style={styles.rowInline}>
              <Typography size={13} style={styles.text}>
                {LocalizedStrings.staffSection?.MyWork?.employer || 'Employer'}:{' '}
              </Typography>
              <Typography type={Font.Poppins_SemiBold} size={13}>
                {employerName || earningSummary?.employer || '--'}
              </Typography>
            </View>
            <View style={styles.rowInline}>
              <Typography size={13} style={styles.text}>
                {LocalizedStrings.staffSection?.MyWork?.role || 'Role'}:{' '}
              </Typography>
              <Typography type={Font.Poppins_SemiBold} size={13}>
                {earningSummary?.job_details?.job_title || earningSummary?.role || activeJobApplication?.job?.title || jobApplications?.[0]?.job?.title || workData?.user_work_info?.primary_role || '--'}
              </Typography>
            </View>
            <View style={styles.rowInline}>
              <Typography size={13} style={styles.text}>
                {LocalizedStrings.staffSection?.MyWork?.joined || 'Joined'}:{' '}
              </Typography>
              <Typography type={Font.Poppins_SemiBold} size={13}>
                {formatDate(activeJobApplication?.available_from || activeJobApplication?.created_at || jobApplications?.[0]?.available_from || jobApplications?.[0]?.created_at || workData?.created_at)}
              </Typography>
            </View>

            {/* Salary Summary */}
            <View style={styles.titleRow}>
              <Image source={ImageConstant?.Salary} style={styles.titleIcon} />
              <Typography
                type={Font.Poppins_SemiBold}
                size={17}
                style={styles.title}
              >
                {LocalizedStrings.staffSection?.MyWork?.salary_summary ||
                  'Salary Summary'}
              </Typography>
            </View>
            <Typography size={12} style={styles.label}>
              {LocalizedStrings.staffSection?.MyWork?.current_monthly_salary ||
                'Current Monthly Salary'}
            </Typography>
            <Typography
              type={Font.Poppins_Bold}
              size={20}
              style={styles.valueBig}
            >
              {"\u20B9"}{userDetail?.user_work_info?.salary || activeJobApplication?.expected_salary || jobApplications?.[0]?.expected_salary || workData?.lastsalary?.amount || workData?.last_exp?.salary || '0'}
            </Typography>

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                navigation.navigate('EarningSummary', {
                  id: activeJobApplication?.job_id || workData?.job_id || workData?.id,
                })
              }
            >
              <Typography size={14} style={styles.buttonText}>
                {LocalizedStrings.staffSection?.MyWork?.view_details ||
                  'View Details'}{' '}
              </Typography>
              <Image
                source={ImageConstant?.next}
                tintColor={'white'}
                style={{
                  width: 20,
                  height: 13,
                  resizeMode: 'center',
                }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.quitButton]}
              onPress={() =>
                navigation.navigate('QuitJob', { jobId: activeJobApplication?.job_id || workData?.job_id || workData?.id })
              }
            >
              <Image
                source={ImageConstant?.Door}
                tintColor={'white'}
                style={{
                  width: 20,
                  height: 13,
                  resizeMode: 'center',
                }}
              />
              <Typography size={14} style={styles.quitText}>
                {LocalizedStrings.staffSection?.MyWork?.quit_job || 'Quit Job'}
              </Typography>
            </TouchableOpacity>
          </View>
          </>
          ) : (
          <View style={styles.card}>
            <View style={styles.noJobContainer}>
              <Image source={ImageConstant?.Briefcase} style={styles.noJobIcon} />
              <Typography type={Font.Poppins_SemiBold} size={17} style={{ marginTop: 12 }}>
                {LocalizedStrings.staffSection?.MyWork?.no_active_job || 'No Active Job'}
              </Typography>
              <Typography size={13} color="#888" style={{ marginTop: 6, textAlign: 'center' }}>
                {LocalizedStrings.staffSection?.MyWork?.no_active_job_desc || 'You have not joined any job yet. Browse available jobs and apply to get started.'}
              </Typography>
              <TouchableOpacity
                style={[styles.button, { marginTop: 16, paddingHorizontal: 30 }]}
                onPress={() => navigation.navigate('ActiveJob')}
              >
                <Typography size={14} style={styles.buttonText}>
                  {LocalizedStrings.staffSection?.MyWork?.browse_jobs || 'Browse Jobs'}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
          )}

          {/* Attendance Summary */}
          {attendanceSummary.length > 0 && (
            <View style={styles.card}>
              <View
                style={[
                  styles.titleRow,
                  { borderColor: 'white', marginTop: 0, paddingTop: 0 },
                ]}
              >
                <Image source={ImageConstant?.lines} style={styles.titleIcon} />
                <Typography
                  type={Font.Poppins_SemiBold}
                  size={17}
                  style={styles.title}
                >
                  Attendance Summary
                </Typography>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Typography type={Font.Poppins_Bold} size={20} color="#4CAF50">
                    {getAttendanceCount('present')}
                  </Typography>
                  <Typography size={12} color="#666">Present</Typography>
                </View>
                <View style={styles.summaryItem}>
                  <Typography type={Font.Poppins_Bold} size={20} color="#FF9800">
                    {getAttendanceCount('late')}
                  </Typography>
                  <Typography size={12} color="#666">Late</Typography>
                </View>
                <View style={styles.summaryItem}>
                  <Typography type={Font.Poppins_Bold} size={20} color="#F44336">
                    {getAttendanceCount('absent')}
                  </Typography>
                  <Typography size={12} color="#666">Absent</Typography>
                </View>
              </View>
            </View>
          )}

          {/* Leave Requests */}
          {workData?.leave_requests?.length > 0 && (
            <View style={styles.card}>
              <View
                style={[
                  styles.titleRow,
                  { borderColor: 'white', marginTop: 0, paddingTop: 0 },
                ]}
              >
                <Image source={ImageConstant?.lines} style={styles.titleIcon} />
                <Typography
                  type={Font.Poppins_SemiBold}
                  size={17}
                  style={styles.title}
                >
                  Leave Requests
                </Typography>
              </View>
              {Array.isArray(workData?.leave_requests) && workData.leave_requests.map((leave, idx) => (
                <View key={leave?.id || `leave-${idx}`} style={styles.leaveItem}>
                  <View style={{ flex: 1 }}>
                    <Typography type={Font.Poppins_Medium} size={13}>
                      {leave.reason}
                    </Typography>
                    <Typography size={11} color="#666">
                      {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                    </Typography>
                  </View>
                  <View
                    style={[
                      styles.statusTag,
                      {
                        backgroundColor:
                          leave.status === 'approved' ? '#A7F3D0' :
                          leave.status === 'rejected' ? '#FECACA' : '#FEF3C7',
                      },
                    ]}
                  >
                    <Typography
                      type={Font.Poppins_SemiBold}
                      size={11}
                      color={
                        leave.status === 'approved' ? '#047857' :
                        leave.status === 'rejected' ? '#B91C1C' : '#B45309'
                      }
                    >
                      {leave.status}
                    </Typography>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
      <View style={styles.bottomSpacer} />
    </CommanView>
  );
};

export default MyWork;

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
  },
  spacer: {
    height: 20,
  },
  bottomSpacer: {
    height: 100,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 0,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#DEE1E6',
    paddingVertical: 12,
    marginTop: 10,
  },
  titleIcon: {
    height: 20,
    width: 22,
    marginRight: 6,
    tintColor: '#171A1F',
    objectFit: 'contain',
  },
  title: {
    color: '#000',
  },

  text: {
    color: '#555',
    marginBottom: 2,
  },
  label: {
    color: 'gray',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  rowInline: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },

  value: {
    fontWeight: '600',
    color: '#000',
    fontFamily: Font?.Poppins_SemiBold,
  },
  valueBig: {
    color: '#000',
    marginVertical: 6,
  },

  button: {
    backgroundColor: '#D98579',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff' },
  secondaryButton: {
    backgroundColor: 'white',
    borderColor: '#DEE1E6',
    borderWidth: 2,
  },
  secondaryBtnText: {
    color: 'black',
  },

  quitButton: {
    backgroundColor: '#BD6162',
  },
  quitText: {
    color: 'white',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  summaryItem: {
    alignItems: 'center',
  },
  leaveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  noJobContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  noJobIcon: {
    width: 50,
    height: 50,
    tintColor: '#D98579',
    resizeMode: 'contain',
  },
});
