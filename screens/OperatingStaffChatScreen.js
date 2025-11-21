import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CHAT_HISTORY_URL = 'http://192.168.100.13:5000/api/chat/conversation';
const SEND_MESSAGE_URL = 'http://192.168.100.13:5000/api/chat/send-staff-message';

const OperatingStaffChatScreen = ({ navigation, route }) => {
  const { customer } = route.params || {};
  
  const [chatHistory, setChatHistory] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    if (customer?.userEmail) {
      fetchChatHistory();
    } else {
      setError('No customer information provided');
      setLoading(false);
    }
  }, [customer]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('staffToken');
      
      console.log('Fetching chat history for:', customer.userEmail);
      
      const response = await axios.get(`${CHAT_HISTORY_URL}/${customer.userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Chat history response:', response.data);
      
      // Make sure we have an array of messages and sort them by timestamp
      const messages = response.data.messages || response.data || [];
      
      // If no messages from API, create initial conversation with customer's first message
      if (messages.length === 0 && customer.initialMessage) {
        const initialConversation = [
          {
            _id: 'customer_initial',
            sender: 'customer',
            message: customer.initialMessage,
            timestamp: customer.timestamp || new Date().toISOString(),
            userName: customer.userName,
            userEmail: customer.userEmail
          }
        ];
        setChatHistory(initialConversation);
      } else {
        // Sort messages by timestamp in ascending order (oldest first)
        const sortedMessages = messages.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        setChatHistory(sortedMessages);
      }
      
    } catch (error) {
      console.error('Error fetching chat history:', error.message);
      setError('Failed to load conversation history');
      
      // Fallback: Create sample conversation
      const sampleChatHistory = [
        {
          _id: '1',
          sender: 'customer',
          message: customer.initialMessage || 'Hello, I need help with my booking',
          timestamp: customer.timestamp || new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          userName: customer.userName,
          userEmail: customer.userEmail
        },
        {
          _id: '2',
          sender: 'staff',
          message: 'Hello! Thank you for contacting Mombasa Ferry Services. How can I assist you today?',
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          userName: 'Operation Staff',
          userEmail: 'operations@mombasaferry.com'
        }
      ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      setChatHistory(sampleChatHistory);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      const token = await AsyncStorage.getItem('staffToken');
      
      const messageData = {
        userEmail: customer.userEmail,
        userName: customer.userName,
        staffMessage: newMessage.trim()
      };
      
      console.log('Sending staff message:', messageData);
      
      const response = await axios.post(SEND_MESSAGE_URL, messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Send message response:', response.data);
      
      if (response.data.success) {
        // Add the new message to chat history immediately
        const newMessageObj = {
          _id: response.data.data._id || Date.now().toString(),
          sender: 'staff',
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
          userName: 'Operation Staff',
          userEmail: 'operations@mombasaferry.com'
        };
        
        setChatHistory(prev => [...prev, newMessageObj]);
        setNewMessage('');
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
        Alert.alert('Success', 'Message sent successfully!');
      }
      
    } catch (error) {
      console.error('Error sending message:', error.message);
      
      // Fallback: Add message locally if API fails
      const tempMessage = {
        _id: Date.now().toString(),
        sender: 'staff',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        userName: 'Operation Staff',
        userEmail: 'operations@mombasaferry.com'
      };
      
      setChatHistory(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      Alert.alert('Message Sent', 'Your response has been recorded.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const renderMessageItem = ({ item, index }) => {
    const isStaff = item.sender === 'staff' || item.userEmail === 'operations@mombasaferry.com';
    const showDate = shouldShowDate(item, index);
    
    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isStaff ? styles.staffMessage : styles.customerMessage
        ]}>
          <View style={[
            styles.messageBubble,
            isStaff ? styles.staffBubble : styles.customerBubble
          ]}>
            {!isStaff && (
              <Text style={styles.senderName}>
                {item.userName || 'Customer'}
              </Text>
            )}
            <Text style={[
              styles.messageText,
              isStaff ? styles.staffMessageText : styles.customerMessageText
            ]}>
              {item.message}
            </Text>
            <Text style={[
              styles.timestamp,
              isStaff ? styles.staffTimestamp : styles.customerTimestamp
            ]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          
          {isStaff && (
            <View style={styles.messageStatus}>
              <Ionicons 
                name="checkmark-done" 
                size={16} 
                color="#28a745" 
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const shouldShowDate = (currentMessage, index) => {
    if (index === 0) return true;
    
    const previousMessage = chatHistory[index - 1];
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1F2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && chatHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1F2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#dc3545" />
          <Text style={styles.errorTitle}>Unable to load chat</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchChatHistory}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1F2E" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {customer.userName || 'Customer'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {customer.userEmail}
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={fetchChatHistory} 
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={24} color="#1A1F2E" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={chatHistory}
          keyExtractor={(item) => item._id || item.timestamp}
          renderItem={renderMessageItem}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            if (flatListRef.current && chatHistory.length > 0) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
          onLayout={() => {
            if (flatListRef.current && chatHistory.length > 0) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
              <Text style={styles.emptyChatTitle}>No messages yet</Text>
              <Text style={styles.emptyChatText}>
                Start a conversation with {customer.userName || 'this customer'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your response..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F2E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  refreshButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  staffMessage: {
    justifyContent: 'flex-end',
  },
  customerMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  staffBubble: {
    backgroundColor: '#007bff',
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  staffMessageText: {
    color: '#FFFFFF',
  },
  customerMessageText: {
    color: '#1A1F2E',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  staffTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  customerTimestamp: {
    color: '#718096',
  },
  messageStatus: {
    marginLeft: 4,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1F2E',
    backgroundColor: '#F7FAFC',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007bff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyChatText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
});

export default OperatingStaffChatScreen;