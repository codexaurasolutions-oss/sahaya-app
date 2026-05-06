import { StyleSheet, Modal, View, TouchableOpacity, Image, Platform, PermissionsAndroid } from 'react-native';
import React, { useState } from 'react';
import { openCamera, openPicker } from 'react-native-image-crop-picker';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import SimpleToast from 'react-native-simple-toast';
import Typography from '../UI/Typography';
import { ImageConstant } from '../../Constants/ImageConstant';
import { Colors } from '../../Constants/Colors';
import { Font } from '../../Constants/Font';
import { windowHeight } from '../../Constants/Dimensions';
import { launchImageLibrary } from 'react-native-image-picker';



const ImageModal = ({
  showModal,
  multiple = false,
  documents = false,
  document,
  close = () => { },
  selected = () => { },
  TimeVal,
  mediaType = 'photo',
  deleteImage = false,
  title
}) => {

  const OpenCamera = () => {
    close();
    setTimeout(() => {
      openCamera({
        mediaType: mediaType,
        width: 200,
        height: 200,
        cropping: mediaType !== 'video',
        compressImageQuality: 0.8,
        compressImageFormat: 'jpeg',
        forceJpg: true,
      })
        .then(response => {
          let arr = [];
          arr.push(response);
          selected(arr, 'camera');
        })
        .catch(err => {
          console.log('Camera error:', err);
        });
    }, 500);
  };

  const OpenGallery = () => {
    close();
    setTimeout(() => {
      openPicker({
        mediaType: mediaType,
        width: 200,
        height: 200,
        cropping: mediaType !== 'video',
        multiple: multiple,
        compressImageQuality: 0.8,
        compressImageFormat: 'jpeg',
        forceJpg: true,
      })
        .then(response => {
          let arr = [];
          arr.push(response);
          selected(arr, 'gallery');
        })
        .catch(err => {
          console.log('Gallery error:', err);
        });
    }, 500);
  };

  const OpenFiles = () => {
    close();
    setTimeout(() => {
      // For Android, using mixed mediaType with launchImageLibrary 
      // is the best we can do without react-native-document-picker.
      // We'll use specific options to encourage the system file picker.
      launchImageLibrary(
        {
          mediaType: 'mixed',
          includeBase64: false,
          selectionLimit: 1,
          presentationStyle: 'fullScreen',
          assetRepresentationMode: 'current',
        },
        response => {
          if (response.didCancel) return;
          if (response.errorCode) {
            SimpleToast.show('Could not open files. Please try again.');
            return;
          }
          if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            const fileObj = {
              path: asset.uri,
              uri: asset.uri,
              mime: asset.type || (asset.uri?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
              filename: asset.fileName || `document_${Date.now()}.${asset.uri?.endsWith('.pdf') ? 'pdf' : 'jpg'}`,
            };
            selected([fileObj], 'files');
          }
        },
      );
    }, 500);
  };

  const isIos = Platform.OS == "ios"

  const checkCameraPermission = () => {
    check(!isIos ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA)
      .then(result => {
        switch (result) {
          case RESULTS.UNAVAILABLE:
            requestCameraPermission();
            SimpleToast.show('Feature not available on this device.');
            break;
          case RESULTS.DENIED:
            requestCameraPermission();
            break;
          case RESULTS.LIMITED:
            requestCameraPermission();
            break;
          case RESULTS.GRANTED:
            OpenCamera();
            break;
          case RESULTS.BLOCKED:
            SimpleToast.show('Permission is blocked. Please enable it from settings.');
            break;
        }
      })
      .catch(error => {
        SimpleToast.show('An error occurred while checking permissions.');
      });
  };

  const checkPhotoPermission = () => {
    check(
      !isIos
        ? Platform.constants['Release'] > 12
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
        : PERMISSIONS.IOS.PHOTO_LIBRARY,
    )
      .then(result => {
        switch (result) {
          case RESULTS.UNAVAILABLE:
            SimpleToast.show('This feature is not available.');
            break;
          case RESULTS.DENIED:
            requestPhotosPermission();
            break;
          case RESULTS.LIMITED:
            requestPhotosPermission();
            break;
          case RESULTS.GRANTED:
            OpenGallery();
            break;
          case RESULTS.BLOCKED:
            SimpleToast.show('Permission is blocked. Please enable it from settings.');
            break;
        }
      })
      .catch(error => {
        SimpleToast.show('An error occurred while checking photo permissions.');
      });
  };

  const requestCameraPermission = () => {
    request(isIos ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA)
      .then(result => {
        if (result === 'blocked') {
          close();
          SimpleToast.show('Permission is blocked. Please enable it from settings.');
        } else if (result === 'granted') {
          OpenCamera();
        } else if (result === 'denied') {
          checkCameraPermission();
        }
      })
      .catch(e => console.log('Error requesting camera permission:', e));
  };

  const requestPhotosPermission = () => {
    request(
      isIos
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : Platform.constants['Release'] > 12
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    )
      .then(result => {
        if (result === 'blocked') {
          close();
          SimpleToast.show('Photo library access denied.');
        } else if (result === 'granted' || result === 'limited') {
          OpenGallery();
        } else if (result === 'denied') {
          checkPhotoPermission();
        }
      })
      .catch(e => console.warn('Error requesting photo permission:', e));
  };



  return (
    <Modal
      statusBarTranslucent
      onRequestClose={() => close()}
      transparent={true}
      visible={showModal}
    >
      <TouchableOpacity 
        style={styles.modalContainer}
        activeOpacity={1}
        onPress={() => close()}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <View style={styles.headerBar} />
            <View style={styles.headerTitleRow}>
              <Typography size={18} fontFamily={Font.Inter_Bold} color={Colors.Black}>
                {title || 'Upload Document'}
              </Typography>
              <TouchableOpacity onPress={() => close()} style={styles.closeCircle}>
                <Image source={ImageConstant.close} style={{ height: 12, width: 12, tintColor: '#fff' }} />
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={[
              styles.modalView,
              { height: documents || deleteImage ? 220 : 200 },
            ]}
          >
            <View style={styles.optionsGrid}>
              <TouchableOpacity style={styles.optionBtn} onPress={checkCameraPermission}>
                <View style={[styles.iconWrapper, { backgroundColor: '#E3F2FD' }]}>
                  <Image
                    style={styles.optionIcon}
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/128/685/685655.png' }}
                  />
                </View>
                <Typography size={14} color={Colors.black} fontFamily={Font.Inter_Medium} style={styles.optionLabel}>
                  {"Camera"}
                </Typography>
              </TouchableOpacity>
  
              <TouchableOpacity style={styles.optionBtn} onPress={checkPhotoPermission}>
                <View style={[styles.iconWrapper, { backgroundColor: '#F3E5F5' }]}>
                  <Image
                    style={styles.optionIcon}
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/128/16025/16025439.png' }}
                  />
                </View>
                <Typography size={14} fontFamily={Font.Inter_Medium} color={Colors.black} style={styles.optionLabel}>
                  {"Gallery"}
                </Typography>
              </TouchableOpacity>
  
              {document && (
                <TouchableOpacity style={styles.optionBtn} onPress={OpenFiles}>
                  <View style={[styles.iconWrapper, { backgroundColor: '#E8F5E9' }]}>
                    <Image
                      style={styles.optionIcon}
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/128/2991/2991112.png' }}
                    />
                  </View>
                  <Typography size={14} color={Colors.black} fontFamily={Font.Inter_Medium} style={styles.optionLabel}>
                    Files / Drive
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ImageModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.gray + "80",

  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  headerBar: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeCircle: {
    backgroundColor: '#D98579',
    borderRadius: 20,
    padding: 6,
  },
  modalHeader: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    paddingBottom: 20,
  },
  optionBtn: {
    alignItems: 'center',
    width: '30%',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    // Add subtle shadow for premium feel
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionIcon: {
    height: 30,
    width: 30,
    resizeMode: 'contain',
  },
  optionLabel: {
    textAlign: 'center',
  },
  modalView: {
    marginTop: 10,
  },
});
