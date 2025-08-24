import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import { AmbulanceOption, AmbulanceType } from "../../types/patient";

interface AmbulanceTypeSelectorProps {
  selectedType: AmbulanceType;
  onSelectType: (type: AmbulanceType) => void;
  availableTypes?: AmbulanceType[];
  emergencyContext?: {
    name: string;
    priority: string;
  };
}

const ALL_AMBULANCE_TYPES: AmbulanceOption[] = [
  { key: 'bls', label: 'Basic Life Support', desc: 'BLS - Oxygen, CPR, First Aid', icon: 'medical-bag' },
  { key: 'als', label: 'Advanced Life Support', desc: 'ALS - Cardiac Monitor, Defibrillator', icon: 'heart-pulse' },
  { key: 'ccs', label: 'Critical Care Support', desc: 'CCS - Ventilator, Advanced Monitoring', icon: 'hospital' },
  { key: 'auto', label: 'Compact Urban Unit', desc: 'Auto - Quick Response in Traffic', icon: 'car-emergency' },
  { key: 'bike', label: 'Emergency Response Motorcycle', desc: 'Bike - Fastest Access', icon: 'motorbike' },
];

export default function AmbulanceTypeSelector({
  selectedType,
  onSelectType,
  availableTypes,
  emergencyContext,
}: AmbulanceTypeSelectorProps) {
  
  // Filter ambulance types based on available types
  const filteredTypes = useMemo(() => {
    if (!availableTypes) return ALL_AMBULANCE_TYPES;
    return ALL_AMBULANCE_TYPES.filter(type => availableTypes.includes(type.key));
  }, [availableTypes]);

  // Organize types into rows for better layout
  const organizedTypes = useMemo(() => {
    const rows: AmbulanceOption[][] = [];
    for (let i = 0; i < filteredTypes.length; i += 2) {
      rows.push(filteredTypes.slice(i, i + 2));
    }
    return rows;
  }, [filteredTypes]);

  return (
    <View style={[styles.mb6]}>
      <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.mb3]}>
        <Text style={[styles.textLg, styles.fontBold, styles.textGray800]}>
          Select Ambulance Type
        </Text>
        {emergencyContext && (
          <View style={[styles.flexRow, styles.py1, styles.px2, styles.rounded3xl, styles.border,
            styles.alignCenter, styles.borderGray200]}>
            <MaterialCommunityIcons name="alert-circle" size={14} color={colors.primary[600]} style={[styles.mr2]} />
            <Text style={[styles.textXs, styles.textGray600]}>
              For {emergencyContext.name}
            </Text>
          </View>
        )}
      </View>

      {organizedTypes.map((row: AmbulanceOption[], index: number) => (
        <View 
          key={`ambulance-row-${index}`} 
          style={[styles.flexRow, styles.justifyBetween, index > 0 && styles.mt3]}
        >
          {row.map((type: AmbulanceOption) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.flex1, styles.py1, styles.px2, styles.roundedLg, styles.mx1,
                styles.shadowSm, selectedType === type.key
                  ? [{ backgroundColor: colors.primary[200] }, styles.borderPrimary300]
                  : [styles.bgGray100, styles.borderGray300],
              ]}
              onPress={() => onSelectType(type.key)}
            >
              {/* Header Row with Icon and Name */}
              <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween]}>
                <View style={[styles.flex1, styles.mr2]}>
                  <Text style={[styles.textXs, styles.fontBold, styles.textGray800]} numberOfLines={1}>
                    {type.label}
                  </Text>
                </View>
                
                {/* Ambulance Icon */}
                <View style={[styles.flexRow, styles.alignCenter, styles.py1]}>
                  <MaterialCommunityIcons 
                    name={type.icon as any} 
                    size={18} 
                    color={selectedType === type.key ? colors.primary[600] : colors.gray[600]} 
                    style={[styles.mr1]} 
                  />
                </View>
              </View>

              {/* Description */}
              <View style={[styles.mt1]}>
                <Text style={[styles.textSm, styles.textGray600]} numberOfLines={2}>
                  {type.desc}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}
