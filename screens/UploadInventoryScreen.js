import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UploadInventoryScreen = () => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const validateInputs = () => {
    if (!itemName.trim()) {
      Alert.alert('Validation Error', 'Item Name is required.');
      return false;
    }
    if (!unit.trim()) {
      Alert.alert('Validation Error', 'Unit is required.');
      return false;
    }
    if (currentStock.trim() === '' || isNaN(currentStock) || Number(currentStock) < 0) {
      Alert.alert('Validation Error', 'Current Stock must be a non-negative number.');
      return false;
    }
    if (reorderLevel.trim() !== '' && (isNaN(reorderLevel) || Number(reorderLevel) < 0)) {
      Alert.alert('Validation Error', 'Reorder Level must be a non-negative number if provided.');
      return false;
    }
    return true;
  };

  const handleManualUpload = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('User not logged in');

      const payload = {
        item_name: itemName.trim(),
        category: category.trim(),
        unit: unit.trim(),
        current_stock: Number(currentStock),
        reorder_level: reorderLevel.trim() === '' ? 0 : Number(reorderLevel),
      };

      const response = await axios.post(
        'https://mombasa-backend.onrender.com/inventory/items',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', response.data.message || 'Item uploaded successfully');
      setItemName('');
      setCategory('');
      setUnit('');
      setCurrentStock('');
      setReorderLevel('');
    } catch (error) {
      console.error('Manual upload error:', error.response?.data || error.message);
      Alert.alert('Upload Failed', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
      });

      if (result.type === 'success') {
        setFile(result);
        Alert.alert('File Selected', result.name);
      }
    } catch (err) {
      console.error('File pick error:', err);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      Alert.alert('No File', 'Please select a file first.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('User not logged in');

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.name.endsWith('.csv')
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const response = await axios.post(
        'https://mombasa-backend.onrender.com/inventory/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      Alert.alert('Success', response.data.message || 'File uploaded successfully');
      setFile(null);
    } catch (error) {
      console.error('File upload error:', error.response?.data || error.message);
      Alert.alert('Upload Failed', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Upload Inventory Item</Text>

        {/* Manual JSON form with labels */}
        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={styles.input}
          value={itemName}
          onChangeText={setItemName}
          editable={!loading}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          editable={!loading}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Unit (e.g., kg, pcs) *</Text>
        <TextInput
          style={styles.input}
          value={unit}
          onChangeText={setUnit}
          editable={!loading}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Current Stock *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={currentStock}
          onChangeText={setCurrentStock}
          editable={!loading}
        />

        <Text style={styles.label}>Reorder Level (default 0)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={reorderLevel}
          onChangeText={setReorderLevel}
          editable={!loading}
        />

        <Button title="Upload Item" onPress={handleManualUpload} color="#007bff" />

        <View style={{ marginVertical: 20, borderBottomWidth: 1, borderBottomColor: '#ccc' }} />

        {/* File upload */}
        <Button title="Pick File" onPress={pickFile} color="#28a745" />
        {file && <Text style={{ marginVertical: 10 }}>Selected: {file.name}</Text>}
        <Button title="Upload File" onPress={handleFileUpload} color="#28a745" />

        {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 10 }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#f9fafd',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
    color: '#222',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 18,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
});

export default UploadInventoryScreen;
