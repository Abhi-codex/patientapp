import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import { Ride } from "../../types/rider";
import { LatLng } from "../../utils/directions";
import { MapViewWrapper as Map, MarkerWrapper as Marker, PolylineWrapper as Polyline } from "../MapView";

interface PatientRideMapProps {
  userLocation: LatLng & { latitudeDelta: number; longitudeDelta: number };
  destinationLocation: LatLng;
  availableDrivers?: Array<{ id: string; location: LatLng; isAccepted?: boolean }>;
  acceptedRide?: Ride | null;
  routeCoords?: Array<LatLng>;
  onRegionChange?: (region: any) => void;
}

export default function PatientRideMap({
  userLocation,
  destinationLocation,
  availableDrivers = [],
  acceptedRide = null,
  routeCoords = [],
  onRegionChange
}: PatientRideMapProps) {
  // Center map on both points - user and destination or driver if available
  const [mapRegion, setMapRegion] = useState<any>(userLocation);

  // Update map region to fit all important points
  useEffect(() => {
    if (!userLocation || !destinationLocation) return;

    const acceptedDriver = availableDrivers.find(driver => driver.isAccepted);
    const points = [
      { lat: userLocation.latitude, lng: userLocation.longitude },
      { lat: destinationLocation.latitude, lng: destinationLocation.longitude },
    ];

    if (acceptedDriver) {
      points.push({
        lat: acceptedDriver.location.latitude,
        lng: acceptedDriver.location.longitude
      });
    }

    // Calculate bounds to fit all points
    const latitudes = points.map(p => p.lat);
    const longitudes = points.map(p => p.lng);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    // Add padding
    const latPadding = (maxLat - minLat) * 0.3;
    const lngPadding = (maxLng - minLng) * 0.3;

    const region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.05, (maxLat - minLat) + latPadding),
      longitudeDelta: Math.max(0.05, (maxLng - minLng) + lngPadding),
    };

    setMapRegion(region);
    if (onRegionChange) {
      onRegionChange(region);
    }
  }, [userLocation, destinationLocation, availableDrivers, onRegionChange]);

  // Helper: get accepted driver id if any
  const acceptedDriverId = availableDrivers.find(d => d.isAccepted)?.id;

  return (
    <View style={[styles.flex1]}>
      <Map
        style={[styles.flex1]}
        region={mapRegion}
        onRegionChangeComplete={onRegionChange}
      >
        {/* User location marker */}
        <Marker
          coordinate={userLocation}
          title="Your Location"
          pinColor={colors.primary[600]}
          type="patient"
        />

        {/* Destination marker */}
        <Marker
          coordinate={destinationLocation}
          title="Hospital"
          pinColor={colors.danger[500]}
          type="hospital"
        />

        {/* Available drivers markers */}
        {availableDrivers.map((driver) => {
          let pinColor = driver.isAccepted
            ? colors.emergency[700]
            : colors.warning[400];
          if (acceptedRide && driver.id === acceptedDriverId) {
            pinColor = colors.emergency[900];
          }
          return (
            <Marker
              key={driver.id}
              coordinate={driver.location}
              title={driver.isAccepted ? "Your Ambulance" : "Available Ambulance"}
              pinColor={pinColor}
              type="driver"
            />
          );
        })}

        {/* Route polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={colors.emergency[500]}
            strokeWidth={4}
          />
        )}

        {/* Ride status overlay (optional) */}
        {acceptedRide && (
          <Marker
            coordinate={userLocation}
            title={`Ride Status: ${acceptedRide.status}`}
            pinColor={colors.emergency[500]}
            type="patient"
          />
        )}
      </Map>
    </View>
  );
}
