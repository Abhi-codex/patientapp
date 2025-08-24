import { colors, styles } from "../constants/tailwindStyles";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";

interface Option {
  label: string;
  value: string;
}

interface DropdownFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  enabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  pickerStyle?: StyleProp<ViewStyle>;
}

const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  required = false,
  value,
  onValueChange,
  options,
  enabled = true,
  containerStyle,
  labelStyle,
  pickerStyle,
}) => {
  return (
    <View style={[styles.mb4, containerStyle]}>
      <Text style={[styles.textSm, styles.fontMedium, styles.textGray700, styles.mb2, labelStyle]}>
        {label} {required && <Text style={{ color: colors.emergency[500] }}>*</Text>}
      </Text>
      <View style={[styles.borderGray300, styles.roundedLg, styles.bgWhite, { borderWidth: 1, overflow: 'hidden' }, pickerStyle]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          enabled={enabled}
          style={{ height: 50 }}
        >
          {options.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

export default DropdownField;
