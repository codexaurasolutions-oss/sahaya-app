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
import { ImageConstant } from '../../../Constants/ImageConstant';
import { validators } from '../../../Backend/Validator';
import { isValidForm, fetchPincodeDetails } from '../../../Backend/Utility';
import { useSelector } from 'react-redux';
import LocalizedStrings from '../../../Constants/localization';
import MapLocationPicker from '../../../Component/MapLocationPicker';

const StepLoactionStaff = forwardRef((props, ref) => {
  const userDetail = useSelector(store => store?.userDetails);
  // State for current address (index 0)
  const [currentStreet, setCurrentStreet] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [currentPincode, setCurrentPincode] = useState('');
  const [currentAreaLocality, setCurrentAreaLocality] = useState('');
  const [currentGoogleLocation, setCurrentGoogleLocation] = useState('');
  const [currentLat, setCurrentLat] = useState('');
  const [currentLong, setCurrentLong] = useState('');
  const [currentId, setCurrentId] = useState(null);

  // State for permanent address (index 1)
  const [permanentStreet, setPermanentStreet] = useState('');
  const [permanentCity, setPermanentCity] = useState('');
  const [permanentState, setPermanentState] = useState('');
  const [permanentPincode, setPermanentPincode] = useState('');
  const [permanentAreaLocality, setPermanentAreaLocality] = useState('');
  const [permanentGoogleLocation, setPermanentGoogleLocation] = useState('');
  const [permanentLat, setPermanentLat] = useState('');
  const [permanentLong, setPermanentLong] = useState('');
  const [permanentId, setPermanentId] = useState(null);
  // State for errors
  const [errors, setErrors] = useState({});
  const [loader, setLoader] = useState(false);
  const handleCurrentPlaceSelected = location => {
    setCurrentGoogleLocation(location?.google_location || '');
    setCurrentLat(location?.lat ? String(location.lat) : '');
    setCurrentLong(location?.long ? String(location.long) : '');
    const mappedArea = location?.area_locality || location?.street;
    if (mappedArea) setCurrentAreaLocality(mappedArea);
    if (location?.city) setCurrentCity(location.city);
    if (location?.state) setCurrentState(location.state);
    if (location?.pincode) setCurrentPincode(location.pincode);
    setErrors(prev => ({
      ...prev,
      currentGoogleLocation: null,
      currentAreaLocality: mappedArea ? null : prev?.currentAreaLocality,
      currentCity: location?.city ? null : prev?.currentCity,
      currentState: location?.state ? null : prev?.currentState,
      currentPincode: location?.pincode ? null : prev?.currentPincode,
    }));
  };

  const handlePermanentPlaceSelected = location => {
    setPermanentGoogleLocation(location?.google_location || '');
    setPermanentLat(location?.lat ? String(location.lat) : '');
    setPermanentLong(location?.long ? String(location.long) : '');
    const mappedArea = location?.area_locality || location?.street;
    if (mappedArea) setPermanentAreaLocality(mappedArea);
    if (location?.city) setPermanentCity(location.city);
    if (location?.state) setPermanentState(location.state);
    if (location?.pincode) setPermanentPincode(location.pincode);
    setErrors(prev => ({
      ...prev,
      permanentGoogleLocation: null,
      permanentAreaLocality: mappedArea ? null : prev?.permanentAreaLocality,
      permanentCity: location?.city ? null : prev?.permanentCity,
      permanentState: location?.state ? null : prev?.permanentState,
      permanentPincode: location?.pincode ? null : prev?.permanentPincode,
    }));
  };

  const addressesString = useMemo(() => {
    return JSON.stringify(userDetail?.addresses || []);
  }, [userDetail?.addresses]);
  const addresses = useMemo(() => userDetail?.addresses || [], [userDetail?.addresses]);

  const previousAddressesStringRef = useRef('');
  const isInitialMount = useRef(true);
  // Load existing addresses from userDetail - only run when addresses actually change
  useEffect(() => {
    // Skip on initial mount if no addresses
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (addresses.length === 0) {
        previousAddressesStringRef.current = addressesString;
        return;
      }
    }

    // Skip if addresses haven't changed (same content)
    if (addressesString === previousAddressesStringRef.current) {
      return; // No change, exit early
    }

    if (addresses && addresses.length > 0) {
      const currentAddress =
        addresses.find(addr => addr.is_primary == 0) || addresses[0];
      if (currentAddress) {
        const newStreet = currentAddress.street || '';
        const newCity = currentAddress.city || '';
        const newState = currentAddress.state || '';
        const newPincode = currentAddress.pincode || '';
        const newAreaLocality = currentAddress.area_locality || '';
        const newGoogleLocation = currentAddress.google_location || '';
        const newLat = currentAddress.lat || currentAddress.latitude || '';
        const newLong = currentAddress.long || currentAddress.longitude || '';
        const newId = currentAddress.id || null;
        setCurrentStreet(prev => (prev !== newStreet ? newStreet : prev));
        setCurrentCity(prev => (prev !== newCity ? newCity : prev));
        setCurrentState(prev => (prev !== newState ? newState : prev));
        setCurrentPincode(prev => (prev !== newPincode ? newPincode : prev));
        setCurrentAreaLocality(prev => (prev !== newAreaLocality ? newAreaLocality : prev));
        setCurrentGoogleLocation(prev => (prev !== newGoogleLocation ? newGoogleLocation : prev));
        setCurrentLat(prev => (prev !== newLat ? newLat : prev));
        setCurrentLong(prev => (prev !== newLong ? newLong : prev));
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
        const newAreaLocality = permanentAddress.area_locality || '';
        const newGoogleLocation = permanentAddress.google_location || '';
        const newLat = permanentAddress.lat || permanentAddress.latitude || '';
        const newLong = permanentAddress.long || permanentAddress.longitude || '';
        const newId = permanentAddress.id || null;
        setPermanentStreet(prev => (prev !== newStreet ? newStreet : prev));
        setPermanentCity(prev => (prev !== newCity ? newCity : prev));
        setPermanentState(prev => (prev !== newState ? newState : prev));
        setPermanentPincode(prev => (prev !== newPincode ? newPincode : prev));
        setPermanentAreaLocality(prev => (prev !== newAreaLocality ? newAreaLocality : prev));
        setPermanentGoogleLocation(prev => (prev !== newGoogleLocation ? newGoogleLocation : prev));
        setPermanentLat(prev => (prev !== newLat ? newLat : prev));
        setPermanentLong(prev => (prev !== newLong ? newLong : prev));
        setPermanentId(prev => (prev !== newId ? newId : prev));
      }
    }

    // Update ref after processing
    previousAddressesStringRef.current = addressesString;
  }, [addresses, addressesString]);

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
      currentAreaLocality: validators?.checkRequire(
        'Current Area / Locality',
        currentAreaLocality,
      ),
      currentGoogleLocation: validators?.checkRequire(
        'Current Google Location',
        currentGoogleLocation,
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
      permanentAreaLocality: validators?.checkRequire(
        'Permanent Area / Locality',
        permanentAreaLocality,
      ),
      permanentGoogleLocation: validators?.checkRequire(
        'Permanent Google Location',
        permanentGoogleLocation,
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
    formData.append('area_locality[0]', currentAreaLocality);
    formData.append('google_location[0]', currentGoogleLocation);
    formData.append('lat[0]', currentLat);
    formData.append('long[0]', currentLong);

    // Permanent address (index 1) - Set as primary
    formData.append('state[1]', permanentState);
    formData.append('is_primary[1]', '1'); // Primary
    formData.append('city[1]', permanentCity);
    formData.append('pincode[1]', permanentPincode);
    formData.append('street[1]', permanentStreet);
    formData.append('area_locality[1]', permanentAreaLocality);
    formData.append('google_location[1]', permanentGoogleLocation);
    formData.append('lat[1]', permanentLat);
    formData.append('long[1]', permanentLong);
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
          <View style={styles.headerRow}>
            <Typography type={Font?.Poppins_SemiBold} size={18}>
              {LocalizedStrings.EditProfile?.Current_Address || 'Current Address'}
            </Typography>
          </View>
          <Typography size={12} color="#707070" style={styles.addressIntro}>
            Choose the exact location first, then complete your address details.
          </Typography>

          <MapLocationPicker
            title="Pin your exact location"
            location={{
              google_location: currentGoogleLocation,
              lat: currentLat,
              long: currentLong,
              street: currentStreet,
              area_locality: currentAreaLocality,
              city: currentCity,
              state: currentState,
              pincode: currentPincode,
            }}
            selectedLabel={[currentAreaLocality, currentCity, currentState].filter(Boolean).join(', ')}
            onConfirm={handleCurrentPlaceSelected}
            error={errors?.currentGoogleLocation}
          />

          {currentGoogleLocation ? (
            <View style={styles.addressDetails}>
              <Typography type={Font.Poppins_SemiBold} size={15}>
                Complete address
              </Typography>
              <Input
                title="House / Flat / Floor / Block"
                placeholder="e.g. Flat 12B, 3rd Floor"
                value={currentStreet}
                onChange={text => {
                  setCurrentStreet(text);
                  if (errors.currentStreet) setErrors({...errors, currentStreet: null});
                }}
                error={errors.currentStreet}
              />
              <Input
                title="Apartment / Building / Road / Area"
                placeholder="e.g. Phase 1, Model Town"
                value={currentAreaLocality}
                onChange={text => {
                  setCurrentAreaLocality(text);
                  if (errors.currentAreaLocality) setErrors({...errors, currentAreaLocality: null});
                }}
                error={errors.currentAreaLocality}
              />
              <View style={styles.row}>
                <View style={styles.cityContainer}>
                  <Input
                    title={LocalizedStrings.EditProfile?.City || 'City'}
                    placeholder="Auto-filled, or enter city"
                    value={currentCity}
                    onChange={text => {
                      setCurrentCity(text);
                      if (errors.currentCity) setErrors({...errors, currentCity: null});
                    }}
                    error={errors.currentCity}
                  />
                </View>
                <View style={styles.stateContainer}>
                  <Input
                    title={LocalizedStrings.EditProfile?.State || 'State'}
                    placeholder="Auto-filled, or enter state"
                    value={currentState}
                    onChange={text => {
                      setCurrentState(text);
                      if (errors.currentState) setErrors({...errors, currentState: null});
                    }}
                    error={errors.currentState}
                  />
                </View>
              </View>
              <Input
                title={LocalizedStrings.EditProfile?.Pincode || LocalizedStrings.StaffProfile?.Pincode || 'Pincode'}
                placeholder="Enter 6-digit pincode"
                keyboardType="numeric"
                value={currentPincode}
                onChange={text => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setCurrentPincode(numericValue);
                  if (errors.currentPincode) setErrors({...errors, currentPincode: null});
                }}
                error={errors.currentPincode}
                maxLength={6}
              />
            </View>
          ) : (
            <View style={styles.mapFirstHint}>
              <Typography size={11} color="#777777">
                Address fields will appear after you confirm the pin.
              </Typography>
            </View>
          )}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.wrap}>
          <View style={styles.headerRow}>
            <Typography type={Font?.Poppins_SemiBold} size={18}>
              {LocalizedStrings.EditProfile?.Permanent_Address || 'Permanent Address'}
            </Typography>
          </View>
          <Typography size={12} color="#707070" style={styles.addressIntro}>
            Choose the exact location first, then complete your address details.
          </Typography>

          <MapLocationPicker
            title="Pin your exact location"
            location={{
              google_location: permanentGoogleLocation,
              lat: permanentLat,
              long: permanentLong,
              street: permanentStreet,
              area_locality: permanentAreaLocality,
              city: permanentCity,
              state: permanentState,
              pincode: permanentPincode,
            }}
            selectedLabel={[permanentAreaLocality, permanentCity, permanentState].filter(Boolean).join(', ')}
            onConfirm={handlePermanentPlaceSelected}
            error={errors?.permanentGoogleLocation}
          />

          {permanentGoogleLocation ? (
            <View style={styles.addressDetails}>
              <Typography type={Font.Poppins_SemiBold} size={15}>
                Complete address
              </Typography>
              <Input
                title="House / Flat / Floor / Block"
                placeholder="e.g. Flat 12B, 3rd Floor"
                value={permanentStreet}
                onChange={text => {
                  setPermanentStreet(text);
                  if (errors.permanentStreet) setErrors({...errors, permanentStreet: null});
                }}
                error={errors.permanentStreet}
              />
              <Input
                title="Apartment / Building / Road / Area"
                placeholder="e.g. Phase 1, Model Town"
                value={permanentAreaLocality}
                onChange={text => {
                  setPermanentAreaLocality(text);
                  if (errors.permanentAreaLocality) setErrors({...errors, permanentAreaLocality: null});
                }}
                error={errors.permanentAreaLocality}
              />
              <View style={styles.row}>
                <View style={styles.cityContainer}>
                  <Input
                    title={LocalizedStrings.EditProfile?.City || 'City'}
                    placeholder="Auto-filled, or enter city"
                    value={permanentCity}
                    onChange={text => {
                      setPermanentCity(text);
                      if (errors.permanentCity) setErrors({...errors, permanentCity: null});
                    }}
                    error={errors.permanentCity}
                  />
                </View>
                <View style={styles.stateContainer}>
                  <Input
                    title={LocalizedStrings.EditProfile?.State || 'State'}
                    placeholder="Auto-filled, or enter state"
                    value={permanentState}
                    onChange={text => {
                      setPermanentState(text);
                      if (errors.permanentState) setErrors({...errors, permanentState: null});
                    }}
                    error={errors.permanentState}
                  />
                </View>
              </View>
              <Input
                title={LocalizedStrings.EditProfile?.Pincode || LocalizedStrings.StaffProfile?.Pincode || 'Pincode'}
                placeholder="Enter 6-digit pincode"
                keyboardType="numeric"
                value={permanentPincode}
                onChange={text => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setPermanentPincode(numericValue);
                  if (errors.permanentPincode) setErrors({...errors, permanentPincode: null});
                }}
                error={errors.permanentPincode}
                maxLength={6}
              />
            </View>
          ) : (
            <View style={styles.mapFirstHint}>
              <Typography size={11} color="#777777">
                Address fields will appear after you confirm the pin.
              </Typography>
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
    borderRadius: 16,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressIntro: {
    marginTop: 5,
    marginBottom: 3,
    lineHeight: 18,
  },
  addressDetails: {
    marginTop: 8,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0E6E4',
  },
  mapFirstHint: {
    marginTop: 2,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
  }
});
