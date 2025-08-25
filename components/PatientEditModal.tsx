import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { styles as s, colors } from '../constants/tailwindStyles';
import { MaterialIcons } from '@expo/vector-icons';
import LabelInput from './LabelInput';

const { height: screenHeight } = Dimensions.get('window');

export interface PatientFormData {
  name: string;
  email: string;
  age: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: string;
  medicalConditions: string;
  allergies: string;
  address: string;
}

interface PatientEditModalProps {
  visible: boolean;
  onClose: () => void;
  editForm: PatientFormData;
  onUpdateField: (key: string, value: any) => void;
  onSave: () => void;
  saving: boolean;
}

export default function PatientEditModal({
  visible,
  onClose,
  editForm,
  onUpdateField,
  onSave,
  saving
}: PatientEditModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[s.flex1, s.justifyEnd, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Pressable style={[s.flex1]} onPress={onClose} />
        
        <View style={[
          s.bgWhite, 
          { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
          { maxHeight: screenHeight * 0.85, minHeight: screenHeight * 0.6 }
        ]}>
          {/* Modal Header */}
          <View style={[s.flexRow, s.justifyBetween, s.alignCenter, s.p5, { borderBottomWidth: 1, borderBottomColor: colors.gray[200] }]}>
            <Text style={[s.textXl, s.fontBold, s.textGray800]}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={[s.flex1]} contentContainerStyle={[s.px5, { paddingBottom: 20 }]}>
            <LabelInput
              label="Full Name"
              value={editForm.name}
              onChangeText={(text) => onUpdateField('name', text)}
              containerStyle={[s.mb4]}
            />

            <LabelInput
              label="Emergency Contact"
              value={editForm.emergencyContact}
              onChangeText={(text) => onUpdateField('emergencyContact', text)}
              keyboardType="phone-pad"
              containerStyle={[s.mb4]}
            />

            <LabelInput
              label="Medical Conditions"
              value={editForm.medicalConditions}
              onChangeText={(text) => onUpdateField('medicalConditions', text)}
              multiline={true}
              numberOfLines={3}
              containerStyle={[s.mb4]}
            />

            <LabelInput
              label="Allergies"
              value={editForm.allergies}
              onChangeText={(text) => onUpdateField('allergies', text)}
              multiline={true}
              numberOfLines={2}
              containerStyle={[s.mb4]}
            />

            <LabelInput
              label="Address"
              value={editForm.address}
              onChangeText={(text) => onUpdateField('address', text)}
              multiline={true}
              numberOfLines={3}
              containerStyle={[s.mb6]}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[
                s.bgPrimary600, 
                s.py4, 
                s.roundedXl, 
                s.alignCenter,
                saving && s.opacity50
              ]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[s.textBase, s.fontSemibold, s.textWhite]}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
