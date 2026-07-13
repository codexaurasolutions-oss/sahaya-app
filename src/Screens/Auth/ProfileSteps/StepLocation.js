import { Alert, Image, Linking, PermissionsAndroid, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import GooglePlacesInput from '../../../Component/GooglePlacesInput';
import Geolocation from '@react-native-community/geolocation';

import { Font } from '../../../Constants/Font';
import { validators } from '../../../Backend/Validator';
import { isValidForm, fetchPincodeDetails } from '../../../Backend/Utility';

import Input from '../../../Component/Input';
import Typography from '../../../Component/UI/Typography';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';

const buildGoogleMapLink = (latitude, longitude) =>
  `https://maps.google.com/?q=${latitude},${longitude}`;

const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission Required',
      message: 'Allow Sahayya to detect your current location.',
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const StepLocation = React.forwardRef((props, ref) => {
  const [show, setShow] = useState(false);
  const [error, setError] = useState({});
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Primary address states
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [street, setStreet] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [googleLocation, setGoogleLocation] = useState('');
  const [lat, setLat] = useState('');
  const [long, setLong] = useState('');
  
  // Secondary address states
  const [name2, setName2] = useState('');
  const [city2, setCity2] = useState('');
  const [state2, setState2] = useState('');
  const [street2, setStreet2] = useState('');
  const [pinCode2, setPinCode2] = useState('');
  const [areaLocality2, setAreaLocality2] = useState('');
  const [googleLocation2, setGoogleLocation2] = useState('');
  const [lat2, setLat2] = useState('');
  const [long2, setLong2] = useState('');

  // Function to get location from coordinates using reverse geocoding
  const getLocationFromCoordinates = async (latitude, longitude) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'SahayaaApp/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        const streetName = [
          address.house_number,
          address.road || address.pedestrian || address.path,
        ].filter(Boolean).join(' ');
        const areaName =
          address.suburb ||
          address.neighbourhood ||
          address.city_district ||
          address.county ||
          '';
        // Extract city (can be city, town, village, or suburb)
        const cityName = address.city || address.town || address.village || address.suburb || '';
        // Extract state
        const stateName = address.state || '';
        // Extract pincode
        const pincode = address.postcode || '';
        
        return {
          street: streetName || data.display_name?.split(',')?.[0] || '',
          areaLocality: areaName,
          city: cityName,
          state: stateName,
          pincode: pincode
        };
      }
      return null;
    } catch (locationLookupError) {
      console.error('Error fetching location details:', locationLookupError);
      return null;
    }
  };

  // Function to capture current location
  const applyPrimaryLocationDetails = (locationDetails) => {
    if (!locationDetails) {
      return;
    }
    if (!street && locationDetails.street) {
      setStreet(locationDetails.street);
      setError(prev => prev?.street ? {...prev, street: null} : prev);
    }
    if (!areaLocality && locationDetails.areaLocality) {
      setAreaLocality(locationDetails.areaLocality);
      setError(prev => prev?.areaLocality ? {...prev, areaLocality: null} : prev);
    }
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
  };

  const applySecondaryLocationDetails = (locationDetails) => {
    if (!locationDetails) {
      return;
    }
    if (!street2 && locationDetails.street) {
      setStreet2(locationDetails.street);
      setError(prev => prev?.street2 ? {...prev, street2: null} : prev);
    }
    if (!areaLocality2 && locationDetails.areaLocality) {
      setAreaLocality2(locationDetails.areaLocality);
      setError(prev => prev?.areaLocality2 ? {...prev, areaLocality2: null} : prev);
    }
    if (locationDetails.city) {
      setCity2(locationDetails.city);
      setError(prev => prev?.city2 ? {...prev, city2: null} : prev);
    }
    if (locationDetails.state) {
      setState2(locationDetails.state);
      setError(prev => prev?.state2 ? {...prev, state2: null} : prev);
    }
    if (locationDetails.pincode) {
      setPinCode2(locationDetails.pincode);
      setError(prev => prev?.pinCode2 ? {...prev, pinCode2: null} : prev);
    }
  };

  const handlePrimaryPlaceSelected = async (location) => {
    const latitude = location?.lat ? String(location.lat) : '';
    const longitude = location?.long ? String(location.long) : '';
    const googleMapLink = location?.google_location || (
      latitude && longitude ? buildGoogleMapLink(latitude, longitude) : ''
    );

    setGoogleLocation(googleMapLink);
    setLat(latitude);
    setLong(longitude);
    if (googleMapLink && error?.googleLocation) {
      setError(prev => ({...prev, googleLocation: null}));
    }

    if (location?.hasExtractedData && !location?.fromMap) {
      if (!street && location.street) setStreet(location.street);
      if (!city && location.city) setCity(location.city);
      if (!state && location.state) setState(location.state);
      if (!pinCode && location.pincode) setPinCode(location.pincode);
    }

    if (location?.fromMap && latitude && longitude) {
      const locationDetails = await getLocationFromCoordinates(latitude, longitude);
      applyPrimaryLocationDetails(locationDetails);
    }
  };

  const handleSecondaryPlaceSelected = async (location) => {
    const latitude = location?.lat ? String(location.lat) : '';
    const longitude = location?.long ? String(location.long) : '';
    const googleMapLink = location?.google_location || (
      latitude && longitude ? buildGoogleMapLink(latitude, longitude) : ''
    );

    setGoogleLocation2(googleMapLink);
    setLat2(latitude);
    setLong2(longitude);
    if (googleMapLink && error?.googleLocation2) {
      setError(prev => ({...prev, googleLocation2: null}));
    }

    if (location?.hasExtractedData && !location?.fromMap) {
      if (!street2 && location.street) setStreet2(location.street);
      if (!city2 && location.city) setCity2(location.city);
      if (!state2 && location.state) setState2(location.state);
      if (!pinCode2 && location.pincode) setPinCode2(location.pincode);
    }

    if (location?.fromMap && latitude && longitude) {
      const locationDetails = await getLocationFromCoordinates(latitude, longitude);
      applySecondaryLocationDetails(locationDetails);
    }
  };

  const captureLocation = async () => {
    setLoadingLocation(true);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLoadingLocation(false);
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
      return;
    }
    
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const googleMapLink = buildGoogleMapLink(latitude, longitude);

        setLat(String(latitude));
        setLong(String(longitude));
        setGoogleLocation(googleMapLink);
        setError(prev => prev?.googleLocation ? {...prev, googleLocation: null} : prev);
        
        // Get location details from coordinates
        const locationDetails = await getLocationFromCoordinates(latitude, longitude);
        
        if (locationDetails) {
          applyPrimaryLocationDetails(locationDetails);
          Alert.alert('Success', 'Location captured successfully. You can move the pin on the map if needed.');
        } else {
          Alert.alert('Success', 'Location captured. Please enter address details manually if needed.');
        }
        setLoadingLocation(false);
      },
      (locationError) => {
        console.error('Location error:', locationError);
        setLoadingLocation(false);
        
        if (locationError.code === 1) {
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
        } else if (locationError.code === 2) {
          // Position unavailable
          Alert.alert('Error', 'Location service is unavailable. Please check your GPS settings.');
        } else if (locationError.code === 3) {
          // Timeout
          Alert.alert('Error', 'Location request timed out. Please try again.');
        } else {
          Alert.alert('Error', 'Could not get your location. Please enter manually.');
        }
      },
      { 
        enableHighAccuracy: false, 
        timeout: 60000, 
        maximumAge: 60000 
      }
    );
  };

  // Clear city and state when pincode is cleared or changed (removed - not needed anymore)
  useEffect(() => {
    if (!pinCode || pinCode.length < 6) {
      setCity('');
      setState('');
    }
  }, [pinCode]);

  useEffect(() => {
    if (!show) return;
    if (!pinCode2 || pinCode2.length < 6) {
      setCity2('');
      setState2('');
    }
  }, [pinCode2, show]);

  useEffect(() => {
    const loadPrimaryPincodeDetails = async () => {
      if (pinCode && pinCode.length === 6) {
        try {
          const details = await fetchPincodeDetails(pinCode);
          setCity(details?.city || '');
          setState(details?.state || '');
          setError(prev => (prev?.city || prev?.state ? {...prev, city: null, state: null} : prev));
        } catch (e) {
          console.error('Primary pincode lookup failed:', e);
        }
      }
    };

    loadPrimaryPincodeDetails();
  }, [pinCode]);

  useEffect(() => {
    const loadSecondaryPincodeDetails = async () => {
      if (show && pinCode2 && pinCode2.length === 6) {
        try {
          const details = await fetchPincodeDetails(pinCode2);
          setCity2(details?.city || '');
          setState2(details?.state || '');
          setError(prev => (prev?.city2 || prev?.state2 ? {...prev, city2: null, state2: null} : prev));
        } catch (e) {
          console.error('Secondary pincode lookup failed:', e);
        }
      }
    };

    loadSecondaryPincodeDetails();
  }, [pinCode2, show]);


  // Validation function for address fields
  const validateAddress = () => {
    let errors = {
      name: validators.checkRequire('Address Name', name),
      street: validators.checkRequire('Street', street),
      areaLocality: validators.checkRequire('Area / Locality', areaLocality),
      city: validators.checkAlphabet('City', 2, 50, city),
      state: validators.checkAlphabet('State', 2, 50, state),
      pinCode: validators.checkPhoneNumberWithFixLength('Pincode', 6, pinCode),
      googleLocation: validators.checkRequire('Google Location', googleLocation),
    };

    // If secondary address is shown, validate it too
    if (show) {
      errors = {
        ...errors,
        name2: validators.checkRequire('Address Name', name2),
        street2: validators.checkRequire('Street', street2),
        areaLocality2: validators.checkRequire('Area / Locality', areaLocality2),
        city2: validators.checkAlphabet('City', 2, 50, city2),
        state2: validators.checkAlphabet('State', 2, 50, state2),
        pinCode2: validators.checkPhoneNumberWithFixLength('Pincode', 6, pinCode2),
        googleLocation2: validators.checkRequire('Google Location', googleLocation2),
      };
    }

    setError(errors);
    return isValidForm(errors);
  };

  // Function to get address data
  const getAddressData = () => {
    const addresses = [{
      name,
      street,
      city,
      state,
      pinCode,
      area_locality: areaLocality,
      google_location: googleLocation,
      lat,
      long,
    }];

    // Add secondary address if exists
    if (show && street2 && city2 && state2 && pinCode2) {
      addresses.push({
        name: name2,
        street: street2,
        city: city2,
        state: state2,
        pinCode: pinCode2,
        area_locality: areaLocality2,
        google_location: googleLocation2,
        lat: lat2,
        long: long2,
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

        {/* Address Name */}
        <Input
          title={LocalizedStrings.EditProfile?.address_name || 'Address Name'}
          placeholder="e.g. Home, Office, Villa 1"
          value={name}
          onChange={(text) => {
            setName(text);
            if (error?.name) setError({...error, name: null});
          }}
          error={error?.name}
        />

        {/* Area / Locality */}
        <Input
          title="Area / Locality"
          placeholder="e.g. Phase 1, Model Town, near Central Park"
          value={areaLocality}
          onChange={(text) => {
            setAreaLocality(text);
            if (error?.areaLocality) setError({...error, areaLocality: null});
          }}
          error={error?.areaLocality}
        />

        {/* Google Location */}
        <View style={styles.primaryGoogleLocationWrap}>
          <GooglePlacesInput
            title="Search Google Location (Mandatory)"
            placeholder="Search for your location on Google Maps..."
            showMap={true}
            selectedLat={lat}
            selectedLong={long}
            onPlaceSelected={handlePrimaryPlaceSelected}
            error={error?.googleLocation}
          />
        </View>

        {/* Read-only parsed Google Location URL display */}
        {googleLocation ? (
          <View style={styles.googleLocationPreview}>
            <Typography size={12} color="green">Location Selected</Typography>
            <Typography size={11} color="gray">{googleLocation}</Typography>
          </View>
        ) : null}

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
              placeholder={'Auto-filled from pincode'}
              value={city}
              editable={false}
              borderColor="#E5E7EB"
              style_input={styles.disabledInputText}
              style_inputContainer={styles.disabledInputContainer}
              error={error?.city}
            />
          </View>
          <View style={styles.stateContainer}>
            <Input 
              title={LocalizedStrings.EditProfile?.State || LocalizedStrings.StaffProfile?.State || 'State'} 
              placeholder={'Auto-filled from pincode'}
              value={state}
              editable={false}
              borderColor="#E5E7EB"
              style_input={styles.disabledInputText}
              style_inputContainer={styles.disabledInputContainer}
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
            const numericValue = text.replace(/[^0-9]/g, '');
            setPinCode(numericValue);
            if (error?.pinCode) setError({...error, pinCode: null});
          }}
          error={error?.pinCode}
          maxLength={6}
        />

        <TouchableOpacity onPress={() => {
          setShow(true);
          if (props.onAddressCountChange) props.onAddressCountChange(2);
        }}>
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
            <TouchableOpacity onPress={() => {
              setShow(false);
              if (props.onAddressCountChange) props.onAddressCountChange(1);
            }}>
              <Image source={ImageConstant?.X} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          {/* Address Name */}
          <Input
            title={LocalizedStrings.EditProfile?.address_name || 'Address Name'}
            placeholder="e.g. Home, Office, Villa 2"
            value={name2}
            onChange={(text) => {
              setName2(text);
              if (error?.name2) setError({...error, name2: null});
            }}
            error={error?.name2}
          />

          {/* Area / Locality */}
          <Input
            title="Area / Locality"
          placeholder="e.g. Phase 1, Model Town, near Central Park"
          value={areaLocality2}
          onChange={(text) => {
            setAreaLocality2(text);
            if (error?.areaLocality2) setError({...error, areaLocality2: null});
          }}
          error={error?.areaLocality2}
        />

          {/* Google Location */}
          <View style={styles.secondaryGoogleLocationWrap}>
            <GooglePlacesInput
              title="Search Google Location (Mandatory)"
              placeholder="Search for your location on Google Maps..."
              showMap={true}
              selectedLat={lat2}
              selectedLong={long2}
              onPlaceSelected={handleSecondaryPlaceSelected}
              error={error?.googleLocation2}
            />
          </View>

          {/* Read-only parsed Google Location URL display */}
          {googleLocation2 ? (
            <View style={styles.googleLocationPreview}>
              <Typography size={12} color="green">Location Selected</Typography>
              <Typography size={11} color="gray">{googleLocation2}</Typography>
            </View>
          ) : null}

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
                placeholder={'Auto-filled from pincode'}
                value={city2}
                editable={false}
                borderColor="#E5E7EB"
                style_input={styles.disabledInputText}
                style_inputContainer={styles.disabledInputContainer}
                error={error?.city2}
              />
            </View>
            <View style={styles.stateContainer}>
              <Input 
                title={LocalizedStrings.EditProfile?.State || LocalizedStrings.StaffProfile?.State || 'State'} 
                placeholder={'Auto-filled from pincode'}
                value={state2}
                editable={false}
                borderColor="#E5E7EB"
                style_input={styles.disabledInputText}
                style_inputContainer={styles.disabledInputContainer}
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
              const numericValue = text.replace(/[^0-9]/g, '');
              setPinCode2(numericValue);
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
  primaryGoogleLocationWrap: {
    zIndex: 100,
  },
  secondaryGoogleLocationWrap: {
    zIndex: 90,
  },
  googleLocationPreview: {
    marginBottom: 15,
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
  disabledInputContainer: {
    backgroundColor: '#F9FAFB',
  },
  disabledInputText: {
    color: '#6B7280',
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
