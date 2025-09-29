import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.137.161:3000/api';

const DashboardContent = () => {
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);

  const userId = '1'; // Replace with actual user ID or auth context

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const summaryRes = await axios.get(`${API_BASE_URL}/bookings/summary/${userId}`);
      setSummary(summaryRes.data);

      // If you want to fetch updates dynamically from backend, add axios call here.
      // For now, updates are hardcoded below.
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Example updates data (replace with dynamic data if available)
  const updates = [
    { id: 1, text: 'New ferry schedule available for June.' },
    { id: 2, text: 'Maintenance scheduled for the Mombasa-Nairobi route on May 30.' },
    { id: 3, text: 'COVID-19 safety protocols updated.' },
  ];

  if (loading) {
    return <ActivityIndicator size="large" color="#0066cc" style={{ marginTop: 50 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>Total Bookings</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{summary.active}</Text>
          <Text style={styles.summaryLabel}>Active Bookings</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{summary.cancelled}</Text>
          <Text style={styles.summaryLabel}>Cancelled Bookings</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Updates</Text>
      {updates.length === 0 ? (
        <Text style={styles.emptyText}>No updates available.</Text>
      ) : (
        updates.map((update) => (
          <View key={update.id} style={styles.updateItem}>
            <Text style={styles.updateText}>{update.text}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default DashboardContent;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 10,
    width: '30%',
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  updateItem: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  updateText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
  },
});
