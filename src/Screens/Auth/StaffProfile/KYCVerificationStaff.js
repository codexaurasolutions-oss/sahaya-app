import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import UploadBox from '../../../Component/UploadBox';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { Font } from '../../../Constants/Font';
import Typography from '../../../Component/UI/Typography';
import { POST_FORM_DATA } from '../../../Backend/Backend';
import { PROFILE_UPDATE } from '../../../Backend/api_routes';
import ImageModal from '../../../Component/Modals/ImageModal';
import { isValidForm } from '../../../Backend/Utility';
import LocalizedStrings from '../../../Constants/localization';
import { validators } from '../../../Backend/Validator';
import SimpleToast from 'react-native-simple-toast';

const KYCVerificationStaff = forwardRef(({ userDetail, prefillFromProfile = true }, ref) => {
  const [uploadedImages, setUploadedImages] = useState({
    verification_certificate: null,
    aadhar_front: null,
    aadhar_back: null,
  });

  useEffect(() => {
    if (!prefillFromProfile) {
      setUploadedImages({
        verification_certificate: null,
        aadhar_front: null,
        aadhar_back: null,
      });
      return;
    }

    const kycInfo = userDetail?.kyc_information || {};

    // Helper function to check if path is valid
    const isValidPath = path => {
      return (
        path &&
        typeof path === 'string' &&
        path.trim().length > 0 &&
        path !== 'null' &&
        path !== 'undefined'
      );
    };

    setUploadedImages({
      verification_certificate: isValidPath(userDetail?.verification_certificate)
        ? { uri: userDetail.verification_certificate }
        : isValidPath(kycInfo?.verification_certificate)
        ? { uri: kycInfo.verification_certificate }
        : isValidPath(kycInfo?.police_clearance_certificate_path)
        ? { uri: kycInfo.police_clearance_certificate_path }
        : null,
      aadhar_front: isValidPath(userDetail?.aadhar_front)
        ? { uri: userDetail.aadhar_front }
        : isValidPath(kycInfo?.aadhar_front)
        ? { uri: kycInfo.aadhar_front }
        : isValidPath(kycInfo?.adharfront_path)
        ? { uri: kycInfo.adharfront_path }
        : null,
      aadhar_back: isValidPath(userDetail?.aadhar_back)
        ? { uri: userDetail.aadhar_back }
        : isValidPath(kycInfo?.aadhar_back)
        ? { uri: kycInfo.aadhar_back }
        : isValidPath(kycInfo?.adharbackend_path)
        ? { uri: kycInfo.adharbackend_path }
        : null,
    });
  }, [prefillFromProfile, userDetail]);

  const [currentImageType, setCurrentImageType] = useState('');

  const [showImageModal, setShowImageModal] = useState(false);

  const [errors, setErrors] = useState({});

  // Function to set image
  const setImageData = (imageType, imageData) => {
    setUploadedImages(prev => ({
      ...prev,
      [imageType]: imageData,
    }));
    // Clear error when image is uploaded
    if (errors[imageType]) {
      setErrors(prev => ({
        ...prev,
        [imageType]: null,
      }));
    }
  };

  // Handle image selection from modal
  const handleImageSelected = (images) => {
    if (images && images.length > 0) {
      const selectedImage = images[0];
      const imageObj = {
        uri: selectedImage?.path || selectedImage?.uri,
        path: selectedImage?.path,
        name: selectedImage?.filename || `${currentImageType}.jpg`,
        type: selectedImage?.mime || 'image/jpeg',
      };

      // Store the image data
      setImageData(currentImageType, imageObj);

      // Clear error for this field
      setErrors(prev => ({
        ...prev,
        [currentImageType]: null,
      }));
    }
  };

  // Handle image selection
  const handleImageSelection = imageType => {
    setCurrentImageType(imageType);
    setShowImageModal(true);
  };

  const renderImagePreview = imageType => {
    const image = uploadedImages[imageType];

    if (image) {
      // Handle different image data formats
      const imageUri = image.uri || image.path || image.source?.uri;

      // Check if URI is valid (not empty, null, or undefined)
      if (
        imageUri &&
        typeof imageUri === 'string' &&
        imageUri.trim().length > 0 &&
        imageUri !== 'null' &&
        imageUri !== 'undefined'
      ) {
        return (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                setImageData(imageType, null);
                // Clear error when image is removed (error will show again on validation)
                if (errors[imageType]) {
                  setErrors(prev => ({
                    ...prev,
                    [imageType]: null,
                  }));
                }
              }}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }
    return null;
  };

  const saveKYC = () => {
    // Check if image exists (has uri or path)
    const hasImage = img => {
      if (!img) return false;
      const uri = img.uri || img.path;
      return (
        uri &&
        typeof uri === 'string' &&
        uri.trim().length > 0 &&
        uri !== 'null' &&
        uri !== 'undefined'
      );
    };

    // Validate all required images using validators
    const validationErrors = {
      aadhar_front: validators.checkRequire(
        LocalizedStrings.NewStaffForm?.Aadhaar_Card_Details + ' Front' ||
          'Aadhaar Front',
        hasImage(uploadedImages.aadhar_front)
          ? uploadedImages.aadhar_front
          : null,
      ),
      aadhar_back: validators.checkRequire(
        LocalizedStrings.NewStaffForm?.Aadhaar_Card_Details + ' Back' ||
          'Aadhaar Back',
        hasImage(uploadedImages.aadhar_back)
          ? uploadedImages.aadhar_back
          : null,
      ),
    };

    setErrors(validationErrors);

    if (!isValidForm(validationErrors)) {
      SimpleToast.show(
        'Please upload all required documents',
        SimpleToast.SHORT,
      );
      return Promise.reject(new Error('Validation failed'));
    }

    // Check if any images have been changed (have 'path' or 'uri' which means user uploaded)
    const changedImages = [];
    Object.keys(uploadedImages).forEach(key => {
      const image = uploadedImages[key];
      if (image && (image.path || image.uri)) {
        changedImages.push(key);
      }
    });

    console.log('--- KYC changedImages ---', changedImages);

    // If no images were changed, don't hit the API, just resolve
    if (changedImages.length === 0) {
      console.log('--- KYC: No images to upload, skipping ---');
      return Promise.resolve({ message: 'No changes detected' });
    }

    // Only send changed images
    const formData = new FormData();
    changedImages.forEach(key => {
      const image = uploadedImages[key];
      const imageUri = image.path || image.uri;
      console.log(`--- KYC appending ${key} ---`, imageUri);
      formData.append(key, {
        uri: imageUri,
        name: image.name || `${key}.jpg`,
        type: image.type || 'image/jpeg',
      });
    });

    return new Promise((resolve, reject) => {
      POST_FORM_DATA(
        PROFILE_UPDATE,
        formData,
        success => {
          console.log('--- KYC upload SUCCESS ---', JSON.stringify(success));
          resolve(success);
        },
        error => {
          console.log('--- KYC upload ERROR ---', JSON.stringify(error?.data || error));
          reject(error);
        },
        fail => {
          console.log('--- KYC upload FAIL ---', fail);
          reject(fail);
        },
      );
    });
  };

  useImperativeHandle(ref, () => ({
    saveKYC: saveKYC,
    getUploadedImages: () => uploadedImages,
    isValid: () => {
      const hasImage = img => {
        if (!img) return false;
        const uri = img.uri || img.path;
        return (
          uri &&
          typeof uri === 'string' &&
          uri.trim().length > 0 &&
          uri !== 'null' &&
          uri !== 'undefined'
        );
      };
      return isValidForm({
        aadhar_front: validators.checkRequire(
          'Aadhaar Front',
          hasImage(uploadedImages.aadhar_front)
            ? uploadedImages.aadhar_front
            : null,
        ),
        aadhar_back: validators.checkRequire(
          'Aadhaar Back',
          hasImage(uploadedImages.aadhar_back)
            ? uploadedImages.aadhar_back
            : null,
        ),
      });
    },
  }));

  return (
    <>
      <View style={styles.wrap}>
        <Typography style={styles.heading}>
          {LocalizedStrings.StaffProfile?.KYC_Status || 'KYC & Verification'}
        </Typography>

        <View style={[styles.row, { justifyContent: 'center' }]}>
          <View style={[styles.uploadWrapper, { width: '48%' }]}>
            <UploadBox
              title={
                LocalizedStrings.NewStaffForm?.Verification_Certificate ||
                'Upload Verification Certificate'
              }
              icon={ImageConstant.Verify}
              onPress={() => handleImageSelection('verification_certificate')}
            />
            {errors.verification_certificate && (
              <Text style={styles.errorText}>{errors.verification_certificate}</Text>
            )}
            {renderImagePreview('verification_certificate')}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.uploadWrapper}>
            <UploadBox
              title={
                LocalizedStrings.NewStaffForm?.Aadhaar_Card_Details +
                  ' Front' || 'Upload Aadhaar Front Image'
              }
              icon={ImageConstant.Doc}
              onPress={() => handleImageSelection('aadhar_front')}
            />
            {errors.aadhar_front && (
              <Text style={styles.errorText}>{errors.aadhar_front}</Text>
            )}
            {renderImagePreview('aadhar_front')}
          </View>
          <View style={styles.uploadWrapper}>
            <UploadBox
              title={
                LocalizedStrings.NewStaffForm?.Aadhaar_Card_Details + ' Back' ||
                'Upload Aadhaar Back Image'
              }
              icon={ImageConstant.Doc}
              onPress={() => handleImageSelection('aadhar_back')}
            />
            {errors.aadhar_back && (
              <Text style={styles.errorText}>{errors.aadhar_back}</Text>
            )}
            {renderImagePreview('aadhar_back')}
          </View>
        </View>
      </View>

      <ImageModal
        showModal={showImageModal}
        title={
          LocalizedStrings.EditProfile?.upload_document || 'Upload Document'
        }
        document={true}
        close={() => setShowImageModal(false)}
        selected={handleImageSelected}
      />
    </>
  );
});

export default KYCVerificationStaff;

const styles = StyleSheet.create({
  heading: {
    fontFamily: Font?.Manrope_Bold,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 10,
  },
  wrap: {
    borderWidth: 1,
    borderColor: '#EBEBEA',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  uploadWrapper: {
    width: '48%',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    marginTop: 8,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});
