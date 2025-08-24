import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { styles, colors } from "../../constants/tailwindStyles";
import { Hospital } from "../../types/patient";

interface BookRideButtonProps {
  onPress: () => void;
  isLoading: boolean;
  selectedHospital: Hospital;
  disabled?: boolean;
}

export default function BookRideButton({
  onPress,
  isLoading,
  disabled = false,
}: BookRideButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.py4, styles.justifyBetween, styles.alignCenter, styles.rounded3xl, styles.shadowMd,
        { backgroundColor: colors.primary[600] }, disabled && { opacity: 0.7 }]}
      onPress={onPress} disabled={isLoading || disabled}>
      {isLoading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <View style={[styles.alignCenter]}>
          <Text style={[styles.textWhite, styles.textLg, styles.fontBold]}>
            Book Emergency Ambulance
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
