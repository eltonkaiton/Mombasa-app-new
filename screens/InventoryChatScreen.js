// InventoryChatScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

const BASE_URL = 'http://192.168.100.8:3000/api/inventory/chat';
const SOCKET_URL = 'http://192.168.100.8:3000';

export default function InventoryChatScreen({ route, navigation }) {
  const roomId = route?.params?.roomId ?? '';
  const userName = route?.params?.userName ?? 'Unknown';

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState('');

  const socketRef = useRef(null);
  const flatListRef = useRef();

  // Load JWT token
  useEffect(() => {
    AsyncStorage.getItem('token')
      .then((t) => t && setToken(t))
      .finally(() => setLoading(false));
  }, []);

  // Fetch previous messages
  const fetchMessages = async () => {
    if (!token || !roomId) return;
    try {
      const res = await axios.get(`${BASE_URL}/all/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data || []);
      scrollToEnd();
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // Socket.io connection
  useEffect(() => {
    if (!token || !roomId) return;

    const socket = io(SOCKET_URL, {
      extraHeaders: { Authorization: `Bearer ${token}` },
    });

    socketRef.current = socket;

    socket.emit('join_room', roomId);

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToEnd();
    });

    // Typing indicator
    socket.on('user_typing', ({ sender }) => {
      if (sender !== userName) setTyping(`${sender} is typing...`);
      setTimeout(() => setTyping(''), 1500);
    });

    return () => socket.disconnect();
  }, [token, roomId]);

  // Fetch old messages once
  useEffect(() => {
    fetchMessages();
  }, [token, roomId]);

  // Send message
  const sendMessage = () => {
    if (!inputMessage.trim() || !roomId) return;

    const messageData = { roomId, message: inputMessage.trim(), sender: userName };

    // Emit live message
    socketRef.current?.emit('send_message', messageData);

    // Emit typing stop
    socketRef.current?.emit('user_typing', { roomId, sender: userName });

    // Optimistic update
    setMessages((prev) => [...prev, { ...messageData, timestamp: new Date() }]);
    setInputMessage('');
    scrollToEnd();
  };

  // Emit typing while typing
  const handleTyping = (text) => {
    setInputMessage(text);
    socketRef.current?.emit('user_typing', { roomId, sender: userName });
  };

  // Scroll to latest
  const scrollToEnd = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  };

  // Render message
  const renderMessage = ({ item }) => {
    const isOwn = item.sender === userName;
    return (
      <View
        style={[styles.messageContainer, isOwn ? styles.myMessage : styles.otherMessage]}
      >
        <Text style={styles.sender}>{isOwn ? 'You' : item.sender}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp
            ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077b6" />
      </View>
    );
  }

  if (!roomId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red' }}>No room selected. Cannot load chat.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 10 }}
        />

        {typing ? <Text style={styles.typingIndicator}>{typing}</Text> : null}

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Type a message..."
            value={inputMessage}
            onChangeText={handleTyping}
            style={styles.input}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inputRow: { flexDirection: 'row', padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ccc' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 8, backgroundColor: '#fff' },
  sendButton: { backgroundColor: '#0077b6', borderRadius: 20, padding: 10, justifyContent: 'center', alignItems: 'center' },
  messageContainer: { marginVertical: 4, padding: 10, borderRadius: 10, maxWidth: '75%' },
  myMessage: { backgroundColor: '#0077b6', alignSelf: 'flex-end' },
  otherMessage: { backgroundColor: '#e0e0e0', alignSelf: 'flex-start' },
  message: { color: '#fff' },
  sender: { fontWeight: 'bold', marginBottom: 2, color: '#fff' },
  timestamp: { fontSize: 10, marginTop: 2, color: '#f0f0f0', alignSelf: 'flex-end' },
  typingIndicator: { fontStyle: 'italic', color: '#555', marginHorizontal: 10, marginBottom: 5 },
});
