import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServerUrl } from './network';

let Notifications: any = null;
let hasNotifications = false;
try {
  // Runtime require so bundler doesn't fail if package is not installed yet
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
  hasNotifications = !!Notifications;
} catch (err) {
  // Package not installed — we'll provide no-op fallbacks below
  console.warn('expo-notifications not installed; notifications will be disabled until installed.');
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!hasNotifications) {
    console.warn('registerForPushNotificationsAsync called but expo-notifications is not available.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notifications permission not granted');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data as string;

    // Persist token locally and try to register with backend
    try {
      await AsyncStorage.setItem('push_token', token);
    } catch (e) {
      // ignore
    }

    try {
      const auth = await AsyncStorage.getItem('access_token');
      if (auth) {
        await fetch(`${getServerUrl()}/patient/push/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
          body: JSON.stringify({ token }),
        });
      }
    } catch (e) {
      console.log('Failed to register push token with backend', e);
    }

    return token;
  } catch (err) {
    console.warn('registerForPushNotificationsAsync error', err);
    return null;
  }
}

export async function showLocalNotification(title: string, body: string) {
  if (!hasNotifications) {
    console.warn('showLocalNotification called but expo-notifications is not available.');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch (e) {
    console.warn('Failed to show local notification', e);
  }
}

export default {
  registerForPushNotificationsAsync,
  showLocalNotification,
};
