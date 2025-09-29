import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';

const ViewInventoryScreen = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await axios.get('http://192.168.100.8:3000/inventory/all'); // Update this to your IP if testing on device
      setInventory(res.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.name}</Text>
      <Text>Quantity: {item.quantity}</Text>
      <Text>Category: {item.category}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Inventory List</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0077b6" />
      ) : (
        <FlatList
          data={inventory}
          renderItem={renderItem}
          keyExtractor={(item) => item._id.toString()} // ✅ Updated line
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

export default ViewInventoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6fa',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0077b6',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  item: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077b6',
  },
});
