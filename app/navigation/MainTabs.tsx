import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Alert, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/tailwindStyles';
import { OTPAuth } from '../../utils/otpauth';
import { useRouter } from 'expo-router';

// Import screen components
import PatientDashboard from '../screens/PatientDashboard';
import PatientProfile from '../screens/PatientProfile';
import AIChatScreen from '../screens/AIScreen';
import TrackingScreen from '../screens/Tracking';
import EmergencyScreen from '../screens/EmergencyScreen';

const Tab = createBottomTabNavigator();

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
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        headerShown: true,
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
      <Tab.Screen 
        name="Dashboard" 
        component={PatientDashboard}
        options={{
          headerTitle: 'InstaAid Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{ width: 20, height: 3, backgroundColor: colors.primary[600] || '#3B82F6', borderRadius: 2, marginBottom: 5 }} />
              )}
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={size} 
                color={color} 
              />
            </View>
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
      <Tab.Screen 
        name="Emergency" 
        component={EmergencyScreen}
        options={{
          headerTitle: 'Book Emergency Ride',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{ width: 20, height: 3, backgroundColor: colors.primary[600] || '#3B82F6', borderRadius: 2, marginBottom: 5 }} />
              )}
              <Ionicons 
                name={focused ? 'medical' : 'medical-outline'} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="AI Chat" 
        component={AIChatScreen}
        options={{
          headerTitle: 'AI Assistant',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{ width: 20, height: 3, backgroundColor: colors.primary[600] || '#3B82F6', borderRadius: 2, marginBottom: 5 }} />
              )}
              <Ionicons 
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Tracking" 
        component={TrackingScreen}
        options={{
          headerTitle: 'Track Emergency',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{ width: 20, height: 3, backgroundColor: colors.primary[600] || '#3B82F6', borderRadius: 2, marginBottom: 5 }} />
              )}
              <Ionicons 
                name={focused ? 'location' : 'location-outline'} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={PatientProfile}
        options={{
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{ width: 20, height: 3, backgroundColor: colors.primary[600] || '#3B82F6', borderRadius: 2, marginBottom: 5 }} />
              )}
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={size} 
                color={color} 
              />
            </View>
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
    </Tab.Navigator>
  );
}