import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/tailwindStyles';
import { OTPAuth } from '../../utils/otpauth';
import { useRouter } from 'expo-router';

export default function MainTabs() {
  const router = useRouter();

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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[600] || '#3B82F6',
        tabBarInactiveTintColor: colors.gray[500] || '#6B7280',
        tabBarStyle: {
          backgroundColor: colors.white || '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.gray[200] || '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.white || '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[200] || '#E5E7EB',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.gray[900] || '#111827',
        },
        headerTintColor: colors.gray[900] || '#111827',
      }}
    >
      <Tabs.Screen 
        name="../screens/PatientDashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'InstaAid Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={size} 
              color={color} 
            />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSignOut}
              style={{ marginRight: 16 }}
            >
              <Ionicons 
                name="log-out-outline" 
                size={24} 
                color={colors.gray[600] || '#6B7280'} 
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen 
        name="../screens/EmergencyScreen"
        options={{
          title: 'Emergency',
          headerTitle: 'Book Emergency Ride',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'medical' : 'medical-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="../screens/AIScreen"
        options={{
          title: 'AI Chat',
          headerTitle: 'AI Assistant',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="../screens/Tracking"
        options={{
          title: 'Tracking',
          headerTitle: 'Track Emergency',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'location' : 'location-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="../screens/PatientProfile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={size} 
              color={color} 
            />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSignOut}
              style={{ marginRight: 16 }}
            >
              <Text style={{ 
                color: colors.danger[600] || '#DC2626', 
                fontSize: 14, 
                fontWeight: '600' 
              }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}