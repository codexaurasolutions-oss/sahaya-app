import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from "react-native";
import moment from "moment";

import CommanView from "../../Component/CommanView";
import HeaderForUser from "../../Component/HeaderForUser";
import Typography from "../../Component/UI/Typography";
import { Font } from "../../Constants/Font";
import { ImageConstant } from "../../Constants/ImageConstant";


import { Calendar } from "react-native-calendars";
import DropdownComponent from "../../Component/DropdownComponent";
import LocalizedStrings from "../../Constants/localization";
import { useIsFocused } from "@react-navigation/native";
import { GET_WITH_TOKEN, POST_FORM_DATA } from "../../Backend/Backend";
import { ActiveTodayUser, ListStaff, AttendanceStaff } from "../../Backend/api_routes";
import SimpleToast from "react-native-simple-toast";

const STATUS_COLORS = {
  present: "#4CAF50",    // Green - Present
  late: "#FF9800",       // Orange - Late (different from present!)
  on_leave: "#FFC107",   // Yellow - On Leave
  leave: "#FFC107",      // Yellow - Leave
  holiday: "#2196F3",    // Blue - Holiday
  absent: "#F44336",     // Red - Absent
  weekend: "#9E9E9E",    // Grey - Weekend
};

const getStaffName = (item) => {
  if (item?.first_name) return `${item.first_name} ${item.last_name || ''}`.trim();
  if (item?.staff?.first_name) return `${item.staff.first_name} ${item.staff.last_name || ''}`.trim();
  if (item?.name) return item.name;
  if (item?.staff?.name) return item.staff.name;
  return `Staff #${item?.id || item?.staff?.id}`;
};

