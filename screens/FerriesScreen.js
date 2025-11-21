import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const API_BASE_URL = "http://192.168.100.13:5000";
const FERRIES_URL = `${API_BASE_URL}/ferries`;

const FerriesScreen = () => {
  const [ferries, setFerries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newFerry, setNewFerry] = useState({ name: "", capacity: "", status: "active" });

  // ✅ Fetch ferry occupancy
  const fetchFerries = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("staffToken");
      if (!token) return Alert.alert("Error", "No token found. Please login again.");

      const response = await axios.get(`${FERRIES_URL}/occupancy`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedFerries = (response.data.ferries || []).map((f) => ({
        ...f,
        bookedCount: f.occupied || 0,
        remaining: f.remaining ?? Math.max(0, f.capacity - (f.occupied || 0)),
      }));

      setFerries(updatedFerries);
    } catch (error) {
      console.error("❌ Error fetching ferries:", error.message);
      Alert.alert("Error", "Failed to fetch ferries.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add new ferry
  const handleAddFerry = async () => {
    if (!newFerry.name?.trim()) {
      return Alert.alert("Error", "Please enter a ferry name.");
    }
    
    if (!newFerry.capacity || parseInt(newFerry.capacity) <= 0) {
      return Alert.alert("Error", "Please enter a valid capacity greater than 0.");
    }

    try {
      const token = await AsyncStorage.getItem("staffToken");
      if (!token) {
        return Alert.alert("Error", "Authentication required. Please login again.");
      }

      // Prepare data exactly as schema expects - status must be lowercase
      const ferryData = {
        name: newFerry.name.trim(),
        capacity: parseInt(newFerry.capacity),
        status: "active" // Must be lowercase to match schema enum
      };

      console.log("📤 Sending to server:", ferryData);

      const response = await axios.post(FERRIES_URL, ferryData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log("✅ Success:", response.data);
      
      Alert.alert("Success", "Ferry added successfully!");
      setModalVisible(false);
      setNewFerry({ name: "", capacity: "", status: "active" });
      fetchFerries();
      
    } catch (error) {
      console.error("❌ Full error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      // Handle specific error cases
      if (error.response?.status === 400) {
        const serverMessage = error.response?.data?.message;
        if (serverMessage?.includes("unique") || serverMessage?.includes("duplicate")) {
          Alert.alert("Error", "A ferry with this name already exists.");
        } else {
          Alert.alert("Validation Error", serverMessage || "Please check your input data.");
        }
      } else if (error.response?.status === 401) {
        Alert.alert("Authentication Error", "Please login again.");
      } else {
        Alert.alert("Error", "Failed to add ferry. Please try again.");
      }
    }
  };

  // ✅ Delete ferry
  const handleDeleteFerry = async (id) => {
    Alert.alert("Confirm", "Delete this ferry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("staffToken");
            await axios.delete(`${FERRIES_URL}/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert("Deleted", "Ferry deleted successfully.");
            fetchFerries();
          } catch (error) {
            console.error("❌ Error deleting ferry:", error.message);
            Alert.alert("Error", "Failed to delete ferry.");
          }
        },
      },
    ]);
  };

  // ✅ Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFerries();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchFerries();
  }, []);

  // Table Header Component
  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={[styles.tableCell, styles.nameColumn]}>
        <Text style={styles.headerText}>Ferry Name</Text>
      </View>
      <View style={[styles.tableCell, styles.capacityColumn]}>
        <Text style={styles.headerText}>Capacity</Text>
      </View>
      <View style={[styles.tableCell, styles.assignedColumn]}>
        <Text style={styles.headerText}>Assigned</Text>
      </View>
      <View style={[styles.tableCell, styles.remainingColumn]}>
        <Text style={styles.headerText}>Remaining</Text>
      </View>
      <View style={[styles.tableCell, styles.statusColumn]}>
        <Text style={styles.headerText}>Status</Text>
      </View>
      <View style={[styles.tableCell, styles.actionsColumn]}>
        <Text style={styles.headerText}>Actions</Text>
      </View>
    </View>
  );

  // Table Row Component
  const TableRow = ({ item }) => (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.nameColumn]}>
        <Text style={styles.cellText}>{item.name}</Text>
      </View>
      <View style={[styles.tableCell, styles.capacityColumn]}>
        <Text style={styles.cellText}>{item.capacity}</Text>
      </View>
      <View style={[styles.tableCell, styles.assignedColumn]}>
        <Text style={styles.cellText}>{item.bookedCount}</Text>
      </View>
      <View style={[styles.tableCell, styles.remainingColumn]}>
        <Text style={[
          styles.cellText, 
          item.remaining < 10 ? styles.lowRemaining : null
        ]}>
          {item.remaining}
        </Text>
      </View>
      <View style={[styles.tableCell, styles.statusColumn]}>
        <View style={[
          styles.statusBadge,
          item.status === "active" ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={[
            styles.statusText,
            item.status === "active" ? styles.activeText : styles.inactiveText
          ]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      <View style={[styles.tableCell, styles.actionsColumn]}>
        <TouchableOpacity 
          onPress={() => handleDeleteFerry(item.id)} 
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={18} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ferry Management</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Add Ferry</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
      ) : (
        <View style={styles.tableContainer}>
          <TableHeader />
          <FlatList
            data={ferries}
            keyExtractor={(item) => item.id || item.name}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="boat-outline" size={50} color="#cbd5e1" />
                <Text style={styles.emptyText}>No ferries available</Text>
              </View>
            }
            renderItem={({ item }) => <TableRow item={item} />}
          />
        </View>
      )}

      {/* Add Ferry Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add New Ferry</Text>
              <TextInput
                placeholder="Ferry Name"
                style={styles.input}
                value={newFerry.name}
                onChangeText={(text) => setNewFerry({ ...newFerry, name: text })}
                autoCapitalize="words"
              />
              <TextInput
                placeholder="Capacity"
                style={styles.input}
                keyboardType="number-pad"
                value={newFerry.capacity}
                onChangeText={(text) => {
                  // Only allow positive numbers
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setNewFerry({ ...newFerry, capacity: numericValue });
                }}
                maxLength={4}
              />
              <TouchableOpacity onPress={handleAddFerry} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Ferry</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FerriesScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC", 
    padding: 16 
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 20,
    paddingHorizontal: 4 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#1e293b" 
  },
  addButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#007AFF", 
    paddingHorizontal: 16,
    paddingVertical: 10, 
    borderRadius: 8,
    elevation: 2 
  },
  addButtonText: { 
    color: "#fff", 
    marginLeft: 6, 
    fontSize: 16,
    fontWeight: "600" 
  },
  tableContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
    overflow: "hidden"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 12
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingHorizontal: 12,
    alignItems: "center"
  },
  tableCell: {
    justifyContent: "center",
  },
  // Column widths
  nameColumn: { width: "22%" },
  capacityColumn: { width: "15%" },
  assignedColumn: { width: "15%" },
  remainingColumn: { width: "15%" },
  statusColumn: { width: "18%" },
  actionsColumn: { width: "15%" },
  headerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center"
  },
  cellText: {
    fontSize: 14,
    color: "#334155",
    textAlign: "center"
  },
  lowRemaining: {
    color: "#dc2626",
    fontWeight: "600"
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "center"
  },
  activeBadge: {
    backgroundColor: "#d1fae5"
  },
  inactiveBadge: {
    backgroundColor: "#fee2e2"
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center"
  },
  activeText: {
    color: "#065f46"
  },
  inactiveText: {
    color: "#991b1b"
  },
  deleteButton: {
    padding: 6,
    alignSelf: "center"
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60
  },
  emptyText: { 
    textAlign: "center", 
    marginTop: 12, 
    color: "#64748b",
    fontSize: 16
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },
  modalBox: { 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 24, 
    width: "85%",
    maxHeight: "80%" 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 20, 
    textAlign: "center",
    color: "#1e293b" 
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#cbd5e1", 
    borderRadius: 8, 
    padding: 12, 
    marginVertical: 8,
    fontSize: 16 
  },
  saveButton: { 
    backgroundColor: "#007AFF", 
    padding: 14, 
    borderRadius: 8, 
    marginTop: 16 
  },
  saveButtonText: { 
    color: "#fff", 
    textAlign: "center", 
    fontWeight: "bold",
    fontSize: 16 
  },
  cancelButton: { 
    backgroundColor: "#f1f5f9", 
    padding: 14, 
    borderRadius: 8, 
    marginTop: 10 
  },
  cancelButtonText: { 
    color: "#64748b", 
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600" 
  },
});