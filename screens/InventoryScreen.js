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
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'https://mombasa-backend.onrender.com/inventory/items';
const SUPPLIERS_URL = 'https://mombasa-backend.onrender.com/inventory/suppliers';
const ORDER_URL = 'https://mombasa-backend.onrender.com/inventory/orders';

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

  // Stats state
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
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
  // Calculate statistics
  // ===========================
  const calculateStats = (items) => {
    const totalItems = items.length;
    const lowStock = items.filter(item => 
      item.current_stock > 0 && item.current_stock <= item.reorder_level
    ).length;
    const outOfStock = items.filter(item => item.current_stock === 0).length;
    
    return { totalItems, lowStock, outOfStock };
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
      setStats(calculateStats(mergedItems));
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
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
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
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const api = await axiosAuth();
              await api.delete(`${API_URL}/${itemId}`);
              Alert.alert('Success', 'Item deleted successfully.');
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
  // Get stock status color
  // ===========================
  const getStockStatus = (item) => {
    if (item.current_stock === 0) return { status: 'Out of Stock', color: '#dc2626' };
    if (item.current_stock <= item.reorder_level) return { status: 'Low Stock', color: '#ea580c' };
    return { status: 'In Stock', color: '#16a34a' };
  };

  // ===========================
  // Render inventory item
  // ===========================
  const renderItem = ({ item }) => {
    const stockStatus = getStockStatus(item);
    
    return (
      <TouchableOpacity 
        style={[styles.card, stockStatus.color === '#dc2626' && styles.outOfStockCard]}
        onPress={() => openEditModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.item_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${stockStatus.color}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: stockStatus.color }]} />
              <Text style={[styles.statusText, { color: stockStatus.color }]}>
                {stockStatus.status}
              </Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                openEditModal(item);
              }}
              style={styles.iconButton}
            >
              <Ionicons name="create-outline" size={18} color="#0077b6" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                deleteItem(item._id);
              }}
              style={styles.iconButton}
            >
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.stockInfo}>
          <View style={styles.stockItem}>
            <Ionicons name="cube-outline" size={14} color="#64748b" />
            <Text style={styles.stockLabel}>Stock:</Text>
            <Text style={styles.stockValue}>{item.current_stock} {item.unit || 'units'}</Text>
          </View>
          
          <View style={styles.stockItem}>
            <Ionicons name="alert-circle-outline" size={14} color="#64748b" />
            <Text style={styles.stockLabel}>Reorder:</Text>
            <Text style={styles.stockValue}>{item.reorder_level} {item.unit || 'units'}</Text>
          </View>
        </View>

        {stockStatus.color !== '#16a34a' && (
          <TouchableOpacity 
            style={styles.orderButton}
            onPress={(e) => {
              e.stopPropagation();
              openOrderModal(item);
            }}
          >
            <Ionicons name="cart-outline" size={14} color="#fff" />
            <Text style={styles.orderButtonText}>Order</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077b6" />
        <Text style={styles.loadingText}>Loading Inventory...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Inventory</Text>
            <Text style={styles.headerSubtitle}>Manage stock efficiently</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setManualOrderVisible(true)}
              style={styles.headerButton}
            >
              <Ionicons name="cart-outline" size={20} color="#0077b6" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('InventoryChat')}
              style={styles.headerButton}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#28a745" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="cube-outline" size={16} color="#0077b6" />
            </View>
            <Text style={styles.statNumber}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fff7ed' }]}>
              <Ionicons name="alert-circle-outline" size={16} color="#ea580c" />
            </View>
            <Text style={styles.statNumber}>{stats.lowStock}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
            </View>
            <Text style={styles.statNumber}>{stats.outOfStock}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navContainer}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('UploadInventory')}
        >
          <View style={styles.navIcon}>
            <Ionicons name="cloud-upload-outline" size={16} color="#0077b6" />
          </View>
          <Text style={styles.navButtonText}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('StockDeliveries')}
        >
          <View style={styles.navIcon}>
            <Ionicons name="cube-outline" size={16} color="#0077b6" />
          </View>
          <Text style={styles.navButtonText}>Deliveries</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={16} color="#64748b" style={styles.searchIcon} />
        <TextInput
          placeholder="Search items..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          placeholderTextColor="#94a3b8"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Inventory List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Items ({filteredInventory.length})</Text>
        <Text style={styles.listHeaderCount}>
          Showing {filteredInventory.length} of {inventory.length}
        </Text>
      </View>

      {/* Inventory List */}
      <FlatList
        data={filteredInventory}
        keyExtractor={(item, index) => item._id || `fallback-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#0077b6']}
            tintColor="#0077b6"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No items found</Text>
            <Text style={styles.emptyStateText}>
              {searchText ? 'Try adjusting your search' : 'Add items to get started'}
            </Text>
          </View>
        }
      />

      {/* Low-stock Order Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Place Order</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Ordering: <Text style={styles.highlightText}>{selectedItem?.item_name}</Text>
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Supplier</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedSupplier}
                  onValueChange={setSelectedSupplier}
                  style={styles.picker}
                  dropdownIconColor="#64748b"
                  mode="dropdown"
                >
                  <Picker.Item label="Choose supplier" value="" />
                  {suppliers.map((s) => (
                    <Picker.Item key={s._id} label={s.name || 'Unknown Supplier'} value={s._id} />
                  ))}
                </Picker>
              </View>
            </View>

            {selectedSupplier && (
              <View style={styles.orderPreview}>
                <Text style={styles.previewTitle}>Order Preview</Text>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Item:</Text>
                  <Text style={styles.previewValue}>{selectedItem?.item_name}</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Supplier:</Text>
                  <Text style={styles.previewValue}>
                    {suppliers.find((s) => s._id === selectedSupplier)?.name}
                  </Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Quantity:</Text>
                  <Text style={styles.previewValue}>{selectedItem?.reorder_level} units</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton, !selectedSupplier && styles.disabledButton]}
                onPress={submitOrder}
                disabled={!selectedSupplier}
              >
                <Ionicons name="cart-outline" size={16} color="#fff" />
                <Text style={styles.primaryButtonText}>Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual Order Modal */}
      <Modal visible={manualOrderVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Order</Text>
              <TouchableOpacity 
                onPress={() => setManualOrderVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Item</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={manualSelectedItem}
                  onValueChange={setManualSelectedItem}
                  style={styles.picker}
                  dropdownIconColor="#64748b"
                  mode="dropdown"
                >
                  <Picker.Item label="Choose item" value="" />
                  {inventory.map((item) => (
                    <Picker.Item key={item._id} label={item.item_name} value={item._id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Supplier</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={manualSelectedSupplier}
                  onValueChange={setManualSelectedSupplier}
                  style={styles.picker}
                  dropdownIconColor="#64748b"
                  mode="dropdown"
                >
                  <Picker.Item label="Choose supplier" value="" />
                  {suppliers.map((s) => (
                    <Picker.Item key={s._id} label={s.name} value={s._id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                placeholder="Enter quantity"
                keyboardType="numeric"
                value={manualQuantity}
                onChangeText={setManualQuantity}
                style={styles.textInput}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {manualSelectedItem && manualSelectedSupplier && manualQuantity && (
              <View style={styles.orderPreview}>
                <Text style={styles.previewTitle}>Order Preview</Text>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Item:</Text>
                  <Text style={styles.previewValue}>
                    {inventory.find((i) => i._id === manualSelectedItem)?.item_name}
                  </Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Supplier:</Text>
                  <Text style={styles.previewValue}>
                    {suppliers.find((s) => s._id === manualSelectedSupplier)?.name}
                  </Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Quantity:</Text>
                  <Text style={styles.previewValue}>{manualQuantity} units</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setManualOrderVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton, 
                  (!manualSelectedItem || !manualSelectedSupplier || !manualQuantity) && styles.disabledButton
                ]}
                onPress={submitManualOrder}
                disabled={!manualSelectedItem || !manualSelectedSupplier || !manualQuantity}
              >
                <Ionicons name="cart-outline" size={16} color="#fff" />
                <Text style={styles.primaryButtonText}>Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                value={editItemData.item_name}
                onChangeText={(text) => setEditItemData({ ...editItemData, item_name: text })}
                style={styles.textInput}
                placeholder="Enter item name"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 6 }]}>
                <Text style={styles.label}>Current Stock</Text>
                <TextInput
                  value={editItemData.current_stock}
                  keyboardType="numeric"
                  onChangeText={(text) => setEditItemData({ ...editItemData, current_stock: text })}
                  style={styles.textInput}
                  placeholder="0"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 6 }]}>
                <Text style={styles.label}>Reorder Level</Text>
                <TextInput
                  value={editItemData.reorder_level}
                  keyboardType="numeric"
                  onChangeText={(text) => setEditItemData({ ...editItemData, reorder_level: text })}
                  style={styles.textInput}
                  placeholder="0"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                value={editItemData.unit}
                onChangeText={(text) => setEditItemData({ ...editItemData, unit: text })}
                style={styles.textInput}
                placeholder="e.g., pieces, kg"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={submitEditItem}
              >
                <Ionicons name="save-outline" size={16} color="#fff" />
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ===========================
// Optimized Compact Styles
// ===========================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  headerButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  navContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  navIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  listHeaderCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  outOfStockCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#f8fafc',
  },
  stockInfo: {
    marginBottom: 8,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockLabel: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
    marginRight: 4,
  },
  stockValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0f172a',
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0077b6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  closeButton: {
    padding: 2,
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  highlightText: {
    color: '#0077b6',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center',
    minHeight: 48,
  },
  picker: {
    height: 48,
    color: '#0f172a',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#fff',
    minHeight: 48,
  },
  orderPreview: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0077b6',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#0077b6',
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});