import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  PixelRatio,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {Colors} from '../Constants/Colors';
import Typography from './UI/Typography';
import {CountryPicker} from 'react-native-country-codes-picker';

import {Font} from '../Constants/Font';
import {useScrollContext} from './CommanView';

const Input = ({
  title,
  style_title,
  style_input,
  placeholder,
  keyboardType = 'default',
  maxLength,
  multiline,
  value,
  optional,
  editable = true,
  onChange,
  secureTextEntry,
  onPress,
  source_eye,
  style_inputContainer,
  placeholderTextColor,
  borderColor = "#DDDDDD",
  countryPicker = false,
  onCountryPress = () => {},
  country,
  numberOfLines,
  onFocus = () => {},
  error = '',
  mainStyle,
  titleTo,
  icon_style,
  showImage,
  source,
  showTitle = true,
  textAlign = 'right',
  firstStyle,
  showImage2,
  prefixText,
  rightAccessory,
}) => {
  const [show, setShow] = useState(false);
  const [countryCode, setCountryCode] = useState({
    flag: 'IN',
    dial_code: '+91',
  });

  const fontScale = PixelRatio?.getFontScale();
  const containerRef = useRef(null);
  const scrollToNode = useScrollContext();

  useEffect(() => {
    if (country?.dial_code) {
      setCountryCode(prev =>
        prev?.dial_code === country?.dial_code ? prev : country,
      );
    }
  }, [country]);

  const handleFocus = (e) => {
    // Tell parent ScrollView to scroll to this input
    if (containerRef.current && scrollToNode) {
      scrollToNode(containerRef.current);
    }
    onFocus(e);
  };

  return (
    <>
      <View ref={containerRef} collapsable={false} style={[styles.container, mainStyle]}>
        {showTitle && (
          <View style={styles.titleContainer}>
            <Typography
              style={[
                styles.txt_style,
                {fontSize: 15 / fontScale},
                style_title,
              ]}>
              {title}
            </Typography>
            <Typography style={[styles.txt_style, style_title]}>
              {titleTo}
            </Typography>
          </View>
        )}

        <View
          style={[
            styles.input_container,
            style_inputContainer,
            {borderColor: error ? 'red' : borderColor},
          ]}>
          {showImage && (
            <Image source={source} style={[styles.image, firstStyle]} />
          )}
          {countryPicker && (
            <>
              <TouchableOpacity
                onPress={() => setShow(true)}
                style={styles.countryPickerContainer}>
                <View style={styles.countryInfo}>
                  <Typography
                    size={17}
                    type={Font.Inter_Bold}
                    style={styles.countryFlag}>
                    {/* {countryCode?.flag} */}
                  </Typography>
                  <Typography
                    size={17}
                    type={Font.Inter_Bold}
                    style={styles.countryDialCode}>
                    {countryCode?.dial_code}
                  </Typography>
                </View>
              </TouchableOpacity>

              <CountryPicker
                show={show}
                onBackdropPress={() => setShow(false)}
                style={styles.countryPickerStyle}
                pickerButtonOnPress={item => {
                  onCountryPress(item);
                  setCountryCode(item);
                  setShow(false);
                }}
              />
            </>
          )}

          {prefixText && (
            <Typography style={{ marginLeft: 15, marginRight: -5, fontSize: 14 / fontScale, fontFamily: Font.Poppins_Medium, color: Colors.black, alignSelf: 'center' }}>
              {prefixText}
            </Typography>
          )}

          <TextInput
            style={[styles.input, {fontSize: 13 / fontScale}, prefixText && { paddingLeft: 5 }, style_input]}
            onChangeText={onChange}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            editable={editable}
            placeholder={placeholder}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            value={value}
            textAlignVertical={multiline ? 'top' : 'center'}
            placeholderTextColor={placeholderTextColor}
            onFocus={handleFocus}
          />
          {rightAccessory}
          {showImage2 && (
            <Image
              source={source}
              style={[styles.image, firstStyle]}
              tintColor={'#171A1F'}
            />
          )}
          {source_eye && (
            <TouchableOpacity style={styles.icon_container} onPress={onPress}>
              <Image
                source={source_eye}
                style={[styles.icon_style, icon_style]}
              />
            </TouchableOpacity>
          )}
        </View>

        {optional && (
          <View style={styles.optionalContainer}>
            <Typography
              size={12}
              marginTop={5}
              type={Font.Inter_Regular}
              marginBottom={-20}
              color="#72778C">
              {'(Optional)'}
            </Typography>
          </View>
        )}

        {error && (
          <Typography textAlign={textAlign} style={styles.errorText}>
            {error}
          </Typography>
        )}
      </View>
    </>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txt_style: {
    color: Colors.lableColor,
    fontSize: 14,
    fontFamily: Font.Poppins_Medium,
  },
  input_container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 5,
    height: 60,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor:"#DDDDDD"
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 13,
    fontFamily: Font.Poppins_Medium,
    color: Colors.black,
    maxHeight: 'fixed',
  },
  icon_container: {
    paddingRight: 5,
  },
  icon_style: {
    height: 22,
    width: 22,
    marginRight: 5,
  },
  countryPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryFlag: {
    marginLeft: 5,
  },
  countryDialCode: {
    marginHorizontal: 1,
    fontSize: 14,
    fontFamily: Font.Poppins_Medium,
  },
  arrowIcon: {
    height: 7,
    width: 14,
    resizeMode: 'contain',
    marginLeft: 2,
  },
  countryPickerStyle: {
    modal: {
      height: '50%',
    },
    textInput: {
      fontFamily: Font.Poppins_Medium,
      color: 'black',
      paddingHorizontal: 10,
    },
    countryName: {
      fontFamily: Font.Poppins_Medium,
      color: 'black',
    },
    dialCode: {
      fontFamily: Font.Poppins_Medium,
      color: 'black',
    },
  },
  optionalContainer: {
    alignSelf: 'flex-end',
  },
  errorText: {
    color: 'red',
    fontize: 11,
    paddingTop: 8,
  },
  image: {
    height: 20,
    width: 20,
    marginLeft: 10,
    marginRight:5,
    resizeMode: 'contain',
  },
});

