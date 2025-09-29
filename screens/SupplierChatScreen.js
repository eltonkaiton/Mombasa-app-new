import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import io from 'socket.io-client';
import { MaterialIcons } from '@expo/vector-icons';

const SOCKET_SERVER_URL = 'http://192.168.100.8:3000'; // Replace with your backend IP
const ROOM_ID = 'supplier_123_inventory_1'; // Unique room for supplier ↔ inventory

const SupplierChatScreen = () => {
  const [chatStarted, setChatStarted] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const socketRef = useRef();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulsing icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsing button
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (chatStarted) {
      // Connect to Socket.io when chat starts
      socketRef.current = io(SOCKET_SERVER_URL);

      socketRef.current.emit('join_room', ROOM_ID);

      socketRef.current.on('receive_message', (data) => {
        setMessages((prev) => [...prev, data]);
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [chatStarted]);

  const handleStartChat = () => {
    setChatStarted(true);
  };

  const handleSend = () => {
    if (message.trim() === '') return;

    const newMessage = {
      message,
      sender: 'supplier',
    };

    socketRef.current.emit('send_message', { roomId: ROOM_ID, ...newMessage });
    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'supplier' ? styles.supplierBubble : styles.inventoryBubble,
      ]}
    >
      <Text style={styles.messageText}>{item.message}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {!chatStarted ? (
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <MaterialIcons name="chat" size={80} color="#0077b6" />
          </Animated.View>
          <Text style={styles.title}>Supplier Chat</Text>
          <Text style={styles.placeholder}>Tap below to start chatting with Inventory Staff.</Text>

          <TouchableWithoutFeedback onPress={handleStartChat}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Start Chat</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      ) : (
        <View style={{ flex: 1, width: '100%' }}>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ padding: 20 }}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef6fa', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0077b6', marginTop: 15, textAlign: 'center' },
  placeholder: { fontSize: 16, color: '#555', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
  button: {
    marginTop: 25,
    backgroundColor: '#0077b6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  inputContainer: { flexDirection: 'row', padding: 10, marginBottom: 10 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: { backgroundColor: '#0077b6', borderRadius: 25, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  sendButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  messageBubble: { padding: 10, borderRadius: 20, marginVertical: 5, maxWidth: '70%' },
  supplierBubble: { backgroundColor: '#0077b6', alignSelf: 'flex-end' },
  inventoryBubble: { backgroundColor: '#555', alignSelf: 'flex-start' },
  messageText: { color: '#fff', fontSize: 16 },
});

export default SupplierChatScreen;
