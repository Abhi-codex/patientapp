import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbulanceTypeSelector, BookRideButton, HospitalList, PatientMap, SelectedHospital } from '../../components/patient';
import { colors, styles } from '../../constants/tailwindStyles';
import { useHospitalSelection, useLocationAndHospitals, useRideBooking } from '../../hooks';
import { AmbulanceType, Hospital } from '../../types/patient';
import { filterHospitalsByEmergency, getAvailableAmbulanceTypes, getEmergencyById, getSuggestedAmbulanceType } from '../../utils/emergencyUtils';
import { getServerUrl } from '../../utils/network';

// Helper to render the correct icon component
const renderIcon = (iconObj: { name: string; library: string }, size = 28, color = '#ef4444') => {
  if (!iconObj) return null;
  const { name, library } = iconObj;
  switch (library) {
    case 'FontAwesome5':
      return <FontAwesome5 name={name as any} size={size} color={color} />;
    case 'FontAwesome':
      return <FontAwesome name={name as any} size={size} color={color} />;
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
    case 'Ionicons':
      return <Ionicons name={name as any} size={size} color={color} />;
    default:
      return <FontAwesome5 name="question" size={size} color={color} />;
  }
};

export default function RideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const checkProfile = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/screens/PatientAuth');
        return;
      }
      try {
        const response = await fetch(`${getServerUrl()}/auth/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const user = await response.json();
          console.log('[PATIENT LOGIN] User profile:', user);
          if (user && user._id) {
            console.log(`[PATIENT LOGIN] Patient ID: ${user._id}, Name: ${user.name}, Email: ${user.email}`);
          } else {
            console.log('[PATIENT LOGIN] No user found in /auth/me response');
          }
          const isProfileComplete = user.name && user.age && user.gender && user.bloodGroup && user.emergencyContact && user.address;
          if (isProfileComplete) {
            await AsyncStorage.setItem('profile_complete', 'true');
          } else {
            await AsyncStorage.removeItem('profile_complete');
            router.replace('/screens/ProfileForm');
          }
        }
      } catch (e) {
        // ignore
      }
    };
    checkProfile();
  }, []);

  // Emergency context from previous screen
  const emergencyId = params.emergencyType as string;
  const emergencyName = params.emergencyName as string;
  const requiredAmbulanceTypes = params.requiredAmbulanceTypes ? 
    JSON.parse(params.requiredAmbulanceTypes as string) : [];
  const requiredServices = params.requiredServices ? 
    JSON.parse(params.requiredServices as string) : [];
  const priority = params.priority as string;

  // Get emergency details
  const emergency = emergencyId ? getEmergencyById(emergencyId) : null;
  
  // State for ambulance type selection - use suggested type based on emergency
  const [ambulanceType, setAmbulanceType] = useState<AmbulanceType>(
    emergencyId ? getSuggestedAmbulanceType(emergencyId) : 'bls'
  );
  
  // Use hooks for location management
  const { 
    currentLocation: initialLocation, 
    originalLocation, 
    hospitals: allHospitals, 
    loading,
    fetchHospitalsByEmergency
  } = useLocationAndHospitals();

  // Effect to fetch emergency-specific hospitals when emergency is selected
  useEffect(() => {
    if (emergencyId && originalLocation && !loading) {
      console.log('useEffect: Fetching hospitals for emergency:', emergencyId);
      console.log('useEffect: originalLocation available:', !!originalLocation);
      console.log('useEffect: loading state:', loading);
      fetchHospitalsByEmergency(emergencyId);
    } else {
      console.log('useEffect: Conditions not met for hospital fetch');
      console.log('- emergencyId:', emergencyId);
      console.log('- originalLocation:', !!originalLocation);
      console.log('- loading:', loading);
    }
  }, [emergencyId, originalLocation, loading]); // Removed fetchHospitalsByEmergency from dependencies
  
  // Filter hospitals based on emergency requirements (fallback for frontend filtering)
  const hospitals = useMemo(() => {
    console.log('Filtering hospitals. Emergency ID:', emergencyId);
    console.log('All hospitals count:', allHospitals.length);
    
    if (!emergencyId) return allHospitals;
    
    const filtered = filterHospitalsByEmergency(allHospitals, emergencyId);
    console.log('Filtered hospitals count:', filtered.length);
    console.log('Emergency requirements:', emergency?.requiredHospitalServices);
    
    // Log first few hospitals to see their services
    filtered.slice(0, 3).forEach((hospital, index) => {
      console.log(`Hospital ${index + 1}: ${hospital.name}`);
      console.log('Services:', hospital.emergencyServices);
    });
    
    return filtered;
  }, [allHospitals, emergencyId, emergency]);
  
  // Get available ambulance types for this emergency
  const availableAmbulanceTypes = useMemo(() => {
    if (!emergencyId) return ['bls', 'als', 'ccs', 'auto', 'bike'] as AmbulanceType[];
    return getAvailableAmbulanceTypes(emergencyId);
  }, [emergencyId]);
  
  // Use hooks for hospital and route management
  const { 
    selectedHospital, 
    routeCoords, 
    routeLoading, 
    selectHospital, 
    clearSelectedHospital,
    getOptimalMapRegion
  } = useHospitalSelection();
  
  // Use hook for ride booking
  const { booking, bookRide } = useRideBooking();
  
  // State to manage map region
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  
  // Update local state when initial location is available
  useEffect(() => {
    if (initialLocation && !currentLocation) {
      setCurrentLocation(initialLocation);
    }
  }, [initialLocation]);
  
  // Update map region when hospital is selected
  useEffect(() => {
    if (selectedHospital && originalLocation) {
      const optimalRegion = getOptimalMapRegion(selectedHospital, originalLocation);
      if (optimalRegion) {
        setCurrentLocation(optimalRegion);
      }
    }
  }, [selectedHospital, routeCoords, originalLocation]);

  // Handler for hospital selection
  const handleSelectHospital = async (hospital: Hospital) => {
    if (originalLocation) {
      await selectHospital(hospital, originalLocation);
    }
  };

  // Handler for booking a ride
  const handleBookRide = () => {
    if (selectedHospital && originalLocation) {
      const emergencyContext = emergency ? {
        emergencyType: emergencyId,
        emergencyName: emergencyName,
        priority: priority
      } : undefined;
      
      console.log('Booking ride with:');
      console.log('- Hospital:', selectedHospital.name);
      console.log('- Ambulance type:', ambulanceType);
      console.log('- Original location:', originalLocation);
      console.log('- Emergency context:', JSON.stringify(emergencyContext, null, 2));
      
      bookRide(selectedHospital, ambulanceType, originalLocation, emergencyContext);
    } else {
      console.log('Cannot book ride:');
      console.log('- Selected hospital:', !!selectedHospital);
      console.log('- Original location:', !!originalLocation);
    }
  };

  // Handler for changing the selected hospital
  const handleChangeHospital = () => {
    clearSelectedHospital(originalLocation);
    // Reset map to original location when deselecting hospital
    if (originalLocation) {
      setCurrentLocation(originalLocation);
    }
  };

  if (loading) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={[styles.mt4, styles.textBase, styles.textGray600]}>
          Getting your location...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex1, { paddingTop: insets.top }]}>
      {/* Emergency Header */}
      {emergency && (
        <View style={[ styles.px3, styles.py2, styles.bgGray100, styles.shadowSm, styles.borderB,
          { borderBottomColor: colors.gray[200] }]}>          
          <View style={[styles.flexRow, styles.alignCenter, styles.mt1]}>
            <View style={[styles.mr2]}>
              {renderIcon(emergency.icon, 25, colors.emergency[600])}
            </View>
            <View style={[styles.flex1]}>
              <View style={[styles.alignCenter, styles.justifyBetween, styles.flexRow]}>
                <Text style={[styles.textLg, styles.fontSemibold, styles.textGray800]}>
                  {emergencyName}
                </Text>
                <TouchableOpacity onPress={() => router.back()} 
                  style={[styles.flexRow, styles.py1, styles.px2, styles.rounded2xl, styles.bgDanger200, styles.alignCenter]}>
                  <Ionicons name="arrow-back" size={15} color={colors.gray[600]} />
                  <Text style={[styles.ml2, styles.textXs, styles.textGray600]}>
                    Change
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.textXs, styles.textGray600]}>
                {emergency.description}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.flex1]}>
        <PatientMap
          currentLocation={currentLocation}
          hospitals={hospitals}
          selectedHospital={selectedHospital}
          routeCoords={routeCoords}
          onHospitalSelect={handleSelectHospital}
        />
      </View>


      <View style={[styles.bgGray100, styles.borderT, styles.borderGray200, styles.px3, styles.pt4, styles.pb4,
        { height: !selectedHospital 
            ? Dimensions.get('window').height * 0.60
            : Dimensions.get('window').height * 0.63
        }
      ]}>
        {!selectedHospital ? (
          <HospitalList
            hospitals={hospitals}
            onSelectHospital={handleSelectHospital}
            selectedHospital={selectedHospital}
            isLoading={hospitals.length === 0 && !loading}
            emergencyContext={emergency ? {
              name: emergencyName,
              priority: priority,
              requiredServices: requiredServices,
              emergencyType: emergencyId
            } : undefined}
            searchCriteria={emergencyId ? {
              emergencyType: emergencyId,
              minimumEmergencyScore: emergency?.priority === 'critical' ? 70 : 
                                   emergency?.priority === 'high' ? 50 : 30
            } : undefined}
          />
        ) : (
          <ScrollView 
            style={[styles.flex1]} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.pb4,
              { paddingBottom: 85 + Math.max(insets.bottom - 8, 0) } // Account for tab bar
            ]}
          >
            <SelectedHospital
              hospital={selectedHospital}
              onChangeHospital={handleChangeHospital}
              routeLoading={routeLoading}
              emergencyType={emergencyId}
            />

            <AmbulanceTypeSelector
              selectedType={ambulanceType}
              onSelectType={(type) => setAmbulanceType(type)}
              availableTypes={availableAmbulanceTypes}
              emergencyContext={emergency ? {
                name: emergencyName,
                priority: priority
              } : undefined}
            />

            <BookRideButton
              onPress={handleBookRide}
              isLoading={booking}
              selectedHospital={selectedHospital}
            />
          </ScrollView>
        )}
      </View>
    </View>
  );
}