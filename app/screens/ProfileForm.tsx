import LabelInput from '../../components/LabelInput';
import LabelSelect from '../../components/LabelSelect';
import { Fontisto } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles as s, colors } from '../../constants/tailwindStyles';
import { getServerUrl } from '../../utils/network';

type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
type Gender = 'male' | 'female' | 'other';

interface PatientProfile {
  name: string;
  email: string;
  age: string;
  gender: Gender | '';
  bloodGroup: BloodGroup | '';
  emergencyContact: string;
  medicalConditions: string;
  allergies: string;
  address: string;
}

export default function PatientProfileSetupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PatientProfile>({
    name: '',
    email: '',
    age: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: '',
    medicalConditions: '',
    allergies: '',
    address: '',
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['male', 'female', 'other'];

  const validateForm = (): boolean => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Please enter a valid name (minimum 2 characters)');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age) || age < 1 || age > 120) {
      Alert.alert('Validation Error', 'Please enter a valid age (1-120)');
      return false;
    }
    if (!formData.gender) {
      Alert.alert('Validation Error', 'Please select your gender');
      return false;
    }
    if (!formData.bloodGroup) {
      Alert.alert('Validation Error', 'Please select your blood group');
      return false;
    }
    if (!/^\d{10,}$/.test(formData.emergencyContact)) {
      Alert.alert('Validation Error', 'Please enter a valid emergency contact number');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Validation Error', 'Please enter your address');
      return false;
    }
    return true;
  };

  const updateFormData = (field: keyof PatientProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  async function handleSubmit() {
    if (!validateForm()) return;
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        router.replace('/screens/PatientAuth');
        return;
      }
      
      // Structure emergency contact as expected by the server (with 'relation' field)
      const emergencyContactData = {
        phone: formData.emergencyContact.trim(),
        name: null, // You might want to add a field for emergency contact name
        relation: null // Backend expects 'relation' not 'relationship'
      };

      // Structure medical history as expected by the server
      const medicalHistoryData = formData.medicalConditions.trim() ? [{
        condition: formData.medicalConditions.trim(),
        details: "",
        diagnosedAt: new Date().toISOString(),
        isChronic: false
      }] : [];

      const profileData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        age: parseInt(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        emergencyContacts: [emergencyContactData],
        medicalHistory: medicalHistoryData,
        allergies: formData.allergies.trim() ? [formData.allergies.trim()] : [],
        address: formData.address.trim(),
        profileCompleted: true,
      };

      const serverUrl = getServerUrl();
      
      if (!serverUrl || serverUrl === 'undefined') {
        Alert.alert('Error', 'Server configuration error. Please contact support.');
        return;
      }

      // Test server connectivity first
      try {
        console.log('[PROFILE FORM] Testing server connectivity...');
        const testResponse = await fetch(serverUrl, { method: 'HEAD' });
        console.log('[PROFILE FORM] Server connectivity test status:', testResponse.status);
      } catch (connectError) {
        console.error('[PROFILE FORM] Server connectivity test failed:', connectError);
      }
      
      // Using the patient profile endpoint
      const requestUrl = `${serverUrl}/patient/profile`;
      
      let response = await fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        await AsyncStorage.setItem('profile_complete', 'true');
        Alert.alert(
          'Success!',
          'Your profile has been updated successfully.',
          [
            {
              text: 'Continue',
              onPress: () => {
                router.replace('/navigation/MainTabs');
              }
            }
          ]
        );
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to update profile. Please try again.');
      }
    } catch (error: any) {
      console.error('[PROFILE FORM] Profile submission error:', error);
      console.error('[PROFILE FORM] Error name:', error.name);
      console.error('[PROFILE FORM] Error message:', error.message);
      console.error('[PROFILE FORM] Error stack:', error.stack);
      
      if (error.message?.includes('Network request failed')) {
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      } else if (error.message?.includes('JSON')) {
        Alert.alert('Error', 'Server returned an unexpected response. Please try again or contact support if the issue persists.');
      } else if (error.message?.includes('Server returned non-JSON response')) {
        Alert.alert('Error', 'Server error occurred. Please try again later.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[s.flex1]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView 
        style={[s.flex1, { backgroundColor: colors.gray[50] }]} 
        contentContainerStyle={s.flexGrow}
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.px5, s.mt6, s.py6]}>
          {/* Header */}
          <View style={[s.alignCenter, s.mb6]}>
            <View style={[s.alignCenter, s.justifyCenter, s.mb4]}>
              <Fontisto name="person" size={64} color={colors.primary[500]} />
            </View>
            <Text style={[s.text2xl, s.fontBold, s.textGray900, s.textCenter]}>
              Complete Your Profile
            </Text>
            <Text style={[s.textSm, s.textGray600, s.textCenter, s.mt2]}>
              Help us provide better emergency care by completing your profile
            </Text>
          </View>

          {/* Personal Information */}
          <View style={s.mb6}>
            <Text style={[s.textLg, s.fontBold, s.textGray900, s.mb3]}>
              Personal Information
            </Text>

            {/* Name */}
            <LabelInput
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              editable={!loading}
              required
              icon="person"
            />

            {/* Email */}
            <LabelInput
              label="Email Address"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              icon="mail"
              helperText="Optional"
            />

            {/* Age and Gender Row */}
            <View style={[s.flexRow, { gap: 12 }, s.mb4]}>
              <View style={s.flex1}>
                <LabelInput
                  label="Age"
                  value={formData.age}
                  onChangeText={(value) => updateFormData('age', value)}
                  keyboardType="numeric"
                  editable={!loading}
                  required
                  icon="calendar"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>

              <View style={s.flex1}>
                <LabelSelect
                  label="Gender"
                  value={formData.gender}
                  onChange={(value) => updateFormData('gender', value as string)}
                  options={genders}
                  required
                  icon="person"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </View>

            {/* Blood Group */}
            <LabelSelect
              label="Blood Group"
              value={formData.bloodGroup}
              onChange={(value) => updateFormData('bloodGroup', value as string)}
              options={bloodGroups}
              required
              icon="water"
            />
          </View>

          {/* Emergency Information */}
          <View style={s.mb6}>
            <Text style={[s.textLg, s.fontBold, s.textGray900, s.mb3]}>
              Emergency Information
            </Text>

            {/* Emergency Contact */}
            <LabelInput
              label="Emergency Contact Number"
              value={formData.emergencyContact}
              onChangeText={(value) => updateFormData('emergencyContact', value)}
              keyboardType="phone-pad"
              editable={!loading}
              required
              icon="call"
            />

            {/* Medical Conditions */}
            <LabelInput
              label="Medical Conditions"
              value={formData.medicalConditions}
              onChangeText={(value) => updateFormData('medicalConditions', value)}
              multiline
              numberOfLines={3}
              editable={!loading}
              icon="medical"
              helperText="Any chronic conditions, medications, etc. (Optional)"
            />

            {/* Allergies */}
            <LabelInput
              label="Allergies"
              value={formData.allergies}
              onChangeText={(value) => updateFormData('allergies', value)}
              editable={!loading}
              icon="warning"
              helperText="Drug allergies, food allergies, etc. (Optional)"
            />

            {/* Address */}
            <LabelInput
              label="Address"
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              multiline
              numberOfLines={3}
              editable={!loading}
              required
              icon="location"
              helperText="Complete address for emergency services"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              s.wFull, 
              s.py4, 
              s.alignCenter, 
              s.roundedLg, 
              s.mb4,
              { backgroundColor: loading ? colors.gray[300] : colors.primary[500] }
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={[s.textWhite, s.textLg, s.fontBold]}>
                Save Profile
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
