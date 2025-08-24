import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/tailwindStyles';

export default function IndexScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [accessToken, role, profileComplete] = await AsyncStorage.multiGet([
        'access_token',
        'role', 
        'profile_complete'
      ]);

      const token = accessToken[1];
      const userRole = role[1];
      const isProfileComplete = profileComplete[1] === 'true';

      console.log('[INDEX] Auth check:', { 
        hasToken: !!token, 
        role: userRole, 
        profileComplete: isProfileComplete 
      });

      if (token && userRole === 'patient') {
        if (isProfileComplete) {
          router.replace('/navigation/MainTabs');
        } else {
          router.replace('/screens/ProfileForm');
        }
      } else {
        router.replace('/screens/PatientAuth');
      }
    } catch (error) {
      console.error('[INDEX] Auth check error:', error);
      router.replace('/screens/PatientAuth');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.gray[50] 
      }}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return null;
}