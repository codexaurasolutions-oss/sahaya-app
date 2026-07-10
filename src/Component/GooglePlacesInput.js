import React, { useRef, useMemo, useCallback } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Colors } from '../Constants/Colors';
import Typography from './UI/Typography';
import { Font } from '../Constants/Font';
import { ImageConstant } from '../Constants/ImageConstant';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { mapKey } from '../Backend/env';

const GooglePlacesInput = ({
  title = 'Location',
  placeholder = '',
  onPlaceSelected = () => {},
  styleContainer,
  styleInput,
  mainStyle,
  showTitle = true,
  showIcon = false,
  source = ImageConstant.location_icon,
  error = '',
}) => {
  const ref = useRef();
  
  const query = useMemo(() => ({
    key: mapKey || '',
    language: 'en',
  }), []);

  const googlePlacesDetailsQuery = useMemo(() => ({
    fields: 'formatted_address,address_components,geometry',
  }), []);

  const handlePress = useCallback((data, details = null) => {
    let extractedData = { data, details };
    
    // Extract address components if details available
    if (details?.address_components) {
      const addressComponents = details.address_components || [];
      
      let street = '';
      let city = '';
      let state = '';
      let pincode = '';
      
      // Parse address components
      addressComponents.forEach(component => {
        const types = component.types;
        
        // Extract street number and route (street address)
        if (types.includes('street_number')) {
          street = component.long_name + ' ';
        }
        if (types.includes('route')) {
          street += component.long_name;
        }
        
        // Extract city (locality or administrative_area_level_2)
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_2') && !city) {
          city = component.long_name;
        }
        
        // Extract state (administrative_area_level_1)
        if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        
        // Extract pincode (postal_code)
        if (types.includes('postal_code')) {
          pincode = component.long_name;
        }
      });
      
      // If street is empty, use formatted_address or description
      if (!street.trim()) {
        street = details.formatted_address?.split(',')[0] || data?.description || '';
      }
      
      const lat = details.geometry?.location?.lat || '';
      const lng = details.geometry?.location?.lng || '';
      const google_location = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '';

      extractedData = {
        ...extractedData,
        street: street.trim(),
        city,
        state,
        pincode,
        lat: String(lat),
        long: String(lng),
        google_location,
        hasExtractedData: true, // Flag to indicate we have extracted data
      };
    } else {
      // If no details, use description or formatted address as fallback for street
      const fallbackStreet = data?.description || details?.formatted_address?.split(',')[0] || '';
      extractedData = {
        ...extractedData,
        street: fallbackStreet,
        lat: '',
        long: '',
        google_location: '',
        hasExtractedData: false, // Flag to indicate we don't have full extracted data
      };
    }
    
    onPlaceSelected?.(extractedData);
  }, [onPlaceSelected]);

  const textInputProps = useMemo(() => ({
    placeholderTextColor: 'gray',
    textAlign: 'left', // Left align text
    onFocus: () => {
    },
  }), []);

  // Memoize styles to prevent re-renders
  const componentStyles = useMemo(() => ({
    textInputContainer: {
      backgroundColor: Colors.white,
      borderTopWidth: 0,
      borderBottomWidth: 0,
      flex: 1,
      width:"100%",
      alignItems: 'flex-start', // Left align container
    },
    textInput: {
      height: 60,
      width:"100%",
      color: Colors.black,
      fontSize: 13,
      fontFamily: Font.Poppins_Medium,
      backgroundColor: Colors.white,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: error ? 'red' : '#DDDDDD',
      paddingHorizontal: 10,
      textAlign: 'left', // Left align text inside input
      textAlignVertical: 'center', // Center vertically for Android
      ...styleInput,
    },
    listView: {
      backgroundColor: Colors.white,
      borderRadius: 10,
      marginTop: 5,
      zIndex: 1000,
      elevation: 5,
    },
    description: {
      color: Colors.black,
      fontFamily: Font.Poppins_Regular,
      textAlign: 'left', // Left align description text
    },
  }), [styleInput, error]);

  return (
    <View style={[styles.container, mainStyle, { overflow: 'visible' }]}>
      {showTitle && (
        <Typography
          style={[styles.title]}
          type={Font.Poppins_Medium}
          size={16}
          color={Colors.lableColor}
        >
          {title}
        </Typography>
      )}

        <GooglePlacesAutocomplete
          minLength={2}
          autoFocus={false}
          returnKeyType={'default'}
          ref={ref}
          placeholder={placeholder}
          fetchDetails={true}
          enablePoweredByContainer={false}
          textInputProps={textInputProps}
          onPress={handlePress}
          query={query}
          nearbyPlacesAPI="GooglePlacesSearch"
          debounce={300}
          predefinedPlaces={[]}
          suppressDefaultStyles={false}
          keepResultsAfterBlur={false}
          enableHighAccuracyLocation={false}
          timeout={20000}
          GooglePlacesDetailsQuery={googlePlacesDetailsQuery}
          styles={componentStyles}
          keyboardShouldPersistTaps="handled"
          listViewDisplayed="auto"
        />
      
      {error && (
        <Typography style={styles.errorText}>
          {error}
        </Typography>
      )}
    </View>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(GooglePlacesInput);

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width:"100%",
  },
  icon: {
    height: 20,
    width: 20,
    marginLeft: 10,
    marginRight: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 11,
    paddingTop: 5,
    fontFamily: Font.Poppins_Regular,
  },
});
