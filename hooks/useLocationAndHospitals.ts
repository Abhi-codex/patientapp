import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Hospital } from '../types/patient';
import { getEmergencyById } from '../utils/emergencyUtils';
import { getServerUrl } from '../utils/network';

interface LocationRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface LocationState {
  currentLocation: LocationRegion | null;
  originalLocation: LocationRegion | null;
  hospitals: Hospital[];
  loading: boolean;
  fetchHospitalsByEmergency: (emergencyType?: string) => Promise<void>;
}

export function useLocationAndHospitals(): LocationState {
  const [currentLocation, setCurrentLocation] = useState<LocationRegion | null>(null);
  const [originalLocation, setOriginalLocation] = useState<LocationRegion | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchTimeRef = useRef<number>(0);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required.');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        const region = {
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setCurrentLocation(region);
        setOriginalLocation(region);
        
        // Fetch hospitals with error handling
        try {
          await fetchHospitals(latitude, longitude);
        } catch (hospitalError) {
          console.error('Error fetching hospitals:', hospitalError);
          // Don't show alert for hospital fetch errors, just log them
          // The app can still function without hospitals
        }
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Unable to get current location.');
      } finally {
        setLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const fetchHospitals = async (lat: number, lon: number, emergencyType?: string) => {
    console.log('fetchHospitals called with:');
    console.log('- Coordinates:', lat, lon);
    console.log('- Emergency type:', emergencyType);
    
    const radius = 10000; // 10km radius
    
    try {
      // First try to use backend hospital search endpoint
      const baseUrl = getServerUrl();
      let url = `${baseUrl}/hospitals/search?lat=${lat}&lng=${lon}&radius=${radius}`;
      
      // Add emergency filter if provided
      if (emergencyType) {
        const encodedEmergency = encodeURIComponent(emergencyType);
        url += `&emergency=${encodedEmergency}`;
        console.log('Emergency filter applied to URL:', emergencyType);
        console.log('Encoded emergency parameter:', encodedEmergency);
      } else {
        console.log('No emergency filter - fetching all hospitals');
      }

      console.log('Final backend URL:', url);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      console.log('Making fetch request to URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('Backend response status:', response.status);
      console.log('Response URL:', response.url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend response data:', data);
        console.log('Backend response status:', data.message);
        console.log('Backend returned count:', data.count);
        console.log('Backend returned totalFound:', data.totalFound);
        
        if (data.hospitals && Array.isArray(data.hospitals)) {
          console.log('Backend returned emergency:', data.emergency);
          console.log('Backend returned hospitals count:', data.hospitals.length);
          
          if (data.hospitals.length === 0) {
            console.warn('Backend returned empty hospital array!');
            console.log('Search criteria:', data.searchCriteria);
            console.log('Total found before filtering:', data.totalFound);
            // Don't fall back immediately, set empty array and let user know
            setHospitals([]);
            return;
          }
          
          const fetchedHospitals = data.hospitals.map((hospital: any) => {
            // Handle the new API response format
            const hospitalLat = hospital.latitude;
            const hospitalLng = hospital.longitude;
            
            if (!hospitalLat || !hospitalLng) {
              console.warn('Hospital missing coordinates:', hospital);
              return null;
            }
            
            const processedHospital = {
              id: hospital.placeId || hospital._id || hospital.id,
              name: hospital.name,
              latitude: hospitalLat,
              longitude: hospitalLng,
              distance: hospital.distance || getDistance(lat, lon, hospitalLat, hospitalLng),
              rating: hospital.rating,
              emergencyServices: hospital.emergencyServices || [],
              // Enhanced emergency capability fields from new API
              emergencyCapabilityScore: hospital.emergencyCapabilityScore,
              emergencyFeatures: hospital.emergencyFeatures || [],
              isEmergencyVerified: hospital.isEmergencyVerified || false,
              recommendation: hospital.recommendation,
              address: hospital.address,
              isOpen: hospital.isOpen,
              priceLevel: hospital.priceLevel,
              placeId: hospital.placeId,
              photos: hospital.photos || [],
            };
            
            console.log(`Hospital: ${processedHospital.name}, Score: ${processedHospital.emergencyCapabilityScore}, Services:`, processedHospital.emergencyServices);
            return processedHospital;
          }).filter(Boolean); // Remove null entries
          
          console.log('Successfully processed', fetchedHospitals.length, 'hospitals from backend');
          setHospitals(fetchedHospitals);
          return;
        } else {
          console.log('Backend returned no hospitals array, falling back to Google Places');
        }
      } else {
        const errorText = await response.text();
        console.log('Backend response not ok, status:', response.status);
        console.log('Backend error response:', errorText);
      }
      
      // Fallback to Google Places API if backend is not available
      console.log('Backend not available, falling back to Google Places API');
      await fetchHospitalsFromGooglePlaces(lat, lon);
      
    } catch (err) {
      console.error('Backend hospital fetch failed:', err);
      console.log('Trying Google Places API as fallback');
      await fetchHospitalsFromGooglePlaces(lat, lon);
    }
  };

  const fetchHospitalsFromGooglePlaces = async (lat: number, lon: number) => {
    console.log('Fetching hospitals from Google Places API');
    const radius = 10000; // 10km radius
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured, using mock hospitals');
      // Provide some mock hospitals so the app doesn't crash
      setHospitals([
        {
          id: 'mock-1',
          name: 'City General Hospital',
          latitude: lat + 0.01,
          longitude: lon + 0.01,
          distance: 1.2,
          rating: 4.2,
          photoUrl: 'https://via.placeholder.com/80x80?text=H',
          emergencyServices: ['emergency_room'],
        },
        {
          id: 'mock-2',
          name: 'Metropolitan Medical Center',
          latitude: lat - 0.01,
          longitude: lon - 0.01,
          distance: 2.5,
          rating: 4.5,
          photoUrl: 'https://via.placeholder.com/80x80?text=H',
          emergencyServices: ['emergency_room', 'trauma_center'],
        }
      ]);
      return;
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=hospital&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Google Places API error:', data.status, data.error_message);
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const fetchedHospitals = data.results.slice(0, 20).map((place: any) => {
        if (!place.geometry?.location?.lat || !place.geometry?.location?.lng) {
          console.warn('Hospital missing coordinates in Google Places data:', place);
          return null;
        }
        
        const distance = getDistance(lat, lon, place.geometry.location.lat, place.geometry.location.lng);
        const photoRef = place.photos?.[0]?.photo_reference;
        return {
          id: place.place_id,
          name: place.name,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
          rating: place.rating,
          photoUrl: photoRef
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`
            : 'https://via.placeholder.com/80x80?text=H',
          emergencyServices: ['emergency_room'], // Default for Google Places
        };
      }).filter(Boolean); // Remove null entries

      console.log('Successfully processed', fetchedHospitals.length, 'hospitals from Google Places');
      setHospitals(fetchedHospitals);
    } catch (err) {
      console.error('Failed to fetch hospital data from Google Places:', err);
      // Don't show alert, just provide mock data
      setHospitals([
        {
          id: 'fallback-1',
          name: 'Emergency Hospital',
          latitude: lat + 0.005,
          longitude: lon + 0.005,
          distance: 0.8,
          rating: 4.0,
          photoUrl: 'https://via.placeholder.com/80x80?text=H',
          emergencyServices: ['emergency_room'],
        }
      ]);
    }
  };

  const fetchHospitalsByEmergency = useCallback(async (emergencyType?: string) => {
    console.log('fetchHospitalsByEmergency called with emergencyType:', emergencyType);

    
    if (!currentLocation) {
      console.log('No current location, skipping hospital fetch');
      return;
    }
    
    // Rate limiting: prevent calls within 2 seconds
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 2000) {
      console.log('Rate limiting: skipping hospital fetch');
      return;
    }
    lastFetchTimeRef.current = now;
    
    // Convert emergency ID to category for backend
    let emergencyCategory = emergencyType;
    console.log('Initial emergency category:', emergencyCategory);
    
    if (emergencyType) {
      console.log('Converting emergency ID to category...');
      console.log('Testing getEmergencyById function...');
      
      // Test the function directly first
      try {
        const testEmergency = getEmergencyById('heart_attack');
        console.log('Test call getEmergencyById("heart_attack"):', testEmergency);
      } catch (error) {
        console.error('Error testing getEmergencyById:', error);
      }
      
      const emergency = getEmergencyById(emergencyType);
      console.log('Emergency object found:', emergency);
      
      if (emergency) {
        emergencyCategory = emergency.category;
        console.log(`Converting emergency ID "${emergencyType}" to category "${emergencyCategory}"`);
        console.log(`Backend will receive emergency filter: "${emergencyCategory}"`);
      } else {
        console.log('No emergency object found for ID:', emergencyType);
      }
    } else {
      console.log('No emergencyType provided, fetching all hospitals');
    }
    
    console.log(`Final emergency category to pass: "${emergencyCategory}"`);
    console.log(`Calling fetchHospitals with coordinates:`, currentLocation.latitude, currentLocation.longitude);
    await fetchHospitals(currentLocation.latitude, currentLocation.longitude, emergencyCategory);
  }, [currentLocation]); // Removed lastFetchTime dependency since it's now a ref

  return {
    currentLocation,
    originalLocation,
    hospitals,
    loading,
    fetchHospitalsByEmergency
  };
}
