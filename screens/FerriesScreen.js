import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

// API Endpoint
const FERRIES_URL = 'https://mombasa-backend.onrender.com/ferries';

const FerriesScreen = () => {
  const [ferries, setFerries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [editingId, setEditingId] = useState(null); // null means adding, not editing

  const fetchFerries = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('staffToken');
      if (!token) return Alert.alert('Error', 'No token found. Please login again.');
      const response = await axios.get(FERRIES_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFerries(response.data.ferries || []);
    } catch (error) {
      console.error('Error fetching ferries:', error.message);
      Alert.alert('Error', 'Failed to fetch ferries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFerries();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFerries().then(() => setRefreshing(false));
  }, []);

  const submitFerry = async () => {
    if (!name || !capacity) return Alert.alert('Error', 'Please enter all fields.');
    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('staffToken');

      if (editingId) {
        // Update ferry
        await axios.put(
          `${FERRIES_URL}/${editingId}`,
          { name, capacity: Number(capacity) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Ferry updated successfully!');
      } else {
        // Add new ferry
        await axios.post(
          FERRIES_URL,
          { name, capacity: Number(capacity) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Ferry added successfully!');
      }

      // Reset form
      setName('');
      setCapacity('');
      setEditingId(null);
      fetchFerries();
    } catch (error) {
      console.error('Error submitting ferry:', error.message);
      Alert.alert('Error', editingId ? 'Failed to update ferry.' : 'Failed to add ferry.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteFerry = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this ferry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('staffToken');
            await axios.delete(`${FERRIES_URL}/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Deleted', 'Ferry deleted successfully.');
            fetchFerries();
          } catch (error) {
            console.error('Error deleting ferry:', error.message);
            Alert.alert('Error', 'Failed to delete ferry.');
          }
        },
      },
    ]);
  };

  const startEditFerry = (ferry) => {
    setName(ferry.name);
    setCapacity(ferry.capacity.toString());
    setEditingId(ferry._id);
  };

  const renderFerry = ({ item, index }) => (
    <View style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
      <TouchableOpacity style={{ flex: 7, flexDirection: 'row' }} onPress={() => startEditFerry(item)}>
        <Text style={[styles.cell, { flex: 1 }]}>{index + 1}</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{item.name}</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{item.capacity}</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{item.status}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => deleteFerry(item._id)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Add/Edit Ferry Form */}
      <View style={styles.addForm}>
        <Text style={styles.formTitle}>{editingId ? 'Edit Ferry' : 'Add New Ferry'}</Text>

        <Text style={styles.inputLabel}>Ferry Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>Capacity</Text>
        <TextInput
          style={styles.input}
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.addButton} onPress={submitFerry} disabled={submitting}>
          <Text style={styles.addButtonText}>
            {submitting ? (editingId ? 'Updating...' : 'Adding...') : editingId ? 'Update Ferry' : 'Add Ferry'}
          </Text>
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#dc3545', marginTop: 5 }]}
            onPress={() => {
              setName('');
              setCapacity('');
              setEditingId(null);
            }}
          >
            <Text style={styles.addButtonText}>Cancel Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : ferries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No ferries found.</Text>
        </View>
      ) : (
        <ScrollView horizontal>
          <View>
            {/* Table Header */}
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, { flex: 1, fontWeight: 'bold' }]}>#</Text>
              <Text style={[styles.cell, { flex: 2, fontWeight: 'bold' }]}>Name</Text>
              <Text style={[styles.cell, { flex: 2, fontWeight: 'bold' }]}>Capacity</Text>
              <Text style={[styles.cell, { flex: 2, fontWeight: 'bold' }]}>Status</Text>
              <Text style={[styles.cell, { flex: 1, fontWeight: 'bold' }]}>Action</Text>
            </View>

            <FlatList
              data={ferries}
              keyExtractor={(item) => item._id}
              renderItem={renderFerry}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default FerriesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addForm: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2 },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  inputLabel: { fontWeight: '600', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  deleteText: { color: '#dc3545', fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  headerRow: { backgroundColor: '#007bff' },
  cell: { paddingHorizontal: 5, color: '#000' },
  evenRow: { backgroundColor: '#fff' },
  oddRow: { backgroundColor: '#f0f0f0' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888' },
});
