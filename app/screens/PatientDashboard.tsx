import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from "react-native";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, styles } from '../../constants/tailwindStyles';

export default function PatientDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getUserName();
  }, []);

  const getUserName = async () => {
    try {
      // Try to get name from profile data or use 'Patient' as default
      const storedProfile = await AsyncStorage.getItem('user_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setUserName(profile.name || 'Patient');
      } else {
        setUserName('Patient');
      }
    } catch (error) {
      setUserName('Patient');
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'Do you want to call emergency services?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Call 112',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:112');
          },
        },
      ]
    );
  };

  const handleBookAmbulance = () => {
    // Navigate to emergency selection screen
    router.push('/screens/EmergencyScreen');
  };

  const handleTrackEmergency = () => {
    router.push('/screens/Tracking');
  };

  const handleAIAssistant = () => {
    router.push('/screens/AIScreen');
  };

  const DashboardCard = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    backgroundColor = colors.white,
    textColor = colors.gray[900],
    iconColor = colors.gray[600]
  }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    backgroundColor?: string;
    textColor?: string;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.p4,
        styles.roundedLg,
        styles.mb4,
        {
          backgroundColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }
      ]}
    >
      <View style={[styles.flexRow, styles.alignCenter]}>
        <View style={[styles.p3, styles.roundedFull, { backgroundColor: colors.gray[100] }]}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={[styles.ml4, styles.flex1]}>
          <Text style={[styles.textLg, styles.fontBold, { color: textColor }]}>
            {title}
          </Text>
          <Text style={[styles.textSm, { color: textColor, opacity: 0.7 }]}>
            {subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={iconColor} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={[styles.flex1, { backgroundColor: colors.gray[50] }]}
      contentContainerStyle={{ 
        paddingTop: insets.top,
        paddingBottom: 85 + Math.max(insets.bottom - 8, 0), // Account for tab bar height
      }}
    >
      <View style={[styles.px4, styles.py6]}>
        {/* Welcome Header */}
        <View style={[styles.mb6]}>
          <Text style={[styles.text2xl, styles.fontBold, styles.textGray900]}>
            Welcome back, {userName}!
          </Text>
          <Text style={[styles.textBase, styles.textGray600, styles.mt1]}>
            Your emergency assistance is just a tap away
          </Text>
        </View>

        {/* Emergency Actions */}
        <View style={[styles.mb6]}>
          <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb4]}>
            Emergency Actions
          </Text>
          
          {/* Emergency Call Button */}
          <TouchableOpacity
            onPress={handleEmergencyCall}
            style={[
              styles.wFull,
              styles.py6,
              styles.alignCenter,
              styles.roundedLg,
              styles.mb4,
              {
                backgroundColor: colors.danger[600],
                shadowColor: colors.danger[600],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }
            ]}
          >
            <Ionicons name="call" size={32} color={colors.white} />
            <Text style={[styles.textWhite, styles.textXl, styles.fontBold, styles.mt2]}>
              Emergency Call
            </Text>
            <Text style={[styles.textWhite, styles.textSm, { opacity: 0.9 }]}>
              Call 112 for immediate help
            </Text>
          </TouchableOpacity>

          {/* Book Ambulance */}
          <DashboardCard
            icon="car-outline"
            title="Book Ambulance"
            subtitle="Request an ambulance to your location"
            onPress={handleBookAmbulance}
            backgroundColor={colors.primary[600]}
            textColor={colors.white}
            iconColor={colors.white}
          />

          {/* Quick Emergency Booking */}
          <TouchableOpacity
            onPress={handleBookAmbulance}
            style={[
              styles.wFull,
              styles.py4,
              styles.alignCenter,
              styles.roundedLg,
              styles.mb4,
              {
                backgroundColor: colors.warning[500],
                shadowColor: colors.warning[500],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }
            ]}
          >
            <Ionicons name="medical" size={32} color={colors.white} />
            <Text style={[styles.textWhite, styles.textXl, styles.fontBold, styles.mt2]}>
              Medical Emergency
            </Text>
            <Text style={[styles.textWhite, styles.textSm, { opacity: 0.9 }]}>
              Select emergency type & book ambulance
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Services */}
        <View style={[styles.mb6]}>
          <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb4]}>
            Quick Services
          </Text>

          <DashboardCard
            icon="location-outline"
            title="Track Emergency"
            subtitle="Track your emergency request status"
            onPress={handleTrackEmergency}
          />

          <DashboardCard
            icon="chatbubbles-outline"
            title="AI Health Assistant"
            subtitle="Get instant health advice and guidance"
            onPress={handleAIAssistant}
          />

          <DashboardCard
            icon="person-outline"
            title="My Profile"
            subtitle="View and update your medical information"
            onPress={() => router.push('/screens/PatientProfile')}
          />
        </View>

        {/* Emergency Contacts */}
        <View style={[styles.bgWhite, styles.roundedLg, styles.p4, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }]}>
          <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb4]}>
            Emergency Contacts
          </Text>
          
          <View style={[styles.flexRow, styles.justifyBetween, styles.alignCenter, styles.py2]}>
            <View>
              <Text style={[styles.textBase, styles.fontMedium, styles.textGray900]}>Police</Text>
              <Text style={[styles.textSm, styles.textGray600]}>100</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('tel:100')}>
              <Ionicons name="call-outline" size={24} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>

          <View style={[styles.flexRow, styles.justifyBetween, styles.alignCenter, styles.py2]}>
            <View>
              <Text style={[styles.textBase, styles.fontMedium, styles.textGray900]}>Fire Service</Text>
              <Text style={[styles.textSm, styles.textGray600]}>101</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('tel:101')}>
              <Ionicons name="call-outline" size={24} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>

          <View style={[styles.flexRow, styles.justifyBetween, styles.alignCenter, styles.py2]}>
            <View>
              <Text style={[styles.textBase, styles.fontMedium, styles.textGray900]}>Ambulance</Text>
              <Text style={[styles.textSm, styles.textGray600]}>108</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('tel:108')}>
              <Ionicons name="call-outline" size={24} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
