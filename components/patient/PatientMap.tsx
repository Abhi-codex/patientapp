import React, { useState } from "react";
import { View } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import { Hospital } from "../../types/patient";
import { MapViewWrapper as Map, MarkerWrapper as Marker, PolylineWrapper as Polyline } from "../MapView";

interface PatientMapProps {
  currentLocation: any;
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  routeCoords: Array<{ latitude: number; longitude: number }>;
  onHospitalSelect?: (hospital: Hospital) => void;
}

export default function PatientMap({
  currentLocation,
  hospitals,
  selectedHospital,
  routeCoords,
  onHospitalSelect,
}: PatientMapProps) {
  const [clickedHospital, setClickedHospital] = useState<Hospital | null>(null);

  React.useEffect(() => {
    if (selectedHospital) {
      setClickedHospital(null);
    }
  }, [selectedHospital]);

  if (!currentLocation) {
    return null;
  }

  const handleMarkerPress = (hospital: Hospital) => {
    if (selectedHospital) return;
    
    if (clickedHospital?.id === hospital.id) {
      if (onHospitalSelect) {
        onHospitalSelect(hospital);
      }
      setClickedHospital(null);
    } else {
      setClickedHospital(hospital);
    }
  };

  const handleCalloutPress = (hospital: Hospital) => {
    if (onHospitalSelect) {
      onHospitalSelect(hospital);
    }
    setClickedHospital(null);
  };

  return (
    <View style={[styles.flex1]}>
      <Map
        style={[styles.wFull, styles.hFull]}
        showsUserLocation={true}
        region={currentLocation}
        onPress={() => setClickedHospital(null)} 
      >
        {!selectedHospital && hospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            coordinate={{
              latitude: hospital.latitude,
              longitude: hospital.longitude,
            }}
            title={clickedHospital?.id === hospital.id ? 
              `${hospital.name}\n${hospital.distance.toFixed(1)} km away • Rating: ${hospital.rating || 'N/A'}\nTap to select this hospital` : 
              hospital.name
            }
            pinColor={clickedHospital?.id === hospital.id ? colors.primary[600] : colors.danger[500]}
            onPress={() => handleMarkerPress(hospital)}
            onCalloutPress={() => handleCalloutPress(hospital)}
            type="hospital"
          />
        ))}
        
        {selectedHospital && (
          <Marker
            coordinate={{
              latitude: selectedHospital.latitude,
              longitude: selectedHospital.longitude,
            }}
            title={`Selected: ${selectedHospital.name}`}
            pinColor={colors.primary[600]}
            type="hospital"
          />
        )}
        
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={colors.primary[600]}
            strokeWidth={4}
          />
        )}
      </Map>
    </View>
  );
}
