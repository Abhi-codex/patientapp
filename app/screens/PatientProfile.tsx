import React from "react";
import { View, Text } from "react-native";

export default function PatientProfile() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>Patient Profile</Text>
      <Text style={{ fontSize: 16, color: '#6b7280' }}>Profile details and completion form goes here.</Text>
    </View>
  );
}
