import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const routeOptions = [
  "Makupa - Likoni",
  "Likoni - Makupa",
  "Mombasa Island - Nyali",
  "Nyali - Mombasa Island",
  "Mombasa Island - Tudor",
  "Tudor - Mombasa Island",
];

const paymentMethods = [
  'M-Pesa',
  'Cash',
  'Credit Card',
  'Bank Transfer',
  'Other'
];

const initialFormState = {
  travel_date: '',
  travel_time: '',
  route: '',
  num_passengers: '',
  vehicle_type: '',
  vehicle_plate: '',
  cargo_description: '',
  cargo_weight_kg: '',
  amount_paid: '',
  payment_method: '',
  transaction_id: ''
};

const BookFerryContent = () => {
  const [bookingType, setBookingType] = useState('passenger');
  const [form, setForm] = useState(initialFormState);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const user_id = 1; // Replace with actual user ID

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });

    if (field === 'route') {
      if (value.length > 0) {
        const filtered = routeOptions.filter(route =>
          route.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredRoutes(filtered);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const selectRoute = (route) => {
    setForm({ ...form, route });
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    const payload = {
      user_id,
      booking_type: bookingType,
      ...form
    };

    try {
      const response = await axios.post('http://172.17.14.56:3000/api/bookings', payload);
      Alert.alert('Success', 'Booking submitted successfully!');
      console.log('Server response:', response.data);

      setForm(initialFormState);
      setBookingType('passenger');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error submitting booking:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to submit booking. Please try again.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.label}>Booking Type</Text>
      <View style={styles.bookingTypeContainer}>
        <Button
          title="Passenger"
          onPress={() => setBookingType('passenger')}
          color={bookingType === 'passenger' ? '#007bff' : '#ccc'}
        />
        <Button
          title="Vehicle"
          onPress={() => setBookingType('vehicle')}
          color={bookingType === 'vehicle' ? '#007bff' : '#ccc'}
        />
        <Button
          title="Cargo"
          onPress={() => setBookingType('cargo')}
          color={bookingType === 'cargo' ? '#007bff' : '#ccc'}
        />
      </View>

      <Text style={styles.label}>Travel Date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={form.travel_date}
        onChangeText={(text) => handleChange('travel_date', text)}
      />

      <Text style={styles.label}>Travel Time</Text>
      <TextInput
        style={styles.input}
        placeholder="HH:MM"
        value={form.travel_time}
        onChangeText={(text) => handleChange('travel_time', text)}
      />

      <Text style={styles.label}>Route</Text>
      <TextInput
        style={styles.input}
        placeholder="Type route"
        value={form.route}
        onChangeText={(text) => handleChange('route', text)}
        onFocus={() => {
          if (form.route.length > 0) setShowSuggestions(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 100);
        }}
      />
      {showSuggestions && filteredRoutes.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={filteredRoutes}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectRoute(item)} style={styles.suggestionItem}>
                <Text>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {bookingType === 'passenger' && (
        <>
          <Text style={styles.label}>Number of Passengers</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.num_passengers}
            onChangeText={(text) => handleChange('num_passengers', text)}
          />
        </>
      )}

      {bookingType === 'vehicle' && (
        <View style={{ maxHeight: 250, marginBottom: 20 }}>
          <Text style={styles.label}>Vehicle Type</Text>
          <TextInput
            style={styles.input}
            value={form.vehicle_type}
            onChangeText={(text) => handleChange('vehicle_type', text)}
          />
          <Text style={styles.label}>Vehicle Plate</Text>
          <TextInput
            style={styles.input}
            value={form.vehicle_plate}
            onChangeText={(text) => handleChange('vehicle_plate', text)}
          />
        </View>
      )}

      {bookingType === 'cargo' && (
        <View style={{ maxHeight: 250, marginBottom: 20 }}>
          <Text style={styles.label}>Cargo Description</Text>
          <TextInput
            style={styles.input}
            value={form.cargo_description}
            onChangeText={(text) => handleChange('cargo_description', text)}
          />
          <Text style={styles.label}>Cargo Weight (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.cargo_weight_kg}
            onChangeText={(text) => handleChange('cargo_weight_kg', text)}
          />
        </View>
      )}

      <Text style={styles.label}>Amount Paid</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={form.amount_paid}
        onChangeText={(text) => handleChange('amount_paid', text)}
      />

      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={form.payment_method}
          onValueChange={(itemValue) => handleChange('payment_method', itemValue)}
        >
          <Picker.Item label="Select payment method" value="" />
          {paymentMethods.map((method) => (
            <Picker.Item key={method} label={method} value={method} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Transaction ID</Text>
      <TextInput
        style={styles.input}
        value={form.transaction_id}
        onChangeText={(text) => handleChange('transaction_id', text)}
      />

      <Button title="Submit Booking" onPress={handleSubmit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { marginTop: 10, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginTop: 5,
    borderRadius: 4,
  },
  bookingTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderColor: '#ccc',
    borderWidth: 1,
    maxHeight: 120,
    marginTop: 0,
    borderRadius: 4,
  },
  suggestionItem: {
    padding: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginTop: 5,
    marginBottom: 10,
  },
});

export default BookFerryContent;
