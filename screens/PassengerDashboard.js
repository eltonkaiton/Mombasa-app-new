import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install expo/vector-icons

const DashboardScreen = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userInfo');
        if (userData) setUser(JSON.parse(userData));

        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error('No token found, please login again.');

        // Fetch dashboard stats from backend with Authorization header
        const response = await axios.get('https://mombasa-backend.onrender.com/api/users/dashboard', {
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

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search', 'Please enter a search term');
      return;
    }
    
    // Navigate to search results screen or implement search logic
    Alert.alert('Search', `Searching for: ${searchQuery}`);
    // You can implement actual search navigation here
    // navigation.navigate('SearchResults', { query: searchQuery });
  };

  const handleChatWithUs = () => {
    Alert.alert(
      'Chat with Operation Staff',
      'You will be connected with our operation staff. How can we help you today?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start Chat',
          onPress: () => {
            // Navigate to chat screen with operation staff category
            navigation.navigate('Chat', { 
              staffCategory: 'operation',
              staffName: 'Operation Staff'
            });
          },
        },
      ]
    );
  };

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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for routes, schedules..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

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
          <Text style={styles.cardValue}>{stats?.cancelledBookings ?? 0}</Text>
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

        {/* Chat with Us Button */}
        <TouchableOpacity
          style={[styles.button, styles.chatButton]}
          onPress={handleChatWithUs}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Chat with Operation Staff</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Chat Button for easy access */}
      <TouchableOpacity 
        style={styles.floatingChatButton}
        onPress={handleChatWithUs}
      >
        <Ionicons name="chatbubble" size={24} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    paddingBottom: 80, // Extra padding for floating button
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#006699',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#006699',
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#006699',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 15,
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
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  chatButton: {
    backgroundColor: '#28a745', // Different color for chat button
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#28a745',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});