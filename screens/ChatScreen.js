import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_BASE_URL = "https://mombasa-backend.onrender.com";

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // ✅ Load logged-in user from AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await AsyncStorage.getItem("user");
        if (data) {
          const parsedUser = JSON.parse(data);
          console.log("🧍 Loaded user:", parsedUser);
          setUserInfo(parsedUser);
        } else {
          console.warn("⚠️ No user found in AsyncStorage");
          setFetchError("No user found. Please login again.");
        }
      } catch (error) {
        console.error("❌ Error loading user:", error);
        setFetchError("Error loading user data.");
      } finally {
        setIsReady(true);
      }
    };
    loadUser();
  }, []);

  // ✅ Fetch chat messages from backend - IMPROVED ERROR HANDLING
  const fetchMessages = useCallback(async () => {
    if (!userInfo) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      const userId = userInfo._id || userInfo.id;
      console.log("📡 Fetching messages for user ID:", userId);
      
      if (!userId) {
        setFetchError("No user ID found");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/api/chat/messages/${userId}`);
      console.log("✅ Messages response:", res.data);
      
      if (res.data.success) {
        setMessages(res.data.messages || []);
      } else {
        setFetchError("Failed to load messages");
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        setFetchError("Chat endpoint not found. The server might be down.");
      } else if (error.response?.status === 500) {
        setFetchError("Server error. Please try again later.");
      } else {
        setFetchError("Failed to load messages. Check your connection.");
      }
      
      // Set empty messages to avoid crashes
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo) {
      fetchMessages();
    }
  }, [fetchMessages, userInfo]);

  // ✅ Send message - IMPROVED ERROR HANDLING
  const sendMessage = async () => {
    if (!userInfo) {
      Alert.alert("User not found", "Please log in again.");
      return;
    }
    if (!message.trim()) return;

    setLoading(true);
    try {
      const userId = userInfo._id || userInfo.id;
      const payload = {
        userId: userId,
        userName: userInfo.full_name || userInfo.name || "Customer",
        userEmail: userInfo.email || "customer@example.com",
        staffCategory: "operation",
        message: message.trim(),
      };

      console.log("📤 Sending message with payload:", payload);

      const res = await axios.post(`${API_BASE_URL}/api/chat/send-message`, payload);
      console.log("✅ Send message response:", res.data);

      if (res.data.success) {
        // Add both user message and auto staff response to the chat
        const newMessages = [
          ...messages,
          res.data.data.userMessage,
          res.data.data.staffMessage
        ];
        setMessages(newMessages);
        setMessage("");
      } else {
        Alert.alert("Failed", res.data.message || "Message not sent. Try again.");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error.response?.data || error.message);
      
      let errorMessage = "Failed to send message. Please try again later.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Render chat bubble
  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === "user" ? styles.userBubble : styles.staffBubble,
      ]}
    >
      <Text style={[
        styles.senderLabel,
        item.sender === "user" ? styles.userSender : styles.staffSender
      ]}>
        {item.sender === "user" ? "You" : "Operation Staff"}
      </Text>
      <Text style={[
        styles.messageText,
        item.sender === "user" ? styles.userMessage : styles.staffMessage
      ]}>
        {item.message}
      </Text>
      <Text style={styles.timeText}>
        {new Date(item.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  // ✅ Loading and error states
  if (!isReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>User not found. Please login again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat with Operation Staff</Text>
        <Text style={styles.headerSubtitle}>We're here to help you</Text>
      </View>

      {fetchError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMessages}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Start a conversation with our operation team</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || `message-${index}`}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!message.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!message.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  header: {
    backgroundColor: "#007bff",
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "white",
    textAlign: "center",
    marginTop: 4,
    opacity: 0.9,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  messageList: { 
    padding: 16,
    paddingBottom: 10,
  },
  messageBubble: {
    marginVertical: 6,
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007bff",
    borderBottomRightRadius: 4,
  },
  staffBubble: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userSender: {
    color: "rgba(255,255,255,0.8)",
  },
  staffSender: {
    color: "#666",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessage: {
    color: "white",
  },
  staffMessage: {
    color: "#333",
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    backgroundColor: "#f8f9fa",
  },
  sendButton: {
    backgroundColor: "#007bff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});