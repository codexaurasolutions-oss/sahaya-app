import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import React, { Profiler } from 'react';
import { Colors } from '../Constants/Colors';
import { Font } from '../Constants/Font';
import { ImageConstant } from '../Constants/ImageConstant';
import { isPlaceholderImage } from '../Utils/ImageUtils';
import Typography from './UI/Typography';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';

const HeaderForUser = ({
  onPress,
  style_img,
  style_backarrow,
  style_title,
  title,
  source_arrow,
  source_logo,
  containerStyle,
  centerIcon = false,
  backgroundColor = Colors.white,
  centerIconSource,
  centerIconTitle,
  onPressRightIcon = () => { },
  onPressLangIcon = () => { },
  onPressLeftIcon = () => { },
  onPressProfileIcon = () => { },
  onPressWalletIcon = () => { },
  back_img,
  Lang_icon,
  Profile_icon,
  wallet_icon,
  walletBalance,
}) => {
  const navigation = useNavigation();
  return (
    <View style={[styles.container, containerStyle]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
        
      />

      <View style={styles.backContainer}>
        {wallet_icon && (
          <TouchableOpacity onPress={onPressWalletIcon} style={styles.walletContainer}>
            <View style={styles.walletIconCircle}>
              <Typography type={Font.Poppins_SemiBold} style={{ fontSize: 16, color: '#E8943A' }}>
                {'\u20B9'}
              </Typography>
            </View>
            <View style={styles.walletTextBox}>
              <Typography type={Font.Poppins_Medium} style={styles.walletLabel}>
                Wallet
              </Typography>
              <Typography type={Font.Poppins_SemiBold} style={styles.walletAmount}>
                {'\u20B9'}{walletBalance || '0.00'}
              </Typography>
            </View>
          </TouchableOpacity>
        )}
        {source_arrow ? (
          <TouchableOpacity
            onPress={() => {
              onPressLeftIcon();
            }}
          >
            <Image
              source={source_arrow}
              style={[styles.back_img, style_backarrow]}
            />
          </TouchableOpacity>
        ) : (
          <View style={[styles.back_img, style_backarrow]} />
        )}
        <Typography
          type={Font.Poppins_Medium}
          style={[styles.txt_style, style_title]}
        >
          {title}
        </Typography>
        {Lang_icon && (
          <TouchableOpacity onPress={onPressLangIcon} style={{ right: 15 }}>
            <Image
              source={Lang_icon}
              style={[styles.back_img, { tintColor: '#fff' }, back_img]}
            />
          </TouchableOpacity>
        )}

        {source_logo && (
          <TouchableOpacity onPress={onPressRightIcon} style={{ right: 10 }}>
            <Image source={source_logo} style={[styles.back_img, back_img]} />
          </TouchableOpacity>
        )}

        {Profile_icon && (
          <TouchableOpacity onPress={onPressProfileIcon}>
            <Image
              source={
                Profile_icon && !isPlaceholderImage(Profile_icon)
                  ? { uri: Profile_icon }
                  : ImageConstant.user
              }
              style={[
                styles.back_img,
                { height: 35, width: 35, borderRadius: 40, resizeMode: 'cover' },
                back_img,
              ]}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default HeaderForUser;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#EBEBEA',
    backgroundColor: '#FFFFFF',
  },
  backContainer: {
    flexDirection: 'row',
    //paddingTop: heightPercentageToDP(7),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  back_img: {
    height: 30,
    width: 30,
    resizeMode: 'center',
  },
  txt_style: {
    color: Colors?.black,
    fontSize: 15,
    textAlign: 'center',
    flex: 1,
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  walletIconCircle: {
    height: 30,
    width: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#E8943A',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletTextBox: {
    marginLeft: 6,
  },
  walletLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  walletAmount: {
    fontSize: 13,
    lineHeight: 16,
  },
});
