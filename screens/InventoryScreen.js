// InventoryScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  Button,
  TextInput,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'http://192.168.100.8:5000/inventory/items';
const SUPPLIERS_URL = 'http://192.168.100.8:5000/inventory/suppliers';
const ORDER_URL = 'http://192.168.100.8:5000/inventory/orders';

export default function InventoryScreen({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const [searchText, setSearchText] = useState('');
  const [filteredInventory, setFilteredInventory] = useState([]);

  // Low-stock order state
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Manual order state
  const [manualOrderVisible, setManualOrderVisible] = useState(false);
  const [manualSelectedItem, setManualSelectedItem] = useState('');
  const [manualSelectedSupplier, setManualSelectedSupplier] = useState('');
  const [manualQuantity, setManualQuantity] = useState('');

  // Edit item modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editItemData, setEditItemData] = useState({
    _id: '',
    item_name: '',
    current_stock: '',
    reorder_level: '',
    unit: '',
  });

  // ===========================
  // Axios instance with token
  // ===========================
  const axiosAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    return axios.create({
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  // ===========================
  // Merge items with same name
  // ===========================
  const mergeInventoryItems = (items) => {
    const merged = {};
    items.forEach((item) => {
      if (!item) return;
      const key = item.item_name;
      if (!merged[key]) {
        merged[key] = { ...item };
      } else {
        merged[key].current_stock += item.current_stock ?? 0;
        merged[key].reorder_level = Math.max(
          merged[key].reorder_level ?? 0,
          item.reorder_level ?? 0
        );
      }
    });
    return Object.values(merged);
  };

  // ===========================
  // Fetch inventory
  // ===========================
  const fetchInventory = async () => {
    try {
      const api = await axiosAuth();
      const res = await api.get(API_URL);
      const items = Array.isArray(res.data) ? res.data : [];
      const mergedItems = mergeInventoryItems(items);
      setInventory(mergedItems);
      setFilteredInventory(
        mergedItems.filter((item) =>
          item.item_name.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    } catch (err) {
      console.error('Error loading inventory:', err);
      Alert.alert('Error', 'Failed to load inventory items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===========================
  // Fetch suppliers
  // ===========================
  const fetchSuppliers = async () => {
    try {
      const api = await axiosAuth();
      const res = await api.get(SUPPLIERS_URL);
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      Alert.alert('Error', 'Failed to load suppliers.');
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    setFilteredInventory(
      inventory.filter((item) =>
        item.item_name.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [searchText, inventory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const openOrderModal = (item) => {
    setSelectedItem(item);
    setSelectedSupplier('');
    setModalVisible(true);
  };

  // ===========================
  // Low-stock order submit
  // ===========================
  const submitOrder = async () => {
    if (!selectedItem || !selectedSupplier) return;
    const payload = {
      item_id: selectedItem._id,
      supplier_id: selectedSupplier,
      quantity: selectedItem.reorder_level,
    };
    try {
      const api = await axiosAuth();
      await api.post(ORDER_URL, payload);
      Alert.alert('Success', 'Supply order placed successfully.');
      setModalVisible(false);
      setSelectedItem(null);
      setSelectedSupplier('');
      fetchInventory();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to place supply order.');
    }
  };

  // ===========================
  // Manual order submit
  // ===========================
  const submitManualOrder = async () => {
    if (!manualSelectedItem || !manualSelectedSupplier || !manualQuantity.trim()) {
      Alert.alert('Validation', 'Please fill all fields.');
      return;
    }
    const quantityNum = Number(manualQuantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Validation', 'Quantity must be a positive number.');
      return;
    }
    const payload = {
      item_id: manualSelectedItem,
      supplier_id: manualSelectedSupplier,
      quantity: quantityNum,
    };
    try {
      const api = await axiosAuth();
      await api.post(ORDER_URL, payload);
      Alert.alert('Success', 'Manual supply order placed successfully.');
      setManualOrderVisible(false);
      setManualSelectedItem('');
      setManualSelectedSupplier('');
      setManualQuantity('');
      fetchInventory();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit manual order.');
    }
  };

  // ===========================
  // Delete inventory item
  // ===========================
  const deleteItem = (itemId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const api = await axiosAuth();
              await api.delete(`${API_URL}/${itemId}`);
              Alert.alert('Deleted', 'Item deleted successfully.');
              fetchInventory();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete item.');
            }
          },
        },
      ]
    );
  };

  // ===========================
  // Edit inventory item
  // ===========================
  const openEditModal = (item) => {
    setEditItemData({
      _id: item._id,
      item_name: item.item_name,
      current_stock: String(item.current_stock),
      reorder_level: String(item.reorder_level),
      unit: item.unit || '',
    });
    setEditModalVisible(true);
  };

  const submitEditItem = async () => {
    const { _id, item_name, current_stock, reorder_level, unit } = editItemData;
    if (!item_name || !current_stock || !reorder_level) {
      Alert.alert('Validation', 'Name, Stock, and Reorder level are required.');
      return;
    }
    const payload = {
      item_name,
      current_stock: Number(current_stock),
      reorder_level: Number(reorder_level),
      unit,
    };
    try {
      const api = await axiosAuth();
      await api.put(`${API_URL}/${_id}`, payload);
      Alert.alert('Success', 'Item updated successfully.');
      setEditModalVisible(false);
      fetchInventory();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update item.');
    }
  };

  // ===========================
  // Render inventory item (ONLY NAME + STOCK)
  // ===========================
  const renderItem = ({ item }) => {
    return (
      <View key={item._id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => openEditModal(item)}>
              <Ionicons name="create-outline" size={20} color="#0077b6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteItem(item._id)}>
              <Ionicons name="trash-outline" size={20} color="#d00000" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.detail}>Stock: {item.current_stock}</Text>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 30 }} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>📋 Inventory Dashboard</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => setManualOrderVisible(true)}
            style={[styles.logoutButton, { marginRight: 10, backgroundColor: '#00b4d8' }]}
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
          </TouchableOpacity>

          {/* ✅ Inventory Chat Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('InventoryChat')}
            style={[styles.logoutButton, { marginRight: 10, backgroundColor: '#28a745' }]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('UploadInventory')}>
          <Ionicons name="add-circle-outline" size={24} color="#0077b6" />
          <Text style={styles.navButtonText}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('StockDeliveries')}>
          <Ionicons name="cube-outline" size={24} color="#0077b6" />
          <Text style={styles.navButtonText}>Deliveries</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TextInput
        placeholder="🔍 Search Inventory"
        value={searchText}
        onChangeText={setSearchText}
        style={styles.searchInput}
      />

      {/* Inventory List */}
      <FlatList
        data={filteredInventory}
        keyExtractor={(item, index) => item._id || `fallback-${index}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>No items.</Text>}
      />

      {/* Modals remain the same */}
      {/* Low-stock order */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Place Order for {selectedItem?.item_name}</Text>
            <Text>Select Supplier:</Text>
            <Picker
              selectedValue={selectedSupplier}
              onValueChange={(value) => setSelectedSupplier(value)}
              style={{ height: 50, width: '100%' }}
            >
              <Picker.Item label="Select Supplier" value="" />
              {suppliers.map((s) => (
                <Picker.Item key={s._id} label={s.name || 'Unknown'} value={s._id} />
              ))}
            </Picker>

            {selectedSupplier && (
              <View style={{ marginVertical: 10, padding: 10, backgroundColor: '#eef6ff', borderRadius: 6 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Order Preview:</Text>
                <Text>Item: {selectedItem?.item_name}</Text>
                <Text>Supplier: {suppliers.find((s) => s._id === selectedSupplier)?.name || 'Unknown'}</Text>
                <Text>Quantity: {selectedItem?.reorder_level}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  setSelectedItem(null);
                  setSelectedSupplier('');
                }}
                color="#888"
              />
              <Button title="Order" onPress={submitOrder} color="#0077b6" disabled={!selectedSupplier || !selectedItem?.reorder_level} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual order */}
      <Modal visible={manualOrderVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🛒 Manual Supply Order</Text>

            <Text>Select Item:</Text>
            <Picker
              selectedValue={manualSelectedItem}
              onValueChange={(value) => setManualSelectedItem(value)}
              style={{ height: 50, width: '100%' }}
            >
              <Picker.Item label="Select Item" value="" />
              {inventory.map((item) => (
                <Picker.Item key={item._id} label={item.item_name || 'Unknown'} value={item._id} />
              ))}
            </Picker>

            <Text>Select Supplier:</Text>
            <Picker
              selectedValue={manualSelectedSupplier}
              onValueChange={(value) => setManualSelectedSupplier(value)}
              style={{ height: 50, width: '100%' }}
            >
              <Picker.Item label="Select Supplier" value="" />
              {suppliers.map((s) => (
                <Picker.Item key={s._id} label={s.name || 'Unknown'} value={s._id} />
              ))}
            </Picker>

            <TextInput
              placeholder="Enter Quantity"
              keyboardType="numeric"
              value={manualQuantity}
              onChangeText={setManualQuantity}
              style={styles.input}
            />

            {manualSelectedItem && manualSelectedSupplier && manualQuantity && (
              <View style={{ marginVertical: 10, padding: 10, backgroundColor: '#eef6ff', borderRadius: 6 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Order Preview:</Text>
                <Text>Item: {inventory.find((i) => i._id === manualSelectedItem)?.item_name || 'Unknown'}</Text>
                <Text>Supplier: {suppliers.find((s) => s._id === manualSelectedSupplier)?.name || 'Unknown'}</Text>
                <Text>Quantity: {manualQuantity}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button
                title="Cancel"
                color="#888"
                onPress={() => {
                  setManualOrderVisible(false);
                  setManualSelectedItem('');
                  setManualSelectedSupplier('');
                  setManualQuantity('');
                }}
              />
              <Button
                title="Order"
                color="#0077b6"
                onPress={submitManualOrder}
                disabled={!manualSelectedItem || !manualSelectedSupplier || !manualQuantity.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit item */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✏️ Edit Item</Text>

            <Text>Name:</Text>
            <TextInput
              value={editItemData.item_name}
              onChangeText={(text) => setEditItemData({ ...editItemData, item_name: text })}
              style={styles.input}
            />

            <Text>Stock:</Text>
            <TextInput
              value={editItemData.current_stock}
              keyboardType="numeric"
              onChangeText={(text) => setEditItemData({ ...editItemData, current_stock: text })}
              style={styles.input}
            />

            <Text>Reorder Level:</Text>
            <TextInput
              value={editItemData.reorder_level}
              keyboardType="numeric"
              onChangeText={(text) => setEditItemData({ ...editItemData, reorder_level: text })}
              style={styles.input}
            />

            <Text>Unit:</Text>
            <TextInput
              value={editItemData.unit}
              onChangeText={(text) => setEditItemData({ ...editItemData, unit: text })}
              style={styles.input}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <Button title="Cancel" color="#888" onPress={() => setEditModalVisible(false)} />
              <Button title="Save" color="#0077b6" onPress={submitEditItem} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ===========================
// Styles
// ===========================
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: '#f5faff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#0077b6' },
  logoutButton: { backgroundColor: '#0077b6', padding: 8, borderRadius: 20 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 16 },
  navButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f7fa', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, marginBottom: 8 },
  navButtonText: { marginLeft: 6, fontSize: 15, color: '#0077b6', fontWeight: '500' },
  searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12, backgroundColor: '#fff' },
  card: { backgroundColor: '#ffffff', borderRadius: 10, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#023e8a' },
  detail: { fontSize: 15, color: '#333', marginBottom: 2 },
  modalOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', paddingHorizontal: 30 },
  modalCard: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginVertical: 5 },
});
