import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/tailwindStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PatientDashboard from '../screens/PatientDashboard';
import PatientProfile from '../screens/PatientProfile';
import AIChatScreen from '../screens/AIScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import AppointmentsScreen from '../screens/AppointmentScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
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
          paddingTop: 4,
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
        name="Home" 
        component={PatientDashboard}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
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
              tabBarActiveTintColor: colors.emergency[500],
              tabBarInactiveTintColor: colors.gray[500],
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <MaterialCommunityIcons 
                    name={focused ? 'car-emergency' : 'ambulance'} 
                    size={28} 
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
        name="Appointment" 
        component={AppointmentsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <FontAwesome
                name={focused ? 'bell' : 'bell-o'} 
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