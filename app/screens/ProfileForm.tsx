import DropdownField from '../../components/DropdownField';
import InputField from '../../components/InputField';
import { Fontisto } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors, styles } from '../../constants/tailwindStyles';
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

  const bloodGroups = [
    { label: 'Select Blood Group', value: '' },
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  const genders = [
    { label: 'Select Gender', value: '' },
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];


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
      const profileData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        age: parseInt(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        emergencyContact: formData.emergencyContact.trim(),
        medicalConditions: formData.medicalConditions.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        address: formData.address.trim(),
      };
      const response = await fetch(`${getServerUrl()}/patient/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      if (response.ok) {
        // Mark profile as complete in local storage
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
        Alert.alert('Error', data.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.flex1]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={[styles.flex1, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.flexGrow}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.px5, styles.mt6, styles.py6]}>
          {/* Header */}
          <View style={[styles.alignCenter, styles.mb6]}>
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 16,}}>
              <Fontisto name="person" size={64} color={colors.black} />
            </View>
            <Text style={[styles.text2xl, styles.fontBold, styles.textGray900, styles.textCenter]}>
              Complete Your Profile
            </Text>
            <Text style={[styles.textSm, styles.textGray600, styles.textCenter, styles.mt2]}>
              Help us provide better emergency care by completing your profile
            </Text>
          </View>

          {/* Personal Information */}
          <View style={[styles.mb6]}>
            <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb3]}>
              Personal Information
            </Text>

            {/* Name */}
            <InputField
              label="Full Name"
              required
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              editable={!loading}
            />

            {/* Email */}
            <InputField
              label="Email Address (Optional)"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            {/* Age and Gender Row */}
            <View style={[styles.flexRow, { gap: 12 }, styles.mb4]}>
              <View style={[styles.flex1]}>
                <InputField
                  label="Age"
                  required
                  placeholder="Age"
                  value={formData.age}
                  onChangeText={(value) => updateFormData('age', value)}
                  keyboardType="numeric"
                  editable={!loading}
                  containerStyle={{ marginBottom: 0 }}
                  labelStyle={{ marginBottom: 8 }}
                />
              </View>

              <View style={[styles.flex1]}>
                <DropdownField
                  label="Gender"
                  required
                  value={formData.gender}
                  onValueChange={(value) => updateFormData('gender', value)}
                  options={genders}
                  enabled={!loading}
                />
              </View>
            </View>

            {/* Blood Group */}
            <DropdownField
              label="Blood Group"
              required
              value={formData.bloodGroup}
              onValueChange={(value) => updateFormData('bloodGroup', value)}
              options={bloodGroups}
              enabled={!loading}
            />
          </View>

          {/* Emergency Information */}
          <View style={[styles.mb6]}>
            <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb3]}>
              Emergency Information
            </Text>

            {/* Emergency Contact */}
            <InputField
              label="Emergency Contact Number"
              required
              placeholder="Emergency contact number"
              value={formData.emergencyContact}
              onChangeText={(value) => updateFormData('emergencyContact', value)}
              keyboardType="phone-pad"
              editable={!loading}
            />

            {/* Medical Conditions */}
            <InputField
              label="Medical Conditions (Optional)"
              placeholder="Any chronic conditions, medications, etc."
              value={formData.medicalConditions}
              onChangeText={(value) => updateFormData('medicalConditions', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!loading}
              inputStyle={{ minHeight: 80 }}
            />

            {/* Allergies */}
            <InputField
              label="Allergies (Optional)"
              placeholder="Drug allergies, food allergies, etc."
              value={formData.allergies}
              onChangeText={(value) => updateFormData('allergies', value)}
              editable={!loading}
            />

            {/* Address */}
            <InputField
              label="Address"
              required
              placeholder="Complete address for emergency services"
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!loading}
              inputStyle={{ minHeight: 80 }}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.wFull, styles.py4, styles.alignCenter, styles.roundedLg, styles.mb4,
              {backgroundColor: loading ? colors.gray[300] : colors.black }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={[styles.textWhite, styles.textLg, styles.fontBold]}>
                Save Profile
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}