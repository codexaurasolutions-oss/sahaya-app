import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';

import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import { Calendar } from 'react-native-calendars';
import { ImageConstant } from '../../Constants/ImageConstant';
// import DropdownComponent from '../../Component/DropdownComponent';
import LocalizedStrings from '../../Constants/localization';
import { useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { POST_FORM_DATA } from '../../Backend/Backend';
import { AttendanceStaff } from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';

const STATUS_COLORS = {
  present: '#4CAF50',    // Green - Present
  late: '#FF9800',       // Orange - Late (different from present!)
  on_leave: '#FFC107',   // Yellow - On Leave
  leave: '#FFC107',      // Yellow - Leave
  holiday: '#2196F3',    // Blue - Holiday
  absent: '#F44336',     // Red - Absent
  weekend: '#9E9E9E',    // Grey - Weekend
};

const StaffAttendance = ({ navigation }) => {
  const isFocused = useIsFocused();
  const userDetail = useSelector(store => store?.userDetails);
  const [selected, setSelected] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [summary, setSummary] = useState({ totalWorked: 0, absent: 0, leave: 0 });
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (isFocused && userDetail?.id) {
      fetchAttendance(userDetail.id, currentMonth);
    }
  }, [isFocused, currentMonth]);

  const fetchAttendance = (staffId, month) => {
    setLoading(true);
    const [year, mon] = month.split('-');

    const formData = new FormData();
    formData.append('id', staffId);
    formData.append('month', parseInt(mon, 10));
    formData.append('year', parseInt(year, 10));

    POST_FORM_DATA(
      AttendanceStaff,
      formData,
      success => {
        const records = success?.data?.attendance || success?.data || [];
        console.log('StaffAttendance records --->', records);
        const dates = {};
        let totalWorked = 0;
        let absentCount = 0;
        let leaveCount = 0;

        // Mark weekends
        const today = new Date();
        const yearNum = parseInt(year, 10);
        const monNum = parseInt(mon, 10);
        const daysInMonth = new Date(yearNum, monNum, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(yearNum, monNum - 1, day);
          if (date > today) break;
          const dayOfWeek = date.getDay();
          const dateStr = `${year}-${String(monNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          if (dayOfWeek === 0 || dayOfWeek === 6) {
            dates[dateStr] = { selected: true, marked: true, selectedColor: STATUS_COLORS.weekend };
          }
        }

        // Use attendance data from API directly (auto-present is handled by backend)
        if (Array.isArray(records)) {
          records.forEach(record => {
            const dateStr = record?.date;
            const status = record?.status?.toLowerCase();
            if (!dateStr || !status) return;

            const color = STATUS_COLORS[status] || '#9E9E9E';

            dates[dateStr] = {
              selected: true,
              marked: true,
              selectedColor: color,
            };

            if (status === 'present' || status === 'late') {
              totalWorked++;
            } else if (status === 'absent') {
              absentCount++;
            } else if (status === 'leave' || status === 'on_leave') {
              leaveCount++;
            }
          });
        }

        setSummary({ totalWorked, absent: absentCount, leave: leaveCount });
        setMarkedDates(dates);
        setLoading(false);
      },
      error => {
        setLoading(false);
        SimpleToast.show('Failed to load attendance', SimpleToast.SHORT);
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const handleMonthChange = month => {
    const newMonth = `${month.year}-${String(month.month).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.AttendanceStatistics?.title || 'Attendance Statistics'}
        onPressLeftIcon={() => navigation?.goBack()}
        source_arrow={ImageConstant?.BackArrow}
        style_title={{ fontSize: 18 }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Employer selection removed - staff sees their own attendance */}
          {/* <DropdownComponent
            title={LocalizedStrings.staffSection?.StaffAttendance?.select_employer || "Select Employer"}
            placeholder={LocalizedStrings.staffSection?.StaffAttendance?.select_employer_placeholder || "Select Employer type"}
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0, height: 50 }}
            selectedTextStyleNew={{
              marginLeft: 10,
              fontFamily: Font.Poppins_Regular,
            }}
            marginHorizontal={0}
            style_title={{ fontFamily: Font.Poppins_Regular }}
            data={[]}
          /> */}

          {loading && (
            <ActivityIndicator size="small" color="#2196F3" style={{ marginVertical: 10 }} />
          )}

          <Calendar
            monthFormat={'MMMM yyyy'}
            hideExtraDays={true}
            maxDate={new Date().toISOString().split('T')[0]}
            onDayPress={day => setSelected(day.dateString)}
            onMonthChange={handleMonthChange}
            markedDates={{
              ...markedDates,
              ...(selected
                ? { [selected]: { ...(markedDates[selected] || {}), selected: true, selectedColor: '#D98579' } }
                : {}),
            }}
            theme={{
              todayTextColor: '#2196F3',
              arrowColor: '#2196F3',
              textDayFontFamily: Font.Poppins_Regular,
              textMonthFontFamily: Font.Poppins_Bold,
              textDayHeaderFontFamily: Font.Poppins_Medium,
            }}
            disableArrowRight={
              currentMonth >=
              `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
            }
          />

          <View style={styles.summary}>
            <Typography
              size={16}
              type={Font.Poppins_Bold}
              style={styles.summaryTitle}
            >
              {LocalizedStrings.AttendanceStatistics?.Summary || 'Summary'}
            </Typography>

            <View style={styles.summaryRow}>
              <Typography size={14} type={Font.Poppins_Regular}>
                {LocalizedStrings.AttendanceStatistics?.Total_Days_Worked || 'Total Days Worked'}
              </Typography>
              <Typography size={14} type={Font.Poppins_Bold}>
                {summary.totalWorked}
              </Typography>
            </View>

            <View style={styles.summaryRow}>
              <Typography size={14} type={Font.Poppins_Regular}>
                {LocalizedStrings.AttendanceStatistics?.Absent_Days || 'Absent Days'}
              </Typography>
              <Typography size={14} type={Font.Poppins_Bold}>
                {summary.absent}
              </Typography>
            </View>

            <View style={styles.summaryRow}>
              <Typography size={14} type={Font.Poppins_Regular}>
                {LocalizedStrings.AttendanceStatistics?.Leave_Days || 'Leave Days'}
              </Typography>
              <Typography size={14} type={Font.Poppins_Bold}>
                {summary.leave}
              </Typography>
            </View>
          </View>

          <View style={styles.legendContainer}>
            <Typography
              size={16}
              type={Font.Poppins_Bold}
              style={styles.legendTitle}
            >
              {LocalizedStrings.AttendanceStatistics?.Legend || 'Legend'}
            </Typography>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                <Typography size={14} type={Font.Poppins_Regular}>
                  {LocalizedStrings.AttendanceStatistics?.Present || 'Present'}
                </Typography>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#FFC107' }]} />
                <Typography size={14} type={Font.Poppins_Regular}>
                  {LocalizedStrings.AttendanceStatistics?.On_Leave || 'On Leave'}
                </Typography>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#2196F3' }]} />
                <Typography size={14} type={Font.Poppins_Regular}>
                  {LocalizedStrings.AttendanceStatistics?.Holiday || 'Holiday'}
                </Typography>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
                <Typography size={14} type={Font.Poppins_Regular}>
                  {LocalizedStrings.AttendanceStatistics?.Absent || 'Absent'}
                </Typography>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#9E9E9E' }]} />
                <Typography size={14} type={Font.Poppins_Regular}>
                  {LocalizedStrings.AttendanceStatistics?.Weekend || 'Weekend'}
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </CommanView>
  );
};

export default StaffAttendance;

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 20, backgroundColor: '#fff' },
  subHeader: { textAlign: 'center', color: '#333' },
  summary: {
    marginTop: 20,
    backgroundColor: '#FAFAFB',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  summaryTitle: { marginBottom: 10, color: '#000' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomColor: '#DEE1E6',
    borderBottomWidth: 1,
  },
  legendContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FAFAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  legendTitle: { marginBottom: 10, color: '#000' },
  legend: { flexDirection: 'row', flexWrap: 'wrap' },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 38,
    marginBottom: 10,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
});
