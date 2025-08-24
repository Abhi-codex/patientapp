import 'dotenv/config';

export default {
  expo: {
    name: "InstaAid Patient",
    slug: "patientapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    scheme: "acme",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    developmentClient: {
      silentLaunch: true
    },
    splash: {
      image: "./assets/images/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    platforms: [
      "ios",
      "android"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.instaaid.patient",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app uses location to show your position on the map and to help you find rides nearby.",
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.instaaid.patient",
      edgeToEdgeEnabled: true,
      permissions: [
        "android.permission.RECEIVE_SMS",
        "android.permission.READ_SMS",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.CALL_PHONE"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        },
        gemini: {
          apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY
        }
      },
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo.png"
    },
    plugins: [
      "expo-location",
      "expo-router",
      "expo-secure-store"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        "projectId": ""
      },
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY
    }
  }
};
