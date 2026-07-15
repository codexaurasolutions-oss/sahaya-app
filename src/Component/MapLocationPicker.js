import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {mapKey} from '../Backend/env';
import {Font} from '../Constants/Font';
import {ImageConstant} from '../Constants/ImageConstant';
import GooglePlacesInput from './GooglePlacesInput';
import Typography from './UI/Typography';

const buildGoogleMapLink = (latitude, longitude) =>
  `https://maps.google.com/?q=${latitude},${longitude}`;

const stringValue = value => (value == null ? '' : String(value));

const normalizeLocation = location => ({
  google_location: stringValue(location?.google_location),
  lat: stringValue(location?.lat),
  long: stringValue(location?.long),
  street: stringValue(location?.street),
  area_locality: stringValue(location?.area_locality),
  city: stringValue(location?.city),
  state: stringValue(location?.state),
  pincode: stringValue(location?.pincode),
  formatted_address: stringValue(location?.formatted_address),
});

const readGoogleAddress = result => {
  const components = result?.address_components || [];
  const getComponent = (...types) =>
    components.find(component =>
      types.some(type => component.types?.includes(type)),
    )?.long_name || '';
  const streetNumber = getComponent('street_number');
  const route = getComponent('route');
  const street = [streetNumber, route].filter(Boolean).join(' ');

  return {
    street: street || result?.formatted_address?.split(',')?.[0] || '',
    area_locality: getComponent(
      'sublocality_level_1',
      'sublocality',
      'neighborhood',
    ),
    city: getComponent('locality', 'postal_town', 'administrative_area_level_2'),
    state: getComponent('administrative_area_level_1'),
    pincode: getComponent('postal_code'),
    formatted_address: result?.formatted_address || '',
  };
};

const reverseGeocodeWithGoogle = async (latitude, longitude) => {
  if (!mapKey) {
    return null;
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${encodeURIComponent(mapKey)}&language=en`,
  );
  const payload = await response.json();

  if (!response.ok || payload?.status !== 'OK' || !payload?.results?.[0]) {
    return null;
  }

  return readGoogleAddress(payload.results[0]);
};

const reverseGeocodeWithOpenStreetMap = async (latitude, longitude) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`,
    {headers: {'User-Agent': 'SahayyaApp/1.0'}},
  );

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const address = payload?.address;
  if (!address) {
    return null;
  }

  return {
    street:
      [
        address.house_number,
        address.road || address.pedestrian || address.path,
      ]
        .filter(Boolean)
        .join(' ') || payload.display_name?.split(',')?.[0] || '',
    area_locality:
      address.suburb ||
      address.neighbourhood ||
      address.city_district ||
      address.county ||
      '',
    city:
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      '',
    state: address.state || '',
    pincode: address.postcode || '',
    formatted_address: payload.display_name || '',
  };
};

const reverseGeocode = async (latitude, longitude) => {
  try {
    const googleAddress = await reverseGeocodeWithGoogle(latitude, longitude);
    if (googleAddress) {
      return googleAddress;
    }
  } catch (error) {
    // Fall through to OpenStreetMap when the Google web service is unavailable.
  }

  try {
    return await reverseGeocodeWithOpenStreetMap(latitude, longitude);
  } catch (error) {
    return null;
  }
};

