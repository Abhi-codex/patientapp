import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
// import { colors, styles } from "../../constants/tailwindStyles";
// import { OTPAuth } from "../../utils/otpauth";

export default function PatientAuthScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(cleanedValue);
  };

  const validatePhone = () => {
    return phoneNumber.length === 10 && /^\d{10}$/.test(phoneNumber);
  };

  const handleAuth = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    if (!validatePhone()) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      // TODO: Send OTP via OTPAuth
      // const formattedPhone = OTPAuth.formatPhoneNumber(phoneNumber, '+91');
      // const result = await OTPAuth.sendOTP(formattedPhone, 'patient');
      // if (result.success) { ... }
      router.push({ pathname: '/screens/OtpScreen', params: { phone: phoneNumber, role: 'patient' } });
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 20, paddingVertical: 40 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>Patient Authentication</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 18, marginBottom: 20 }}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            maxLength={10}
          />
          <TouchableOpacity
            style={{ backgroundColor: loading || !validatePhone() ? '#d1d5db' : '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' }}
            onPress={handleAuth}
            disabled={loading || !validatePhone()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Continue with Phone</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
