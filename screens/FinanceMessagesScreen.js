import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const API_BASE_URL = "http://192.168.100.13:5000";

const FinanceMessagesScreen = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/chat/staff-messages`);
      // Filter for finance messages only
      const financeMessages = res.data.messages.filter(
        (msg) => msg.staffCategory.toLowerCase() === "finance"
      );
      setMessages(financeMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageCard}
      onPress={() => navigation.navigate("FinanceChart", { userId: item.userId, userName: item.userName })}
    >
      <Text style={styles.userName}>{item.userName}</Text>
      <Text numberOfLines={1} style={styles.lastMessage}>{item.message}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text>No messages yet.</Text>}
      />
    </View>
  );
};

export default FinanceMessagesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef6fa" },
  messageCard: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#ccc", borderRadius: 8, marginBottom: 8, backgroundColor: "#fff" },
  userName: { fontWeight: "bold", fontSize: 16 },
  lastMessage: { color: "#555", marginTop: 4 },
});
