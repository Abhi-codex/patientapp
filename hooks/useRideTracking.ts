import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Ride, RideStatus } from '../types/rider';
import { getServerUrl } from '../utils/network';

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

    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Fetch current ride details
      const response = await fetch(`${getServerUrl()}/ride/rides?id=${rideId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch ride details: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (data && data.rides && data.rides.length > 0) {
        const currentRide = data.rides[0];
        
        // Validate ride data structure before setting state
        if (currentRide && currentRide._id) {
          setRide(currentRide);
          
          // Safely set ride status with validation
          if (Object.values(RideStatus).includes(currentRide.status)) {
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
              // In a real implementation, this would be a separate API call to get real-time driver location
              if (currentRide.pickup && 
                  typeof currentRide.pickup.latitude === 'number' && 
                  typeof currentRide.pickup.longitude === 'number') {
                setDriverLocation({
                  latitude: currentRide.pickup.latitude,
                  longitude: currentRide.pickup.longitude,
                });
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
      setLoading(false);
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

  return {
    ride,
    loading,
    error,
    rideStatus,
    driverLocation,
    refreshRideData: fetchRideDetails
  };
}
