import React from 'react';
import { View, Text } from 'react-native';
import { styles as s } from '../../constants/tailwindStyles';

export default function AppointmentsScreen() {
  return (
    <View style={[s.flex1, s.bgGray50]}>
      {/* Content Area */}
      <View style={[s.flex1, s.justifyCenter, s.alignCenter]}>
        <Text style={[s.textXl, s.fontSemibold, s.textGray700]}>Appointments Screen</Text>
        <Text style={[s.textBase, s.textGray500, s.mt2]}>Coming Soon...</Text>
      </View>
    </View>
  );
}
