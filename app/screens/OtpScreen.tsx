import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
// import { BackendOTPAuth } from "../../utils/backendOTPAuth";

const OtpScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { phone, role = 'patient' } = params as { phone: string; role?: string };

  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOtp, setBackendOtp] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // TODO: Send OTP via BackendOTPAuth and set backendOtp
    // Example:
    // const result = await BackendOTPAuth.sendOTP(phone, role);
    // if (result.success && result.otp) setBackendOtp(result.otp);
  }, [phone, role]);

  const handleOtpChange = (raw: string, index: number) => {
    if (error) setError(null);
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6 - index).split('');
      const nd = [...otpDigits];
      chars.forEach((c, i) => { nd[index + i] = c; });
      setOtpDigits(nd);
      const next = Math.min(index + chars.length, 5);
      if (next <= 5) inputRefs.current[next]?.focus();
      return;
    }
    if (cleaned.length === 1) {
      const nd = [...otpDigits];
      nd[index] = cleaned;
      setOtpDigits(nd);
      if (index < 5) inputRefs.current[index + 1]?.focus();
      return;
    }
    if (otpDigits[index]) {
      const nd = [...otpDigits];
      nd[index] = '';
      setOtpDigits(nd);
      if (index > 0) setTimeout(() => inputRefs.current[index - 1]?.focus(), 10);
    } else if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      // TODO: Verify OTP via BackendOTPAuth
      // const result = await BackendOTPAuth.verifyOTP(phone, otp);
      // if (result.success) { ... }
      router.replace('/screens/PatientProfile');
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>Verify Phone</Text>
      <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 8 }}>We sent a 6-digit code to {phone}.</Text>
      {backendOtp && (
        <Text style={{ fontSize: 16, color: '#ef4444', marginBottom: 8, fontWeight: 'bold' }}>Test OTP: {backendOtp}</Text>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 16 }}>
        {otpDigits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={{ width: 40, height: 48, fontSize: 24, textAlign: 'center', borderWidth: 1, borderColor: digit ? '#2563eb' : '#d1d5db', borderRadius: 8, backgroundColor: '#fff', marginHorizontal: 4 }}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
            autoComplete="one-time-code"
          />
        ))}
      </View>
      {error && <Text style={{ color: '#ef4444', marginBottom: 8 }}>{error}</Text>}
      <TouchableOpacity
        style={{ backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, marginBottom: 12 }}
        onPress={verifyOtp}
        disabled={loading || otpDigits.join('').length !== 6}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OtpScreen;
