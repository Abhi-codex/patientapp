import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import { EMERGENCY_TYPES } from '../../types/emergency';
import { Hospital } from "../../types/patient";
import HospitalCard from "./HospitalCard";

interface HospitalListProps {
  hospitals: Hospital[];
  onSelectHospital: (hospital: Hospital) => void;
  selectedHospital: Hospital | null;
  isLoading?: boolean;
  emergencyContext?: {
    name: string;
    priority: string;
    requiredServices: string[];
    emergencyType?: string;
  };
  searchCriteria?: {
    minimumEmergencyScore?: number;
    emergencyType?: string;
  };
}

type SortOption = 'capability' | 'distance' | 'rating' | 'emergency_match';

export default function HospitalList({
  hospitals,
  onSelectHospital,
  selectedHospital,
  isLoading = false,
  emergencyContext,
  searchCriteria
}: HospitalListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('distance');

  // at least 2 out of 3 required services must match
  const filteredHospitals = useMemo(() => {
    if (!emergencyContext?.emergencyType) return hospitals;
    const emergency = EMERGENCY_TYPES.find(e => e.id === emergencyContext.emergencyType);
    if (!emergency) return hospitals;
    let required = emergency.requiredHospitalServices;
    if (!required || required.length === 0) return hospitals;

    required = required.map(s => s.trim().toLowerCase());
    return hospitals.filter(hospital => {
      let services = hospital.emergencyServices || [];
      services = services.map(s => s.trim().toLowerCase());
      const matches = required.filter(service => services.includes(service));
      if (required.length === 1) return matches.length === 1;
      if (required.length === 2) return matches.length === 2;
      if (required.length >= 3) return matches.length >= 2;
      return false;
    });
  }, [hospitals, emergencyContext]);

  const sortedHospitals = useMemo(() => {
    const openHospitals = filteredHospitals.filter(hospital => hospital.isOpen !== false);
    const hospitalsCopy = [...openHospitals];
    switch (sortBy) {
      case 'capability':
        return hospitalsCopy.sort((a, b) => {
          const scoreA = a.emergencyCapabilityScore || 0;
          const scoreB = b.emergencyCapabilityScore || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          return a.distance - b.distance;
        });
      case 'distance':
        return hospitalsCopy.sort((a, b) => a.distance - b.distance);
      case 'rating':
        return hospitalsCopy.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          return a.distance - b.distance;
        });
      case 'emergency_match':
        return hospitalsCopy.sort((a, b) => {
          if (a.isEmergencyVerified && !b.isEmergencyVerified) return -1;
          if (!a.isEmergencyVerified && b.isEmergencyVerified) return 1;
          const scoreA = a.emergencyCapabilityScore || 0;
          const scoreB = b.emergencyCapabilityScore || 0;
          return scoreB - scoreA;
        });
      default:
        return hospitalsCopy;
    }
  }, [filteredHospitals, sortBy]);
  const openHospitals = hospitals.filter(hospital => hospital.isOpen !== false);
  const verifiedCount = openHospitals.filter(h => h.isEmergencyVerified).length;

  return (
    <View style={[styles.flex1]}>
      {/* Header with Emergency Context */}
      <View style={[styles.mb2]}>
        <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween]}>
          <Text style={[styles.textLg, styles.fontBold, styles.textGray800]}>
            Emergency Hospitals
          </Text>
          {emergencyContext && (
            <View style={[styles.px2, styles.py1, styles.roundedMd, { backgroundColor: colors.primary[100] }]}>
              <Text style={[styles.textXs, { color: colors.primary[600] }]}>
                {emergencyContext.name}
              </Text>
            </View>
          )}
        </View>

        {/* Search Context Display */}
        {searchCriteria && (
          <View style={[styles.mb1]}>
            <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>
              Found {sortedHospitals.length} hospitals • {verifiedCount} verified
            </Text>
          </View>
        )}

        {/* Sort Options */}
        <View>
          <View style={[styles.flexRow, styles.justifyCenter]}>
            {[{ key: 'capability' as SortOption, label: 'Capability' },
              { key: 'distance' as SortOption, label: 'Distance' },
              { key: 'rating' as SortOption, label: 'Rating' },
              { key: 'emergency_match' as SortOption, label: 'Match' },
            ].map((option) => (
              <TouchableOpacity key={option.key} 
                  style={[styles.px2, styles.py1, styles.mr1, styles.roundedMd, styles.border,
                  sortBy === option.key 
                    ? { backgroundColor: colors.primary[100], borderColor: colors.primary[300] }
                    : { backgroundColor: colors.gray[50], borderColor: colors.gray[200] }
                ]}
                onPress={() => setSortBy(option.key)}
              >
                <Text style={[
                  styles.textSm,
                  sortBy === option.key 
                    ? { color: colors.primary[700] }
                    : { color: colors.gray[600] }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
      {/* Hospital List */}
      <ScrollView
        style={[styles.flex1]}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[styles.pb2]}
      >
        {isLoading || hospitals.length === 0 ? (
          <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.py6]}>
            <Text style={[styles.textBase, styles.textGray600, styles.textCenter]}>
              {isLoading ? "Searching for emergency-capable hospitals..." : "No emergency hospitals found nearby"}
            </Text>
            {isLoading && (
              <ActivityIndicator size="large" color={colors.primary[600]} style={[styles.mt4]} />
            )}
            {!isLoading && hospitals.length === 0 && (
              <Text style={[styles.textSm, styles.textGray500, styles.textCenter, styles.mt2]}>
                Try expanding your search radius or selecting a different emergency type
              </Text>
            )}
          </View>
        ) : (
            <>
            {/* Show recommended hospitals first */}
            {sortedHospitals.filter(h => h.isEmergencyVerified).length > 0 && (
              <View style={[styles.mb1]}>
              <Text style={[styles.textSm, styles.fontMedium, { color: colors.medical[600] }, styles.ml2, styles.mb1]}>
                Recommended Emergency Hospitals
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} 
                          contentContainerStyle={[{ paddingHorizontal: 4 }]}>
                {sortedHospitals
                .filter(h => h.isEmergencyVerified)
                .slice(0, 4)
                .map(hospital => (
                  <View key={hospital.id} style={[{ marginRight: 10, width: 300, height: 320 }]}>
                  <HospitalCard
                    hospital={hospital}
                    onSelect={onSelectHospital}
                    isSelected={selectedHospital?.id === hospital.id}
                    emergencyType={emergencyContext?.emergencyType}
                  />
                  </View>
                ))}
              </ScrollView>
              </View>
            )}

            {/* All hospitals */}
            <View>
              <Text style={[styles.textSm, styles.fontMedium, styles.textGray600, styles.mb2]}>
              All Emergency Hospitals ({sortedHospitals.length})
              </Text>
              {sortedHospitals.map(hospital => (
              <View
                key={hospital.id}
                style={[
                { marginBottom: 12, width: 355 },
                styles.selfCenter
                ]}
              >
                <HospitalCard
                hospital={hospital}
                onSelect={onSelectHospital}
                isSelected={selectedHospital?.id === hospital.id}
                emergencyType={emergencyContext?.emergencyType}
                />
              </View>
              ))}
            </View>
            </>
        )}
      </ScrollView>
    </View>
  );
}
