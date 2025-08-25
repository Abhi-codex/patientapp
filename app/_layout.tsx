import React from 'react';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="screens/PatientAuth" />
        <Stack.Screen name="screens/OtpScreen" />
        <Stack.Screen name="screens/ProfileForm" />
        <Stack.Screen name="screens/PatientDashboard" />
        <Stack.Screen name="screens/AppointmentScreen" />
        <Stack.Screen name="screens/MedicineScreen" />
        <Stack.Screen name="screens/PatientProfile" />
        <Stack.Screen name="screens/AIScreen" />
        <Stack.Screen name="screens/EmergencyScreen" />
        <Stack.Screen name="screens/BookingScreen" />
        <Stack.Screen name="screens/Tracking" />
        <Stack.Screen name="navigation/MainTabs" />
      </Stack>
    </GestureHandlerRootView>
  );
}
