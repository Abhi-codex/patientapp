import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PatientRideMap, TripSummary } from '../../components/patient';
import { colors, styles } from '../../constants/tailwindStyles';
import { useRideTracking } from '../../hooks';
import { RideStatus } from '../../types/rider';

function getFirstParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

const decodePolyline = (t: string) => {
  let points = [], index = 0, lat = 0, lng = 0;
  while (index < t.length) {
    let b, shift = 0, result = 0;
    do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; }
    while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = result = 0;
    do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; }
    while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

export default function TrackingScreen() {
  const params = useLocalSearchParams();
  const rideId = getFirstParam(params.rideId);
  const insets = useSafeAreaInsets();
  
  // Get user's current location
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  
  const [routeCoords, setRouteCoords] = useState<Array<any>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  
  const {
    ride,
    loading: rideLoading,
    error: rideError,
    rideStatus,
    driverLocation,
    refreshRideData
  } = useRideTracking(rideId);

  const availableDrivers = useMemo(() => {
    const drivers = [];
    
    // Only add driver if ride exists and has been accepted (has a rider)
    if (ride?.rider && ride.rider._id) {
      try {
        // Safely determine driver location with fallbacks
        let driverLoc = null;
        
        if (driverLocation) {
          // Use real-time driver location if available
          driverLoc = driverLocation;
        } else if (ride.pickup) {
          // Fallback to pickup location when no real-time location
          driverLoc = {
            latitude: ride.pickup.latitude,
            longitude: ride.pickup.longitude
          };
        }
        
        if (driverLoc && typeof driverLoc.latitude === 'number' && typeof driverLoc.longitude === 'number') {
          drivers.push({
            id: ride.rider._id,
            location: driverLoc,
            isAccepted: true
          });
        }
      } catch (error) {
        console.error('Error processing driver location:', error);
        // Don't add driver if there's an error to prevent crashes
      }
    }
    
    return drivers;
  }, [ride?._id, ride?.rider?._id, driverLocation, ride?.pickup]); // More specific dependencies

  const destinationLocation = useMemo(() => {
    try {
      if (ride?.drop && 
          typeof ride.drop.latitude === 'number' && 
          typeof ride.drop.longitude === 'number' && 
          !isNaN(ride.drop.latitude) && 
          !isNaN(ride.drop.longitude)) {
        return {
          latitude: ride.drop.latitude,
          longitude: ride.drop.longitude
        };
      }
      return null;
    } catch (error) {
      console.error('Error processing destination location:', error);
      return null;
    }
  }, [ride?._id, ride?.drop?.latitude, ride?.drop?.longitude]); // More specific dependencies

  // Get user-friendly status message
  const getStatusMessage = (status: RideStatus) => {
    switch (status) {
      case RideStatus.SEARCHING:
        return 'Searching for nearby ambulance drivers...';
      case RideStatus.START:
        return 'Ambulance is on the way to pick you up';
      case RideStatus.ARRIVED:
        return 'Ambulance has arrived at your location';
      case RideStatus.COMPLETED:
        return 'Ride completed successfully';
      default:
        return 'Processing your emergency request...';
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshRideData();
    setIsRefreshing(false);
  };

  // Initialize user location once on mount
  useEffect(() => {
    const initializeLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to track your ride.');
        setLocationLoading(false);
        return;
      }

      try {
        // Get user's current location
        const location = await Location.getCurrentPositionAsync({});
        const region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setUserLocation(region);
      } catch (err) {
        console.error('Location error:', err);
        Alert.alert('Location error', 'Could not get your current location.');
      } finally {
        setLocationLoading(false);
      }
    };

    initializeLocation();
  }, []); // Only run once on mount

  // Separate effect to update route when ride data is available
  useEffect(() => {
    const updateRoute = async () => {
      // Validate all required data before proceeding
      if (!ride || !ride.drop || !userLocation || locationLoading) {
        console.log('Route update skipped: missing required data', {
          hasRide: !!ride,
          hasDropLocation: !!ride?.drop,
          hasUserLocation: !!userLocation,
          locationLoading
        });
        return;
      }

      // Validate coordinates
      if (typeof ride.drop.latitude !== 'number' || 
          typeof ride.drop.longitude !== 'number' ||
          typeof userLocation.latitude !== 'number' || 
          typeof userLocation.longitude !== 'number' ||
          isNaN(ride.drop.latitude) || 
          isNaN(ride.drop.longitude) ||
          isNaN(userLocation.latitude) || 
          isNaN(userLocation.longitude)) {
        console.error('Invalid coordinate data for route calculation');
        return;
      }

      console.log('Starting route calculation with valid data', {
        origin: { lat: userLocation.latitude, lng: userLocation.longitude },
        destination: { lat: ride.drop.latitude, lng: ride.drop.longitude }
      });

      try {
        const origin = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        };
        
        const destination = {
          latitude: ride.drop.latitude,
          longitude: ride.drop.longitude
        };
        
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
          console.warn('Google Maps API key not configured, using straight line route');
          const coords = [origin, destination];
          setRouteCoords(coords);
          return;
        }
        
        const directionsUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        
        const requestBody = {
          origin: {
            location: {
              latLng: {
                latitude: origin.latitude,
                longitude: origin.longitude
              }
            }
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.latitude,
                longitude: destination.longitude
              }
            }
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          polylineQuality: 'HIGH_QUALITY',
          polylineEncoding: 'ENCODED_POLYLINE'
        };
        
        console.log('Fetching patient tracking route from new Routes API:', directionsUrl);
        
        const response = await fetch(directionsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error(`Routes API HTTP error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('Patient tracking Routes API response:', data);
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          if (route.polyline && route.polyline.encodedPolyline) {
            console.log('Decoding patient tracking polyline with', route.polyline.encodedPolyline.length, 'characters');
            const points = decodePolyline(route.polyline.encodedPolyline);
            console.log('Decoded', points.length, 'patient tracking route points');
            setRouteCoords(points);
          } else {
            console.warn('No polyline in patient tracking route, using fallback');
            const coords = [origin, destination];
            setRouteCoords(coords);
          }
        } else {
          console.error('Patient tracking Routes API error:', data.error || 'No routes found');
          // Fallback to simple straight line route
          const coords = [origin, destination];
          setRouteCoords(coords);
        }
      } catch (err) {
        console.error('Route error:', err);
        // Fallback to simple straight line route
        if (ride?.drop && userLocation) {
          try {
            const coords = [
              { latitude: userLocation.latitude, longitude: userLocation.longitude },
              { latitude: ride.drop.latitude, longitude: ride.drop.longitude }
            ];
            setRouteCoords(coords);
          } catch (fallbackError) {
            console.error('Fallback route error:', fallbackError);
            setRouteCoords([]); // Clear route coords on complete failure
          }
        }
      }
    };

    // Add a small delay to prevent rapid successive calls during location loading
    const timeoutId = setTimeout(() => {
      updateRoute();
    }, 100); // 100ms delay

    return () => clearTimeout(timeoutId);
  }, [ride?._id, ride?.drop?.latitude, ride?.drop?.longitude, userLocation?.latitude, userLocation?.longitude, locationLoading]); // Include locationLoading in dependencies

  // Show loading state if we're loading location or ride data
  if (locationLoading || rideLoading) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <ActivityIndicator size="large" color={colors.emergency[600]} />
        <Text style={[styles.mt3, styles.textBase, styles.textGray600]}>
          {locationLoading ? 'Getting your location...' : 'Loading ride details...'}
        </Text>
        {rideLoading && (
          <Text style={[styles.mt1, styles.textSm, styles.textGray500]}>
            Connecting to emergency services...
          </Text>
        )}
      </View>
    );
  }

  // Show message if no userLocation or ride data yet
  if (!userLocation || !ride) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <Ionicons name="location-outline" size={48} color={colors.gray[400]} />
        <Text style={[styles.mt3, styles.textLg, styles.fontBold, styles.textGray700]}>
          Setting up tracking...
        </Text>
        <Text style={[styles.mt1, styles.textBase, styles.textGray600, styles.textCenter, styles.mx4]}>
          {!userLocation ? 'Waiting for location access' : 'Initializing emergency services'}
        </Text>
      </View>
    );
  }

  // Show error if there's an issue with fetching ride data
  if (rideError) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger[500]} />
        <Text style={[styles.mt3, styles.textLg, styles.fontBold, styles.textDanger700]}>
          Error Loading Ride
        </Text>
        <Text style={[styles.mt1, styles.textBase, styles.textGray600, styles.textCenter, styles.mx4]}>
          {rideError}
        </Text>
        <TouchableOpacity
          style={[styles.mt4, styles.bgPrimary600, styles.roundedLg, styles.py2, styles.px4]}
          onPress={handleRefresh}
        >
          <Text style={[styles.textBase, styles.textWhite, styles.fontBold]}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!destinationLocation) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <Text style={[styles.textBase, styles.textDanger600]}>
          Destination information not available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex1, { paddingTop: insets.top }]}>
      {/* Status Header */}
      <View style={[
        styles.bgEmergency500, 
        styles.py3, 
        styles.px4, 
        styles.shadowSm,
        { backgroundColor: rideStatus === RideStatus.SEARCHING ? colors.warning[400] : 
                           rideStatus === RideStatus.COMPLETED ? colors.medical[500] : 
                           colors.emergency[500] }
      ]}>
        <View style={[styles.flexRow, styles.alignCenter, styles.justifyCenter]}>
          <Ionicons 
            name={rideStatus === RideStatus.SEARCHING ? "search" : 
                  rideStatus === RideStatus.ARRIVED ? "checkmark-circle" :
                  rideStatus === RideStatus.COMPLETED ? "checkmark-done-circle" : "car"} 
            size={20} 
            color="white" 
            style={[styles.mr2]} 
          />
          <Text style={[styles.textWhite, styles.textBase, styles.fontBold]}>
            {getStatusMessage(rideStatus)}
          </Text>
        </View>
      </View>

      <PatientRideMap
        userLocation={userLocation}
        destinationLocation={destinationLocation}
        availableDrivers={availableDrivers}
        routeCoords={routeCoords}
        acceptedRide={ride}
      />

      <TripSummary 
        status={rideStatus}
        distance={typeof ride.distance === 'number' && !isNaN(ride.distance) ? ride.distance : 0}
        // Calculate duration based on distance if not available
        duration={typeof ride.distance === 'number' && !isNaN(ride.distance) ? Math.round(ride.distance / 0.6) : 0} // ~36km/h average ambulance speed in traffic
        ambulanceType={ride.vehicle || 'bls'} 
        otp={ride.otp || ''}
        vehicleDetails={ride.rider && ride.rider.vehicle ? `${ride.rider.vehicle.model || 'Unknown Model'} (${ride.rider.vehicle.plateNumber || 'Unknown Plate'})` : undefined}
        driverName={ride.rider?.name || undefined}
        emergencyType={getFirstParam(params.emergencyType)}
        emergencyName={getFirstParam(params.emergencyName)}
        priority={getFirstParam(params.priority)}
      />
    </View>
  );
}
