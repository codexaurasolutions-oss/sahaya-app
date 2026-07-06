import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import UploadBox from '../../../Component/UploadBox';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { Font } from '../../../Constants/Font';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import ImageModal from '../../../Component/Modals/ImageModal';
import LocalizedStrings from '../../../Constants/localization';

const KYCVerification = () => {
  const [uploadedImages, setUploadedImages] = useState({
    staff_photo: null,
    police_clearance: null,
    aadhar_front: null,
    aadhar_back: null,
  });

  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageType, setCurrentImageType] = useState('');

  const handleUpload = (type) => {
    setCurrentImageType(type);
    setShowImageModal(true);
  };

  const handleImageSelect = (images) => {
    if (images && images.length > 0) {
      const image = images[0];
      setUploadedImages(prev => ({
        ...prev,
        [currentImageType]: {
          uri: image.path,
          path: image.path,
          name: image.filename,
          type: image.mime || 'image/jpeg',
        },
      }));
    }
    setShowImageModal(false);
  };

  return (
    <>
      <CommanView>
        <View style={styles.wrap}>
          <Typography style={styles.heading}>
            {LocalizedStrings.StaffProfile?.KYC_Status || 'KYC & Verification'}
          </Typography>

          <View style={styles.row}>
            <UploadBox
              title={LocalizedStrings.AddStaffPhoto?.Staff_Photo || 'Upload Your Photo'}
              icon={ImageConstant.NewCamera}
              image={uploadedImages.staff_photo}
              onPress={() => handleUpload('staff_photo')}
            />
            <UploadBox
              title={LocalizedStrings.NewStaffForm?.Police_Clearance_Certificate || 'Upload Police Verification Certificate'}
              icon={ImageConstant.Verify}
              image={uploadedImages.police_clearance}
              onPress={() => handleUpload('police_clearance')}
            />
          </View>

          <View style={styles.row}>
            <UploadBox
              title={(LocalizedStrings.NewStaffForm?.Aadhaar_Card_Details || 'Aadhaar Card') + ' Front'}
              icon={ImageConstant.Doc}
              image={uploadedImages.aadhar_front}
              onPress={() => handleUpload('aadhar_front')}
            />
            <UploadBox
              title={(LocalizedStrings.NewStaffForm?.Aadhaar_Card_Details || 'Aadhaar Card') + ' Back'}
              icon={ImageConstant.Doc}
              image={uploadedImages.aadhar_back}
              onPress={() => handleUpload('aadhar_back')}
            />
          </View>
        </View>
      </CommanView>

      <ImageModal
        showModal={showImageModal}
        title="Upload KYC Document"
        close={() => setShowImageModal(false)}
        selected={handleImageSelect}
      />
    </>
  );
};

export default KYCVerification;

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
});
