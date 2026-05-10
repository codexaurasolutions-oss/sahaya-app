import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from 'react';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import Typography from '../../../Component/UI/Typography';
import { POST_FORM_DATA } from '../../../Backend/Backend';
import { ADDRESSES_UPDATE } from '../../../Backend/api_routes';
import { StyleSheet, View, TouchableOpacity, Image, Alert, Platform, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { validators } from '../../../Backend/Validator';
import { isValidForm, fetchPincodeDetails } from '../../../Backend/Utility';
import { useSelector } from 'react-redux';
import LocalizedStrings from '../../../Constants/localization';

const StepLoactionStaff = forwardRef((props, ref) => {
  const userDetail = useSelector(store => store?.userDetails);
  // State for current address (index 0)
  const [currentStreet, setCurrentStreet] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [currentPincode, setCurrentPincode] = useState('');
  const [currentId, setCurrentId] = useState(null);

  // State for permanent address (index 1)
  const [permanentStreet, setPermanentStreet] = useState('');
  const [permanentCity, setPermanentCity] = useState('');
  const [permanentState, setPermanentState] = useState('');
  const [permanentPincode, setPermanentPincode] = useState('');
  const [permanentId, setPermanentId] = useState(null);
  // State for errors
  const [errors, setErrors] = useState({});
  const [loader, setLoader] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Function to get location from coordinates using reverse geocoding
  const getLocationFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: { 'User-Agent': 'SahayaaApp/1.0' }
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        const cityName = address.city || address.town || address.village || address.suburb || '';
        const stateName = address.state || '';
        const pincode = address.postcode || '';
        
        return { city: cityName, state: stateName, pincode: pincode };
      }
      return null;
    } catch (error) {
      console.error('Error fetching location details:', error);
      return null;
    }
  };

  const captureLocation = () => {
    setLoadingLocation(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationDetails = await getLocationFromCoordinates(latitude, longitude);
        
        if (locationDetails) {
          if (locationDetails.city) setCurrentCity(locationDetails.city);
          if (locationDetails.state) setCurrentState(locationDetails.state);
          if (locationDetails.pincode) setCurrentPincode(locationDetails.pincode);
          Alert.alert('Success', 'Location captured successfully!');
        } else {
          Alert.alert('Error', 'Could not fetch location details.');
        }
        setLoadingLocation(false);
      },
      (error) => {
        setLoadingLocation(false);
        Alert.alert('Error', 'Could not get your location. Please check permissions.');
      },
      { 
        enableHighAccuracy: false, 
        timeout: 60000, 
        maximumAge: 60000 
      }
    );
  };

  const addressesString = useMemo(() => {
    return JSON.stringify(userDetail?.addresses || []);
  }, [userDetail?.addresses]);

  const previousAddressesStringRef = useRef('');
  const isInitialMount = useRef(true);
  // Load existing addresses from userDetail - only run when addresses actually change
  useEffect(() => {
    // Skip on initial mount if no addresses
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (!userDetail?.addresses || userDetail.addresses.length === 0) {
        previousAddressesStringRef.current = addressesString;
        return;
      }
    }

    // Skip if addresses haven't changed (same content)
    if (addressesString === previousAddressesStringRef.current) {
      return; // No change, exit early
    }

    const addresses = userDetail?.addresses || [];

    if (addresses && addresses.length > 0) {
      const currentAddress =
        addresses.find(addr => addr.is_primary == 0) || addresses[0];
      if (currentAddress) {
        const newStreet = currentAddress.street || '';
        const newCity = currentAddress.city || '';
        const newState = currentAddress.state || '';
        const newPincode = currentAddress.pincode || '';
        const newId = currentAddress.id || null;
        setCurrentStreet(prev => (prev !== newStreet ? newStreet : prev));
        setCurrentCity(prev => (prev !== newCity ? newCity : prev));
        setCurrentState(prev => (prev !== newState ? newState : prev));
        setCurrentPincode(prev => (prev !== newPincode ? newPincode : prev));
        setCurrentId(prev => (prev !== newId ? newId : prev));
      }

      // Find permanent address (is_primary = 1 or second address)
      const permanentAddress =
        addresses.find(addr => addr.is_primary == 1) || addresses[1];
      if (permanentAddress) {
        // Only update if values are actually different to prevent unnecessary re-renders
        const newStreet = permanentAddress.street || '';
        const newCity = permanentAddress.city || '';
        const newState = permanentAddress.state || '';
        const newPincode = permanentAddress.pincode || '';
        const newId = permanentAddress.id || null;
        setPermanentStreet(prev => (prev !== newStreet ? newStreet : prev));
        setPermanentCity(prev => (prev !== newCity ? newCity : prev));
        setPermanentState(prev => (prev !== newState ? newState : prev));
        setPermanentPincode(prev => (prev !== newPincode ? newPincode : prev));
        setPermanentId(prev => (prev !== newId ? newId : prev));
      }
    }

    // Update ref after processing
    previousAddressesStringRef.current = addressesString;
  }, [addressesString]);

  // Clear city and state when pincode is cleared or changed
  useEffect(() => {
    if (currentPincode.length < 6) {
      setCurrentCity('');
      setCurrentState('');
    }
  }, [currentPincode]);

  useEffect(() => {
    if (permanentPincode.length < 6) {
      setPermanentCity('');
      setPermanentState('');
    }
  }, [permanentPincode]);

  // Fetch pincode details for current address
  useEffect(() => {
    const fetchDetails = async () => {
      if (currentPincode && currentPincode.length === 6) {
        try {
          const details = await fetchPincodeDetails(currentPincode);
          if (details && details.city) {
            setCurrentCity(details.city);
            setErrors(prev =>
              prev?.currentCity ? { ...prev, currentCity: null } : prev,
            );
          }
          if (details && details.state) {
            setCurrentState(details.state);
            setErrors(prev =>
              prev?.currentState ? { ...prev, currentState: null } : prev,
            );
          }
        } catch (error) {
          console.error('Error fetching pincode details:', error);
        }
      }
    };

    // Small delay to avoid multiple calls
    const timer = setTimeout(() => {
      fetchDetails();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPincode]);

  // Fetch pincode details for permanent address
  useEffect(() => {
    const fetchDetails = async () => {
      if (permanentPincode && permanentPincode.length === 6) {
        try {
          const details = await fetchPincodeDetails(permanentPincode);
          if (details && details.city) {
            setPermanentCity(details.city);
            setErrors(prev =>
              prev?.permanentCity ? { ...prev, permanentCity: null } : prev,
            );
          }
          if (details && details.state) {
            setPermanentState(details.state);
            setErrors(prev =>
              prev?.permanentState ? { ...prev, permanentState: null } : prev,
            );
          }
        } catch (error) {
          console.error('Error fetching pincode details:', error);
        }
      }
    };

    // Small delay to avoid multiple calls
    const timer = setTimeout(() => {
      fetchDetails();
    }, 300);

    return () => clearTimeout(timer);
  }, [permanentPincode]);

  const saveAddresses = () => {
    // Validate all required fields using validators utility

    const error = {
      currentStreet: validators?.checkRequire('Current Street', currentStreet),
      currentCity: validators?.checkRequire('Current City', currentCity),
      currentState: validators?.checkRequire('Current State', currentState),
      currentPincode: validators?.checkRequire(
        'Current Pincode',
        currentPincode,
      ),
      permanentStreet: validators?.checkRequire(
        'Permanent Street',
        permanentStreet,
      ),
      permanentCity: validators?.checkRequire('Permanent City', permanentCity),
      permanentState: validators?.checkRequire(
        'Permanent State',
        permanentState,
      ),
      permanentPincode: validators?.checkRequire(
        'Permanent Pincode',
        permanentPincode,
      ),
    };

    setErrors(error);

    // Check if there are any errors using isValidForm
    if (!isValidForm(error)) {
      return Promise.reject(new Error('Validation failed'));
    }

    // Build form data with all keys as shown in Postman
    const formData = new FormData();

    // Current address (index 0) - Clear primary (set to 0 for current)
    formData.append('pincode[0]', currentPincode);
    formData.append('city[0]', currentCity);
    if (currentId) formData.append('id[0]', currentId);
    formData.append('street[0]', currentStreet);
    formData.append('is_primary[0]', '0'); // Not primary
    formData.append('state[0]', currentState);

    // Permanent address (index 1) - Set as primary
    formData.append('state[1]', permanentState);
    formData.append('is_primary[1]', '1'); // Primary
    formData.append('city[1]', permanentCity);
    formData.append('pincode[1]', permanentPincode);
    formData.append('street[1]', permanentStreet);
    if (permanentId) formData.append('id[1]', permanentId);

    setLoader(true);

    return new Promise((resolve, reject) => {
      POST_FORM_DATA(
        ADDRESSES_UPDATE,
        formData,
        success => {
          setLoader(false);
          resolve(success);
        },
        error => {
          setLoader(false);
          reject(error);
        },
        fail => {
          setLoader(false);
          reject(fail);
        },
      );
    });
  };

  // Expose saveAddresses function to parent component
  useImperativeHandle(ref, () => ({
    saveAddresses: saveAddresses,
  }));

  return (
    <>
      <View style={{ flex: 1 }}>
        <View style={styles.wrap}>
          <View style={styles.headerWithLocation}>
            <Typography type={Font?.Poppins_SemiBold} size={18}>
              {LocalizedStrings.EditProfile?.Current_Address || 'Current Address'}
            </Typography>
            <TouchableOpacity 
              onPress={captureLocation} 
              style={styles.locationButton}
              disabled={loadingLocation}
            >
              <Image source={ImageConstant?.Location} style={styles.locationIcon} />
              <Typography color='rgba(217, 133, 121, 1)' size={12}>
                {loadingLocation ? 'Detecting...' : 'Use my location'}
              </Typography>
            </TouchableOpacity>
          </View>

          {/* City and State - Always Visible */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                title={LocalizedStrings.EditProfile?.City || 'City'}
                placeholder={'Enter city'}
                value={currentCity}
                onChange={text => {
                  setCurrentCity(text);
                  if (errors.currentCity) setErrors({ ...errors, currentCity: null });
                }}
                error={errors.currentCity}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                title={LocalizedStrings.EditProfile?.State || 'State'}
                placeholder={'Enter state'}
                value={currentState}
                onChange={text => {
                  setCurrentState(text);
                  if (errors.currentState) setErrors({ ...errors, currentState: null });
                }}
                error={errors.currentState}
              />
            </View>
          </View>

          <Input
            title={
              LocalizedStrings.EditProfile?.Street ||
              LocalizedStrings.StaffProfile?.Street ||
              'Street'
            }
            placeholder={
              LocalizedStrings.EditProfile?.Street || 'Enter street address'
            }
            value={currentStreet}
            onChange={text => {
              setCurrentStreet(text);
              if (errors.currentStreet)
                setErrors({ ...errors, currentStreet: null });
            }}
            error={errors.currentStreet}
          />
          <Input
            title={
              LocalizedStrings.EditProfile?.Pincode ||
              LocalizedStrings.StaffProfile?.Pincode ||
              'Pincode'
            }
            placeholder={''}
            keyboardType="numeric"
            value={currentPincode}
            onChange={text => {
              setCurrentPincode(text);
              if (errors.currentPincode)
                setErrors({ ...errors, currentPincode: null });
            }}
            error={errors.currentPincode}
            maxLength={6}
          />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.wrap}>
          <Typography type={Font?.Poppins_SemiBold} size={18}>
            {LocalizedStrings.EditProfile?.Permanent_Address || 'Permanent Address'}
          </Typography>

          {/* City and State for Permanent - Always Visible */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                title={LocalizedStrings.EditProfile?.City || 'City'}
                placeholder={'Enter city'}
                value={permanentCity}
                onChange={text => {
                  setPermanentCity(text);
                  if (errors.permanentCity) setErrors({ ...errors, permanentCity: null });
                }}
                error={errors.permanentCity}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                title={LocalizedStrings.EditProfile?.State || 'State'}
                placeholder={'Enter state'}
                value={permanentState}
                onChange={text => {
                  setPermanentState(text);
                  if (errors.permanentState) setErrors({ ...errors, permanentState: null });
                }}
                error={errors.permanentState}
              />
            </View>
          </View>
          <Input
            title={
              LocalizedStrings.EditProfile?.Street ||
              LocalizedStrings.StaffProfile?.Street ||
              'Street'
            }
            placeholder={
              LocalizedStrings.EditProfile?.Street || 'Enter street address'
            }
            value={permanentStreet}
            onChange={text => {
              setPermanentStreet(text);
              if (errors.permanentStreet)
                setErrors({ ...errors, permanentStreet: null });
            }}
            error={errors.permanentStreet}
          />
          <Input
            title={
              LocalizedStrings.EditProfile?.Pincode ||
              LocalizedStrings.StaffProfile?.Pincode ||
              'Pincode'
            }
            placeholder={''}
            keyboardType="numeric"
            value={permanentPincode}
            onChange={text => {
              setPermanentPincode(text);
              if (errors.permanentPincode)
                setErrors({ ...errors, permanentPincode: null });
            }}
            error={errors.permanentPincode}
            maxLength={6}
          />
          {permanentPincode.length === 6 && (
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  title={
                    LocalizedStrings.EditProfile?.City ||
                    LocalizedStrings.StaffProfile?.City ||
                    'City'
                  }
                  placeholder={''}
                  value={permanentCity}
                  onChange={text => {
                    setPermanentCity(text);
                    if (errors.permanentCity)
                      setErrors({ ...errors, permanentCity: null });
                  }}
                  error={errors.permanentCity}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Input
                  title={
                    LocalizedStrings.EditProfile?.State ||
                    LocalizedStrings.StaffProfile?.State ||
                    'State'
                  }
                  placeholder={''}
                  value={permanentState}
                  onChange={text => {
                    setPermanentState(text);
                    if (errors.permanentState)
                      setErrors({ ...errors, permanentState: null });
                  }}
                  error={errors.permanentState}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </>
  );
});

export default StepLoactionStaff;

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: Font?.Manrope_Bold,
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wrap: {
    borderWidth: 1,
    borderColor: '#EBEBEA',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
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
});
