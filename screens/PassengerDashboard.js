import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const DashboardScreen = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userInfo');
        if (userData) setUser(JSON.parse(userData));

        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error('No token found, please login again.');

        // Fetch dashboard stats from backend with Authorization header
        const response = await axios.get('http://192.168.100.8:3000/api/users/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStats(response.data.stats);
      } catch (error) {
        console.error('Dashboard fetch error:', error.response?.data || error.message);
        Alert.alert(
          'Authentication Error',
          'Session expired or you are not authenticated. Please login again.',
          [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
        );
      } finally {
        setLoading(false);
      }
    };

    loadUserAndData();
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#006699" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Welcome, {user?.full_name || 'Passenger'} 👋</Text>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming</Text>
          <Text style={styles.cardValue}>{stats?.pendingBookings ?? 0}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Completed</Text>
          <Text style={styles.cardValue}>{stats?.completedBookings ?? 0}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cancelled</Text>
          <Text style={styles.cardValue}>0</Text> {/* Update if you track cancelled bookings */}
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('BookFerry')}
        >
          <Text style={styles.buttonText}>Book a Ferry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('MyBookings')}
        >
          <Text style={styles.buttonText}>My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('AboutUs')}
        >
          <Text style={styles.buttonText}>About Us</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Help')}
        >
          <Text style={styles.buttonText}>Help & Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ContactUs')}
        >
          <Text style={styles.buttonText}>Contact Us</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#006699',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    width: '30%',
    alignItems: 'center',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#006699',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'column',
  },
  button: {
    backgroundColor: '#006699',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
