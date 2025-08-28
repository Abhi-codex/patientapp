import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Ride, RideStatus } from '../types/rider';
import { SERVER_URL } from '../utils/network';

interface TrackingState {
  ride: Ride | null;
  loading: boolean;
  error: string | null;
  rideStatus: RideStatus;
  driverLocation: { latitude: number; longitude: number } | null;
  refreshRideData: () => Promise<void>;
}

export function useRideTracking(rideId: string): TrackingState {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rideStatus, setRideStatus] = useState<RideStatus>(RideStatus.SEARCHING);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchRideDetails = async () => {
    if (!rideId) {
      setError('No ride ID provided');
      setLoading(false);
      return;
    }

    let didSetLoading = false;
    try {
      // Only show the global loading state for the initial fetch (avoid UI flashing on poll)
      if (!ride) { setLoading(true); didSetLoading = true; }
      setError(null);
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Fetch current ride details
  const response = await fetch(`${SERVER_URL}/ride/rides?id=${rideId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Handle unauthorized specially so callers can re-auth if needed
        if (response.status === 401) {
          setError('Authentication token invalid or expired');
        }
        throw new Error(`Failed to fetch ride details: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (data && data.rides && data.rides.length > 0) {
        const currentRide = data.rides[0];
        
        // Validate ride data structure before setting state
        if (currentRide && currentRide._id) {
            // Only update ride state if important fields changed to avoid full-screen refreshes
            const hasRideChanged = (a: any | null, b: any | null) => {
              if (!b) return true; // no existing ride
              try {
                if (a.status !== b.status) return true;
                if (a.createdAt !== b.createdAt) return true;
                const aRiderId = a.rider?._id;
                const bRiderId = b.rider?._id;
                if (aRiderId !== bRiderId) return true;
                const aDriverLat = a.rider?.location?.latitude ?? a.pickup?.latitude;
                const aDriverLng = a.rider?.location?.longitude ?? a.pickup?.longitude;
                const bDriverLat = b.rider?.location?.latitude ?? b.pickup?.latitude;
                const bDriverLng = b.rider?.location?.longitude ?? b.pickup?.longitude;
                if (aDriverLat !== bDriverLat || aDriverLng !== bDriverLng) return true;
                // Compare drop/pickup coordinates
                if ((a.drop?.latitude !== b.drop?.latitude) || (a.drop?.longitude !== b.drop?.longitude)) return true;
                return false;
              } catch (e) {
                return true;
              }
            };

            if (hasRideChanged(currentRide, ride)) setRide(currentRide);
          
          // Safely set ride status with validation
          if (Object.values(RideStatus).includes(currentRide.status)) {
            // If status changed from SEARCHING to START and a rider is assigned, notify user
            // If status transitions SEARCHING -> START, UI will handle user-visible changes. Notifications disabled for now.
            setRideStatus(currentRide.status);
          } else {
            console.warn('Invalid ride status received:', currentRide.status);
            setRideStatus(RideStatus.SEARCHING); // Default fallback
          }
          
          // If ride has been accepted, get driver's current location
          if (currentRide.rider && 
              currentRide.rider._id &&
              (currentRide.status === RideStatus.START || 
               currentRide.status === RideStatus.ARRIVED)) {
            try {
              // For now, we'll use the pickup location as driver location
              // Prefer explicit rider.location if backend provides it; fallback to pickup
              const candidate = currentRide.rider.location ?? currentRide.pickup ?? null;
              if (candidate && typeof candidate.latitude === 'number' && typeof candidate.longitude === 'number') {
                const newLoc = { latitude: candidate.latitude, longitude: candidate.longitude };
                if (!driverLocation || driverLocation.latitude !== newLoc.latitude || driverLocation.longitude !== newLoc.longitude) {
                  setDriverLocation(newLoc);
                }
              }
            } catch (locationError) {
              console.warn('Error processing driver location:', locationError);
              setDriverLocation(null);
            }
          } else {
            // Clear driver location if no driver or ride not started
            setDriverLocation(null);
          }
        } else {
          console.error('Invalid ride data structure received');
          setError('Invalid ride data received from server');
        }
      } else {
        setError('Ride not found or no rides returned from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching ride details:', err);
    } finally {
      if (didSetLoading) setLoading(false);
    }
  };

  // Initial fetch and polling setup
  useEffect(() => {
    if (!rideId) return;
    
    let intervalId: number | null = null;
    let isMounted = true;
    
    const performFetch = async () => {
      if (!isMounted) return;
      await fetchRideDetails();
    };
    
    // Initial fetch
    performFetch();
    
    // Set up polling for ride status updates only if ride is active
    const setupPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      intervalId = setInterval(async () => {
        if (!isMounted) return;
        
        // Only poll if ride is in an active state
        if (rideStatus === RideStatus.SEARCHING || 
            rideStatus === RideStatus.START || 
            rideStatus === RideStatus.ARRIVED) {
          await performFetch();
        }
      }, 15000); // Poll every 15 seconds
    };
    
    setupPolling();
    
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [rideId, rideStatus]); // Depend on both rideId and rideStatus

  // Separate effect to stop polling when ride is completed
  useEffect(() => {
    if (rideStatus === RideStatus.COMPLETED) {
      // Stop any active polling when ride is done
      console.log('Ride completed, stopping tracking updates');
    }
  }, [rideStatus]);

  // Push registration removed for now.

  return {
    ride,
    loading,
    error,
    rideStatus,
    driverLocation,
    refreshRideData: fetchRideDetails
  };
}
