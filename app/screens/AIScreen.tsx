import { fetchGeminiResponse } from '../../utils/gemini';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View, InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, styles } from '../../constants/tailwindStyles';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const extraWarmupOffset = 24;

  // Check if this is the first interaction (no messages yet)
  const isFirstTime = messages.length === 0;

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;
    const userMessageId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const userMessage: Message = {
      id: userMessageId,
      text: inputText,
      sender: 'user',
    };
    setMessages(prev => [userMessage, ...prev]);
    // persist immediately after adding user's message
    try {
      await AsyncStorage.setItem('ai_chat_messages_v1', JSON.stringify([userMessage, ...messages]));
    } catch (e) {
      console.warn('Failed to persist messages', e);
    }
    setInputText('');
    setLoading(true);
    try {
      const newHistory = [...history, { role: 'user', parts: [{ text: inputText }] }];
      setHistory(newHistory);
      // persist history immediately
      try {
        await AsyncStorage.setItem('ai_chat_history_v1', JSON.stringify(newHistory));
      } catch (e) {
        console.warn('Failed to persist history', e);
      }
      const aiText = await fetchGeminiResponse(inputText, newHistory);
      const aiMessageId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const aiMessage: Message = {
        id: aiMessageId,
        text: aiText,
        sender: 'ai',
      };
      setMessages(prev => [aiMessage, ...prev]);
      // persist messages after AI response
      try {
        await AsyncStorage.setItem('ai_chat_messages_v1', JSON.stringify([aiMessage, userMessage, ...messages]));
      } catch (e) {
        console.warn('Failed to persist messages', e);
      }
      setHistory([...newHistory, { role: 'model', parts: [{ text: aiText }] }]);
    } catch (error) {
      console.error('Gemini API error:', error);
      const aiMessageId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setMessages(prev => [{
        id: aiMessageId,
        text: 'Sorry, there was a problem getting a response. Please try again.',
        sender: 'ai',
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  // Storage keys and load/persist logic
  useEffect(() => {
    const loadChat = async () => {
      try {
        const rawMessages = await AsyncStorage.getItem('ai_chat_messages_v1');
        const rawHistory = await AsyncStorage.getItem('ai_chat_history_v1');
        if (rawMessages) {
          const parsed = JSON.parse(rawMessages) as Message[];
          setMessages(parsed);
        }
        if (rawHistory) {
          const parsedH = JSON.parse(rawHistory) as {role: string, parts: {text: string}[]}[];
          setHistory(parsedH);
        }
      } catch (e) {
        console.warn('Failed to load chat history', e);
      }
    };
    loadChat();
    const task = InteractionManager.runAfterInteractions(() => {
      setLayoutReady(true);
    });
    return () => task.cancel && task.cancel();
  }, []);

  // Persist messages + history whenever they change
  useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem('ai_chat_messages_v1', JSON.stringify(messages));
        await AsyncStorage.setItem('ai_chat_history_v1', JSON.stringify(history));
      } catch (e) {
        console.warn('Failed to persist chat state', e);
      }
    };
    persist();
  }, [messages, history]);

  // Chat bubble rendering
  const renderItem = ({ item }: { item: Message }) => (
    <View style={getBubbleStyle(item.sender)}>
      <Text style={getTextStyle(item.sender)}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <View style={[styles.flex1, styles.bgGray100]}>
      {isFirstTime ? (
        // First time experience - centered input
        <KeyboardAvoidingView
          style={[styles.flex1]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.px4]}>
            {loading && <ActivityIndicator size="large" color={colors.primary[600]} style={[styles.mb4]} />}
            
            {/* Centered input */}
            <View style={[
              styles.wFull,
              styles.flexRow,
              styles.alignCenter,
              styles.bgWhite,
              styles.rounded3xl,
              styles.p2,
              styles.shadow,
              { marginBottom: 85 + Math.max(insets.bottom - 8, 0) + (layoutReady ? 0 : extraWarmupOffset) } // tab bar space + warmup offset
            ]}>
              <TextInput
                style={[
                  styles.flex1,
                  styles.textBase,
                  styles.px4,
                  styles.py2,
                  {
                    minHeight: 40,
                    maxHeight: 100,
                  }
                ]}
                placeholder="Type your health question..."
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                editable={!loading}
                blurOnSubmit={false}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.px4,
                  styles.py2,
                  styles.rounded3xl,
                ]}
                onPress={sendMessage}
                disabled={loading || !inputText.trim()}
              >
                <Feather name="send" size={20} color={inputText.trim() && !loading ? colors.black : colors.gray[400]} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        // Chat mode - bottom input
        <KeyboardAvoidingView
          style={[styles.flex1]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.p4,
              styles.flexGrow,
              styles.justifyEnd,
              { paddingBottom: 85 + Math.max(insets.bottom - 8, 0) + (layoutReady ? 0 : extraWarmupOffset) } // tab bar only + warmup offset
            ]}
            inverted
            keyboardShouldPersistTaps="handled"
          />
          {loading && <ActivityIndicator size="large" color={colors.primary[600]} style={[styles.mb3]} />}
          <View style={[
            styles.px4,
            styles.py2,
            styles.alignCenter,
            {
              paddingBottom: 24 + Math.max(insets.bottom, 8) + (layoutReady ? 0 : extraWarmupOffset), // tab bar height + safe area + warmup offset
              borderTopColor: colors.gray[200]
            }
          ]}>
            <View style={[
              styles.wFull,
              styles.flexRow,
              styles.alignCenter,
              styles.bgWhite,
              styles.rounded3xl,
              styles.p2,
              styles.shadow,
            ]}>
              <TextInput
                style={[
                  styles.flex1,
                  styles.textBase,
                  styles.px4,
                  styles.py2,
                  {
                    minHeight: 40,
                    maxHeight: 100,
                  }
                ]}
                placeholder="Type your message..."
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                editable={!loading}
                blurOnSubmit={false}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.px4,
                  styles.py2,
                  styles.rounded3xl,
                ]}
                onPress={sendMessage}
                disabled={loading || !inputText.trim()}
              >
                <Feather name="send" size={20} color={inputText.trim() && !loading ? colors.black : colors.gray[400]} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const getBubbleStyle = (sender: 'user' | 'ai') => [
  { maxWidth: 320 },
  styles.p3,
  styles.rounded2xl,
  styles.mb3,
  sender === 'user'
    ? { backgroundColor: colors.primary[600], alignSelf: 'flex-end' as const, borderTopRightRadius: 0 }
    : { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary[100], alignSelf: 'flex-start' as const, borderTopLeftRadius: 0 },
];

const getTextStyle = (sender: 'user' | 'ai') => [
  sender === 'user'
    ? [styles.textWhite, styles.textBase]
    : [styles.textGray900, styles.textBase],
];