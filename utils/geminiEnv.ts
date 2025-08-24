import Constants from 'expo-constants';
export const getGeminiApiKey = () => {
  return Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || '';
};

export const getGeminiApiUrl = () => {
  const key = getGeminiApiKey();
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${key}`;
};
