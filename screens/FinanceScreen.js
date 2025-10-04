import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://mombasa-backend.onrender.com';

export default function FinanceScreen() {
  const [bookings, setBookings] = useState([]);
  const [supplyRequests, setSupplyRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = async () => await AsyncStorage.getItem('token');

  // Fetch summary safely
  const fetchSummary = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE}/api/finance/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(res.data || {});
    } catch (err) {
      console.error('Fetch summary error:', err.message);
      setSummary({});
    }
  };

  // Fetch bookings safely
  const fetchBookings = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE}/api/finance/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(Array.isArray(res.data.bookings) ? res.data.bookings : []);
    } catch (err) {
      console.error('Fetch bookings error:', err.message);
      setBookings([]);
    }
  };

  // Fetch supply requests safely
  const fetchSupplyRequests = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE}/api/finance/supply-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSupplyRequests(Array.isArray(res.data.supplyRequests) ? res.data.supplyRequests : []);
    } catch (err) {
      console.error('Fetch supply requests error:', err.message);
      setSupplyRequests([]);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchBookings(), fetchSupplyRequests()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handlePaymentAction = async (id, action) => {
    const token = await getToken();
    try {
      await axios.post(`${API_BASE}/api/finance/${action}-payment`, { bookingId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', `Payment ${action}ed successfully`);
      fetchBookings();
      fetchSummary();
    } catch (err) {
      console.error(`Payment ${action} error:`, err.message);
      Alert.alert('Error', `Failed to ${action} payment`);
    }
  };

  const handleSupplyApproval = async (id, action) => {
    const token = await getToken();
    try {
      await axios.put(`${API_BASE}/api/finance/${action}-supply/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', `Supply request ${action}ed`);
      fetchSupplyRequests();
    } catch (err) {
      console.error(`Supply ${action} error:`, err.message);
      Alert.alert('Error', `Failed to ${action} supply request`);
    }
  };

  const renderBooking = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.bold}>#{item._id} - {item.user_id?.full_name || 'Unknown'}</Text>
      <Text>Amount: Ksh {item.amount_paid ?? 'N/A'}</Text>
      <Text>Status: {item.payment_status}</Text>
      {item.payment_status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handlePaymentAction(item._id, 'approve')}
            style={[styles.button, styles.approve]}>
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePaymentAction(item._id, 'reject')}
            style={[styles.button, styles.reject]}>
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSupplyRequest = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.bold}>Item: {item.item_name}</Text>
      <Text>Supplier: {item.supplier_name}</Text>
      <Text>Quantity: {item.quantity}</Text>
      <Text>Amount: Ksh {item.amount}</Text>
      <Text>Finance Status: {item.finance_status}</Text>
      {item.finance_status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handleSupplyApproval(item._id, 'approve')}
            style={[styles.button, styles.approve]}>
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSupplyApproval(item._id, 'reject')}
            style={[styles.button, styles.reject]}>
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <Text style={styles.title}>📊 Finance Dashboard</Text>

        {summary && (
          <View style={styles.summaryBox}>
            <Text>Total Bookings: {summary.total_bookings ?? 0}</Text>
            <Text>Total Revenue: Ksh {summary.total_revenue ?? 0}</Text>
            <Text>Pending Payments: Ksh {summary.pending_amount ?? 0}</Text>
            <Text>Rejected Payments: Ksh {summary.rejected_amount ?? 0}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>💰 Pending Payments</Text>
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderBooking}
          scrollEnabled={false}
        />

        <Text style={styles.sectionTitle}>📦 Supply Requests</Text>
        <FlatList
          data={supplyRequests}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderSupplyRequest}
          scrollEnabled={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f1f9ff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0077b6', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 6 },
  summaryBox: { backgroundColor: '#e0f0ff', padding: 12, borderRadius: 10, marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, borderColor: '#cce6ff', borderWidth: 1 },
  bold: { fontWeight: 'bold' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  button: { flex: 1, padding: 8, borderRadius: 6, alignItems: 'center', marginHorizontal: 5 },
  approve: { backgroundColor: '#4CAF50' },
  reject: { backgroundColor: '#F44336' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
