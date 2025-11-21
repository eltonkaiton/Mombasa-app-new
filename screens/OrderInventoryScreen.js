import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const API_BASE = 'https://mombasa-backend.onrender.com';

export default function OrderInventoryScreen() {
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    fetchInventoryItems();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/suppliers`);
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to load suppliers', err);
      Alert.alert('Error', 'Could not load supplier list.');
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/inventory/items`);
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load inventory items', err);
      Alert.alert('Error', 'Could not load inventory items.');
    }
  };

  const handleOrder = async () => {
    if (!selectedSupplier || !selectedItem || !quantity) {
      Alert.alert('Validation', 'Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const res = await axios.post(
        `${API_BASE}/api/inventory/orders`,
        {
          supplier_id: selectedSupplier,
          item_id: selectedItem,
          quantity: parseFloat(quantity),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Success', 'Order placed successfully.');
      setSelectedSupplier('');
      setSelectedItem('');
      setQuantity('');
    } catch (err) {
      console.error('Order failed:', err);
      Alert.alert('Error', 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📦 Order Inventory Item</Text>

      <Text style={styles.label}>Select Supplier</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedSupplier}
          onValueChange={(val) => setSelectedSupplier(val)}
        >
          <Picker.Item label="-- Choose Supplier --" value="" />
          {suppliers.map((s) => (
            <Picker.Item key={s.id} label={s.name} value={s.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Select Item</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedItem}
          onValueChange={(val) => setSelectedItem(val)}
        >
          <Picker.Item label="-- Choose Item --" value="" />
          {items.map((i) => (
            <Picker.Item key={i.id} label={i.item_name} value={i.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Quantity</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter quantity"
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Place Order</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#eef6fa',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0077b6',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    marginTop: 10,
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0077b6',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
