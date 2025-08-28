import { FontAwesome5, MaterialCommunityIcons, MaterialIcons, Octicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import { Hospital } from "../../types/patient";
import { SERVER_URL } from "../../utils/network";

interface SelectedHospitalProps {
  hospital: Hospital;
  onChangeHospital: () => void;
  routeLoading?: boolean;
  emergencyType?: string;
}

export default function SelectedHospital({
  hospital,
  onChangeHospital,
  routeLoading = false,
  emergencyType
}: SelectedHospitalProps) {
  const [imageError, setImageError] = useState(false);
  const [showMore, setShowMore] = useState(false);
  
  const getPhotoUrl = () => {
    if (hospital.photos && hospital.photos.length > 0 && hospital.photos[0].photoReference) {
      const photoReference = hospital.photos[0].photoReference;
  const baseUrl = SERVER_URL;
      const url = `${baseUrl}/hospitals/photo/${encodeURIComponent(photoReference)}?maxwidth=400&maxheight=400`;
      console.log('Using hospital photo URL:', url);
      return url;
    }
    
    if (hospital.photoUrl && !hospital.photoUrl.includes('placeholder')) {
      return hospital.photoUrl;
    }
    return null;
  };
  
  const photoUrl = getPhotoUrl();
  
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

  const verificationStatus = getVerificationStatus();
  return (
    <View style={[styles.mb2]}>
      <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.mb2]}>
        <Text style={[styles.textLg, styles.fontBold, styles.textGray800]}>
          Selected Hospital
        </Text>
        <TouchableOpacity
          style={[styles.py1, styles.px2, styles.rounded2xl, styles.border, styles.borderGray300]}
          onPress={onChangeHospital}
        >
          <Text style={[styles.textSm, styles.textGray700, styles.fontMedium]}>
            Change
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.bgGray100, styles.py2, styles.roundedLg, 
      styles.px3, styles.shadowSm, hospital.isEmergencyVerified && 
      [styles.borderPrimary200, { backgroundColor: colors.medical[50]}]]}>
        {/* Header Row with Name and Verification */}
        <View style={[styles.flexRow, styles.alignStart, styles.justifyBetween, styles.mb2]}>
          <View style={[styles.flex1, styles.mr2]}>
            <Text style={[styles.textBase, styles.fontBold, styles.textGray800]} numberOfLines={2}>
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
              size={16} 
              color={verificationStatus.iconColor} 
              style={[styles.mr1]} 
            />
          </View>
        </View>

        {/* Hospital Details Row */}
        <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.mb1]}>
          <View style={[styles.w48, styles.h24, styles.roundedLg, styles.mr3, styles.overflowHidden,
            styles.alignCenter, styles.justifyCenter, { backgroundColor: colors.medical[100] }]}>
            {photoUrl && !imageError ? (
              <Image 
                source={{ uri: photoUrl }} 
                style={[styles.w48, styles.h24, styles.roundedLg]}
                onError={(error) => {
                  console.log('Image loading error:', error.nativeEvent.error);
                  setImageError(true);
                }}
                onLoad={() => {
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
                {hospital.distance} km away
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
         {/* Hospital Address */}
            {hospital.address && (
              <View>
                <View style={[styles.flexRow, styles.py1, styles.mt1, styles.px2, styles.roundedXl, styles.border,
                  styles.alignCenter, styles.borderGray200]}>
                  <FontAwesome5 name="hospital" size={15} color={colors.gray[600]} style={[styles.mr1]} />
                  <Text style={[styles.textXs, styles.textGray600, styles.flex1]} numberOfLines={2}>
                    {hospital.address}
                  </Text>
                </View>
              </View>
            )}

        {routeLoading && (
          <View style={[styles.flexRow, styles.alignCenter, styles.mt2]}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={[styles.textXs, styles.textGray600, styles.ml2]}>
              Loading route...
            </Text>
          </View>
        )}
      </View>
      
      {((hospital.emergencyFeatures?.length ?? 0) > 0 || (emergencyType && (hospital.emergencyServices?.length ?? 0) > 0)) && (
        showMore ? (
          <View style={[styles.bgGray100, styles.mt3, styles.border, styles.borderGray200, styles.py2,
           styles.roundedLg, styles.px3, styles.shadowSm]}>

            {/* Hospital Specialties */}
            {hospital.specialties && hospital.specialties.length > 0 && (
              <View style={[styles.mb2]}>
                <Text style={[styles.textXs, styles.textGray600, styles.mb1]}>Medical Specialties:</Text>
                <View style={[styles.flexRow, styles.flexWrap]}>
                  {hospital.specialties.slice(0, 6).map((specialty, index) => (
                    <View key={index} style={[styles.px1, styles.py1, styles.mr1, styles.mb1,
                        styles.roundedMd, { backgroundColor: colors.primary[100] }]}>
                      <Text style={[styles.textXs, { color: colors.primary[700] }]}>
                        {specialty}
                      </Text>
                    </View>
                  ))}
                  {hospital.specialties.length > 6 && (
                    <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>
                      +{hospital.specialties.length - 6} more specialties
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Emergency Features */}
            {hospital.emergencyFeatures && hospital.emergencyFeatures.length > 0 && (
              <View style={[styles.mb2]}>
                <Text style={[styles.textXs, styles.textGray600, styles.mb1]}>Emergency Features:</Text>
                <View style={[styles.flexRow, styles.flexWrap]}>
                  {hospital.emergencyFeatures.slice(0, 8).map((feature, index) => (
                    <View key={index} style={[styles.px1, styles.py1, styles.mr1, styles.mb1,
                        styles.roundedMd, { backgroundColor: colors.secondary[100] }]}>
                      <Text style={[styles.textXs, { color: colors.secondary[700] }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                  {hospital.emergencyFeatures.length > 8 && (
                    <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>
                      +{hospital.emergencyFeatures.length - 8} more features
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Emergency Services */}
            {emergencyType && hospital.emergencyServices && hospital.emergencyServices.length > 0 && (
              <View>
                <Text style={[styles.textXs, styles.textGray600, styles.mb1]}>Available Emergency Services:</Text>
                <View style={[styles.flexRow, styles.flexWrap]}>
                  {hospital.emergencyServices.slice(0, 8).map((service, index) => (
                    <View key={index} style={[styles.px1, styles.py1, styles.mr1, styles.mb1,
                        styles.roundedMd, { backgroundColor: colors.medical[100] }]}>
                      <Text style={[styles.textXs, { color: colors.medical[700] }]}>
                        {service.replace(/_/g, " ")}
                      </Text>
                    </View>
                  ))}
                  {hospital.emergencyServices.length > 8 && (
                    <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>
                      +{hospital.emergencyServices.length - 8} more services
                    </Text>
                  )}
                </View>
              </View>
            )}
            <TouchableOpacity onPress={() => setShowMore(false)} style={[styles.mt2]}>
              <Text style={[styles.textXs, styles.textPrimary500]}>Read Less</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowMore(true)} style={[styles.mt2]}>
            <Text style={[styles.textXs, styles.textPrimary500]}>Read More</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}
