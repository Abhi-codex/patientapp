import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Hospital, AmbulanceType } from '../types/patient';
import { getServerUrl } from '../utils/network';
import { getEmergencyById } from '../utils/emergencyUtils';

export interface RideBookingState {
  booking: boolean;
  bookRide: (
    hospital: Hospital, 
    ambulanceType: AmbulanceType, 
    pickupLocation: { latitude: number; longitude: number },
    emergencyContext?: {
      emergencyType?: string;
      emergencyName?: string;
      priority?: string;
    }
  ) => Promise<void>;
}

export function useRideBooking(): RideBookingState {
  const router = useRouter();
  const [booking, setBooking] = useState(false);
  const BACKEND_URL = `${getServerUrl()}/ride/create`;

  const bookRide = async (
    hospital: Hospital,
    ambulanceType: AmbulanceType,
    pickupLocation: { latitude: number; longitude: number },
    emergencyContext?: {
      emergencyType?: string;
      emergencyName?: string;
      priority?: string;
    }
  ) => {
    if (!hospital || !pickupLocation) {
      Alert.alert('Error', 'Please select a hospital and ensure location is available.');
      return;
    }

    setBooking(true);

    // Validate data before sending
    if (!pickupLocation.latitude || !pickupLocation.longitude) {
      Alert.alert('Error', 'Invalid pickup location coordinates.');
      setBooking(false);
      return;
    }
    
    if (!hospital.latitude || !hospital.longitude) {
      Alert.alert('Error', 'Invalid hospital location coordinates.');
      setBooking(false);
      return;
    }
    
    if (!['bls', 'als', 'ccs', 'auto', 'bike'].includes(ambulanceType)) {
      Alert.alert('Error', `Invalid ambulance type: ${ambulanceType}`);
      setBooking(false);
      return;
    }

    // Convert emergency ID to category for backend if emergency context is provided
    let emergencyForBackend = undefined;
    if (emergencyContext?.emergencyType) {
      const emergency = getEmergencyById(emergencyContext.emergencyType);
      emergencyForBackend = emergency ? {
        type: emergency.category, // Send category instead of ID
        name: emergencyContext.emergencyName,
        priority: emergencyContext.priority,
      } : {
        type: emergencyContext.emergencyType, // Fallback to original if not found
        name: emergencyContext.emergencyName,
        priority: emergencyContext.priority,
      };
      
      console.log(`Converting emergency ID "${emergencyContext.emergencyType}" to category "${emergency?.category}" for backend`);
    }

    const rideData = {
      vehicle: ambulanceType,
      pickup: {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        address: 'Current Location',
      },
      drop: {
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        address: hospital.name,
      },
      emergency: emergencyForBackend,
    };

    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/');
        return;
      }

      console.log('Booking ride with data:', JSON.stringify(rideData, null, 2));
      console.log('Backend URL:', BACKEND_URL);
      console.log('Token available:', !!token);
      
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(rideData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        Alert.alert(
          'Ambulance Booked Successfully', 
          `${hospital.name}\n\nKeep your phone accessible - the driver will contact you soon.`,
          [{
            text: 'Start Tracking',
            onPress: () => {
              router.push({
                pathname: "/patient/tracking",
                params: {
                  rideId: data.ride._id,
                  hospitalName: data.ride.drop.address,
                  rideType: ambulanceType,
                  destination: data.ride.drop.address,
                  hospitalAddress: hospital.address || hospital.name,
                  fare: data.ride.fare.toString(),
                  otp: data.ride.otp,
                  latitude: data.ride.drop.latitude.toString(),
                  longitude: data.ride.drop.longitude.toString(),
                  emergencyType: emergencyContext?.emergencyType || '',
                  emergencyName: emergencyContext?.emergencyName || '',
                  priority: emergencyContext?.priority || '',
                  specialties: hospital.specialties ? hospital.specialties.join(', ') : '',
                },
              });
            }
          }]
        )} 
        else {
      console.log('Booking failed with status:', response.status);
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      // Log specific error details for debugging
      if (response.status === 400) {
        console.log('400 Bad Request - Possible issues:');
        console.log('- Invalid data format');
        console.log('- Missing required fields');
        console.log('- Invalid ambulance type:', ambulanceType);
        console.log('- Invalid coordinates:', pickupLocation, hospital);
        
        if (data.errors) {
          console.log('Validation errors:', data.errors);
        }
        if (data.details) {
          console.log('Error details:', data.details);
        }
      }
      
      Alert.alert('Booking Failed', data.message || `Server responded with status ${response.status}. Please try again.`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        Alert.alert(
          'Connection Error', 
          'Cannot connect to server. Make sure:\n• Backend server is running\n• Using correct IP address\n• No firewall blocking connection'
        );
      } else {
        Alert.alert('Error', `Failed to book ambulance: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setBooking(false);
    }
  };

  return { booking, bookRide };
}
