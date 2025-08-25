import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, styles } from '../../constants/tailwindStyles';
import { getServerUrl } from '../../utils/network';

interface PatientProfile {
  name?: string;
  phone?: string;
  email?: string;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  address?: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          router.replace('/');
          return;
        }
        const res = await fetch(`${getServerUrl()}/patient/profile`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          const user = data.user || data;
          setProfile({ ...user, phone: user?.phone || (await AsyncStorage.getItem('phone')) || '' });
        } else {
          const phone = await AsyncStorage.getItem('phone');
          setProfile({ phone: phone || '' });
        }
      } catch (e) {
        const phone = await AsyncStorage.getItem('phone');
        setProfile({ phone: phone || '' });
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    Animated.timing(dropdownAnim, { toValue: dropdownOpen ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [dropdownOpen]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    router.replace('/');
  };

  const isProfileComplete = !!(profile && profile.name && profile.address && profile.emergencyContact);

  return (
    <View style={[styles.flex1, styles.bgGray50]}>
      {/* Top Profile Bar */}
      <View style={[styles.flexRow, styles.justifyBetween, styles.alignCenter, styles.px5, styles.pt2, styles.pb3, styles.bgWhite, styles.shadow, { zIndex: 10, paddingTop: insets.top }]}> 
        <View style={[styles.flexRow, styles.alignCenter]}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
          <Text style={[styles.text2xl, styles.ml2, styles.fontBold, styles.textEmergency600]}>InstaAid</Text>
        </View>

        <View style={{ position: 'relative' }}>
          <Pressable
            style={[styles.flexRow, styles.alignCenter, styles.p2, styles.bgGray100, styles.roundedXl, styles.shadowSm]}
            onPress={() => setDropdownOpen((v) => !v)}
          >
            <FontAwesome5 name="user-injured" size={18} color={colors.black} />
            <Text style={[styles.textSm, styles.fontSemibold, styles.ml2, { minWidth: 80 }]}> 
              {loadingProfile ? <ActivityIndicator size="small" color={colors.primary[600]} /> : (profile?.phone || '---')}
            </Text>
            <MaterialIcons name={dropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={22} color={colors.gray[700]} />
          </Pressable>

          {dropdownOpen && (
            <Animated.View
              style={{
                transform: [{ scale: dropdownAnim.interpolate({ inputRange: [0,1], outputRange: [0.96,1] }) }],
                position: 'absolute', right: 0, top: 48, backgroundColor: colors.white,
                borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 8,
                minWidth: 180, padding: 10
              }}
            >
              {!isProfileComplete && (
                <TouchableOpacity style={[styles.flexRow, styles.alignCenter, styles.mb3]} onPress={() => { setDropdownOpen(false); router.push('/screens/PatientProfile'); }}>
                  <FontAwesome5 name="user-edit" size={16} color={colors.primary[600]} />
                  <Text style={[styles.ml2, styles.textBase, styles.textPrimary600]}>Complete Profile</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.flexRow, styles.alignCenter]} onPress={handleLogout}>
                <MaterialIcons name="logout" size={18} color={colors.danger[600]} />
                <Text style={[styles.ml2, styles.textBase, styles.textDanger600]}>Logout</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Greeting + Search */}
      <View style={[styles.px5, styles.mt4, styles.mb4]}> 
        <Text style={[styles.text2xl, styles.fontBold, styles.textGray900]}>Hi {profile?.name || 'Patient'}</Text>
        <View style={[styles.flexRow, styles.alignCenter, styles.bgGray100, styles.roundedXl, styles.px4, styles.py3, styles.mt3, styles.shadowSm]}> 
          <Ionicons name="search" size={20} color={colors.gray[500]} />
          <TextInput
            style={[styles.flex1, styles.textBase, styles.ml2]}
            placeholder="Search services..."
            placeholderTextColor={colors.gray[400]}
            editable={false}
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={[styles.flex1, styles.px5]}> 
        <TouchableOpacity
          style={[styles.bgEmergency500, styles.rounded2xl, styles.p6, styles.shadow, styles.mb6, styles.alignCenter]}
          onPress={() => router.push('/screens/EmergencyScreen')}
        >
          <FontAwesome5 name="ambulance" size={44} color={colors.white} />
          <Text style={[styles.text2xl, styles.fontBold, styles.textWhite, styles.mt3]}>Book Ambulance</Text>
          <Text style={[styles.textBase, styles.textWhite, styles.textCenter]}>Quickly book a nearby ambulance in emergency</Text>
        </TouchableOpacity>

        <View style={[styles.flexRow, styles.justifyBetween, styles.gap3]}> 
          <TouchableOpacity
            style={[styles.flex1, styles.bgMedical100, styles.roundedXl, styles.alignCenter, styles.px4, styles.py5, styles.shadowSm]}
            onPress={() => router.push('/screens/MedicineScreen')}
          >
            <FontAwesome5 name="pills" size={28} color={colors.medical ? colors.medical[600] : colors.primary[600]} />
            <Text style={[styles.textLg, styles.fontBold, styles.textMedical600, styles.mt2]}>Medicine</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.flex1, styles.bgPrimary100, styles.roundedXl, styles.alignCenter, styles.px4, styles.py5, styles.shadowSm]}
            onPress={() => router.push('/screens/AIScreen')}
          >
            <Ionicons name="chatbubbles" size={28} color={colors.primary[600]} />
            <Text style={[styles.textLg, styles.fontBold, styles.textPrimary600, styles.mt2]}>AI Assistant</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.bgPrimary500, styles.rounded2xl, styles.p6, styles.shadow, styles.mt6, styles.alignCenter]}
          onPress={() => router.push('/screens/AppointmentScreen')}
        >
          <FontAwesome5 name="user-md" size={44} color={colors.white} />
          <Text style={[styles.text2xl, styles.fontBold, styles.textWhite, styles.mt3]}>Free Consultation</Text>
          <Text style={[styles.textBase, styles.textWhite, styles.textCenter]}>Book an appointment with a doctor instantly for free health advice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
