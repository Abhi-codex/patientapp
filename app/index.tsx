import React from "react";
import { View, Text } from "react-native";

export default function Page() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20 }}>Welcome to InstaAid Patient App</Text>
      <Text style={{ fontSize: 16, color: '#6b7280' }}>This is the entry point for the patient application.</Text>
    </View>
  );
}
