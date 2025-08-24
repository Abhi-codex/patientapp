import { colors, styles } from "../constants/tailwindStyles";
import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

interface InputFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  required = false,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  ...props
}) => {
  return (
    <View style={[styles.mb4, containerStyle]}>
      <Text style={[styles.textSm, styles.fontMedium, styles.textGray700, styles.mb2, labelStyle]}>
        {label} {required && <Text style={[styles.textEmergency500]}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.wFull, styles.px4, styles.py3, styles.borderGray300, styles.roundedLg, styles.textBase, styles.bgWhite, styles.border,
          inputStyle,
        ]}
        placeholderTextColor={colors.gray[400]}
        {...props}
      />
      {!!error && (
        <Text style={[styles.textXs, styles.textEmergency600, styles.mt1]}>{error}</Text>
      )}
    </View>
  );
};

export default InputField;
