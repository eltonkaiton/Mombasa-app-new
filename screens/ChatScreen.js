// ./src/screens/ChatScreen.js
import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { Picker } from "@react-native-picker/picker";

const API_BASE_URL = "http://192.168.100.13:5000/api/chat";

const CATEGORY_OPTIONS = [
  { label: "Operation", value: "operation" },
  { label: "Finance", value: "finance" },
  { label: "Service", value: "service" },
];

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const ChatScreen = () => {
  const [messages, setMessages] = useState([]); // messages from server (already filtered)
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("operation"); // default
  const flatListRef = useRef(null);

  // Load logged-in user from AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await AsyncStorage.getItem("user");
        if (data) {
          const parsedUser = JSON.parse(data);
          setUserInfo(parsedUser);
        } else {
          setFetchError("No user found. Please login again.");
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setFetchError("Error loading user data.");
      } finally {
        setIsReady(true);
      }
    };
    loadUser();
  }, []);

  // Fetch messages for user + selectedCategory
  const fetchMessages = useCallback(
    async (opts = { showLoading: true }) => {
      if (!userInfo) return;
      if (opts.showLoading) setLoading(true);
      setFetchError(null);

      try {
        const userId = userInfo._id || userInfo.id;
        if (!userId) {
          setFetchError("No user ID found.");
          setMessages([]);
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}/messages/${userId}/${selectedCategory.toLowerCase()}`
        );

        if (res.data && res.data.success) {
          setMessages(res.data.messages || []);
        } else {
          setFetchError(res.data?.message || "Failed to load messages.");
          setMessages([]);
        }
      } catch (error) {
        console.error("Error fetching messages:", error.response?.data || error.message);
        if (error.response?.status === 404) {
          setFetchError("Chat endpoint not found. Server might be down.");
        } else if (error.response?.status === 500) {
          setFetchError("Server error. Try again later.");
        } else {
          setFetchError("Failed to load messages. Check your connection.");
        }
        setMessages([]);
      } finally {
        if (opts.showLoading) setLoading(false);
        setRefreshing(false);
      }
    },
    [userInfo, selectedCategory]
  );

  // Fetch on user load and category change
  useEffect(() => {
    if (userInfo) {
      fetchMessages();
    }
  }, [userInfo, selectedCategory, fetchMessages]);

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMessages({ showLoading: false });
  };

  // Send message with selected category
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
        userId,
        userName: userInfo.full_name || userInfo.name || "Customer",
        userEmail: userInfo.email || "customer@example.com",
        staffCategory: selectedCategory.toLowerCase(),
        message: message.trim(),
      };

      const res = await axios.post(`${API_BASE_URL}/send-message`, payload);

      if (res.data && res.data.success) {
        // If backend returns created messages (user + staff auto response), append them.
        const returnedUserMessage = res.data.data?.userMessage;
        const returnedStaffMessage = res.data.data?.staffMessage;

        // Option A: If backend returns updated conversation, re-fetch
        // Option B: Locally append returned messages if present
        if (returnedUserMessage || returnedStaffMessage) {
          const appended = [...messages];
          if (returnedUserMessage) appended.push(returnedUserMessage);
          if (returnedStaffMessage) appended.push(returnedStaffMessage);
          setMessages(appended);
        } else {
          // fallback: re-fetch conversation for reliability
          await fetchMessages();
        }

        setMessage("");
        // scroll to bottom after a short delay to allow render
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 250);
      } else {
        Alert.alert("Failed", res.data?.message || "Message not sent. Try again.");
      }
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
      const errMsg = error.response?.data?.message || "Failed to send message. Try again later.";
      Alert.alert("Error", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    // normalize item fields
    const sender = (item.sender || "user").toString();
    const staffCat = (item.staffCategory || "").toString();
    const timeVal = item.timestamp ? new Date(item.timestamp) : null;

    const bubbleSenderLabel =
      sender === "user" ? "You" : `${capitalize(staffCat || item.userName || "Operation")}`;

    return (
      <View
        style={[
          styles.messageBubble,
          sender === "user" ? styles.userBubble : styles.staffBubble,
        ]}
      >
        <Text style={[styles.senderLabel, sender === "user" ? styles.userSender : styles.staffSender]}>
          {bubbleSenderLabel}
        </Text>
        <Text style={[styles.messageText, sender === "user" ? styles.userMessage : styles.staffMessage]}>
          {item.message}
        </Text>
        <Text style={styles.timeText}>
          {timeVal ? timeVal.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </Text>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Chat with Staff</Text>
        <Text style={styles.headerSubtitle}>Choose a department to chat with</Text>
      </View>

      {/* Category picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(val) => setSelectedCategory(val)}
          mode="dropdown"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchMessages()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet for {capitalize(selectedCategory)}</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation with the {capitalize(selectedCategory)} team
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || item.id || `message-${index}`}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder={`Message ${capitalize(selectedCategory)}...`}
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
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendText}>Send</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  pickerContainer: {
    backgroundColor: "white",
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
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
    color: "rgba(255,255,255,0.9)",
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
