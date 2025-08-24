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
        <Stack.Screen name="screens/PatientProfile" />
        <Stack.Screen name="screens/PatientDashboard" />
        <Stack.Screen name="screens/PatientMap" />
        <Stack.Screen name="navigation/MainTabs" />
      </Stack>
    </GestureHandlerRootView>
  );
}
