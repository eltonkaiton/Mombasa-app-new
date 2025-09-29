import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const InventoryHome = ({ route }) => {
  const navigation = useNavigation();
  const full_name = route?.params?.full_name || 'Inventory Staff';

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome, {full_name}</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('UploadInventory')}
        >
          <Text style={styles.cardText}>Upload Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ViewInventory')}
        >
          <Text style={styles.cardText}>View Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('OrderInventory')}
        >
          <Text style={styles.cardText}>Order Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('StockDeliveries')}
        >
          <Text style={styles.cardText}>Stock Deliveries</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: '#f44336' }]}
          onPress={handleLogout}
        >
          <Text style={styles.cardText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InventoryHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6fa',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0077b6',
    marginBottom: 30,
    textAlign: 'center',
  },
  cardContainer: {
    flexDirection: 'column',
    gap: 20,
  },
  card: {
    backgroundColor: '#0077b6',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  cardText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
