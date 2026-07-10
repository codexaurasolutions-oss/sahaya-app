import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image } from 'react-native';
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

import Typography from "../../Component/UI/Typography";
import { Font } from "../../Constants/Font";
import Input from '../../Component/Input';
import DropdownComponent from '../../Component/DropdownComponent';
import Date_Picker from '../../Component/Date_Picker';
import { ImageConstant } from '../../Constants/ImageConstant';
import { POST_FORM_DATA } from '../../Backend/Backend';
import { LAST_WORK_INFO } from '../../Backend/api_routes';
import { validators } from '../../Backend/Validator';
import { isValidForm } from '../../Backend/Utility';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { useNavigation, CommonActions } from '@react-navigation/native';
import LocalizedStrings from '../../Constants/localization';

const UpdateProfile = forwardRef((props, ref) => {
  const userDetail = useSelector(store => store?.userDetails);
  const navigation = useNavigation();
  const [role, setRole] = useState('');
  const [joinDate, setJoinDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [salary, setSalary] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [houseSold, setHouseSold] = useState(''); // Additional field from API
  const [errors, setErrors] = useState({});
  const [loader, setLoader] = useState(false);

  // Load existing last work experience data from userDetail
  useEffect(() => {
    const lastWorkInfo = userDetail?.last_exp || {};
    
    if (lastWorkInfo && Object.keys(lastWorkInfo).length > 0) {
      // Load role - API returns string like "Cook" or "Chef"
      if (lastWorkInfo.role) {
        setRole(lastWorkInfo.role);
      }

      // Load join date - API might return YYYY-MM-DD, DD/MM/YY format, or ISO format
      if (lastWorkInfo.join_date) {
        let parsedDate = null;
        // Try parsing YYYY-MM-DD format first (from API)
        if (typeof lastWorkInfo.join_date === 'string' && lastWorkInfo.join_date.includes('-') && !lastWorkInfo.join_date.includes('T')) {
          const parsed = moment(lastWorkInfo.join_date, 'YYYY-MM-DD');
          if (parsed.isValid()) {
            parsedDate = parsed.toDate();
          }
        }
        // Try parsing DD/MM/YY format
        else if (typeof lastWorkInfo.join_date === 'string' && lastWorkInfo.join_date.includes('/')) {
          const parsed = moment(lastWorkInfo.join_date, 'DD/MM/YY');
          if (parsed.isValid()) {
            parsedDate = parsed.toDate();
          }
        } else {
          // Try parsing ISO format or other formats
          const parsed = moment(lastWorkInfo.join_date);
          if (parsed.isValid()) {
            parsedDate = parsed.toDate();
          }
        }
        if (parsedDate) {
          setJoinDate(parsedDate);
        }
      }

      // Load end date - API might return YYYY-MM-DD, DD/MM/YY format, or ISO format
      if (lastWorkInfo.end_date) {
        let parsedDate = null;
        // Try parsing YYYY-MM-DD format first (from API)
        if (typeof lastWorkInfo.end_date === 'string' && lastWorkInfo.end_date.includes('-') && !lastWorkInfo.end_date.includes('T')) {
          const parsed = moment(lastWorkInfo.end_date, 'YYYY-MM-DD');
          if (parsed.isValid()) {
            parsedDate = parsed.toDate();
          }
        }
        // Try parsing DD/MM/YY format
        else if (typeof lastWorkInfo.end_date === 'string' && lastWorkInfo.end_date.includes('/')) {
          const parsed = moment(lastWorkInfo.end_date, 'DD/MM/YY');
          if (parsed.isValid()) {
            parsedDate = parsed.toDate();
          }
        } else {
          // Try parsing ISO format or other formats
          const parsed = moment(lastWorkInfo.end_date);
          if (parsed.isValid()) {
            parsedDate = parsed.toDate();
          }
        }
        if (parsedDate) {
          setEndDate(parsedDate);
        }
      }

      // Load salary - API returns string like "5000"
      if (lastWorkInfo.salary) {
        setSalary(String(lastWorkInfo.salary));
      }

      // Load working hours - API returns string like "8"
      if (lastWorkInfo.working_hours) {
        setWorkingHours(String(lastWorkInfo.working_hours));
      }

      // Load owner name - API returns string like "John Doe"
      if (lastWorkInfo.owner_name) {
        setOwnerName(lastWorkInfo.owner_name);
      }

      // Load contact number - API returns string like "9876543210"
      if (lastWorkInfo.contact_number) {
        setContactNumber(String(lastWorkInfo.contact_number));
      }

      // Load house sold (optional) - API returns string or null
      if (lastWorkInfo.house_sold) {
        setHouseSold(String(lastWorkInfo.house_sold));
      }
    } else {
    }
  }, [userDetail?.last_exp]);

  const saveLastWorkExperience = () => {
    // Validate all required fields
    const error = {
      // role: validators?.checkRequire('Role/Designation', role),
      // joinDate: validators?.checkRequire('Joining Date', joinDate),
      // endDate: validators?.checkRequire('End Date', endDate),
      // salary: validators?.checkRequire('Salary', salary),
      // workingHours: validators?.checkRequire('Working Hours', workingHours),
      // ownerName: validators?.checkRequire('Owner Name', ownerName),
      // contactNumber: validators?.checkRequire('Contact Number', contactNumber),
    };

    setErrors(error);

    if (!isValidForm(error)) {
      return Promise.reject(new Error('Validation failed'));
    }

    // Build form data - matching Postman format
    const formData = new FormData();

    // Format dates as DD/MM/YY
    const formattedJoinDate = joinDate ? moment(joinDate).format('DD/MM/YY') : '';
    const formattedEndDate = endDate ? moment(endDate).format('DD/MM/YY') : '';

    formData.append('role', role);
    formData.append('join_date', formattedJoinDate);
    formData.append('end_date', formattedEndDate);
    formData.append('salary', salary);
    formData.append('working_hours', workingHours);
    formData.append('house_sold', houseSold || ownerName); // Use houseSold if available, fallback to ownerName
    formData.append('owner_name', ownerName);
    formData.append('contact_number', contactNumber);

    setLoader(true);

    return new Promise((resolve, reject) => {
      POST_FORM_DATA(
        LAST_WORK_INFO,
        formData,
        success => {
          setLoader(false);
          SimpleToast.show('Last work experience saved successfully', SimpleToast.SHORT);
          // Reset navigation stack to TabNavigationForStaff
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'TabNavigationForStaff' }],
            })
          );
          resolve(success);
        },
        error => {
          setLoader(false);
          SimpleToast.show(error?.message || 'Failed to save last work experience', SimpleToast.SHORT);
          reject(error);
        },
        fail => {
          setLoader(false);
          SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
          reject(fail);
        },
      );
    });
  };

  useImperativeHandle(ref, () => ({
    saveLastWorkExperience: saveLastWorkExperience,
  }));
 
  return (
      <View style={styles.container}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={ImageConstant?.Briefcase} style={{ height: 20, width: 20, marginRight: 5 }} />
          <Typography style={styles.sectionTitle} type={Font?.Poppins_SemiBold} size={18}>{LocalizedStrings.staffSection?.UpdateProfile?.last_work_experience || "Last Work Experience"}</Typography>
        </View>
      
      <Input 
        title={'Role/Designation'} 
        value={role}
        onChange={(text) => {
          setRole(text);
          if (errors.role) setErrors({...errors, role: null});
        }}
        error={errors.role}
      />
      
        <View style={styles.row}>
        <View style={[styles.halfInput, { marginRight: 8 }]}>
          <Date_Picker
            title={'Joining Date'}
            placeholder={'DD/MM/YYYY'}
            selected_date={joinDate}
            allowFutureDates={false}
            disablePastDates={false}
            onConfirm={(date) => {
              setJoinDate(date);
              if (errors.joinDate) setErrors({...errors, joinDate: null});
            }}
            error={errors.joinDate}
          />
        </View>
        <View style={styles.halfInput}>
          <Date_Picker
            title={'End Date'}
            placeholder={'DD/MM/YYYY'}
            selected_date={endDate}
            allowFutureDates={false}
            disablePastDates={false}
            onConfirm={(date) => {
              setEndDate(date);
              if (errors.endDate) setErrors({...errors, endDate: null});
            }}
            error={errors.endDate}
          />
        </View>
      </View>
      
      <Input 
        title={'Salary'} 
        value={salary}
        onChange={(text) => {
          setSalary(text);
          if (errors.salary) setErrors({...errors, salary: null});
        }}
        keyboardType="numeric"
        error={errors.salary}
      />
      
      <Input 
        title={'Working Hours'} 
        value={workingHours}
        onChange={(text) => {
          setWorkingHours(text);
          if (errors.workingHours) setErrors({...errors, workingHours: null});
        }}
        error={errors.workingHours}
      />
      
      <Input 
        title={'Household Owner Name'} 
        value={ownerName}
        onChange={(text) => {
          setOwnerName(text);
          if (errors.ownerName) setErrors({...errors, ownerName: null});
        }}
        error={errors.ownerName}
      />
      
      <Input 
        title={'Contact Number'} 
        value={contactNumber}
        onChange={(text) => {
          const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 10);
          setContactNumber(digitsOnly);
          if (errors.contactNumber) setErrors({...errors, contactNumber: null});
        }}
        keyboardType="phone-pad"
        maxLength={10}
        error={errors.contactNumber}
      />
      
      {/* <Input 
        title={'House Sold (Optional)'} 
        value={houseSold}
        onChange={(text) => {
          setHouseSold(text);
        }}
      />
      
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <DropdownComponent
              title="State"
              width={'100%'}
              marginHorizontal={0}
              style_dropdown={{ marginHorizontal: 0, width: '95%' }}
              selectedTextStyleNew={{ marginLeft: 10 }}
              style_title={{ textAlign: 'left' }}
              data={[{ label: 'Punjab', value: 'pb' }, { label: 'Delhi', value: 'dl' }]}
            />
          </View>
          <View style={styles.halfInput}>
            <DropdownComponent
              title="City"
              width={'100%'}
              style_dropdown={{ marginHorizontal: 0, width: '99%' }}
              selectedTextStyleNew={{ marginLeft: 10 }}
              marginHorizontal={0}
              style_title={{ textAlign: 'left' }}
              data={[{ label: 'Ludhiana', value: 'ldh' }, { label: 'Delhi', value: 'dl' }]}
            />
        </View>
      </View> */}
      </View>
  );
});

export default UpdateProfile;

const styles = StyleSheet.create({
  container: {
 marginTop:10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
  },
  sectionTitle: {

    marginVertical: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
  },
  button: {
    backgroundColor: '#C56E59',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Font.bold,
  },
});
