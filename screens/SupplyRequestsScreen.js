// 📱 SupplierSupplyScreen.js — Fully Fixed & Updated
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const API_URL = 'https://mombasa-backend.onrender.com/suppliers';

export default function SupplierSupplyScreen() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [amount, setAmount] = useState('');
  const [modalWarning, setModalWarning] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmingPaymentIds, setConfirmingPaymentIds] = useState([]); // Track disabling

  // Fetch supplier's orders
  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
      setFilteredOrders(res.data);
    } catch (err) {
      console.error('❌ Error fetching orders:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept order
  const acceptOrder = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/orders/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      console.error('❌ Accept order failed:', err.response?.data || err.message);
    }
  };

  // Reject order
  const rejectOrder = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/orders/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      console.error('❌ Reject order failed:', err.response?.data || err.message);
    }
  };

  // Live validation for modal amount input
  const handleAmountChange = (text) => {
    setAmount(text);
    const value = parseFloat(text);
    if (isNaN(value) || value <= 0) {
      setModalWarning('Enter a positive number');
    } else if (value >= 100000) {
      setModalWarning('Amount must be less than 100,000 KES');
    } else {
      setModalWarning('');
    }
  };

  // Submit supply amount (<100,000)
  const submitSupply = async () => {
    try {
      const supplyAmount = parseFloat(amount);
      if (modalWarning) return;

      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/supply/${currentOrderId}`, { amount: supplyAmount }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setModalVisible(false);
      setAmount('');
      setModalWarning('');
      fetchOrders();
    } catch (err) {
      console.error('❌ Submit supply failed:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to submit supply amount.');
    }
  };

  // Mark as delivered
  const markDelivered = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/mark-delivered/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      console.error('❌ Mark delivered failed:', err.response?.data || err.message);
    }
  };

  // ✅ Confirm Payment Received (button disables immediately)
  const markReceived = async (id) => {
    try {
      setConfirmingPaymentIds((prev) => [...prev, id]); // disable button
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/confirm-payment/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // update local state instead of full fetch
      setOrders((prev) => prev.map(o => o._id === id ? { ...o, payment_confirmation: 'received' } : o));
      setFilteredOrders((prev) => prev.map(o => o._id === id ? { ...o, payment_confirmation: 'received' } : o));
    } catch (err) {
      console.error('❌ Confirm payment failed:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to confirm payment received.');
    } finally {
      setConfirmingPaymentIds((prev) => prev.filter(orderId => orderId !== id));
    }
  };

  // Download/View receipt
  const viewReceipt = async (receiptUrl, item) => {
    try {
      const fileUri = FileSystem.documentDirectory + `${item.item_id?.item_name || 'receipt'}_${item._id}.pdf`;

      if (receiptUrl) {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          const downloadResumable = FileSystem.createDownloadResumable(receiptUrl, fileUri);
          await downloadResumable.downloadAsync();
        }
        await Sharing.shareAsync(fileUri);
      } else {
        const html = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                table, th, td { border: 1px solid #333; }
                th, td { padding: 10px; text-align: left; }
                .signature { text-align: center; margin-top: 40px; }
                .signature-line { margin-top: 50px; border-top: 1px solid #000; width: 200px; margin-left: auto; margin-right: auto; }
              </style>
            </head>
            <body>
              <h2>Supply Receipt</h2>
              <table>
                <tr><th>Order ID</th><td>${item._id}</td></tr>
                <tr><th>Item</th><td>${item.item_id?.item_name || 'Unknown Item'}</td></tr>
                <tr><th>Quantity</th><td>${item.quantity || 'N/A'}</td></tr>
                <tr><th>Supply Amount (KES)</th><td>${item.amount || 'N/A'}</td></tr>
                <tr><th>Status</th><td>${item.status || 'N/A'}</td></tr>
                <tr><th>Finance Status</th><td>${item.finance_status || 'N/A'}</td></tr>
                <tr><th>Delivery Status</th><td>${item.delivery_status || 'N/A'}</td></tr>
              </table>
              <p style="margin-top: 20px;">Generated on: ${new Date().toLocaleString()}</p>
              <div class="signature">
                <p>Authorized Signature</p>
                <div class="signature-line"></div>
              </div>
            </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({ html });
        await FileSystem.moveAsync({ from: uri, to: fileUri });
        await Sharing.shareAsync(fileUri);
      }
    } catch (err) {
      console.error('❌ Receipt view/download failed:', err.message);
      Alert.alert('Error', 'Failed to view or download receipt.');
    }
  };

  // Search functionality
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredOrders(orders);
      return;
    }
    const filtered = orders.filter(order =>
      order.item_id?.item_name?.toLowerCase().includes(text.toLowerCase()) ||
      order.status?.toLowerCase().includes(text.toLowerCase()) ||
      order.finance_status?.toLowerCase().includes(text.toLowerCase()) ||
      order.delivery_status?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.itemText}>Item: {item.item_id?.item_name || 'Unknown Item'}</Text>
      <Text>Quantity: {item.quantity || 'N/A'}</Text>
      <Text>Status: {item.status || 'N/A'}</Text>
      <Text>Finance: {item.finance_status || 'N/A'}</Text>
      <Text>Delivery: {item.delivery_status || 'N/A'}</Text>

      {item.status === 'pending' && (
        <View style={styles.row}>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#27ae60' }]} onPress={() => acceptOrder(item._id)}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#c0392b' }]} onPress={() => rejectOrder(item._id)}>
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'approved' && item.delivery_status === 'pending' && (
        <TouchableOpacity style={[styles.button, { backgroundColor: '#2980b9' }]} onPress={() => markDelivered(item._id)}>
          <Text style={styles.buttonText}>Mark as Delivered</Text>
        </TouchableOpacity>
      )}

      {item.status === 'approved' && item.delivery_status === 'received' && item.finance_status === 'pending' && (
        <TouchableOpacity
          style={[styles.button, item.amount ? { backgroundColor: '#95a5a6' } : {}]}
          onPress={() => { setCurrentOrderId(item._id); setModalVisible(true); }}
          disabled={!!item.amount}
        >
          <Text style={styles.buttonText}>{item.amount ? 'Submitted' : 'Submit Supply'}</Text>
        </TouchableOpacity>
      )}

      {item.status === 'approved' &&
       item.delivery_status === 'received' &&
       item.finance_status === 'approved' &&
       item.payment_confirmation !== 'received' && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#16a085' }]}
          onPress={() => markReceived(item._id)}
          disabled={confirmingPaymentIds.includes(item._id)}
        >
          <Text style={styles.buttonText}>
            {confirmingPaymentIds.includes(item._id) ? 'Confirming...' : 'Confirm Payment Received'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8e44ad' }]}
        onPress={() => viewReceipt(item.receipt_url, item)}
      >
        <Text style={styles.buttonText}>Receipt</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Supply Requests</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by item, status, finance, or delivery..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0077b6" />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text>No supply requests found.</Text>}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Amount (KES)</Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="e.g. 15000"
              style={[styles.input, modalWarning ? { borderColor: 'red' } : {}]}
            />
            {modalWarning ? <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>{modalWarning}</Text> : null}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#27ae60', opacity: modalWarning ? 0.6 : 1 }]}
                onPress={submitSupply}
                disabled={!!modalWarning}
              >
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#c0392b' }]}
                onPress={() => { setModalVisible(false); setAmount(''); setModalWarning(''); }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#eef6fa' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#0077b6' },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ccc' },
  card: { padding: 12, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  button: { flex: 1, backgroundColor: '#0077b6', padding: 10, margin: 4, borderRadius: 5 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  itemText: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000088' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 5 },
  modalButtonText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});
