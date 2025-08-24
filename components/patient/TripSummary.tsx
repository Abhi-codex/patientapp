import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Octicons } from '@expo/vector-icons';
import { styles, colors } from '../../constants/tailwindStyles';
import { formatDuration, formatDistance } from '../../utils/directions';
import { RideStatus } from '../../types/rider';
import { ScrollView } from 'react-native-gesture-handler';

const { height: screenHeight } = Dimensions.get('window');

const statusMap = {
  [RideStatus.SEARCHING]: { text: 'Finding Driver', color: colors.warning[500], icon: 'search', bgColor: colors.warning[50] },
  [RideStatus.START]: { text: 'En Route', color: colors.emergency[500], icon: 'rocket', bgColor: colors.emergency[50] },
  [RideStatus.ARRIVED]: { text: 'Arrived', color: colors.primary[600], icon: 'verified', bgColor: colors.primary[50] },
  [RideStatus.COMPLETED]: { text: 'Completed', color: colors.medical[500], icon: 'check', bgColor: colors.medical[50] },
};

const calculateFare = (ambulanceType: string, distanceKm: number): number => {
  const ratePerKm = {
    bls: 15,    // Basic Life Support
    als: 20,    // Advanced Life Support
    ccs: 30,    // Critical Care Support
    auto: 12,   // Auto Ambulance (compact)
    bike: 10,   // Bike Safety Unit
  };

  const baseRate = {
    bls: 50,     // Basic Life Support
    als: 80,     // Advanced Life Support
    ccs: 120,    // Critical Care Support
    auto: 40,    // Auto Ambulance (compact)
    bike: 30,    // Bike Safety Unit
  };

  // Get rate based on ambulance type, default to bls if type not found
  const rate = ratePerKm[ambulanceType as keyof typeof ratePerKm] || ratePerKm.bls;
  const base = baseRate[ambulanceType as keyof typeof baseRate] || baseRate.bls;
  
  // Calculate fare: base rate + distance * rate, rounded to nearest 5
  return Math.round((base + (distanceKm * rate)) / 5) * 5;
};

interface TripSummaryProps {
  status: RideStatus;
  distance: number;
  duration: number;
  ambulanceType: string;
  driverName?: string;
  vehicleDetails?: string;
  otp?: string;
  emergencyType?: string;
  emergencyName?: string;
  priority?: string;
}

