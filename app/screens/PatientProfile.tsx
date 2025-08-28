import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, styles as s } from '../../constants/tailwindStyles';
import { SERVER_URL } from '../../utils/network';
import { OTPAuth } from '../../utils/otpauth';
import PatientEditModal, { PatientFormData } from '../../components/PatientEditModal';

interface PatientData {
  name?: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  emergencyContacts?: Array<{
    name?: string;
    phone?: string;
    relation?: string;
  }>;
  medicalHistory?: Array<{
    condition?: string;
    details?: string;
    diagnosedAt?: string;
    isChronic?: boolean;
  }>;
  allergies?: string[];
  address?: string;
}

export default function PatientProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<PatientData>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();
  const [editForm, setEditForm] = useState<PatientFormData>({
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

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/screens/PatientAuth');
        return;
      }

  const response = await fetch(`${SERVER_URL}/patient/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        setProfileData(userData);
        
        // Populate edit form with current data (only editable fields)
        setEditForm({
          name: userData.name || '',
          email: userData.email || '',
          age: userData.age?.toString() || '',
          gender: userData.gender || '',
          bloodGroup: userData.bloodGroup || '',
          emergencyContact: userData.emergencyContacts?.[0]?.phone || '',
          medicalConditions: userData.medicalHistory?.[0]?.condition || '',
          allergies: userData.allergies?.join(', ') || '',
          address: userData.address || '',
        });
      } else {
        Alert.alert('Error', 'Failed to load profile');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Network error occurred');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (key: string, value: any) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      // Structure data for backend (only send editable fields)
      const emergencyContactData = {
        phone: editForm.emergencyContact.trim(),
        name: null,
        relation: null
      };

      const medicalHistoryData = editForm.medicalConditions.trim() ? [{
        condition: editForm.medicalConditions.trim(),
        details: "",
        diagnosedAt: new Date().toISOString(),
        isChronic: false
      }] : [];

      const profilePayload = {
        name: editForm.name.trim(),
        emergencyContacts: [emergencyContactData],
        medicalHistory: medicalHistoryData,
        allergies: editForm.allergies.trim() ? [editForm.allergies.trim()] : [],
        address: editForm.address.trim(),
        profileCompleted: true,
      };

  const response = await fetch(`${SERVER_URL}/patient/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profilePayload),
      });

      if (response.ok) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowEditModal(false);
        fetchProfileData(); // Refresh data
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await OTPAuth.signOut();
              router.replace('/screens/PatientAuth');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[s.flex1, s.justifyCenter, s.alignCenter, s.bgGray50]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={[s.textBase, s.mt2, s.textGray600]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[s.flex1, s.bgGray50]}>
      <ScrollView 
        style={[s.flex1]} 
        contentContainerStyle={[
          s.p5, 
          { 
            paddingTop: insets.top + 20,
            paddingBottom: 85 + Math.max(insets.bottom - 8, 0), // Account for tab bar height
          }
        ]}
      >
        {/* Profile Header Card */}
        <View style={[s.bgWhite, s.rounded3xl, s.p6, s.mb5, s.shadow, s.alignCenter, { position: 'relative' }]}>
          <TouchableOpacity
            onPress={() => setShowEditModal(true)}
            style={{ position: 'absolute', left: 16, top: 16, zIndex: 10, padding: 6 }}
            accessibilityLabel="Edit profile"
          >
            <Entypo name="edit" size={30} color={colors.black} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            style={{ position: 'absolute', right: 16, top: 16, zIndex: 10, padding: 6 }}
            accessibilityLabel="Sign out"
          >
            <MaterialIcons name="logout" size={30} color={colors.black} />
          </TouchableOpacity>
          <View style={[s.w20, s.h20, s.bgPrimary100, s.roundedFull, s.alignCenter, s.justifyCenter, s.mb4]}>
            <FontAwesome5 name="user" size={40} color={colors.primary[600]} />
          </View>
          <Text style={[s.text2xl, s.fontBold, s.textGray800, s.textCenter]}>
            {profileData?.name || 'Patient Name'}
          </Text>
        </View>

        {/* Contact Information */}
        <View style={[s.bgWhite, s.rounded2xl, s.p5, s.mb4, s.shadow]}>
          <Text style={[s.textLg, s.fontBold, s.textGray800, s.mb4]}>Contact Information</Text>
          
          {profileData?.email && (
            <View style={[s.flexRow, s.alignCenter, s.mb3]}>
              <MaterialIcons name="email" size={20} color={colors.gray[600]} />
              <Text style={[s.textBase, s.textGray700, s.ml3]}>{profileData.email}</Text>
            </View>
          )}
          
          {profileData?.phone && (
            <View style={[s.flexRow, s.alignCenter, s.mb3]}>
              <MaterialIcons name="phone" size={20} color={colors.gray[600]} />
              <Text style={[s.textBase, s.textGray700, s.ml3]}>{profileData.phone}</Text>
            </View>
          )}
          
          {profileData?.emergencyContacts?.[0]?.phone && (
            <View style={[s.flexRow, s.alignCenter, s.mb3]}>
              <MaterialIcons name="emergency" size={20} color={colors.gray[600]} />
              <Text style={[s.textBase, s.textGray700, s.ml3]}>{profileData.emergencyContacts[0].phone}</Text>
            </View>
          )}
          
          {profileData?.address && (
            <View style={[s.flexRow, s.alignCenter]}>
              <MaterialIcons name="location-on" size={20} color={colors.gray[600]} />
              <Text style={[s.textBase, s.textGray700, s.ml3, s.flex1]}>{profileData.address}</Text>
            </View>
          )}
        </View>

        {/* Medical Information */}
        <View style={[s.bgWhite, s.rounded2xl, s.p5, s.mb4, s.shadow]}>
          <Text style={[s.textLg, s.fontBold, s.textGray800, s.mb4]}>Medical Information</Text>
          
          {profileData?.age && (
            <View style={[s.mb4]}>
              <Text style={[s.textSm, s.fontSemibold, s.textGray600, s.mb1]}>Age</Text>
              <Text style={[s.textBase, s.textGray800]}>{profileData.age} years</Text>
            </View>
          )}
          
          {profileData?.gender && (
            <View style={[s.mb4]}>
              <Text style={[s.textSm, s.fontSemibold, s.textGray600, s.mb1]}>Gender</Text>
              <Text style={[s.textBase, s.textGray800, { textTransform: 'capitalize' }]}>{profileData.gender}</Text>
            </View>
          )}
          
          {profileData?.bloodGroup && (
            <View style={[s.mb4]}>
              <Text style={[s.textSm, s.fontSemibold, s.textGray600, s.mb1]}>Blood Group</Text>
              <View style={[{ backgroundColor: colors.danger[100] }, s.px3, s.py1, s.roundedFull, s.selfStart]}>
                <Text style={[s.textSm, { color: colors.danger[700] }, s.fontSemibold]}>{profileData.bloodGroup}</Text>
              </View>
            </View>
          )}
          
          {profileData?.medicalHistory && profileData.medicalHistory.length > 0 && (
            <View style={[s.mb4]}>
              <Text style={[s.textSm, s.fontSemibold, s.textGray600, s.mb2]}>Medical Conditions</Text>
              {profileData.medicalHistory.map((condition, index) => (
                <View key={index} style={[{ backgroundColor: colors.primary[100] }, s.px3, s.py1, s.roundedFull, s.mr2, s.mb2, s.selfStart]}>
                  <Text style={[s.textSm, { color: colors.primary[700] }]}>{condition.condition}</Text>
                </View>
              ))}
            </View>
          )}
          
          {profileData?.allergies && profileData.allergies.length > 0 && (
            <View>
              <Text style={[s.textSm, s.fontSemibold, s.textGray600, s.mb2]}>Allergies</Text>
              <View style={[s.flexRow, s.flexWrap]}>
                {profileData.allergies.map((allergy, index) => (
                  <View key={index} style={[{ backgroundColor: colors.warning[100] }, s.px3, s.py1, s.roundedFull, s.mr2, s.mb2]}>
                    <Text style={[s.textSm, { color: colors.warning[700] }]}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Edit Modal */}
      <PatientEditModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        editForm={editForm}
        onUpdateField={handleUpdateField}
        onSave={handleSaveProfile}
        saving={saving}
      />
    </View>
  );
}
