import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import {
  fetchOrders,
  approveOrderPayment,
  rejectOrderPayment,
} from '../services/financeApi';

const FinanceOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Refresh orders immediately after action
  const refreshOrders = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleApprovePayment = async (orderId) => {
    try {
      const res = await approveOrderPayment(orderId);
      if (res?.message) {
        Alert.alert('Success', res.message);
        refreshOrders();
      } else {
        Alert.alert('Error', 'Approval failed');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Approval failed');
    }
  };

  const handleRejectPayment = async (orderId) => {
    try {
      const res = await rejectOrderPayment(orderId);
      if (res?.message) {
        Alert.alert('Rejected', res.message);
        refreshOrders();
      } else {
        Alert.alert('Error', 'Rejection failed');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Rejection failed');
    }
  };

  const handleViewReceipt = async (item) => {
    try {
      const fileUri =
        FileSystem.documentDirectory +
        `receipt_${item.id || item._id}.pdf`;

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h2 { text-align: center; color: #0077b6; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              table, th, td { border: 1px solid #333; }
              th, td { padding: 10px; text-align: left; }
              .signature { text-align: center; margin-top: 50px; }
              .signature-line { margin-top: 50px; border-top: 1px solid #000; width: 200px; margin-left: auto; margin-right: auto; }
            </style>
          </head>
          <body>
            <h2>Finance Receipt</h2>
            <table>
              <tr><th>Order ID</th><td>${item.id || item._id}</td></tr>
              <tr><th>Supplier</th><td>${item.supplier_name || 'N/A'}</td></tr>
              <tr><th>Item</th><td>${item.item_name || 'N/A'}</td></tr>
              <tr><th>Quantity</th><td>${item.quantity || 'N/A'}</td></tr>
              <tr><th>Amount</th><td>Ksh ${item.amount?.toLocaleString() || '0'}</td></tr>
              <tr><th>Status</th><td>${item.status || 'N/A'}</td></tr>
              <tr><th>Finance Status</th><td>${item.finance_status || 'N/A'}</td></tr>
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
    } catch (err) {
      console.error('❌ Receipt generation failed:', err.message);
      Alert.alert('Error', 'Failed to generate receipt.');
    }
  };

  const handleDownloadAllReceipts = async () => {
    if (!orders.length) {
      Alert.alert('No orders available to generate receipt.');
      return;
    }

    try {
      const fileUri = FileSystem.documentDirectory + `all_orders_receipt.pdf`;

      let rows = orders
        .map(
          (order) => `
          <tr>
            <td>${order.id || order._id}</td>
            <td>${order.supplier_name || 'N/A'}</td>
            <td>${order.item_name || 'N/A'}</td>
            <td>${order.quantity || 'N/A'}</td>
            <td>Ksh ${order.amount?.toLocaleString() || '0'}</td>
            <td>${order.status || 'N/A'}</td>
            <td>${order.finance_status || 'N/A'}</td>
          </tr>`
        )
        .join('');

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h2 { text-align: center; color: #0077b6; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              table, th, td { border: 1px solid #333; font-size: 12px; }
              th, td { padding: 8px; text-align: left; }
              th { background: #f0f0f0; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #555; }
            </style>
          </head>
          <body>
            <h2>Finance Orders Report</h2>
            <p>Total Orders: ${orders.length}</p>
            <table>
              <tr>
                <th>Order ID</th>
                <th>Supplier</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Finance Status</th>
              </tr>
              ${rows}
            </table>
            <div class="footer">
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <p>Mombasa Ferry Finance System</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await FileSystem.moveAsync({ from: uri, to: fileUri });
      await Sharing.shareAsync(fileUri);
    } catch (err) {
      console.error('❌ All Orders PDF failed:', err.message);
      Alert.alert('Error', 'Failed to generate all orders PDF.');
    }
  };

  const formatCurrency = (amount) => `Ksh ${amount?.toLocaleString() || '0'}`;

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.text}>Order ID: {item.id || item._id}</Text>
      <Text style={styles.text}>
        Supplier: <Ionicons name="person-circle-outline" size={16} color="#0077b6" />{' '}
        {item.supplier_name}
      </Text>
      <Text style={styles.text}>
        Item: <Ionicons name="cube-outline" size={16} color="#0077b6" />{' '}
        {item.item_name}
      </Text>
      <Text style={styles.text}>
        Quantity: <Ionicons name="layers-outline" size={16} color="#0077b6" />{' '}
        {item.quantity}
      </Text>
      <Text style={styles.text}>
        Amount: <Ionicons name="cash-outline" size={16} color="#0077b6" />{' '}
        {formatCurrency(item.amount)}
      </Text>
      <Text style={styles.text}>Status: {item.status}</Text>
      <Text style={styles.text}>
        Payment:{' '}
        {item.finance_status === 'approved' ? (
          <Ionicons name="checkmark-circle-outline" size={16} color="green" />
        ) : item.finance_status === 'rejected' ? (
          <Ionicons name="close-circle-outline" size={16} color="red" />
        ) : (
          'Pending'
        )}{' '}
        {item.finance_status}
      </Text>

      {item.finance_status === 'pending' && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => handleApprovePayment(item.id || item._id)}
            style={styles.approveBtn}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.btnText}> Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRejectPayment(item.id || item._id)}
            style={styles.rejectBtn}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.btnText}> Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={() => handleViewReceipt(item)}
        style={styles.receiptBtn}
      >
        <Ionicons name="document-text-outline" size={16} color="#fff" />
        <Text style={styles.btnText}> Receipt</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#0077b6"
        style={{ marginTop: 40 }}
      />
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => (item.id || item._id).toString()}
      renderItem={renderOrder}
      contentContainerStyle={styles.container}
      refreshing={refreshing}
      onRefresh={refreshOrders}
      ListHeaderComponent={
        <View>
          <Text style={styles.heading}>Finance Orders</Text>
          <TouchableOpacity
            onPress={handleDownloadAllReceipts}
            style={styles.downloadAllBtn}
          >
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.btnText}> Download All Receipts</Text>
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={
        <Text style={{ textAlign: 'center', marginTop: 50, color: '#777' }}>
          No orders to display.
        </Text>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f4f8',
    paddingBottom: 100,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0077b6',
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  approveBtn: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  rejectBtn: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  receiptBtn: {
    backgroundColor: '#8e44ad',
    padding: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  downloadAllBtn: {
    backgroundColor: '#ff9800',
    padding: 12,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FinanceOrdersScreen;
