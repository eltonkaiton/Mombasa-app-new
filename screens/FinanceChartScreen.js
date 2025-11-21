import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import axios from "axios";

const API_BASE_URL = "https://mombasa-backend.onrender.com";

const FinanceChat = ({ route }) => {
  const { userId, userName } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/chat/messages/${userId}/finance`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      setLoading(true);

      // Send staffCategory: "finance" so it appears in the finance section
      const payload = {
        userEmail: messages[0]?.userEmail, 
        staffMessage: input,
        staffCategory: "finance",
      };

      await axios.post(`${API_BASE_URL}/api/chat/send-staff-message`, payload);
      setInput("");
      fetchMessages(); // refresh chat
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.bubble, item.sender === "user" ? styles.userBubble : styles.staffBubble]}>
      <Text style={styles.text}>{item.message}</Text>
      <Text style={styles.time}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#eef6fa" }}>
      {loading && <ActivityIndicator size="small" color="#0077b6" />}
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item, index) => item._id || `msg-${index}`}
        contentContainerStyle={{ padding: 16 }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Reply to ${userName}`}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

export default FinanceChat;

const styles = StyleSheet.create({
  bubble: { marginVertical: 6, padding: 12, borderRadius: 16, maxWidth: "80%" },
  userBubble: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", alignSelf: "flex-start" },
  staffBubble: { backgroundColor: "#16a085", alignSelf: "flex-end" },
  text: { fontSize: 16, color: "#fff" },
  time: { fontSize: 10, marginTop: 4, opacity: 0.6 },
  inputContainer: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderColor: "#ddd", backgroundColor: "#fff" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 16 },
  sendBtn: { backgroundColor: "#16a085", borderRadius: 20, paddingHorizontal: 20, justifyContent: "center", marginLeft: 8 },
});
