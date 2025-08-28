import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Linking, Platform } from 'react-native';
import { useRideTracking } from '.';
import { RideStatus } from '../types/rider';
import { SERVER_URL } from '../utils/network';
import { getEmergencyById } from '../utils/emergencyUtils';

function decodePolyline(t: string) {
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
}

export function useTrackingLogic(rideId: string | undefined) {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<any | null>(null);
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
  } = useRideTracking(rideId || '');

  const NO_DRIVER_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
  const [noDriverTimerActive, setNoDriverTimerActive] = useState(false);
  const [recreateLoading, setRecreateLoading] = useState(false);
  const [noDriverTimerStart, setNoDriverTimerStart] = useState<number | null>(null);
  const [noDriverRemainingMs, setNoDriverRemainingMs] = useState<number>(NO_DRIVER_TIMEOUT_MS);
  const [noDriverExpired, setNoDriverExpired] = useState(false);
  const [driverLocationLive, setDriverLocationLive] = useState<{ latitude: number; longitude: number } | null>(null);

  const availableDrivers = useMemo(() => {
    const drivers: any[] = [];
    if (ride?.rider && ride.rider._id) {
      try {
  // Prefer frequently-updated live driver location when available so map updates smoothly
  let driverLoc = null;
  if (driverLocationLive) driverLoc = driverLocationLive;
  else if (driverLocation) driverLoc = driverLocation;
  else if (ride.pickup) driverLoc = { latitude: ride.pickup.latitude, longitude: ride.pickup.longitude };
        if (driverLoc && typeof driverLoc.latitude === 'number' && typeof driverLoc.longitude === 'number') {
          drivers.push({ id: ride.rider._id, location: driverLoc, isAccepted: true });
        }
      } catch (err) {
        console.error('Error computing availableDrivers:', err);
      }
    }
    return drivers;
  }, [ride?._id, ride?.rider?._id, driverLocation, ride?.pickup, driverLocationLive]);

  const destinationLocation = useMemo(() => {
    try {
      if (ride?.drop && typeof ride.drop.latitude === 'number' && typeof ride.drop.longitude === 'number' && !isNaN(ride.drop.latitude) && !isNaN(ride.drop.longitude)) {
        return { latitude: ride.drop.latitude, longitude: ride.drop.longitude };
      }
      return null;
    } catch (err) {
      console.error('Error computing destinationLocation:', err);
      return null;
    }
  }, [ride?._id, ride?.drop?.latitude, ride?.drop?.longitude]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshRideData();
    setIsRefreshing(false);
  };

  // Initialize user location
  useEffect(() => {
    const initializeLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to track your ride.');
        setLocationLoading(false);
        return;
      }
      try {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      } catch (err) {
        console.error('Location error:', err);
        Alert.alert('Location error', 'Could not get your current location.');
      } finally {
        setLocationLoading(false);
      }
    };
    initializeLocation();
  }, []);

  // Back handler (Android) to replace with dashboard
  useEffect(() => {
    const onBackPress = () => {
      try { 
        // Replace to the main tab navigator so user returns to the app's tabbed dashboard.
        router.replace('/navigation/MainTabs');
        return true; 
      } catch (e) { console.error(e); return false; }
    };
    if (Platform.OS === 'android') {
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }
    return undefined;
  }, [router]);

  // No-driver timer
  useEffect(() => {
    let intervalHandle: ReturnType<typeof setInterval> | null = null;

    const computeRemainingFromCreatedAt = () => {
      try {
        if (!ride || !ride.createdAt) return NO_DRIVER_TIMEOUT_MS;
        const created = Date.parse(ride.createdAt as unknown as string);
        if (isNaN(created)) return NO_DRIVER_TIMEOUT_MS;
        const elapsed = Date.now() - created;
        return Math.max(NO_DRIVER_TIMEOUT_MS - elapsed, 0);
      } catch (err) {
        console.error('Error computing remaining from createdAt:', err);
        return NO_DRIVER_TIMEOUT_MS;
      }
    };

    const startBasedOnServerTime = () => {
      // Only start the timer when we have a ride and a valid createdAt timestamp from server
      if (!ride || !ride.createdAt) {
        setNoDriverTimerActive(false);
        setNoDriverTimerStart(null);
        setNoDriverRemainingMs(NO_DRIVER_TIMEOUT_MS);
        return;
      }

      const remaining = computeRemainingFromCreatedAt();
      if (remaining <= 0) {
        // Already expired on server-side - mark expired so UI can show a custom dialog
        setNoDriverTimerActive(false);
        setNoDriverTimerStart(null);
        setNoDriverRemainingMs(0);
        setNoDriverExpired(true);
        return;
      }

      setNoDriverTimerActive(true);
      // set start to createdAt for display/reference
      try {
        const created = Date.parse(ride.createdAt as unknown as string);
        if (!isNaN(created)) setNoDriverTimerStart(created);
        else setNoDriverTimerStart(Date.now());
      } catch (e) {
        setNoDriverTimerStart(Date.now());
      }
      setNoDriverRemainingMs(remaining);

      intervalHandle = setInterval(() => {
        const r = computeRemainingFromCreatedAt();
        setNoDriverRemainingMs(r);
        if (r <= 0) {
          // time's up - mark expired so UI can show a custom dialog
          setNoDriverTimerActive(false);
          setNoDriverTimerStart(null);
          setNoDriverRemainingMs(0);
          if (intervalHandle) { clearInterval(intervalHandle); intervalHandle = null; }
          setNoDriverExpired(true);
        }
      }, 1000);
    };

    if (rideStatus === RideStatus.SEARCHING) {
      startBasedOnServerTime();
    } else {
      if (intervalHandle) { clearInterval(intervalHandle); intervalHandle = null; }
      setNoDriverTimerActive(false); setNoDriverTimerStart(null); setNoDriverRemainingMs(NO_DRIVER_TIMEOUT_MS);
    }

    return () => { if (intervalHandle) clearInterval(intervalHandle); };
  }, [rideStatus, ride?.createdAt, ride?._id]);

  // Lightweight polling for driver's live location (update frequently without re-fetching full ride state)
  useEffect(() => {
    let pollHandle: ReturnType<typeof setInterval> | null = null;
    let isActive = true;

    const fetchDriverLocation = async () => {
      try {
        if (!ride || !ride._id || !ride.rider || !ride.rider._id) return;
        const token = await AsyncStorage.getItem('access_token');
        if (!token) return;
  const resp = await fetch(`${SERVER_URL}/ride/rides?id=${ride._id}`, { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
        if (!resp.ok) return;
        const json = await resp.json();
        if (!json || !json.rides || json.rides.length === 0) return;
        const current = json.rides[0];
        if (current && current.rider && current.pickup) {
          // The backend currently doesn't return a separate real-time driver lat/lng, use rider's last known or pickup as proxy
          const dloc = current.rider.location || current.pickup || null;
          if (dloc && typeof dloc.latitude === 'number' && typeof dloc.longitude === 'number') {
            // Only update if changed to avoid unnecessary renders
            if (!driverLocationLive || driverLocationLive.latitude !== dloc.latitude || driverLocationLive.longitude !== dloc.longitude) {
              setDriverLocationLive({ latitude: dloc.latitude, longitude: dloc.longitude });
            }
          }
        }
      } catch (err) {
        // Don't spam console on intermittent errors
      }
    };

    // Start polling only when there is an assigned rider and ride is active
    if (ride && ride._id && ride.rider && ride.rider._id && (rideStatus === RideStatus.START || rideStatus === RideStatus.ARRIVED || rideStatus === RideStatus.SEARCHING)) {
      // fetch immediately then start interval
      fetchDriverLocation();
      pollHandle = setInterval(() => { if (isActive) fetchDriverLocation(); }, 3000);
    }

    return () => { isActive = false; if (pollHandle) clearInterval(pollHandle); };
  }, [ride?._id, ride?.rider?._id, rideStatus]);

  // Recreate last ride
  const recreateLastRide = async () => {
    setRecreateLoading(true);
    try {
      const last = await AsyncStorage.getItem('last_ride');
      if (!last) { Alert.alert('No previous ride', 'No previous ride found to recreate.'); setRecreateLoading(false); return; }
      const parsed = JSON.parse(last);
      if (!parsed) { Alert.alert('Invalid saved ride', 'Saved ride data is invalid.'); setRecreateLoading(false); return; }
      const token = await AsyncStorage.getItem('access_token');
      if (!token) { Alert.alert('Authentication required', 'Please log in again.'); router.replace('/'); return; }
      let pickupLat: number | undefined; let pickupLng: number | undefined;
      if (parsed.pickup && parsed.pickup.latitude && parsed.pickup.longitude) { pickupLat = Number(parsed.pickup.latitude); pickupLng = Number(parsed.pickup.longitude); }
      if (!pickupLat || !pickupLng) {
        try { const loc = await Location.getCurrentPositionAsync({}); pickupLat = loc.coords.latitude; pickupLng = loc.coords.longitude; } catch (e) { console.error('Could not get device loc for recreate', e); }
      }
      const dropLat = parsed.latitude ? Number(parsed.latitude) : (parsed.params && parsed.params.latitude ? Number(parsed.params.latitude) : undefined);
      const dropLng = parsed.longitude ? Number(parsed.longitude) : (parsed.params && parsed.params.longitude ? Number(parsed.params.longitude) : undefined);
      // Prefer backend-friendly emergency type if stored at booking time
      let emergencyForBackend = undefined;
      if (parsed.emergencyBackendType) {
        emergencyForBackend = { type: parsed.emergencyBackendType, name: parsed.emergencyName, priority: parsed.priority };
        console.log('Recreate: using stored emergencyBackendType', parsed.emergencyBackendType);
      } else if (parsed.emergencyType) {
        // Convert saved emergency ID (if present) to backend-expected category using getEmergencyById
        const em = getEmergencyById(parsed.emergencyType);
        emergencyForBackend = em ? { type: em.category, name: parsed.emergencyName, priority: parsed.priority } : { type: parsed.emergencyType, name: parsed.emergencyName, priority: parsed.priority };
        console.log('Recreate: mapped emergency', parsed.emergencyType, '->', emergencyForBackend.type);
      }

      const payload: any = {
        vehicle: parsed.ambulanceType || parsed.params?.rideType || 'bls',
        pickup: { latitude: pickupLat, longitude: pickupLng, address: parsed.hospitalName || parsed.params?.hospitalAddress || 'Current Location' },
        drop: { latitude: dropLat, longitude: dropLng, address: parsed.hospitalName || parsed.params?.destination || parsed.params?.hospitalAddress || '' },
        emergency: emergencyForBackend
      };

      console.log('Recreate payload:', JSON.stringify(payload));
      if (!payload.pickup.latitude || !payload.pickup.longitude || !payload.drop.latitude || !payload.drop.longitude) { Alert.alert('Recreate failed', 'Ride coordinates are missing. Please try booking again or contact support.'); setRecreateLoading(false); return; }
  const response = await fetch(`${SERVER_URL}/ride/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error('Recreate ride - non-JSON response body:', text);
        console.error('Response status:', response.status, response.statusText);
        Alert.alert('Server error', `Unexpected server response (${response.status}). Please try again.`);
        setRecreateLoading(false);
        return;
      }

      if (response.ok && data?.ride) {
        const newLast = { rideId: data.ride._id, params: { rideId: data.ride._id } };
        await AsyncStorage.setItem('last_ride', JSON.stringify(newLast));
        router.replace({ pathname: '/screens/Tracking', params: { rideId: data.ride._id } });
        return;
      }
      console.error('Recreate failed, status:', response.status, 'body:', data);
      Alert.alert('Recreate failed', data?.message || `Server responded with status ${response.status}.`);
    } catch (err) { console.error('Recreate error:', err); Alert.alert('Error', 'Failed to recreate ride.'); }
    finally { setRecreateLoading(false); }
  };

  // Clear last_ride when ride completes or cancelled
  useEffect(() => {
    try { if (!ride) return; const status = ride.status as any; if (status === RideStatus.COMPLETED || (typeof status === 'string' && status.toLowerCase().includes('cancel'))) { AsyncStorage.removeItem('last_ride').catch(e => console.error('Failed to clear last_ride', e)); } } catch (err) { console.error(err); }
  }, [ride?.status]);

  // Update route coords when we have userLocation and ride.drop
  useEffect(() => {
    const updateRoute = async () => {
      if (!ride || !ride.drop || !userLocation || locationLoading) return;
      if (typeof ride.drop.latitude !== 'number' || typeof ride.drop.longitude !== 'number' || typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') { return; }
      try {
        const origin = { latitude: userLocation.latitude, longitude: userLocation.longitude };
        const destination = { latitude: ride.drop.latitude, longitude: ride.drop.longitude };
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) { setRouteCoords([origin, destination]); return; }
        const directionsUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        const requestBody = { origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } }, destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } }, travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE', polylineQuality: 'HIGH_QUALITY', polylineEncoding: 'ENCODED_POLYLINE' };
        const response = await fetch(directionsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline' }, body: JSON.stringify(requestBody) });
        if (!response.ok) throw new Error(`Routes API HTTP error: ${response.status}`);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          if (route.polyline && route.polyline.encodedPolyline) {
            const points = decodePolyline(route.polyline.encodedPolyline);
            setRouteCoords(points);
          } else setRouteCoords([origin, destination]);
        } else setRouteCoords([origin, destination]);
      } catch (err) {
        console.error('Route error:', err);
        if (ride?.drop && userLocation) setRouteCoords([{ latitude: userLocation.latitude, longitude: userLocation.longitude }, { latitude: ride.drop.latitude, longitude: ride.drop.longitude }]);
      }
    };
    const timeoutId = setTimeout(() => { updateRoute(); }, 100);
    return () => clearTimeout(timeoutId);
  }, [ride?._id, ride?.drop?.latitude, ride?.drop?.longitude, userLocation?.latitude, userLocation?.longitude, locationLoading]);

  return {
    userLocation,
    routeCoords,
    isRefreshing,
    locationLoading,
    ride,
    rideLoading,
    rideError,
    rideStatus,
    driverLocation,
    handleRefresh,
  noDriverTimerActive,
  noDriverRemainingMs,
  noDriverExpired,
  recreateLoading,
    recreateLastRide,
    availableDrivers,
    destinationLocation,
    driverLocationLive,
  };
}

export default useTrackingLogic;
