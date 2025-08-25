import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, Linking, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PatientRideMap, TripSummary } from '../../components/patient';
import { colors, styles } from '../../constants/tailwindStyles';
import useTrackingLogic from '../../hooks/useTrackingLogic';

export default function TrackingScreen() {
  const params = useLocalSearchParams();
  const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [noDriverDialogVisible, setNoDriverDialogVisible] = useState(false);

  const {
    userLocation,
    routeCoords,
    locationLoading,
    ride,
    rideLoading,
    rideError,
    handleRefresh,
    noDriverTimerActive,
    noDriverRemainingMs,
    recreateLastRide,
    availableDrivers,
    destinationLocation,
    rideStatus,
  } = useTrackingLogic(rideId as string | undefined);

  const timerText = useMemo(() => {
    const ms = noDriverRemainingMs || 0;
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const ss = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }, [noDriverRemainingMs]);

  if (locationLoading || rideLoading) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <ActivityIndicator size="large" color={colors.emergency[600]} />
        <Text style={[styles.mt3, styles.textBase, styles.textGray600]}>
          {locationLoading ? 'Getting your location...' : 'Loading ride details...'}
        </Text>
        {rideLoading && (
          <Text style={[styles.mt1, styles.textSm, styles.textGray500]}>Connecting to emergency services...</Text>
        )}
      </View>
    );
  }

  if (!userLocation || !ride) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <Text style={[styles.mt3, styles.textLg, styles.fontBold, styles.textGray700]}>Setting up tracking...</Text>
        <Text style={[styles.mt1, styles.textBase, styles.textGray600, styles.textCenter, styles.mx4]}> {!userLocation ? 'Waiting for location access' : 'Initializing emergency services'}</Text>
      </View>
    );
  }

  if (rideError) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <Text style={[styles.mt3, styles.textLg, styles.fontBold, styles.textDanger700]}>Error Loading Ride</Text>
        <Text style={[styles.mt1, styles.textBase, styles.textGray600, styles.textCenter, styles.mx4]}>{rideError}</Text>
        <TouchableOpacity style={[styles.mt4, styles.bgPrimary600, styles.roundedLg, styles.py2, styles.px4]} onPress={handleRefresh}>
          <Text style={[styles.textBase, styles.textWhite, styles.fontBold]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!destinationLocation) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <Text style={[styles.textBase, styles.textDanger600]}>Destination information not available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex1, { paddingTop: insets.top }]}> 
      {noDriverTimerActive && (
        <View style={{ position: 'absolute', top: insets.top + 8, left: 17, zIndex: 50 }}>
          <TouchableOpacity onPress={() => setNoDriverDialogVisible(true)}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 6 }}>
              <Text style={{ color: '#000', fontWeight: '600', fontSize: 12 }}>{timerText}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={noDriverDialogVisible} transparent animationType="fade" onRequestClose={() => setNoDriverDialogVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '86%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Pressable onPress={() => setNoDriverDialogVisible(false)} style={{ position: 'absolute', right: 8, top: 8, zIndex: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>✕</Text>
            </Pressable>
            <Text style={[styles.textLg, styles.fontBold, { marginTop: 8 }]}>No Driver Available</Text>
            <Text style={[styles.mt2, styles.textBase, styles.textGray600]}>No driver has accepted your request within 10 minutes. What would you like to do?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => { setNoDriverDialogVisible(false); recreateLastRide(); }} style={{ marginLeft: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.emergency[600], borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Recreate</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setNoDriverDialogVisible(false); Linking.openURL('tel:108'); }} style={{ marginLeft: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#ddd', borderRadius: 8 }}>
                <Text style={{ color: '#000', fontWeight: '700' }}>Call 108</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setNoDriverDialogVisible(false); router.replace('/screens/EmergencyScreen'); }} style={{ marginLeft: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
                <Text style={{ color: '#000', fontWeight: '700' }}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
        duration={typeof ride.distance === 'number' && !isNaN(ride.distance) ? Math.round(ride.distance / 0.6) : 0}
        ambulanceType={ride.vehicle || 'bls'}
        otp={ride.otp || ''}
        vehicleDetails={ride.rider && ride.rider.vehicle ? `${ride.rider.vehicle.model || 'Unknown Model'} (${ride.rider.vehicle.plateNumber || 'Unknown Plate'})` : undefined}
        driverName={ride.rider?.name || undefined}
        emergencyType={Array.isArray(params.emergencyType) ? params.emergencyType[0] : params.emergencyType}
        emergencyName={Array.isArray(params.emergencyName) ? params.emergencyName[0] : params.emergencyName}
        priority={Array.isArray(params.priority) ? params.priority[0] : params.priority}
      />
    </View>
  );
}