const MapLocationPicker = ({
  title = 'Google Location (Mandatory)',
  location,
  selectedLabel = '',
  onConfirm,
  error = '',
}) => {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(() => normalizeLocation(location));
  const [resolving, setResolving] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const [pickerSession, setPickerSession] = useState(0);
  const lookupSequence = useRef(0);

  const openPicker = useCallback(() => {
    lookupSequence.current += 1;
    setDraft(normalizeLocation(location));
    setLookupMessage('');
    setResolving(false);
    setPickerSession(previous => previous + 1);
    setVisible(true);
  }, [location]);

  const closePicker = useCallback(() => {
    lookupSequence.current += 1;
    setResolving(false);
    setVisible(false);
  }, []);

  const handlePlaceSelected = useCallback(async selected => {
    const latitude = stringValue(selected?.lat);
    const longitude = stringValue(selected?.long);
    if (!latitude || !longitude) {
      return;
    }

    const coordinateLocation = {
      ...normalizeLocation(selected),
      lat: latitude,
      long: longitude,
      google_location:
        selected?.google_location || buildGoogleMapLink(latitude, longitude),
    };

    const currentSequence = lookupSequence.current + 1;
    lookupSequence.current = currentSequence;
    setResolving(false);
    setDraft(previous => ({...previous, ...coordinateLocation}));
    setLookupMessage('');

    if (!selected?.fromMap) {
      return;
    }

    setResolving(true);
    const address = await reverseGeocode(latitude, longitude);

    if (lookupSequence.current !== currentSequence) {
      return;
    }

    setResolving(false);
    if (address) {
      setDraft(previous => ({...previous, ...address}));
    } else {
      setLookupMessage(
        'Pin selected. Address details could not be fetched, so you can complete them in the form.',
      );
    }
  }, []);

  const confirmLocation = useCallback(() => {
    if (!draft.lat || !draft.long) {
      setLookupMessage('Search for a place or select a point on the map first.');
      return;
    }

    onConfirm?.({
      ...draft,
      google_location:
        draft.google_location || buildGoogleMapLink(draft.lat, draft.long),
      hasExtractedData: true,
    });
    setVisible(false);
  }, [draft, onConfirm]);

  const hasSelection = Boolean(location?.lat && location?.long);
  const summary =
    selectedLabel?.trim() ||
    [location?.area_locality, location?.city, location?.state]
      .filter(Boolean)
      .join(', ') ||
    (hasSelection ? 'Map location selected' : 'No location selected yet');
  const draftSummary =
    draft.formatted_address ||
    [draft.area_locality, draft.city, draft.state].filter(Boolean).join(', ') ||
    (draft.lat && draft.long
      ? `Selected pin: ${Number(draft.lat).toFixed(5)}, ${Number(draft.long).toFixed(5)}`
      : 'Move the pin or search for your address.');

  return (
    <View style={styles.fieldWrap}>
      <Typography type={Font.Poppins_Medium} size={16} color="#2B2B2B">
        {title}
      </Typography>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openPicker}
        style={[styles.openButton, error ? styles.openButtonError : null]}>
        <View style={styles.locationIconWrap}>
          <Image source={ImageConstant?.Location} style={styles.locationIcon} />
        </View>
        <View style={styles.openButtonText}>
          <Text style={styles.openButtonTitle}>
            {hasSelection ? 'Change Location' : 'Open Map'}
          </Text>
          <Text style={styles.openButtonSubtitle} numberOfLines={2}>
            {hasSelection
              ? summary
              : 'Search, use your current location, or move the pin'}
          </Text>
        </View>
        <Text style={styles.chevron}>{'>'}</Text>
      </TouchableOpacity>
      {hasSelection ? (
        <View style={styles.selectedNotice}>
          <View style={styles.selectedDot} />
          <Text style={styles.selectedNoticeText}>Location selected</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={closePicker}
        statusBarTranslucent={false}>
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView
            style={styles.modalSafeArea}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closePicker} style={styles.headerAction}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Location</Text>
              <View style={styles.headerAction} />
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescription}>
                Search for your address or move the pin to the exact entrance.
              </Text>
              <View style={styles.searchAndMapWrap}>
                <GooglePlacesInput
                  key={pickerSession}
                  title="Search Google Location"
                  placeholder="Search area, street, landmark..."
                  showMap
                  mapHeight={330}
                  selectedLat={draft.lat}
                  selectedLong={draft.long}
                  onPlaceSelected={handlePlaceSelected}
                  autoLocate={!draft.lat || !draft.long}
                />
              </View>

              <View style={styles.draftCard}>
                <Text style={styles.draftLabel}>SELECTED LOCATION</Text>
                <Text style={styles.draftAddress}>{draftSummary}</Text>
                {resolving ? (
                  <View style={styles.resolvingRow}>
                    <ActivityIndicator size="small" color="#D98579" />
                    <Text style={styles.resolvingText}>Fetching address details...</Text>
                  </View>
                ) : null}
                {lookupMessage ? (
                  <Text style={styles.lookupMessage}>{lookupMessage}</Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={resolving}
                onPress={confirmLocation}
                style={[
                  styles.confirmButton,
                  resolving ? styles.confirmButtonDisabled : null,
                ]}>
                <Text style={styles.confirmButtonText}>
                  {resolving ? 'Fetching Address...' : 'Confirm Location'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default React.memo(MapLocationPicker);

const styles = StyleSheet.create({
  fieldWrap: {
    marginVertical: 10,
  },
  openButton: {
    minHeight: 82,
    marginTop: 7,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  openButtonError: {
    borderColor: '#D32F2F',
  },
  locationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF3F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIcon: {
    width: 21,
    height: 21,
    resizeMode: 'contain',
    tintColor: '#D98579',
  },
  openButtonText: {
    flex: 1,
    marginHorizontal: 12,
  },
  openButtonTitle: {
    fontFamily: Font.Poppins_SemiBold,
    color: '#242424',
    fontSize: 15,
  },
  openButtonSubtitle: {
    marginTop: 2,
    fontFamily: Font.Poppins_Regular,
    color: '#737373',
    fontSize: 11,
    lineHeight: 17,
  },
  chevron: {
    color: '#D98579',
    fontFamily: Font.Poppins_SemiBold,
    fontSize: 22,
  },
  selectedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  selectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: '#2E9B62',
  },
  selectedNoticeText: {
    color: '#2E7D52',
    fontFamily: Font.Poppins_Medium,
    fontSize: 11,
  },
  errorText: {
    marginTop: 5,
    color: '#D32F2F',
    fontFamily: Font.Poppins_Regular,
    fontSize: 11,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    height: 60,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAction: {
    width: 70,
  },
  cancelText: {
    color: '#D98579',
    fontFamily: Font.Poppins_Medium,
    fontSize: 14,
  },
  modalTitle: {
    color: '#1F1F1F',
    fontFamily: Font.Poppins_SemiBold,
    fontSize: 17,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalDescription: {
    marginBottom: 4,
    color: '#606060',
    fontFamily: Font.Poppins_Regular,
    fontSize: 12,
    lineHeight: 19,
  },
  searchAndMapWrap: {
    zIndex: 10,
  },
  draftCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF8F6',
    borderWidth: 1,
    borderColor: '#F2D4CF',
  },
  draftLabel: {
    color: '#A45F55',
    fontFamily: Font.Poppins_SemiBold,
    fontSize: 10,
    letterSpacing: 0.7,
  },
  draftAddress: {
    marginTop: 5,
    color: '#333333',
    fontFamily: Font.Poppins_Medium,
    fontSize: 13,
    lineHeight: 19,
  },
  resolvingRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resolvingText: {
    marginLeft: 8,
    color: '#6B6B6B',
    fontFamily: Font.Poppins_Regular,
    fontSize: 11,
  },
  lookupMessage: {
    marginTop: 8,
    color: '#8A5A32',
    fontFamily: Font.Poppins_Regular,
    fontSize: 11,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    backgroundColor: '#FFFFFF',
  },
  confirmButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#D98579',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.65,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: Font.Poppins_SemiBold,
    fontSize: 16,
  },
});