export default function TripSummary({
  status = RideStatus.SEARCHING,
  distance = 0,
  duration = 0,
  ambulanceType = 'bls',
  driverName = '',
  vehicleDetails = '',
  otp = '',
  emergencyName,
  priority,
}: TripSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusInfo = statusMap[status] || statusMap[RideStatus.SEARCHING];
  const estimatedFare = calculateFare(ambulanceType, distance);

  // Get emergency details if available
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return colors.emergency[500];
      case 'high': return colors.warning[500];
      case 'medium': return colors.primary[500];
      case 'low': return colors.medical[500];
      default: return colors.gray[500];
    }
  };

  const getAmbulanceTypeDetails = (type: string) => {
    const types = {
      'bls': { name: 'Basic Life Support', icon: 'medical-bag' },
      'als': { name: 'Advanced Life Support', icon: 'heart-pulse' },
      'ccs': { name: 'Critical Care Support', icon: 'hospital' },
      'auto': { name: 'Auto Ambulance', icon: 'car-emergency' },
      'bike': { name: 'Bike Emergency Unit', icon: 'motorbike' },
    };
    return types[type as keyof typeof types] || { name: type, icon: 'ambulance' };
  };

  const ambulanceDetails = getAmbulanceTypeDetails(ambulanceType);

  return (
    <ScrollView style={[ styles.absolute, styles.bottom0, styles.left0, styles.right0, styles.bgWhite,
      styles.roundedTl3xl, styles.roundedTr3xl, styles.shadowLg, styles.border, styles.borderGray200,
      styles.pb8, { maxHeight: screenHeight * 0.5 } ]}>
      {/* Handle Bar */}
      <TouchableOpacity 
        style={[styles.alignCenter, styles.py3]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={[styles.w12, styles.h1, styles.bgGray300, styles.rounded2xl]} />
      </TouchableOpacity>

      {/* Main Status Header */}
      <View style={[styles.px4, styles.pb3]}>
        <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.py3,
          styles.px3, styles.roundedXl, styles.mb3, { backgroundColor: statusInfo.bgColor }]}>
          <View style={[styles.flexRow, styles.alignCenter]}>
            <View style={[styles.w10, styles.h10, styles.roundedFull, styles.alignCenter, 
            styles.justifyCenter, styles.mr3, { backgroundColor: statusInfo.color }]}>
              <Octicons name={statusInfo.icon as any} size={16} color="white" />
            </View>
            <View>
              <Text style={[styles.textBase, styles.fontBold, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
              {status === RideStatus.SEARCHING && (
                <Text style={[styles.textXs, styles.textGray600]}>
                  Finding nearby ambulance...
                </Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <MaterialIcons 
              name={isExpanded ? "keyboard-arrow-down" : "keyboard-arrow-up"} 
              size={24} 
              color={statusInfo.color} 
            />
          </TouchableOpacity>
        </View>

        {/* Quick Info Tiles - Always Visible */}
        <View style={[styles.flexRow, styles.justifyBetween, styles.mb3]}>
          {/* ETA Tile */}
          <View style={[styles.flex1, styles.bgGray50, styles.roundedLg, styles.p3, styles.mr2]}>
            <View style={[styles.flexRow, styles.alignCenter, styles.mb1]}>
              <Octicons name="clock" size={14} color={colors.primary[600]} style={[styles.mr1]} />
              <Text style={[styles.textXs, styles.textGray600, styles.fontMedium]}>ETA</Text>
            </View>
            <Text style={[styles.textSm, styles.fontBold, styles.textGray800]}>
              {formatDuration(duration)}
            </Text>
          </View>

          {/* Distance Tile */}
          <View style={[styles.flex1, styles.bgGray50, styles.roundedLg, styles.p3, styles.mr2]}>
            <View style={[styles.flexRow, styles.alignCenter, styles.mb1]}>
              <Octicons name="location" size={14} color={colors.medical[600]} style={[styles.mr1]} />
              <Text style={[styles.textXs, styles.textGray600, styles.fontMedium]}>Distance</Text>
            </View>
            <Text style={[styles.textSm, styles.fontBold, styles.textGray800]}>
              {formatDistance(distance)}
            </Text>
          </View>

          {/* Fare Tile */}
          <View style={[styles.flex1, styles.bgGray50, styles.roundedLg, styles.p3]}>
            <View style={[styles.flexRow, styles.alignCenter, styles.mb1]}>
              <MaterialIcons name="attach-money" size={14} color={colors.warning[600]} style={[styles.mr1]} />
              <Text style={[styles.textXs, styles.textGray600, styles.fontMedium]}>Fare</Text>
            </View>
            <Text style={[styles.textSm, styles.fontBold, styles.textGray800]}>
              ₹{estimatedFare}
            </Text>
          </View>
        </View>

        {/* OTP Display - Always Visible if Available */}
        {otp && (
          <View style={[styles.bgWarning50, styles.roundedLg, styles.p3, styles.mb3, styles.border, styles.borderWarning200]}>
            <View style={[styles.flexRow, styles.alignCenter, styles.justifyCenter]}>
              <MaterialIcons name="vpn-key" size={18} color={colors.warning[600]} style={[styles.mr2]} />
              <Text style={[styles.textSm, styles.textGray700, styles.fontMedium]}>
                Your OTP: 
              </Text>
              <Text style={[styles.textLg, styles.fontBold, { color: colors.warning[700] }, styles.ml1]}>
                {otp}
              </Text>
            </View>
            <Text style={[styles.textXs, styles.textGray600, styles.textCenter, styles.mt1]}>
              Share this with your ambulance driver
            </Text>
          </View>
        )}
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={[styles.px4, styles.pb4, styles.borderT, styles.borderGray100, styles.pt3]}>
          {/* Emergency Info */}
          {emergencyName && (
            <View style={[styles.bgGray50, styles.roundedLg, styles.p3, styles.mb3]}>
              <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={colors.emergency[600]} style={[styles.mr2]} />
                <Text style={[styles.textSm, styles.fontBold, styles.textGray800]}>
                  Emergency Details
                </Text>
              </View>
              <Text style={[styles.textSm, styles.textGray700, styles.mb1]}>
                {emergencyName}
              </Text>
              {priority && (
                <View style={[styles.flexRow, styles.alignCenter]}>
                  <Text style={[styles.textXs, styles.textGray600]}>Priority: </Text>
                  <View style={[styles.px2, styles.py1, styles.roundedFull, { backgroundColor: getPriorityColor(priority) + '20' }]}>
                    <Text style={[ styles.textXs, styles.fontBold, { color: getPriorityColor(priority) }]}>
                      {priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Ambulance Type Info */}
          <View style={[styles.bgGray50, styles.roundedLg, styles.p3, styles.mb3]}>
            <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
              <MaterialCommunityIcons name={ambulanceDetails.icon as any} size={16} color={colors.emergency[600]} style={[styles.mr2]} />
              <Text style={[styles.textSm, styles.fontBold, styles.textGray800]}>
                {ambulanceDetails.name}
              </Text>
            </View>
            {vehicleDetails && (
              <Text style={[styles.textXs, styles.textGray600]}>
                Vehicle: {vehicleDetails}
              </Text>
            )}
          </View>

          {/* Driver Info */}
          {driverName && (
            <View style={[styles.bgGray50, styles.roundedLg, styles.p3, styles.mb3]}>
              <View style={[styles.flexRow, styles.alignCenter, styles.mb1]}>
                <Octicons name="person" size={16} color={colors.primary[600]} style={[styles.mr2]} />
                <Text style={[styles.textSm, styles.fontBold, styles.textGray800]}>
                  Driver Information
                </Text>
              </View>
              <Text style={[styles.textSm, styles.textGray700]}>
                {driverName}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
