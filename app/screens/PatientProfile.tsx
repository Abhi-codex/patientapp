import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, styles } from '../../constants/tailwindStyles';
import { getServerUrl } from '../../utils/network';
import { OTPAuth } from '../../utils/otpauth';

interface PatientData {
  name?: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  medicalConditions?: string;
  allergies?: string;
  address?: string;
}

export default function PatientProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<PatientData>({});

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

      const response = await fetch(`${getServerUrl()}/patient/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.profile || {});
      } else {
        console.error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/screens/ProfileForm');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await OTPAuth.signOut();
              router.replace('/screens/PatientAuth');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, { backgroundColor: colors.gray[50] }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.mt4, styles.textBase, styles.textGray600]}>Loading profile...</Text>
      </View>
    );
  }

  const ProfileItem = ({ icon, label, value }: { icon: string, label: string, value?: string | number }) => (
    <View style={[styles.flexRow, styles.alignCenter, styles.py3, styles.borderB, { borderBottomColor: colors.gray[200] }]}>
      <Ionicons name={icon as any} size={20} color={colors.gray[600]} style={[styles.mr3]} />
      <View style={[styles.flex1]}>
        <Text style={[styles.textSm, styles.textGray500]}>{label}</Text>
        <Text style={[styles.textBase, styles.textGray900, styles.fontMedium]}>
          {value || 'Not provided'}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.flex1, { backgroundColor: colors.gray[50] }]}>
      <View style={[styles.px4, styles.py6]}>
        {/* Header with edit button */}
        <View style={[styles.flexRow, styles.justifyBetween, styles.alignCenter, styles.mb6]}>
          <View>
            <Text style={[styles.text2xl, styles.fontBold, styles.textGray900]}>
              {profileData.name || 'Patient Profile'}
            </Text>
            <Text style={[styles.textBase, styles.textGray600]}>
              Manage your personal information
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleEditProfile}
            style={[styles.p3, styles.roundedFull, { backgroundColor: colors.primary[100] }]}
          >
            <Ionicons name="pencil" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Profile Information Card */}
        <View style={[styles.bgWhite, styles.roundedLg, styles.p4, styles.mb4, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }]}>
          <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb4]}>
            Personal Information
          </Text>
          
          <ProfileItem icon="person-outline" label="Full Name" value={profileData.name} />
          <ProfileItem icon="call-outline" label="Phone Number" value={profileData.phone} />
          <ProfileItem icon="mail-outline" label="Email" value={profileData.email} />
          <ProfileItem icon="calendar-outline" label="Age" value={profileData.age} />
          <ProfileItem icon="person-outline" label="Gender" value={profileData.gender} />
          <ProfileItem icon="water-outline" label="Blood Group" value={profileData.bloodGroup} />
        </View>

        {/* Emergency Information Card */}
        <View style={[styles.bgWhite, styles.roundedLg, styles.p4, styles.mb4, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }]}>
          <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb4]}>
            Emergency Information
          </Text>
          
          <ProfileItem icon="call-outline" label="Emergency Contact" value={profileData.emergencyContact} />
          <ProfileItem icon="location-outline" label="Address" value={profileData.address} />
          <ProfileItem icon="medical-outline" label="Medical Conditions" value={profileData.medicalConditions} />
          <ProfileItem icon="warning-outline" label="Allergies" value={profileData.allergies} />
        </View>

        {/* Actions */}
        <View style={[styles.mt6]}>
          <TouchableOpacity
            onPress={handleEditProfile}
            style={[styles.wFull, styles.py4, styles.alignCenter, styles.roundedLg, styles.mb3, { backgroundColor: colors.primary[600] }]}
          >
            <Text style={[styles.textWhite, styles.textLg, styles.fontBold]}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            style={[styles.wFull, styles.py4, styles.alignCenter, styles.roundedLg, { backgroundColor: colors.danger[600] }]}
          >
            <Text style={[styles.textWhite, styles.textLg, styles.fontBold]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
