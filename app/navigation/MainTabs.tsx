import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/tailwindStyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PatientDashboard from '../screens/PatientDashboard';
import PatientProfile from '../screens/PatientProfile';
import AIChatScreen from '../screens/AIScreen';
import TrackingScreen from '../screens/Tracking';
import EmergencyScreen from '../screens/EmergencyScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false, // Remove headers from all screens
        tabBarActiveTintColor: colors.primary[600] || '#3B82F6',
        tabBarInactiveTintColor: colors.gray[500] || '#6B7280',
        tabBarStyle: {
          backgroundColor: colors.white || '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.gray[200] || '#E5E7EB',
          paddingBottom: Math.max(insets.bottom, 8), // Ensure padding above system nav
          paddingTop: 8,
          height: 65 + Math.max(insets.bottom - 8, 0), // Adjust height for safe area
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={PatientDashboard}
        options={{
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
        }}
      />
      <Tab.Screen 
        name="Emergency" 
        component={EmergencyScreen}
        options={{
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
        }}
      />
    </Tab.Navigator>
  );
}