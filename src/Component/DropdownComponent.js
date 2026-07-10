import { StyleSheet, Text, View, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-native-element-dropdown';
import { ImageConstant } from '../Constants/ImageConstant';
import { Colors } from '../Constants/Colors';
import Typography from './UI/Typography';
import { Font } from '../Constants/Font';

const DropdownComponent = ({
  title,
  source,
  style_img,
  style_title,
  style_dropdown,
  data,
  value,
  onChange = () => { },
  containerStyle = {},
  MainBoxStyle = {},
  iconColor,
  disable,
  width = '100%',
  marginHorizontal = 20,
  size = 52,
  error,
  placeholder = " ",
  leftIcons = ImageConstant.BackArrow,
  leftIconsShow=false,
  selectedTextStyleNew={},
  dropdownPosition = 'auto',
  multiSelect = false,
  selectedValues = [],
}) => {
  const isItemSelected = (itemValue) => {
    if (multiSelect) {
      return selectedValues.some(v => v === itemValue || v?.value === itemValue);
    }
    return value && itemValue === (value?.value || value);
  };

  const renderItem = (item, index) => {
    const isSelected = isItemSelected(item?.value);
    return (
      <View key={item?.value || index}>
        <View
          style={{
            flexDirection: 'row',
            height: 50,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isSelected ? '#FFF5F3' : 'white',
            paddingHorizontal: 16,
            borderRadius: 8,
            marginHorizontal: 6,
            marginVertical: 2,
          }}>
          <Typography style={{ flex: 1 }} type={Font.Poppins_Medium} size={14}>
            {item?.label}
          </Typography>
          {multiSelect ? (
            <View style={{
              height: 22,
              width: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: isSelected ? '#D98579' : '#CCCCCC',
              backgroundColor: isSelected ? '#D98579' : 'white',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isSelected && (
                <Typography size={14} color="white" type={Font.Poppins_SemiBold}>
                  ✓
                </Typography>
              )}
            </View>
          ) : (
            <Image
              style={{ height: 20, width: 20, marginStart: 20, resizeMode: 'contain' }}
              source={
                isSelected ? ImageConstant.radioButtonOn : ImageConstant.radioButtonOff
              }
            />
          )}
        </View>
        {index !== data?.length - 1 && (
          <View
            style={{
              height: 1.5,
              backgroundColor: Colors.lightgrey,
              marginHorizontal: 20,
            }}></View>
        )}
      </View>
    );
  };
  return (
    <>
      <View style={[{ marginHorizontal: marginHorizontal, marginVertical: 10 }, MainBoxStyle]}>
        {
          title && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 5,
              }}>
              {source && <Image source={source} style={[styles.img_style, style_img]} />}
              <Typography  style={[styles.txt_style, style_title]}>
                {title}
              </Typography>
            </View>
          )
        }
        <Dropdown
          disable={disable}
          showsVerticalScrollIndicator={false}
          style={[styles.dropdown, style_dropdown,{ borderColor: error ? 'red' : '#E0E0E0' }]}
          selectedTextStyle={[styles.selectedTextStyle,selectedTextStyleNew]}
          iconStyle={styles.iconStyle}
          placeholderStyle={[styles.placeholderStyle,{...selectedTextStyleNew}]}
          data={data}
          value={multiSelect ? (selectedValues || []) : value}
          multiSelect={multiSelect}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={placeholder}
          dropdownPosition={dropdownPosition}
          iconColor={iconColor}
          activeColor="#FFF5F3"
          onChange={item => {
            onChange(item);
          }}
          renderRightIcon={() => {
            return (
              <View
                pointerEvents="none"
                style={{
                  height: 24,
                  width: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Image
                  tintColor={iconColor}
                  source={ImageConstant.BackArrow}
                  style={{
                    height: 15,
                    width: 8,
                    resizeMode: 'contain',
                    tintColor:"#979797",
                    transform: [{ rotate: '-90deg' }],
                  }}
                />
              </View>
            );
          }}
          renderLeftIcon={() => {
            return (
              <>
                {
                  leftIconsShow && (
                    <View
                      pointerEvents="none"
                      style={{
                        height: 24,
                        width: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Image
                        tintColor={iconColor}
                        source={leftIcons}
                        style={{
                          height: 20,
                          width: 20,
                          resizeMode: 'contain',
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}
                      />
                    </View>
                  )
                }
              </>
            );
          }}
          renderItem={renderItem}
          containerStyle={[styles.containerStyle, containerStyle,]}
        />
      </View>
      {error && (
        <Typography
          textAlign={"right"}
          style={{ color: 'red', fontSize: 12, marginStart: 5, marginTop: -5, marginBottom: 10 }}>
          {error}
        </Typography>
      )}
    </>
  );
};

export default DropdownComponent;

const styles = StyleSheet.create({
  img_style: {
    height: 16,
    width: 16,
    marginLeft: 10,
  },
  txt_style: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Font.Poppins_Medium,
    marginBottom: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor:"#E0E0E0",
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginHorizontal: 10,
    height: 56,
    paddingHorizontal: 4,
  },
  placeholderStyle: {
    color: '#999',
    fontSize: 14,
    fontFamily: Font.Poppins_Regular,
    flex: 1,
  },
  inputSearchStyle: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E0E0E0',
  },
  iconStyle: {
    height: 20,
    width: 20,
    marginHorizontal: 10,
    marginVertical: 18,
  },
  selectedTextStyle: {
    color: Colors.black,
    fontSize: 14,
    fontFamily: Font.Poppins_Medium,
  },
  containerStyle: {
    borderRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'visible',
    marginTop: 2,
  },
});
