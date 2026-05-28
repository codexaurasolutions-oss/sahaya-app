import { StyleSheet, View } from 'react-native';
import React, { useState, useRef } from 'react';
import CommanView from '../../../Component/CommanView';
import Header from '../../../Component/Header';
import { Font } from '../../../Constants/Font';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Button from '../../../Component/Button';
import Typography from '../../../Component/UI/Typography';
import { useDispatch, useSelector } from 'react-redux';
import { isAuth, userDetails } from '../../../Redux/action';
import KYCVerificationStaff from './KYCVerificationStaff';
import StepLoactionStaff from './StepLoactionStaff';
import StepWokInfo from './StepWokInfo';
import UpdateProfile from '../../Staff/UpdateProfile';
import { POST_WITH_TOKEN } from '../../../Backend/Backend';
import { DELETE_ACCOUNT } from '../../../Backend/api_routes';
import LocalizedStrings from '../../../Constants/localization';
import SimpleToast from 'react-native-simple-toast';
const StepFirst = () => {
  const userTypes = useSelector(store => store?.userType);
  const userDetail = useSelector(store => store?.userDetails);
  const [activeTab, setActiveTab] = useState(1); // Start from KYC step (skip basic info since Aadhaar provides it)
  const [loader, setLoader] = useState(false);
  const [kycImages, setKycImages] = useState(null);
  const kycRef = useRef(null);
  const locationRef = useRef(null);
  const workInfoRef = useRef(null);
  const lastWorkRef = useRef(null);
  const Dispatch = useDispatch();

  const renderContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <>
            <KYCVerificationStaff
              ref={kycRef}
              userDetail={userDetail}
              prefillFromProfile={false}
            />
          </>
        );
      case 2:
        return (
          <>
            <StepLoactionStaff ref={locationRef} />
          </>
        );
      case 3:
        return (
          <>
            <StepWokInfo ref={workInfoRef} />
          </>
        );
      case 4:
        return (
          <>
            <UpdateProfile ref={lastWorkRef} />
          </>
        );
      default:
        return null;
    }
  };

  const confirmLogout = () => {
    POST_WITH_TOKEN(
      DELETE_ACCOUNT,
      {},
      success => {
        // SimpleToast.show(
        //   success?.message ||
        //     LocalizedStrings.Settings?.accountDeletedSuccess ||
        //     'Account deleted successfully',
        //   SimpleToast.SHORT,
        // );
        // Logout user after account deletion
        Dispatch(isAuth(false));
        Dispatch(userDetails({}));
      },
      error => {
        SimpleToast.show(
          error?.message ||
          LocalizedStrings.Settings?.accountDeleteFailed ||
          'Failed to delete account',
          SimpleToast.SHORT,
        );
      },
      fail => {
        SimpleToast.show(
          LocalizedStrings.Settings?.networkError ||
          'Network error. Please try again.',
          SimpleToast.SHORT,
        );
      },
    );
  };

  return (
    <CommanView>
      <Header
        source_arrow={ImageConstant?.BackArrow}
        onBackPressFun={() => {
          if (activeTab === 1) {
            confirmLogout();
          } else {
            setActiveTab(activeTab - 1);
          }
        }}
        title={LocalizedStrings.EditProfile?.title || 'Complete Profile'}
        style_title={{ fontFamily: Font?.Manrope_SemiBold }}
        onBackPress
      />
      {renderContent()}
      <Button
        title={
          activeTab == 4
            ? LocalizedStrings.EditProfile?.Save_Changes || 'Save & Proceed'
            : LocalizedStrings.Auth?.next || 'Next'
        }
        onPress={async () => {
          if (activeTab == 1) {
            // Save KYC images to parent state before component unmounts
            const images = kycRef.current?.getUploadedImages?.();
            if (images) setKycImages(images);
            // Save KYC and move to next step
            try {
              setLoader(true);
              await kycRef.current?.saveKYC();
              setActiveTab(2);
            } catch (error) {
            } finally {
              setLoader(false);
            }
          } else if (activeTab == 2) {
            // Save addresses and move to next step
            try {
              setLoader(true);
              await locationRef.current?.saveAddresses();
              setActiveTab(3);
            } catch (error) {
            } finally {
              setLoader(false);
            }
          } else if (activeTab == 3) {
            // Save work info and move to next step
            try {
              setLoader(true);
              await workInfoRef.current?.saveWorkInfo();
              setActiveTab(4);
            } catch (error) {
            } finally {
              setLoader(false);
            }
          } else if (activeTab == 4) {
            // Final step — save last work experience
            try {
              setLoader(true);
              await lastWorkRef.current?.saveLastWorkExperience();
              SimpleToast.show(
                LocalizedStrings.EditProfile?.profile_completed ||
                'Profile completed successfully',
                SimpleToast.SHORT,
              );
            } catch (error) {
              console.log('Final step error:', error);
            } finally {
              setLoader(false);
            }
          }
        }}
        style={{ width: 150, alignSelf: 'flex-end' }}
        disabled={loader}
        loader={loader}
      />
    </CommanView>
  );
};

export default StepFirst;

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: Font?.Manrope_Bold,
    fontSize: 16,
    marginBottom: 10,
  },
  tabContainer: {
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: '#f7f7f7',
    backgroundColor: '#f7f7f7',
    overflow: 'scroll',
    color: ' #8C8D8B',
    marginTop: 20,
    padding: 5,
    overflow: 'hidden',
  },
  tab: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'scroll',
    flexDirection: 'row',
  },
  tabText: {
    fontFamily: Font?.Manrope_SemiBold,
    fontSize: 14,
    color: '#666',
  },
  activeTab: {
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  activeTabText: {
    color: 'black',
  },
});
