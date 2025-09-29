// StockDeliveryScreen.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const BASE_URL = 'http://192.168.100.8:5000/inventory';

const StockDeliveryScreen = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [searchText, setSearchText] = useState('');

  // ===========================
  // Fetch Deliveries
  // ===========================
  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setDeliveries(data);
      setFilteredDeliveries(data);
    } catch (err) {
      console.error('Fetch deliveries error:', err.response?.data || err.message);
      setError('Failed to fetch deliveries. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  // ===========================
  // Confirm Received
  // ===========================
  const confirmReceived = async (orderId) => {
    try {
      setMarkingId(orderId);
      const token = await AsyncStorage.getItem('token');

      const res = await axios.patch(
        `${BASE_URL}/deliveries/${orderId}/confirm-received`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data.order;

      setDeliveries((prev) =>
        prev.map((item) =>
          item.order_id === orderId
            ? { ...item, delivery_status: updated.delivery_status, received_at: updated.received_at }
            : item
        )
      );

      setFilteredDeliveries((prev) =>
        prev.map((item) =>
          item.order_id === orderId
            ? { ...item, delivery_status: updated.delivery_status, received_at: updated.received_at }
            : item
        )
      );

      Alert.alert('Success', 'Delivery confirmed as received.');
    } catch (err) {
      console.error('Confirm received error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to confirm delivery.');
    } finally {
      setMarkingId(null);
    }
  };

  // ===========================
  // Search Deliveries
  // ===========================
  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = deliveries.filter((d) => {
      const itemName = d.item_name?.toLowerCase() || '';
      const supplierName = d.supplier_name?.toLowerCase() || '';
      return itemName.includes(text.toLowerCase()) || supplierName.includes(text.toLowerCase());
    });
    setFilteredDeliveries(filtered);
  };

  // ===========================
  // Export PDF
  // ===========================
  const exportPDF = async () => {
    if (filteredDeliveries.length === 0) {
      Alert.alert('No data', 'There are no deliveries to export.');
      return;
    }

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h2 { color: #0077b6; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #333; padding: 8px; font-size: 12px; text-align: left; }
            th { background-color: #0077b6; color: #fff; }
          </style>
        </head>
        <body>
          <h2>Delivery Receipts</h2>
          <table>
            <tr>
              <th>Item</th>
              <th>Supplier</th>
              <th>Quantity</th>
              <th>Amount</th>
              <th>Delivered At</th>
              <th>Status</th>
            </tr>
            ${filteredDeliveries
              .map(
                (d) => `
              <tr>
                <td>${d.item_name || ''}</td>
                <td>${d.supplier_name || ''}</td>
                <td>${d.quantity ?? ''}</td>
                <td>${d.amount ?? ''}</td>
                <td>${d.delivered_at ? new Date(d.delivered_at).toLocaleString() : ''}</td>
                <td>${d.delivery_status || ''}</td>
              </tr>
            `
              )
              .join('')}
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Delivery Receipts',
      });
    } catch (err) {
      console.error('Export PDF error:', err);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  // ===========================
  // Render Each Delivery
  // ===========================
  const renderItem = ({ item }) => {
    let buttonText = 'Mark as Received';
    let buttonColor = '#0077b6';
    let disabled = false;

    if (item.delivery_status === 'pending') {
      buttonText = '⏳ Awaiting Delivery';
      buttonColor = '#888';
      disabled = true;
    } else if (item.delivery_status === 'delivered') {
      buttonText = 'Mark as Received';
      buttonColor = '#f39c12';
    } else if (item.delivery_status === 'received') {
      buttonText = '✅ Received';
      buttonColor = 'green';
      disabled = true;
    }

    return (
      <View style={styles.card}>
        <Text style={styles.text}>📦 {item.item_name || 'N/A'}</Text>
        <Text style={styles.text}>Supplier: {item.supplier_name || 'N/A'}</Text>
        <Text style={styles.text}>Quantity: {item.quantity ?? 'N/A'}</Text>
        <Text style={styles.text}>Amount: {item.amount ?? 'N/A'}</Text>
        <Text style={styles.text}>
          Delivered At: {item.delivered_at ? new Date(item.delivered_at).toLocaleString() : 'N/A'}
        </Text>
        <Text style={styles.text}>Status: {item.delivery_status || 'N/A'}</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonColor }]}
          onPress={() => item.delivery_status === 'delivered' && confirmReceived(item.order_id)}
          disabled={disabled || markingId === item.order_id}
        >
          {markingId === item.order_id ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{buttonText}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ===========================
  // Render
  // ===========================
  if (loading && !refreshing) {
    return <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 40 }} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDeliveries}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 10 }}>
        <Text style={styles.header}>📑 Stock Deliveries</Text>
        <TextInput
          placeholder="Search by item or supplier"
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.exportButton} onPress={exportPDF}>
          <Text style={styles.exportButtonText}>Download Receipts PDF</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredDeliveries}
        keyExtractor={(item, index) => item.order_id || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50 }}>No deliveries found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0077b6',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#0077b6',
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },
  exportButton: {
    backgroundColor: '#00b894',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#0077b6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
});

export default StockDeliveryScreen;
