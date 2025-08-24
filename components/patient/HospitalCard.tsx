import { MaterialCommunityIcons, MaterialIcons, Octicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import { Hospital } from "../../types/patient";
import { getServerUrl } from "../../utils/network";

interface HospitalCardProps {
  hospital: Hospital;
  onSelect: (hospital: Hospital) => void;
  isSelected?: boolean;
  emergencyType?: string;
}

export default function HospitalCard({ 
  hospital, 
  onSelect, 
  isSelected,
  emergencyType 
}: HospitalCardProps) {
  
  if (hospital.isOpen === false) {
    return null;
  }
    const [imageError, setImageError] = useState(false);
  
  const getPhotoUrl = () => {
    if (hospital.photos && hospital.photos.length > 0 && hospital.photos[0].photoReference) {
      const photoReference = hospital.photos[0].photoReference;
      const baseUrl = getServerUrl();
      // Updated to match new Places API format
      const url = `${baseUrl}/hospitals/photo/${encodeURIComponent(photoReference)}?maxwidth=400&maxheight=400`;
      console.log('Using hospital photo URL:', url);
      return url;
    }
    
    // Fallback to photoUrl if it's not a placeholder
    if (hospital.photoUrl && !hospital.photoUrl.includes('placeholder')) {
      console.log('Using fallback photoUrl:', hospital.photoUrl);
      return hospital.photoUrl;
    }
    
    console.log('No valid photo found for hospital:', hospital.name);
    return null;
  };
  
  const photoUrl = getPhotoUrl();
  
  // Emergency verification status
  const getVerificationStatus = () => {
    if (hospital.isEmergencyVerified) {
      return { 
        icon: "verified", 
        text: "Verified", 
        color: colors.medical[600],
        iconColor: colors.medical[600]
      };
    } 
    else if (hospital.emergencyCapabilityScore && hospital.emergencyCapabilityScore >= 30) {
      return { 
        icon: "question", 
        text: "Likely", 
        color: colors.warning[600],
        iconColor: colors.warning[600]
      };
    }
    return { 
      icon: "circle", 
      text: "Uncertain", 
      color: colors.danger[600],
      iconColor: colors.danger[600]
    };
  };

  // Capability score color
  const getScoreColor = (score?: number) => {
    if (!score) return colors.gray[400];
    if (score >= 70) return colors.medical[500];
    if (score >= 50) return colors.warning[500];
    if (score >= 30) return colors.warning[800];
    return colors.danger[500];
  };

  const verificationStatus = getVerificationStatus();

  return (
    <TouchableOpacity
      style={[ styles.bgGray100, styles.py2, styles.roundedLg, styles.px3, styles.shadowSm, 
        isSelected && [{ backgroundColor: colors.primary[50] }],
        hospital.isEmergencyVerified && !isSelected && [styles.borderPrimary200, 
        { backgroundColor: colors.medical[50] }]]} onPress={() => onSelect(hospital)}>

      {/* Header Row with Name and Verification */}
      <View style={[styles.flexRow, styles.alignStart, styles.justifyBetween, styles.mb2]}>
        <View style={[styles.flex1, styles.mr2]}>
          <Text style={[styles.textBase, styles.fontBold, styles.textGray800]} numberOfLines={1}>
            {hospital.name}
          </Text>
          {hospital.recommendation && (
            <Text style={[styles.textXs, styles.textPrimary600, styles.fontMedium, styles.mt1]}>
              {hospital.recommendation}
            </Text>
          )}
        </View>
        
        {/* Verification Badge */}
        <View style={[styles.flexRow, styles.alignCenter, styles.py1]}>
          <Octicons 
            name={verificationStatus.icon as any} 
            size={14} 
            color={verificationStatus.iconColor} 
            style={[styles.mr1]} 
          />
        </View>
      </View>

      {/* Hospital Details Row */}
      <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.mb1]}>
        <View style={[styles.w36, styles.h24, styles.roundedLg, styles.mr3, styles.overflowHidden,
          styles.alignCenter, styles.justifyCenter, { backgroundColor: colors.medical[100] }]}>
          {photoUrl && !imageError ? (
            <Image 
              source={{ uri: photoUrl }} 
              style={[styles.w36, styles.h24, styles.roundedLg]}
              onError={(error) => {
                console.log('Image loading error:', error.nativeEvent.error);
                console.log('Failed URL:', photoUrl);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Image loaded successfully for:', hospital.name);
                console.log('Loaded URL:', photoUrl);
                setImageError(false);
              }}
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons
              name="hospital-building" 
              size={32} 
              color={colors.medical[600]} 
            />
          )}
        </View>
        <View style={{ width: 125 }}>
          <View style={[styles.flexRow, styles.py1, styles.px2, styles.rounded3xl, styles.border,
            styles.alignCenter, styles.borderGray200, styles.mt1, { width: 125 }]}>
            <Octicons name="location" size={14} color={colors.gray[600]} style={[styles.mr2]} />
            <Text style={[styles.textXs, styles.textGray600]}>
              {hospital.distance.toFixed(2)} km away
            </Text>
          </View>
          {hospital.rating && (
            <View style={[styles.flexRow, styles.py1, styles.px2, styles.rounded3xl, styles.border,
              styles.alignCenter, styles.borderGray200, styles.mt1, { width: 125 }]}>
              <Octicons name="feed-star" size={12} color={colors.gray[600]} style={[styles.mr2]} />
              <Text style={[styles.textXs, styles.textGray600]}>
                {hospital.rating} out of 5
              </Text>
            </View>
          )}
          {hospital.emergencyCapabilityScore !== undefined && (
            <View style={[styles.flexRow, styles.py1, styles.px2, styles.rounded3xl, styles.border,
              styles.alignCenter, styles.borderGray200, styles.mt1, { width: 125 }]}>
              <MaterialIcons name="credit-score" size={14} color={colors.gray[600]} style={[styles.mr2]} />
              <Text style={[styles.textXs, styles.textGray600]}>
                {hospital.emergencyCapabilityScore} % capability
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Emergency Features */}
      {hospital.emergencyFeatures && hospital.emergencyFeatures.length > 0 && (
        <View style={[styles.mb2]}>
          <Text style={[styles.textXs, styles.textGray600, styles.mb1]}>Emergency Features:</Text>
          <View style={[styles.flexRow, styles.flexWrap]}>
            {hospital.emergencyFeatures.slice(0, 3).map((feature, index) => (
              <View key={index} style={[styles.px2, styles.py1, styles.mr1, styles.mb1,
                  styles.roundedMd, { backgroundColor: colors.secondary[100] }]}>
                <Text style={[styles.textXs, { color: colors.secondary[700] }]}>
                  {feature}
                </Text>
              </View>
            ))}
            {hospital.emergencyFeatures.length > 3 && (
              <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>
                +{hospital.emergencyFeatures.length - 3} more
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Emergency Services for Current Emergency */}
      {emergencyType && hospital.emergencyServices && hospital.emergencyServices.length > 0 && (
        <View style={[styles.mb2]}>
          <Text style={[styles.textXs, styles.textGray600, styles.mb1]}>Available Services:</Text>
          <View style={[styles.flexRow, styles.flexWrap]}>
            {hospital.emergencyServices.slice(0, 4).map((service, index) => (
              <View key={index} style={[styles.px2, styles.py1, styles.mr1, styles.mb1,
                  styles.roundedMd, { backgroundColor: colors.medical[100] }]}>
                <Text style={[styles.textXs, { color: colors.medical[700] }]}>
                  {service.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}
