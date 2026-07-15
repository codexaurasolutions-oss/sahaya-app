import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import MapLocationPicker from '../../../Component/MapLocationPicker';

import { Font } from '../../../Constants/Font';
import { validators } from '../../../Backend/Validator';
import { isValidForm, fetchPincodeDetails } from '../../../Backend/Utility';

import Input from '../../../Component/Input';
import Typography from '../../../Component/UI/Typography';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';

const ADDRESS_LABELS = ['Home', 'Work', 'Other'];

const AddressLabelSelector = ({value, onChange, error}) => {
  const selectedLabel = ADDRESS_LABELS.includes(value) ? value : 'Other';

  return (
    <View style={styles.labelSection}>
      <Typography type={Font.Poppins_Medium} size={14} color="#2B2B2B">
        Save address as
      </Typography>
      <View style={styles.labelOptions}>
        {ADDRESS_LABELS.map(label => (
          <TouchableOpacity
            key={label}
            activeOpacity={0.8}
            style={[
              styles.labelChip,
              selectedLabel === label ? styles.labelChipSelected : null,
            ]}
            onPress={() => onChange(label === 'Other' ? '' : label)}>
            <Typography
              type={Font.Poppins_Medium}
              size={12}
              color={selectedLabel === label ? '#FFFFFF' : '#5F5F5F'}>
              {label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
      {selectedLabel === 'Other' ? (
        <Input
          title="Custom address label"
          placeholder="e.g. Parents' Home, Villa 1"
          value={value}
          onChange={onChange}
          error={error}
        />
      ) : error ? (
        <Typography size={11} color="#D32F2F" style={styles.labelError}>
          {error}
        </Typography>
      ) : null}
    </View>
  );
};

const StepLocation = React.forwardRef((props, ref) => {
  const [show, setShow] = useState(false);
  const [error, setError] = useState({});
  
  // Primary address states
  const [name, setName] = useState('Home');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [street, setStreet] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [googleLocation, setGoogleLocation] = useState('');
  const [lat, setLat] = useState('');
  const [long, setLong] = useState('');
  
  // Secondary address states
  const [name2, setName2] = useState('Work');
  const [city2, setCity2] = useState('');
  const [state2, setState2] = useState('');
  const [street2, setStreet2] = useState('');
  const [pinCode2, setPinCode2] = useState('');
  const [areaLocality2, setAreaLocality2] = useState('');
  const [googleLocation2, setGoogleLocation2] = useState('');
  const [lat2, setLat2] = useState('');
  const [long2, setLong2] = useState('');

  const handlePrimaryPlaceSelected = location => {
    setGoogleLocation(location?.google_location || '');
    setLat(location?.lat ? String(location.lat) : '');
    setLong(location?.long ? String(location.long) : '');
    const mappedArea = location?.area_locality || location?.street;
    if (mappedArea) setAreaLocality(mappedArea);
    if (location?.city) setCity(location.city);
    if (location?.state) setState(location.state);
    if (location?.pincode) setPinCode(location.pincode);
    setError(prev => ({
      ...prev,
      googleLocation: null,
      areaLocality: mappedArea ? null : prev?.areaLocality,
      city: location?.city ? null : prev?.city,
      state: location?.state ? null : prev?.state,
      pinCode: location?.pincode ? null : prev?.pinCode,
    }));
  };

  const handleSecondaryPlaceSelected = location => {
    setGoogleLocation2(location?.google_location || '');
    setLat2(location?.lat ? String(location.lat) : '');
    setLong2(location?.long ? String(location.long) : '');
    const mappedArea = location?.area_locality || location?.street;
    if (mappedArea) setAreaLocality2(mappedArea);
    if (location?.city) setCity2(location.city);
    if (location?.state) setState2(location.state);
    if (location?.pincode) setPinCode2(location.pincode);
    setError(prev => ({
      ...prev,
      googleLocation2: null,
      areaLocality2: mappedArea ? null : prev?.areaLocality2,
      city2: location?.city ? null : prev?.city2,
      state2: location?.state ? null : prev?.state2,
      pinCode2: location?.pincode ? null : prev?.pinCode2,
    }));
  };

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
      name: validators.checkRequire('Address Label', name),
      street: validators.checkRequire('House / Flat / Floor / Block', street),
      areaLocality: validators.checkRequire('Building / Road / Area', areaLocality),
      city: validators.checkAlphabet('City', 2, 50, city),
      state: validators.checkAlphabet('State', 2, 50, state),
      pinCode: validators.checkPhoneNumberWithFixLength('Pincode', 6, pinCode),
      googleLocation: validators.checkRequire('Google Location', googleLocation),
    };

    // If secondary address is shown, validate it too
    if (show) {
      errors = {
        ...errors,
        name2: validators.checkRequire('Address Label', name2),
        street2: validators.checkRequire('House / Flat / Floor / Block', street2),
        areaLocality2: validators.checkRequire('Building / Road / Area', areaLocality2),
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
        <View style={styles.headerRow}>
          <Typography type={Font?.Poppins_SemiBold} size={18}>
            Set your home address
          </Typography>
        </View>
        <Typography size={12} color="#707070" style={styles.addressIntro}>
          Choose the exact location first, then complete your address details.
        </Typography>

        <MapLocationPicker
          title="Pin your exact location"
          location={{
            google_location: googleLocation,
            lat,
            long,
            street,
            area_locality: areaLocality,
            city,
            state,
            pincode: pinCode,
          }}
          selectedLabel={[areaLocality, city, state].filter(Boolean).join(', ')}
          onConfirm={handlePrimaryPlaceSelected}
          error={error?.googleLocation}
        />

        {googleLocation ? (
          <View style={styles.addressDetails}>
            <Typography type={Font.Poppins_SemiBold} size={15}>
              Complete address
            </Typography>
            <Input
              title="House / Flat / Floor / Block"
              placeholder="e.g. Flat 12B, 3rd Floor"
              value={street}
              onChange={text => {
                setStreet(text);
                if (error?.street) setError({...error, street: null});
              }}
              error={error?.street}
            />
            <Input
              title="Apartment / Building / Road / Area"
              placeholder="e.g. Palm Residency, MG Road"
              value={areaLocality}
              onChange={text => {
                setAreaLocality(text);
                if (error?.areaLocality) setError({...error, areaLocality: null});
              }}
              error={error?.areaLocality}
            />
            <View style={styles.row}>
              <View style={styles.cityContainer}>
                <Input
                  title="City"
                  placeholder="Auto-filled, or enter city"
                  value={city}
                  onChange={text => {
                    setCity(text);
                    if (error?.city) setError({...error, city: null});
                  }}
                  error={error?.city}
                />
              </View>
              <View style={styles.stateContainer}>
                <Input
                  title="State"
                  placeholder="Auto-filled, or enter state"
                  value={state}
                  onChange={text => {
                    setState(text);
                    if (error?.state) setError({...error, state: null});
                  }}
                  error={error?.state}
                />
              </View>
            </View>
            <Input
              title="Pincode"
              placeholder="Enter 6-digit pincode"
              keyboardType="numeric"
              value={pinCode}
              onChange={text => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setPinCode(numericValue);
                if (error?.pinCode) setError({...error, pinCode: null});
              }}
              error={error?.pinCode}
              maxLength={6}
            />
            <AddressLabelSelector
              value={name}
              onChange={value => {
                setName(value);
                if (error?.name) setError({...error, name: null});
              }}
              error={error?.name}
            />
          </View>
        ) : (
          <View style={styles.mapFirstHint}>
            <Typography size={11} color="#777777">
              Address fields will appear after you confirm the pin.
            </Typography>
          </View>
        )}

        {googleLocation && !show ? (
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => {
              setShow(true);
              if (props.onAddressCountChange) props.onAddressCountChange(2);
            }}>
            <Typography color="#D98579" type={Font.Poppins_Medium}>
              + {LocalizedStrings.EditProfile?.add_more_address || 'Add another address'}
            </Typography>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Secondary Address */}
      {show && (
        <View style={styles.wrap}>
          <View style={styles.headerRow}>
            <Typography type={Font?.Poppins_SemiBold} size={18}>
              Additional address
            </Typography>
            <TouchableOpacity onPress={() => {
              setShow(false);
              if (props.onAddressCountChange) props.onAddressCountChange(1);
            }}>
              <Image source={ImageConstant?.X} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>
          <Typography size={12} color="#707070" style={styles.addressIntro}>
            Pin this location first, then add the complete address.
          </Typography>

          <MapLocationPicker
            title="Pin your exact location"
            location={{
              google_location: googleLocation2,
              lat: lat2,
              long: long2,
              street: street2,
              area_locality: areaLocality2,
              city: city2,
              state: state2,
              pincode: pinCode2,
            }}
            selectedLabel={[areaLocality2, city2, state2].filter(Boolean).join(', ')}
            onConfirm={handleSecondaryPlaceSelected}
            error={error?.googleLocation2}
          />

          {googleLocation2 ? (
            <View style={styles.addressDetails}>
              <Typography type={Font.Poppins_SemiBold} size={15}>
                Complete address
              </Typography>
              <Input
                title="House / Flat / Floor / Block"
                placeholder="e.g. Flat 12B, 3rd Floor"
                value={street2}
                onChange={text => {
                  setStreet2(text);
                  if (error?.street2) setError({...error, street2: null});
                }}
                error={error?.street2}
              />
              <Input
                title="Apartment / Building / Road / Area"
                placeholder="e.g. Palm Residency, MG Road"
                value={areaLocality2}
                onChange={text => {
                  setAreaLocality2(text);
                  if (error?.areaLocality2) setError({...error, areaLocality2: null});
                }}
                error={error?.areaLocality2}
              />
              <View style={styles.row}>
                <View style={styles.cityContainer}>
                  <Input
                    title="City"
                    placeholder="Auto-filled, or enter city"
                    value={city2}
                    onChange={text => {
                      setCity2(text);
                      if (error?.city2) setError({...error, city2: null});
                    }}
                    error={error?.city2}
                  />
                </View>
                <View style={styles.stateContainer}>
                  <Input
                    title="State"
                    placeholder="Auto-filled, or enter state"
                    value={state2}
                    onChange={text => {
                      setState2(text);
                      if (error?.state2) setError({...error, state2: null});
                    }}
                    error={error?.state2}
                  />
                </View>
              </View>
              <Input
                title="Pincode"
                placeholder="Enter 6-digit pincode"
                keyboardType="numeric"
                value={pinCode2}
                onChange={text => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setPinCode2(numericValue);
                  if (error?.pinCode2) setError({...error, pinCode2: null});
                }}
                error={error?.pinCode2}
                maxLength={6}
              />
              <AddressLabelSelector
                value={name2}
                onChange={value => {
                  setName2(value);
                  if (error?.name2) setError({...error, name2: null});
                }}
                error={error?.name2}
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
    borderRadius: 16,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledInputContainer: {
    backgroundColor: '#F9FAFB',
  },
  disabledInputText: {
    color: '#6B7280',
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
  },
  labelSection: {
    marginTop: 5,
  },
  labelOptions: {
    flexDirection: 'row',
    marginTop: 9,
    marginBottom: 2,
  },
  labelChip: {
    minWidth: 76,
    height: 38,
    marginRight: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDC2BD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelChipSelected: {
    borderColor: '#D98579',
    backgroundColor: '#D98579',
  },
  labelError: {
    marginTop: 5,
  },
  addAddressButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E7BBB4',
    borderRadius: 10,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  closeIcon: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
  },
});