const AttendanceScreen = ({ navigation, route }) => {
  const isFocused = useIsFocused();
  const preSelectedStaffId = route?.params?.staffId;
  const preSelectedStaffName = route?.params?.staffName;
  const [selected, setSelected] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(
    preSelectedStaffId ? { value: preSelectedStaffId, label: preSelectedStaffName || 'Staff' } : null
  );
  const [markedDates, setMarkedDates] = useState({});
  const [summary, setSummary] = useState({ totalWorked: 0, absent: 0, leave: 0 });
  const [loading, setLoading] = useState(false);
  const [isEditingDeductions, setIsEditingDeductions] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const statusOptions = [
    { value: 'present', label: 'Present', color: '#4CAF50' },
    { value: 'absent', label: 'Absent', color: '#F44336' },
    { value: 'on_leave', label: 'Late', color: '#FFC107' },
  ];

  useEffect(() => {
    if (isFocused) {
      if (!preSelectedStaffId) {
        fetchStaffList();
      }
    }
  }, [isFocused]);

  useEffect(() => {
    if (selectedStaff) {
      fetchAttendance(selectedStaff.value, currentMonth);
    }
  }, [selectedStaff, currentMonth]);

  const fetchStaffList = () => {
    // Try ActiveTodayUser first (same as Dashboard - proven to work)
    GET_WITH_TOKEN(
      ActiveTodayUser,
      (success) => {
        const staff = success?.data || [];
        const list = Array.isArray(staff) ? staff : [];
        if (list.length > 0) {
          const formatted = list.map((item) => ({
            value: item?.staff?.id || item?.id,
            label: getStaffName(item),
          }));
          setStaffList(formatted);
        } else {
          // Fallback to ListStaff if no active staff today
          fetchStaffListFallback();
        }
      },
      (error) => {
        fetchStaffListFallback();
      },
      (fail) => {
        fetchStaffListFallback();
      }
    );
  };

  const fetchStaffListFallback = () => {
    GET_WITH_TOKEN(
      ListStaff,
      (success) => {
        const staff = success?.data?.data || success?.data || [];
        const list = Array.isArray(staff) ? staff : [];
        const formatted = list.map((item) => ({
          value: item?.id || item?.staff?.id,
          label: getStaffName(item),
        }));
        setStaffList(formatted);
      },
      (error) => {
        SimpleToast.show("Failed to load staff list", SimpleToast.SHORT);
      },
      (fail) => {
        SimpleToast.show("Network error. Please try again.", SimpleToast.SHORT);
      }
    );
  };

  const fetchAttendance = (staffId, month) => {
    setLoading(true);
    const [year, mon] = month.split("-");

    const formData = new FormData();
    formData.append("id", staffId);
    formData.append("month", parseInt(mon, 10));
    formData.append("year", parseInt(year, 10));

    POST_FORM_DATA(
      AttendanceStaff,
      formData,
      (success) => {
        console.log('AttendanceScreen API full response --->', JSON.stringify(success));
        const records = success?.data?.attendance || success?.data || [];
        console.log('AttendanceScreen records --->', JSON.stringify(records));
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
          const dateStr = `${year}-${String(monNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

          if (dayOfWeek === 0 || dayOfWeek === 6) {
            dates[dateStr] = { selected: true, marked: true, selectedColor: STATUS_COLORS.weekend };
          }
        }

        // Use attendance data from API directly (auto-present is handled by backend)
        if (Array.isArray(records)) {
          records.forEach((record) => {
            const dateStr = record?.date;
            const status = record?.status?.toLowerCase();
            if (!dateStr || !status) return;

            const color = STATUS_COLORS[status] || "#9E9E9E";

            dates[dateStr] = {
              selected: true,
              marked: true,
              selectedColor: color,
            };

            if (status === "present" || status === "late") {
              totalWorked++;
            } else if (status === "absent") {
              absentCount++;
            } else if (status === "leave" || status === "on_leave") {
              leaveCount++;
            }
          });
        }

        setSummary({ totalWorked, absent: absentCount, leave: leaveCount });
        setMarkedDates(dates);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        SimpleToast.show("Failed to load attendance", SimpleToast.SHORT);
      },
      (fail) => {
        setLoading(false);
        SimpleToast.show("Network error. Please try again.", SimpleToast.SHORT);
      }
    );
  };

  const handleMonthChange = (month) => {
    const newMonth = `${month.year}-${String(month.month).padStart(2, "0")}`;
    setCurrentMonth(newMonth);
  };

  const handleDatePress = (day) => {
    if (!selectedStaff) {
      SimpleToast.show("Please select a staff member first", SimpleToast.SHORT);
      return;
    }
    setSelected(day.dateString);
    setEditingDate(day.dateString);
    setStatusModalVisible(true);
  };

  const saveAttendanceEdit = (status) => {
    if (!editingDate || !selectedStaff) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("staff_id", selectedStaff.value);
    formData.append("date", editingDate);
    formData.append("status", status === 'on_leave' ? 'absent' : status); // API prefers absent/present
    formData.append("check_in_time", "09:00:00");
    formData.append("description", "Manual update from calendar");
    
    console.log('SENDING ATTENDANCE:', {
      staff_id: selectedStaff.value,
      date: editingDate,
      status: status === 'on_leave' ? 'absent' : status
    });
    
    // Note: leave_id is required by some API versions if absent, but we'll try without first
    // or provide a dummy if needed based on controller logic.

    POST_FORM_DATA(
      "admin/housersold/attendance",
      formData,
      (success) => {
        SimpleToast.show("Attendance marked!", SimpleToast.SHORT);
        setStatusModalVisible(false);
        fetchAttendance(selectedStaff.value, currentMonth);
      },
      (error) => {
        setLoading(false);
        SimpleToast.show(error?.data?.message || "Failed to update attendance", SimpleToast.SHORT);
      },
      (fail) => {
        setLoading(false);
        SimpleToast.show("Network error", SimpleToast.SHORT);
      }
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.Dashboard?.Attendance || "Attendance"}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        style_title={{ fontSize: 18 }}
      />

      <View style={styles.container}>
        {preSelectedStaffId ? (
          <Typography size={16} type={Font.Poppins_SemiBold} style={{ marginBottom: 10 }}>
            {preSelectedStaffName || 'Staff'} - Attendance
          </Typography>
        ) : (
          <DropdownComponent
            title={LocalizedStrings.Dashboard?.Attendance || "Staff Attendance"}
            placeholder={"Select Staff"}
            width={"100%"}
            style_dropdown={{ marginHorizontal: 0, height: 45 }}
            selectedTextStyleNew={{ marginLeft: 10, fontFamily: Font.Poppins_Regular }}
            marginHorizontal={0}
            style_title={{ fontFamily: Font.Poppins_Regular }}
            data={staffList}
            value={selectedStaff?.value}
            onChange={(item) => setSelectedStaff(item)}
          />
        )}

        {loading && (
          <ActivityIndicator size="small" color="#2196F3" style={{ marginVertical: 10 }} />
        )}

        <Calendar
          monthFormat={"MMMM yyyy"}
          hideExtraDays={true}
          maxDate={new Date().toISOString().split("T")[0]}
          onDayPress={handleDatePress}
          onMonthChange={handleMonthChange}
          markedDates={{
            ...markedDates,
            ...(selected
              ? { [selected]: { ...(markedDates[selected] || {}), selected: true, selectedColor: editMode ? "#000" : (markedDates[selected]?.selectedColor || "#000") } }
              : {}),
          }}
          theme={{
            todayTextColor: "#2196F3",
            arrowColor: "#2196F3",
            textDayFontFamily: Font.Poppins_Regular,
            textMonthFontFamily: Font.Poppins_Bold,
            textDayHeaderFontFamily: Font.Poppins_Medium,
          }}
          disableArrowRight={
            currentMonth >=
            `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
          }
        />

        {selectedStaff && (
          <Typography 
            size={12} 
            color="#999" 
            style={{ textAlign: 'center', marginTop: 10, fontFamily: Font.Poppins_Regular }}
          >
            Tip: Click on any date to mark attendance.
          </Typography>
        )}

        <Modal
          visible={statusModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setStatusModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Typography type={Font.Poppins_SemiBold} size={16} style={{ marginBottom: 15, textAlign: 'center' }}>
                Mark Attendance for {editingDate ? moment(editingDate).format("DD MMM") : ""}
              </Typography>
              
              <View style={styles.modalButtons}>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[styles.modalButton, { borderColor: status.color }]}
                    onPress={() => saveAttendanceEdit(status.value)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    <Typography type={Font.Poppins_Medium} size={14} color="#333">
                      {status.label}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setStatusModalVisible(false)}
              >
                <Typography type={Font.Poppins_Medium} size={14} color="#666">Cancel</Typography>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.summary}>
          <Typography size={16} type={Font.Poppins_Bold} style={styles.summaryTitle}>
            {LocalizedStrings.AttendanceStatistics?.Summary || "Summary"}
          </Typography>

          <View style={styles.summaryRow}>
            <Typography size={14} type={Font.Poppins_Regular}>
              {LocalizedStrings.AttendanceStatistics?.Total_Days_Worked || "Total Days Worked"}
            </Typography>
            <Typography size={14} type={Font.Poppins_Bold}>
              {summary.totalWorked}
            </Typography>
          </View>

          <View style={styles.summaryRow}>
            <Typography size={14} type={Font.Poppins_Regular}>
              {LocalizedStrings.AttendanceStatistics?.Absent_Days || "Absent Days"}
            </Typography>
            <Typography size={14} type={Font.Poppins_Bold}>
              {summary.absent}
            </Typography>
          </View>

          <View style={styles.summaryRow}>
            <Typography size={14} type={Font.Poppins_Regular}>
              {LocalizedStrings.AttendanceStatistics?.Leave_Days || "Leave Days"}
            </Typography>
            <Typography size={14} type={Font.Poppins_Bold}>
              {summary.leave}
            </Typography>
          </View>
        </View>

        <View style={styles.legendContainer}>
          <Typography size={16} type={Font.Poppins_Bold} style={styles.legendTitle}>
            {LocalizedStrings.AttendanceStatistics?.Legend || "Legend"}
          </Typography>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#4CAF50" }]} />
              <Typography size={14} type={Font.Poppins_Regular}>
                {LocalizedStrings.Dashboard?.Present || "Present"}
              </Typography>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#FFC107" }]} />
              <Typography size={14} type={Font.Poppins_Regular}>
                Late
              </Typography>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#2196F3" }]} />
              <Typography size={14} type={Font.Poppins_Regular}>
                {LocalizedStrings.Dashboard?.Holiday || "Holiday"}
              </Typography>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#F44336" }]} />
              <Typography size={14} type={Font.Poppins_Regular}>
                {LocalizedStrings.Dashboard?.Absent || "Absent"}
              </Typography>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#9E9E9E" }]} />
              <Typography size={14} type={Font.Poppins_Regular}>
                {LocalizedStrings.Dashboard?.Weekend || "Weekend"}
              </Typography>
            </View>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </View>
    </CommanView>
  );
};

export default AttendanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 20, backgroundColor: "#fff" },
  subHeader: { textAlign: "center", color: "#333" },
  summary: {
    marginTop: 20,
    backgroundColor: "#FAFAFB",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  summaryTitle: { marginBottom: 10, color: "#000" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomColor: "#DEE1E6",
    borderBottomWidth: 1,
  },
  legendContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#FAFAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  legendTitle: { marginBottom: 10, color: "#000" },
  legend: { flexDirection: "row", flexWrap: "wrap" },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 38,
    marginBottom: 10,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  editButtonContainer: {
    marginTop: 15,
    alignItems: "center",
  },
  editButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D98579",
    backgroundColor: "#FFF5EE",
  },
  editButtonActive: {
    backgroundColor: "#D98579",
    borderColor: "#D98579",
  },
  editPanel: {
    marginTop: 20,
    backgroundColor: "#FAFAFB",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#F9F9F9",
  },
  statusButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  saveButton: {
    backgroundColor: "#D98579",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalButtons: {
    gap: 12,
    marginBottom: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#FAFAFB',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  closeButton: {
    padding: 10,
    alignItems: 'center',
  },
});
