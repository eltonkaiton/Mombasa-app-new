import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const BookingScreen = () => {
  const navigation = useNavigation();

  const [bookingType, setBookingType] = useState('passenger');
  const [travelDate, setTravelDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [route, setRoute] = useState('');
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [numPassengers, setNumPassengers] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [cargoDescription, setCargoDescription] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [transactionId, setTransactionId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'https://mombasa-backend.onrender.com';

  const ferryRoutes = [
    'Likoni - Island',
    'Island - Likoni',
    'Mtongwe - Island',
    'Island - Mtongwe',
    'Likoni - Mtongwe',
    'Mtongwe - Likoni',
  ];

  const paymentMethods = ['mpesa', 'cash', 'card', 'bank transfer'];

  useEffect(() => {
    if (bookingType === 'vehicle') {
      setAmountPaid('500');
    } else if (bookingType === 'cargo') {
      const weight = parseFloat(cargoWeight);
      if (!isNaN(weight)) {
        setAmountPaid((weight * 20).toFixed(0));
      } else {
        setAmountPaid('');
      }
    } else {
      setAmountPaid('');
    }
  }, [bookingType, cargoWeight]);

  const handleSubmit = async () => {
    if (!route) {
      Alert.alert('Error', 'Please select a route.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');

      const bookingData = {
        booking_type: bookingType,
        travel_date: travelDate.toISOString().split('T')[0],
        travel_time: formatTime(travelDate),
        route,
        amount_paid: Number(amountPaid),
        // Automatically set payment status as "paid" for passenger bookings
        payment_status: bookingType === 'passenger' ? 'paid' : 'pending',
      };

      if (bookingType === 'passenger') {
        bookingData.num_passengers = numPassengers;
      } else if (bookingType === 'vehicle') {
        bookingData.vehicle_type = vehicleType;
        bookingData.vehicle_plate = vehiclePlate;
        bookingData.payment_method = paymentMethod;
        bookingData.transaction_id = transactionId;
        bookingData.payment_status = 'pending'; // Vehicle bookings require payment verification
      } else if (bookingType === 'cargo') {
        bookingData.cargo_description = cargoDescription;
        bookingData.cargo_weight_kg = cargoWeight;
        bookingData.payment_method = paymentMethod;
        bookingData.transaction_id = transactionId;
        bookingData.payment_status = 'pending'; // Cargo bookings require payment verification
      }

      await axios.post(`${API_BASE_URL}/bookings/create`, bookingData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Success', 'Booking submitted successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('MyBookings'),
        },
      ]);
      resetForm();
    } catch (error) {
      console.error('Booking submission failed:', error?.response?.data || error);
      Alert.alert('Error', error?.response?.data?.message || 'Booking submission failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoute('');
    setFilteredRoutes([]);
    setNumPassengers('');
    setVehicleType('');
    setVehiclePlate('');
    setCargoDescription('');
    setCargoWeight('');
    setPaymentMethod('');
    setFilteredPayments([]);
    setTransactionId('');
    setAmountPaid('');
    setTravelDate(new Date());
  };

  const formatDate = (date) => date.toISOString().split('T')[0];
  const formatTime = (date) => date.toTimeString().split(':').slice(0, 2).join(':');

  const handleRouteChange = (text) => {
    setRoute(text);
    if (text.length > 0) {
      const filtered = ferryRoutes.filter((r) =>
        r.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredRoutes(filtered);
    } else {
      setFilteredRoutes([]);
    }
  };

  const handleSelectRoute = (selected) => {
    setRoute(selected);
    setFilteredRoutes([]);
  };

  const handlePaymentChange = (text) => {
    setPaymentMethod(text);
    if (text.length > 0) {
      const filtered = paymentMethods.filter((p) =>
        p.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPayments(filtered);
    } else {
      setFilteredPayments([]);
    }
  };

  const handleSelectPayment = (selected) => {
    setPaymentMethod(selected);
    setFilteredPayments([]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>New Booking</Text>

      <Text style={styles.label}>Booking Type</Text>
      <View style={styles.row}>
        {['passenger', 'vehicle', 'cargo'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeBtn, bookingType === type && styles.selectedBtn]}
            onPress={() => setBookingType(type)}
          >
            <Text style={[styles.typeText, bookingType === type && { color: '#fff' }]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Travel Date</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text>{formatDate(travelDate)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={travelDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setTravelDate(new Date(selectedDate));
          }}
        />
      )}

      <Text style={styles.label}>Travel Time</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
        <Text>{formatTime(travelDate)}</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={travelDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) setTravelDate(new Date(selectedTime));
          }}
        />
      )}

      <Text style={styles.label}>Route</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter or select a route"
        value={route}
        onChangeText={handleRouteChange}
      />
      {filteredRoutes.length > 0 && (
        <View style={styles.suggestionsList}>
          {filteredRoutes.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => handleSelectRoute(item)}
              style={styles.suggestionItem}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {bookingType === 'passenger' && (
        <>
          <Text style={styles.label}>Number of Passengers</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2"
            keyboardType="numeric"
            value={numPassengers}
            onChangeText={setNumPassengers}
          />
          <Text style={styles.paymentNote}>
            * Passenger bookings are automatically marked as paid
          </Text>
        </>
      )}

      {bookingType === 'vehicle' && (
        <>
          <Text style={styles.label}>Vehicle Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Car, Truck, Bus, Motorcycle"
            value={vehicleType}
            onChangeText={setVehicleType}
          />
          <Text style={styles.label}>Vehicle Plate</Text>
          <TextInput
            style={styles.input}
            placeholder="Plate Number"
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
          />
        </>
      )}

      {bookingType === 'cargo' && (
        <>
          <Text style={styles.label}>Cargo Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe your cargo"
            value={cargoDescription}
            onChangeText={setCargoDescription}
          />
          <Text style={styles.label}>Cargo Weight (KG)</Text>
          <TextInput
            style={styles.input}
            placeholder="Weight in KG"
            keyboardType="numeric"
            value={cargoWeight}
            onChangeText={setCargoWeight}
          />
        </>
      )}

      {(bookingType === 'vehicle' || bookingType === 'cargo') && (
        <>
          <Text style={styles.label}>Payment Method</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter or select payment method"
            value={paymentMethod}
            onChangeText={handlePaymentChange}
          />
          {filteredPayments.length > 0 && (
            <View style={styles.suggestionsList}>
              {filteredPayments.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => handleSelectPayment(item)}
                  style={styles.suggestionItem}
                >
                  <Text>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Transaction ID</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter transaction ID" 
            value={transactionId} 
            onChangeText={setTransactionId} 
          />

          <Text style={styles.label}>Amount (Auto Calculated)</Text>
          <Text style={styles.amount}>{amountPaid} KES</Text>
          
          <Text style={styles.paymentNote}>
            * Payment verification required for {bookingType} bookings
          </Text>
        </>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Booking</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default BookingScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    marginTop: 15,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#f9f9f9',
  },
  suggestionsList: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    maxHeight: 120,
    marginTop: 2,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
    justifyContent: 'space-between',
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedBtn: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  typeText: {
    fontWeight: '600',
    color: '#333',
  },
  submitBtn: {
    backgroundColor: '#28a745',
    padding: 15,
    marginTop: 30,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#007bff',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    textAlign: 'center',
  },
  paymentNote: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 5,
  },
});