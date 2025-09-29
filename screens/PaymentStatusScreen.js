import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.100.8:3000/api/suppliers';

const PaymentStatus = () => {
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');

        if (!user || !token) {
          console.error('User or token not found in storage');
          setLoading(false);
          return;
        }

        const { id } = JSON.parse(user); // supplier id

        const res = await axios.get(`${API_URL}/payments/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ Include JWT token
          },
        });

        setPayments(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error('Failed to load payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const applyFilter = (status) => {
    setFilter(status);
    if (status === 'All') {
      setFiltered(payments);
    } else {
      setFiltered(payments.filter((p) => p.status.toLowerCase() === status.toLowerCase()));
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.label}>Reference:</Text>
      <Text style={styles.value}>{item.reference}</Text>

      <Text style={styles.label}>Status:</Text>
      <Text
        style={[
          styles.status,
          item.status === 'Paid'
            ? styles.paid
            : item.status === 'Pending'
            ? styles.pending
            : styles.rejected,
        ]}
      >
        {item.status}
      </Text>

      <Text style={styles.label}>Amount:</Text>
      <Text style={styles.value}>KES {item.amount}</Text>

      <Text style={styles.label}>Date:</Text>
      <Text style={styles.value}>{item.date}</Text>

      {item.receipt_url && (
        <TouchableOpacity onPress={() => Linking.openURL(item.receipt_url)}>
          <Text style={styles.receiptLink}>📄 View Receipt</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Status</Text>

      <View style={styles.filterContainer}>
        {['All', 'Paid', 'Pending', 'Rejected'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filter === status && styles.activeFilterButton,
            ]}
            onPress={() => applyFilter(status)}
          >
            <Text
              style={[
                styles.filterText,
                filter === status && styles.activeFilterText,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0077b6" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#eef6fa' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0077b6', marginBottom: 12 },

  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    flexWrap: 'wrap',
    gap: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ddd',
    borderRadius: 10,
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: '#0077b6',
  },
  filterText: {
    color: '#333',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  label: {
    fontWeight: '600',
    color: '#555',
    marginTop: 5,
  },
  value: {
    fontSize: 16,
    color: '#222',
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  paid: { color: 'green' },
  pending: { color: '#e67e22' },
  rejected: { color: '#c0392b' },
  receiptLink: {
    color: '#1d3557',
    marginTop: 8,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default PaymentStatus;
