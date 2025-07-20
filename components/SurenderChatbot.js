import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SurenderChatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I am Surender, your farming assistant 🌾. Ask me anything about farming!', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height * 0.7)).current;
  const insets = useSafeAreaInsets();

  const GEMINI_API_KEY = 'AIzaSyADQotpPZOPC0DDtpWwRebs62g3A4GNqoA';  // 🔑 Replace with your API key
  const MAX_REPLY_LENGTH = 300;  // Adjust as needed

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const fetchBotReplyFromGemini = async (userMessage) => {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

      const concisePrompt = `Please answer concisely in 2-3 sentences: ${userMessage}`;

      const response = await axios.post(
        endpoint,
        {
          contents: [{ parts: [{ text: concisePrompt }] }]
        }
      );

      let reply = response.data.candidates[0].content.parts[0].text.trim();

      if (reply.length > MAX_REPLY_LENGTH) {
        reply = reply.substring(0, MAX_REPLY_LENGTH) + '...';
      }

      return reply;

    } catch (error) {
      console.error('Gemini API error:', error.response ? error.response.data : error.message);
      return "I'm unable to respond right now. Please try again.";
    }
  };

  const handleSend = async () => {
    if (input.trim() === '' || isTyping) return;

    const userMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const botReplyText = await fetchBotReplyFromGemini(input);

    const botReply = { id: (Date.now() + 1).toString(), text: botReplyText, sender: 'bot' };
    setMessages((prev) => [...prev, botReply]);
    setIsTyping(false);
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.chatbotModalContainer, { height: height * 0.7 }]}>
        <SafeAreaView style={styles.safeAreaContent}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 10 : 0}
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Image source={require('../assets/remove.png')} style={styles.iconImageRegular} />
            </TouchableOpacity>

            <View style={styles.header}>
              <Image source={require('../assets/farmer.png')} style={styles.avatar} />
              <Text style={styles.headerTitle}>Surender Farmer</Text>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={styles.messageList}
              contentContainerStyle={{ paddingVertical: 10 }}
            />

            {isTyping && (
              <View style={styles.typingIndicatorContainer}>
                <Text style={styles.typingIndicatorText}>Surender is typing...</Text>
                <ActivityIndicator size="small" color="#76B947" />
              </View>
            )}

            <View style={[styles.inputContainer, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0 }]}>
              <TextInput
                style={styles.input}
                placeholder="Ask Surender something..."
                placeholderTextColor="#888"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                <Image source={require('../assets/send.png')} style={styles.iconImageSmall} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Animated.View>
  );
};

// Keep styles same as before...
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 999, elevation: 999 },
  chatbotModalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', width: '100%' },
  safeAreaContent: { flex: 1 },
  keyboardAvoidingContainer: { flex: 1, paddingHorizontal: 15 },
  closeButton: { position: 'absolute', top: 13, right: 10, zIndex: 10, backgroundColor: '#F0F0F0', borderRadius: 20, padding: 5, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', padding: 12, borderRadius: 12, marginBottom: 10, marginTop: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 2, borderColor: '#fff' },
  headerTitle: { fontSize: 19, fontWeight: 'bold', color: '#fff' },
  messageList: { flex: 1, paddingTop: 5 },
  messageBubble: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15, marginBottom: 8, maxWidth: '80%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6', borderBottomRightRadius: 5 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#E0F7FA', borderBottomLeftRadius: 5 },
  messageText: { fontSize: 16, color: '#333', lineHeight: 22 },
  typingIndicatorContainer: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', marginBottom: 10, paddingLeft: 10 },
  typingIndicatorText: { fontSize: 14, color: '#666', marginRight: 5 },
  inputContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 25, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, elevation: 3, marginTop: 10, marginBottom: 70 },
  input: { flex: 1, fontSize: 16, color: '#333', paddingVertical: Platform.OS === 'ios' ? 10 : 8 },
  sendButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 25, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  iconImageRegular: { width: 24, height: 24 },
  iconImageSmall: { width: 18, height: 18 },
});

export default SurenderChatbot;
