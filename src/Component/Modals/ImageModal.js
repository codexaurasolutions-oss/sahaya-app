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
      // Use launchImageLibrary with mixed type to access Files, Drive, etc.
      launchImageLibrary(
        {
          mediaType: 'mixed',
          includeBase64: false,
          selectionLimit: 1,
          presentationStyle: 'fullScreen',
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
              mime: asset.type || 'image/jpeg',
              filename: asset.fileName || `document_${Date.now()}.jpg`,
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
            <Typography fontFamily={Font.Inter_Bold} color={Colors.Black}>
              {title}
            </Typography>
            <TouchableOpacity onPress={() => close()}>
              <Image source={ImageConstant.close} style={{ height: 20, width: 20 }} />
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.modalView,
              { height: documents || deleteImage ? 220 : 200 },
            ]}
          >
            <TouchableOpacity style={styles.checkView} onPress={checkCameraPermission}>
              <View style={styles.iconContainer}>
                <Image
                  style={styles.icon}
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/128/685/685655.png',
                  }}
                />
              </View>
              <Typography
                size={16}
                color={Colors.black}
                style={{ marginLeft: 15 }}
                fontFamily={Font.Inter_Medium}
              >
                {"Photo"}
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkView} onPress={checkPhotoPermission}>
              <View style={styles.iconContainer}>
                <Image
                  style={styles.icon}
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/128/16025/16025439.png',
                  }}
                />
              </View>
              <Typography
                size={16}
                fontFamily={Font.Inter_Medium}
                color={Colors.black}
                style={{ marginLeft: 15 }}
              >
                {"Gallery"}
              </Typography>
            </TouchableOpacity>

            {document && (
              <TouchableOpacity
                style={styles.checkView}
                onPress={OpenFiles}
              >
                <View style={styles.iconContainer}>
                  <Image
                    style={styles.icon}
                    source={{
                      uri: 'https://cdn-icons-png.flaticon.com/128/2991/2991112.png',
                    }}
                  />
                </View>
                <Typography
                  size={16}
                  color={Colors.black}
                  fontFamily={Font.Inter_Medium}
                  style={{ marginLeft: 15 }}
                >
                  Files / Drive
                </Typography>
              </TouchableOpacity>
            )}
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
    borderWidth: 1,
    borderColor: Colors.grey,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: windowHeight / 4,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  modalHeader: {
    padding: 8,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: Colors.black,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  checkView: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
  },
  modalView: {
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  iconContainer: {
    borderRadius: 50,
    backgroundColor: Colors.bg_grey,
    height: 45,
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    height: 25,
    width: 25,
  },
});
