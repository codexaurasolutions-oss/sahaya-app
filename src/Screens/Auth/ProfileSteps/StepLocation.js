import { Image, StyleSheet, TouchableOpacity, View, Alert, Platform, Linking } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import Geolocation from '@react-native-community/geolocation';

import { Font } from '../../../Constants/Font';
import { validators } from '../../../Backend/Validator';
import { isValidForm, fetchPincodeDetails } from '../../../Backend/Utility';

import Input from '../../../Component/Input';
import Typography from '../../../Component/UI/Typography';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';



const StepLocation = React.forwardRef((props, ref) => {
  const [show, setShow] = useState(false);
  const [error, setError] = useState({});
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Primary address states
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [street, setStreet] = useState('');
  const [pinCode, setPinCode] = useState('');
  
  // Secondary address states
  const [city2, setCity2] = useState('');
  const [state2, setState2] = useState('');
  const [street2, setStreet2] = useState('');
  const [pinCode2, setPinCode2] = useState('');

  // Function to get location from coordinates using reverse geocoding
  const getLocationFromCoordinates = async (latitude, longitude) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SahayaaApp/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        // Extract city (can be city, town, village, or suburb)
        const cityName = address.city || address.town || address.village || address.suburb || '';
        // Extract state
        const stateName = address.state || '';
        // Extract pincode
        const pincode = address.postcode || '';
        
        return {
          city: cityName,
          state: stateName,
          pincode: pincode
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching location details:', error);
      return null;
    }
  };

  // Function to capture current location
  const captureLocation = () => {
    setLoadingLocation(true);
    
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Get location details from coordinates
        const locationDetails = await getLocationFromCoordinates(latitude, longitude);
        
        if (locationDetails) {
          if (locationDetails.city) {
            setCity(locationDetails.city);
            setError(prev => prev?.city ? {...prev, city: null} : prev);
          }
          if (locationDetails.state) {
            setState(locationDetails.state);
            setError(prev => prev?.state ? {...prev, state: null} : prev);
          }
          if (locationDetails.pincode) {
            setPinCode(locationDetails.pincode);
            setError(prev => prev?.pinCode ? {...prev, pinCode: null} : prev);
          }
          Alert.alert('Success', 'Location captured successfully!');
        } else {
          Alert.alert('Error', 'Could not fetch location details. Please enter manually.');
        }
        setLoadingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        setLoadingLocation(false);
        
        if (error.code === 1) {
          // Permission denied
          Alert.alert(
            'Location Permission Required',
            'Please enable location permission in your device settings to use this feature.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
        } else if (error.code === 2) {
          // Position unavailable
          Alert.alert('Error', 'Location service is unavailable. Please check your GPS settings.');
        } else if (error.code === 3) {
          // Timeout
          Alert.alert('Error', 'Location request timed out. Please try again.');
        } else {
          Alert.alert('Error', 'Could not get your location. Please enter manually.');
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 10000 
      }
    );
  };

  // Clear city and state when pincode is cleared or changed (removed - not needed anymore)
  // City and State are now entered first, before pincode


  // Validation function for address fields
  const validateAddress = () => {
    let errors = {
      street: validators.checkRequire('Street', street),
      city: validators.checkAlphabet('City', 2, 50, city),
      state: validators.checkAlphabet('State', 2, 50, state),
      pinCode: validators.checkPhoneNumberWithFixLength('Pincode', 6, pinCode),
    };

    // If secondary address is shown, validate it too
    if (show) {
      errors = {
        ...errors,
        street2: validators.checkRequire('Street', street2),
        city2: validators.checkAlphabet('City', 2, 50, city2),
        state2: validators.checkAlphabet('State', 2, 50, state2),
        pinCode2: validators.checkPhoneNumberWithFixLength('Pincode', 6, pinCode2),
      };
    }

    setError(errors);
    return isValidForm(errors);
  };

  // Function to get address data
  const getAddressData = () => {
    const addresses = [{
      street,
      city,
      state,
      pinCode,
    }];

    // Add secondary address if exists
    if (show && street2 && city2 && state2 && pinCode2) {
      addresses.push({
        street: street2,
        city: city2,
        state: state2,
        pinCode: pinCode2,
      });
    }

    return addresses;
  };

  // Expose validation and data functions to parent component
  React.useImperativeHandle(ref, () => ({
    validateAddress,
    getAddressData,
  }));


  return (
    <View style={styles.container}>
      <View style={styles.wrap}>
        <View style={styles.headerWithLocation}>
          <Typography type={Font?.Poppins_SemiBold} size={18}>
            {LocalizedStrings.EditProfile?.Home_Address || LocalizedStrings.NewStaffForm?.Home_Address || 'Home Address'}
          </Typography>
          <TouchableOpacity 
            onPress={captureLocation} 
            style={styles.locationButton}
            disabled={loadingLocation}
          >
            <Image 
              source={ImageConstant?.Location} 
              style={styles.locationIcon} 
            />
            <Typography color='rgba(217, 133, 121, 1)' size={12}>
              {loadingLocation ? 'Getting location...' : 'Use my location'}
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Street - FIRST */}
        <Input
          title={LocalizedStrings.EditProfile?.Street || LocalizedStrings.StaffProfile?.Street || 'Street'}
          placeholder="Enter street address"
          value={street}
          onChange={(text) => {
            setStreet(text);
            if (error?.street) setError({...error, street: null});
          }}
          error={error?.street}
        />

        {/* City and State - SECOND */}
        <View style={styles.row}>
          <View style={styles.cityContainer}>
            <Input 
              title={LocalizedStrings.EditProfile?.City || LocalizedStrings.StaffProfile?.City || 'City'} 
              placeholder={'Enter city'}
              value={city}
              onChange={(text) => {
                setCity(text);
                if (error?.city) setError({...error, city: null});
              }}
              error={error?.city}
            />
          </View>
          <View style={styles.stateContainer}>
            <Input 
              title={LocalizedStrings.EditProfile?.State || LocalizedStrings.StaffProfile?.State || 'State'} 
              placeholder={'Enter state'}
              value={state}
              onChange={(text) => {
                setState(text);
                if (error?.state) setError({...error, state: null});
              }}
              error={error?.state}
            />
          </View>
        </View>

        {/* Pincode - THIRD */}
        <Input 
          title={LocalizedStrings.EditProfile?.Pincode || LocalizedStrings.StaffProfile?.Pincode || 'Pincode'} 
          placeholder={'Enter pincode'} 
          keyboardType="numeric"
          value={pinCode}
          onChange={(text) => {
            setPinCode(text);
            if (error?.pinCode) setError({...error, pinCode: null});
          }}
          error={error?.pinCode}
          maxLength={6}
        />

        <TouchableOpacity onPress={() => setShow(true)}>
          <Typography color='rgba(217, 133, 121, 1)'>+ {LocalizedStrings.EditProfile?.add_more_address || 'Add more address'}</Typography>
        </TouchableOpacity>
      </View>

      {/* Secondary Address */}
      {show && (
        <View style={styles.wrap}>
          <View style={styles.headerRow}>
            <Typography type={Font?.Poppins_SemiBold} size={18}>
              {LocalizedStrings.EditProfile?.Home_Address || LocalizedStrings.NewStaffForm?.Home_Address || 'Home Address'}
            </Typography>
            <TouchableOpacity onPress={() => setShow(false)}>
              <Image source={ImageConstant?.X} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          {/* Street - FIRST */}
          <Input
            title={LocalizedStrings.EditProfile?.Street || LocalizedStrings.StaffProfile?.Street || 'Street'}
            placeholder={LocalizedStrings.EditProfile?.Street || 'Enter street address'}
            value={street2}
            onChange={(text) => {
              setStreet2(text);
              if (error?.street2) setError({...error, street2: null});
            }}
            error={error?.street2}
          />

          {/* City and State - SECOND */}
          <View style={styles.row}>
            <View style={styles.cityContainer}>
              <Input 
                title={LocalizedStrings.EditProfile?.City || LocalizedStrings.StaffProfile?.City || 'City'} 
                placeholder={'Enter city'}
                value={city2}
                onChange={(text) => {
                  setCity2(text);
                  if (error?.city2) setError({...error, city2: null});
                }}
                error={error?.city2}
              />
            </View>
            <View style={styles.stateContainer}>
              <Input 
                title={LocalizedStrings.EditProfile?.State || LocalizedStrings.StaffProfile?.State || 'State'} 
                placeholder={'Enter state'}
                value={state2}
                onChange={(text) => {
                  setState2(text);
                  if (error?.state2) setError({...error, state2: null});
                }}
                error={error?.state2}
              />
            </View>
          </View>

          {/* Pincode - THIRD */}
          <Input 
            title={LocalizedStrings.EditProfile?.Pincode || LocalizedStrings.StaffProfile?.Pincode || 'Pincode'} 
            placeholder={'Enter pincode'} 
            keyboardType="numeric"
            value={pinCode2}
            onChange={(text) => {
              setPinCode2(text);
              if (error?.pinCode2) setError({...error, pinCode2: null});
            }}
            error={error?.pinCode2}
            maxLength={6}
          />
        </View>
      )}
    </View>
  );
});

StepLocation.displayName = 'StepLocation';

export default StepLocation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: Font?.Manrope_Bold,
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cityContainer: {
    flex: 1,
    marginRight: 8,
  },
  stateContainer: {
    flex: 1,
    marginLeft: 8,
  },
  wrap: {
    borderWidth: 1,
    borderColor: '#EBEBEA',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerWithLocation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(217, 133, 121, 0.3)',
    backgroundColor: 'rgba(217, 133, 121, 0.05)',
  },
  locationIcon: {
    height: 16,
    width: 16,
    resizeMode: 'contain',
    marginRight: 5,
    tintColor: 'rgba(217, 133, 121, 1)',
  },
  closeIcon: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
  },
});
