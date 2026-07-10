import React, { useEffect, useState } from 'react';
import DatePicker from 'react-native-date-picker';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import moment from 'moment';
import Typography from './UI/Typography';
import { ImageConstant } from '../Constants/ImageConstant';
import { Colors } from '../Constants/Colors';
import { Font } from '../Constants/Font';
import LocalizedStrings from '../Constants/localization';

const Date_Picker = ({
  onChange = () => {},
  onConfirm = () => {},
  placeholder = 'DD-MM-YYYY',
  title = LocalizedStrings?.personalInfo?.dob,
  selected_date = '',
  error,
  allowFutureDates,
  disablePastDates = false,
  ageRestrict = false,
  // dateValue
}) => {
  const [date, setDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // Update state with the selected date if provided
    if (selected_date) {
      setDate(new Date(selected_date));
    }
  }, [selected_date]);

  const handleConfirm = selectedDate => {
    setValidationError('');
    setDate(selectedDate);
    setShowPicker(false);
    onConfirm(selectedDate);
  };

  const ageRestriction = ageRestrict
    ? moment().subtract(18, 'years').toDate()
    : allowFutureDates === false
    ? new Date() // Set maximum date to today
    : null;

  return (
    <View style={{ marginTop: 18, marginBottom: 3 }}>
      {title && <Typography style={styles?.textStyle}>{title}</Typography>}
      <TouchableOpacity
        style={[styles.container, { borderColor: error ? 'red' : '#DDDDDD' }]}
        onPress={() => {
          setShowPicker(true);
        }}
      >
        <Typography
          style={styles.label}
          color={date ? Colors?.black : Colors?.gray}
        >
          {date ? moment(date).format('DD-MM-YYYY') : placeholder}
        </Typography>
        <View style={{ marginRight: 5 }}>
          {/* <SvgIcon name={'calender'} /> */}
          <Image
            source={ImageConstant?.Calendar}
            style={{ width: 25, height: 25, resizeMode: 'center',tintColor:"gray" }}
          />
        </View>
      </TouchableOpacity>
      {showPicker && (
        <View style={styles?.datePickerContainer}>
          <DatePicker
            mode="date"
            modal
            open={showPicker}
            date={date || ageRestriction || new Date()}
            minimumDate={disablePastDates ? new Date() : undefined}
            maximumDate={ageRestriction}
            onConfirm={handleConfirm}
            onCancel={() => setShowPicker(false)}
            onChange={onChange}
          />
        </View>
      )}
      {error && (
        <Typography textAlign={'right'} style={styles.errorText}>
          {error}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 5,
    backgroundColor: Colors.white,
    borderWidth: 1,
    height: 60,
  },
  label: {
    fontSize: 14,
    fontFamily: Font.Poppins_Medium,
    paddingLeft: 15,
  },
  datePickerContainer: {
    alignItems: 'center',
  },
  textStyle: {
    color: Colors.lableColor,
    fontSize: 15,
    fontFamily: Font?.Poppins_Medium,
    marginBottom: 6,
  },
  errorText: {
    color: 'red',
    fontize: 11,
    paddingTop: 8,
  },
});

export default Date_Picker;
