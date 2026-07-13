import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {Font} from '../Constants/Font';

const DEFAULT_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 18,
  longitudeDelta: 18,
};

const buildRegion = (latitude, longitude, zoomed = true) => ({
  latitude,
  longitude,
  latitudeDelta: zoomed ? 0.01 : DEFAULT_REGION.latitudeDelta,
  longitudeDelta: zoomed ? 0.01 : DEFAULT_REGION.longitudeDelta,
});

const parseCoordinate = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission Required',
      message: 'Allow Sahayya to show your current location on the map.',
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const LocationMap = ({
  lat,
  long,
  onMarkerDragEnd,
  height = 200,
  autoLocate = true,
}) => {
  const [region, setRegion] = useState(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');
  const didAutoLocateRef = useRef(false);

  useEffect(() => {
    const latitude = parseCoordinate(lat);
    const longitude = parseCoordinate(long);

    if (latitude !== null && longitude !== null) {
      setRegion(buildRegion(latitude, longitude));
      setSelectedCoordinate({latitude, longitude});
    }
  }, [lat, long]);

  const updateSelectedLocation = useCallback((latitude, longitude) => {
    const nextRegion = buildRegion(latitude, longitude);
    setRegion(nextRegion);
    setSelectedCoordinate({latitude, longitude});
    onMarkerDragEnd?.({latitude, longitude});
  }, [onMarkerDragEnd]);

  const getCurrentLocation = useCallback(async () => {
    setPermissionMessage('');
    setLoading(true);

    const hasPermission = await requestLocationPermission();
    setHasLocationPermission(hasPermission);
    if (!hasPermission) {
      setLoading(false);
      setRegion(prev => prev || DEFAULT_REGION);
      setPermissionMessage('Location permission is off. Search above or enable location to use your current position.');
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        setLoading(false);
        const {latitude, longitude} = position.coords;
        updateSelectedLocation(latitude, longitude);
      },
      error => {
        setLoading(false);
        setRegion(prev => prev || DEFAULT_REGION);
        if (error.code === 1) {
          setPermissionMessage('Location permission is off. Search above or enable location to use your current position.');
        } else {
          setPermissionMessage('Could not detect current location. You can still search above or tap the map to drop the pin.');
        }
      },
      {enableHighAccuracy: false, timeout: 30000, maximumAge: 60000},
    );
  }, [updateSelectedLocation]);

  useEffect(() => {
    const hasInitialCoordinate =
      parseCoordinate(lat) !== null && parseCoordinate(long) !== null;

    if (autoLocate && !hasInitialCoordinate && !didAutoLocateRef.current) {
      didAutoLocateRef.current = true;
      getCurrentLocation();
    }
  }, [autoLocate, getCurrentLocation, lat, long]);

  const handleCoordinateChange = useCallback((coordinate) => {
    updateSelectedLocation(coordinate.latitude, coordinate.longitude);
  }, [updateSelectedLocation]);

  if (!region) {
    return (
      <View style={[styles.container, styles.emptyContainer, styles.emptyContainerHeight]}>
        {loading ? (
          <>
            <ActivityIndicator size="small" color="#D98579" />
            <Text style={styles.emptyText}>Finding your current location...</Text>
          </>
        ) : null}
        <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation}>
          <Text style={styles.gpsButtonText}>Use My Current Location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, {height}]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={event => handleCoordinateChange(event.nativeEvent.coordinate)}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}>
        {selectedCoordinate ? (
          <Marker
            coordinate={selectedCoordinate}
            draggable
            onDragEnd={e => {
              handleCoordinateChange(e.nativeEvent.coordinate);
            }}
            title="Selected Location"
            description="Drag this pin or tap the map to adjust"
          />
        ) : null}
      </MapView>
      <View style={styles.mapHint}>
        <Text style={styles.mapHintText}>Drag the pin or tap the map to adjust location</Text>
      </View>
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={getCurrentLocation}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.recenterText}>Use My Location</Text>
        )}
      </TouchableOpacity>
      {permissionMessage ? (
        <TouchableOpacity
          style={styles.permissionToast}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }}>
          <Text style={styles.permissionText}>{permissionMessage}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default React.memo(LocationMap);

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 12,
  },
  emptyContainerHeight: {
    height: 120,
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
    fontFamily: Font.Poppins_Regular,
    fontSize: 12,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  gpsButton: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F3',
    borderRadius: 20,
  },
  gpsButtonText: {
    color: '#D98579',
    fontFamily: Font.Poppins_Medium,
    fontSize: 13,
  },
  mapHint: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapHintText: {
    color: '#444',
    fontFamily: Font.Poppins_Regular,
    fontSize: 10,
    textAlign: 'center',
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#D98579',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  recenterText: {
    color: '#fff',
    fontFamily: Font.Poppins_Medium,
    fontSize: 11,
  },
  permissionToast: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderRadius: 10,
    padding: 8,
  },
  permissionText: {
    color: '#fff',
    fontFamily: Font.Poppins_Regular,
    fontSize: 10,
    textAlign: 'center',
  },
});
