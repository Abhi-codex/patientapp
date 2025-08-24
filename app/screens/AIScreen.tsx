import { fetchGeminiResponse } from '../../utils/gemini';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, styles } from '../../constants/tailwindStyles';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'ai_welcome',
      text: 'Hi! How can I assist you today?',
      sender: 'ai',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // For Gemini API: maintain a history of user/ai messages for context
  const [history, setHistory] = useState<{role: string, parts: {text: string}[]}[]>([
    { role: 'model', parts: [{ text: 'Hi! How can I assist you today?' }] }
  ]);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    // Use timestamp + random for unique ID
    const userMessageId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const userMessage: Message = {
      id: userMessageId,
      text: inputText,
      sender: 'user',
    };

    setMessages(prev => [userMessage, ...prev]);
    setInputText('');
    setLoading(true);

    try {
      // Add user message to history for Gemini context
      const newHistory = [...history, { role: 'user', parts: [{ text: inputText }] }];
      setHistory(newHistory);

      // Fetch Gemini response
      const aiText = await fetchGeminiResponse(inputText, newHistory);
      const aiMessageId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const aiMessage: Message = {
        id: aiMessageId,
        text: aiText,
        sender: 'ai',
      };
      setMessages(prev => [aiMessage, ...prev]);
      setHistory([...newHistory, { role: 'model', parts: [{ text: aiText }] }]);
    } catch (error) {
      // Log the error for debugging
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

  // Use getBubbleStyle and getTextStyle for message rendering
  const renderItem = ({ item }: { item: Message }) => (
    <View style={getBubbleStyle(item.sender)}>
      <Text style={getTextStyle(item.sender)}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex1, styles.pt8, styles.bgGray100]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.p4, styles.flexGrow,styles.justifyEnd]}
        inverted
        keyboardShouldPersistTaps="handled"
      />

      {loading && <ActivityIndicator size="large" color={colors.primary[600]} style={[styles.mb3]} />}

      <View style={[styles.flexRow, styles.px4, styles.alignCenter]}>
        <TextInput
          style={[styles.flex1, styles.inputDefault, styles.bgGray100, styles.roundedFull, styles.textBase, styles.mr2]}
          placeholder="Type your message..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          editable={!loading}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.buttonPrimary, styles.px4, styles.py2, styles.roundedFull, styles.shadowSm, loading && styles.opacity50]}
          onPress={sendMessage}
          disabled={loading}
        >
          <Text style={[styles.textWhite, styles.fontSemibold, styles.textBase]}>Send</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.pb8]}/>
    </KeyboardAvoidingView>
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

// Patch renderItem to use new bubble/text styles
const renderItem = ({ item }: { item: Message }) => (
  <View style={getBubbleStyle(item.sender)}>
    <Text style={getTextStyle(item.sender)}>
      {item.text}
    </Text>
  </View>
);