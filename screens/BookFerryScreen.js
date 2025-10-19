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
  const [showPaymentSuggestions, setShowPaymentSuggestions] = useState(false);
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

  const paymentMethods = ['mpesa', 'cash', 'card', 'bank'];

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

  // Function to check if selected date/time is in the past
  const isPastDateTime = (selectedDate) => {
    const now = new Date();
    return selectedDate < now;
  };

  // Function to get minimum date for date picker (today)
  const getMinDate = () => {
    return new Date();
  };

  // Function to validate booking date and time
  const validateBookingDateTime = () => {
    if (isPastDateTime(travelDate)) {
      Alert.alert('Invalid Date/Time', 'You cannot book for a past date or time. Please select a future date and time.');
      return false;
    }
    return true;
  };

  const validateTransactionId = (id) => {
    // Check if transaction ID contains both letters and numbers
    const hasLetters = /[a-zA-Z]/.test(id);
    const hasNumbers = /[0-9]/.test(id);
    return hasLetters && hasNumbers;
  };

  const handleSubmit = async () => {
    // Validate date and time first
    if (!validateBookingDateTime()) {
      return;
    }

    if (!route) {
      Alert.alert('Error', 'Please select a route.');
      return;
    }

    // Validate transaction ID for vehicle and cargo bookings
    if ((bookingType === 'vehicle' || bookingType === 'cargo') && transactionId) {
      if (!validateTransactionId(transactionId)) {
        Alert.alert('Error', 'Transaction ID must contain both letters and numbers.');
        return;
      }
    }

    // Validate payment method for vehicle and cargo bookings
    if ((bookingType === 'vehicle' || bookingType === 'cargo') && !paymentMethod) {
      Alert.alert('Error', 'Please select a payment method.');
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
        // Set payment status based on booking type
        payment_status: bookingType === 'passenger' ? 'paid' : 'pending',
      };

      if (bookingType === 'passenger') {
        bookingData.num_passengers = parseInt(numPassengers) || 1;
        // For passenger bookings, use default payment method and auto-generated transaction ID
        bookingData.payment_method = 'cash';
        bookingData.transaction_id = `PASS-${Date.now()}`;
      } else if (bookingType === 'vehicle') {
        bookingData.vehicle_type = vehicleType;
        bookingData.vehicle_plate = vehiclePlate;
        bookingData.payment_method = paymentMethod;
        bookingData.transaction_id = transactionId;
      } else if (bookingType === 'cargo') {
        bookingData.cargo_description = cargoDescription;
        bookingData.cargo_weight_kg = parseFloat(cargoWeight);
        bookingData.payment_method = paymentMethod;
        bookingData.transaction_id = transactionId;
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
    setShowPaymentSuggestions(false);
    setTransactionId('');
    setAmountPaid('');
    setTravelDate(new Date());
  };

  const formatDate = (date) => date.toISOString().split('T')[0];
  const formatTime = (date) => date.toTimeString().split(':').slice(0, 2).join(':');

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // If selected date is today, ensure time is not in the past
      const now = new Date();
      const today = new Date(now.toDateString());
      const selectedDay = new Date(selectedDate.toDateString());
      
      if (selectedDay.getTime() === today.getTime()) {
        // If selecting today's date, ensure time is in future
        if (selectedDate < now) {
          Alert.alert('Invalid Time', 'You cannot book for a past time. Please select a future time.');
          // Set to current time + 1 hour as default
          const futureTime = new Date(now.getTime() + 60 * 60 * 1000);
          setTravelDate(futureTime);
          return;
        }
      }
      setTravelDate(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const now = new Date();
      const selectedDateTime = new Date(
        travelDate.getFullYear(),
        travelDate.getMonth(),
        travelDate.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );

      if (selectedDateTime < now) {
        Alert.alert('Invalid Time', 'You cannot book for a past time. Please select a future time.');
        // Set to current time + 1 hour as default
        const futureTime = new Date(now.getTime() + 60 * 60 * 1000);
        setTravelDate(futureTime);
        return;
      }

      // Update only the time portion while keeping the date
      const updatedDate = new Date(travelDate);
      updatedDate.setHours(selectedTime.getHours());
      updatedDate.setMinutes(selectedTime.getMinutes());
      setTravelDate(updatedDate);
    }
  };

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
      setShowPaymentSuggestions(true);
    } else {
      setFilteredPayments([]);
      setShowPaymentSuggestions(false);
    }
  };

  const handleSelectPayment = (selected) => {
    setPaymentMethod(selected);
    setFilteredPayments([]);
    setShowPaymentSuggestions(false);
  };

  const handlePaymentInputFocus = () => {
    setFilteredPayments(paymentMethods);
    setShowPaymentSuggestions(true);
  };

  const handlePaymentInputBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowPaymentSuggestions(false);
    }, 200);
  };

  // Get date display with warning if past
  const getDateDisplay = () => {
    const dateStr = formatDate(travelDate);
    if (isPastDateTime(travelDate)) {
      return `${dateStr} ⚠️ Past`;
    }
    return dateStr;
  };

  // Get time display with warning if past
  const getTimeDisplay = () => {
    const timeStr = formatTime(travelDate);
    if (isPastDateTime(travelDate)) {
      return `${timeStr} ⚠️ Past`;
    }
    return timeStr;
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
      <TouchableOpacity 
        style={[styles.input, isPastDateTime(travelDate) && styles.pastInput]} 
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={isPastDateTime(travelDate) && styles.pastText}>
          {getDateDisplay()}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={travelDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={getMinDate()}
        />
      )}

      <Text style={styles.label}>Travel Time</Text>
      <TouchableOpacity 
        style={[styles.input, isPastDateTime(travelDate) && styles.pastInput]} 
        onPress={() => setShowTimePicker(true)}
      >
        <Text style={isPastDateTime(travelDate) && styles.pastText}>
          {getTimeDisplay()}
        </Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={travelDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {isPastDateTime(travelDate) && (
        <Text style={styles.warningText}>
          ⚠️ You have selected a past date/time. Please select a future date and time to proceed.
        </Text>
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
          <Text style={styles.label}>Payment Method *</Text>
          <TextInput
            style={styles.input}
            placeholder="Select payment method"
            value={paymentMethod}
            onChangeText={handlePaymentChange}
            onFocus={handlePaymentInputFocus}
            onBlur={handlePaymentInputBlur}
          />
          {showPaymentSuggestions && filteredPayments.length > 0 && (
            <View style={styles.suggestionsList}>
              {filteredPayments.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => handleSelectPayment(item)}
                  style={styles.suggestionItem}
                >
                  <Text style={styles.paymentSuggestionText}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Transaction ID *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter transaction ID (must contain letters & numbers)" 
            value={transactionId} 
            onChangeText={setTransactionId} 
          />
          {transactionId && !validateTransactionId(transactionId) && (
            <Text style={styles.errorText}>
              Transaction ID must contain both letters and numbers
            </Text>
          )}

          <Text style={styles.label}>Amount (Auto Calculated)</Text>
          <Text style={styles.amount}>{amountPaid} KES</Text>
          
          <Text style={styles.paymentNote}>
            * Payment verification required for {bookingType} bookings
          </Text>
        </>
      )}

      <TouchableOpacity 
        style={[
          styles.submitBtn, 
          isPastDateTime(travelDate) && styles.disabledBtn
        ]} 
        onPress={handleSubmit} 
        disabled={loading || isPastDateTime(travelDate)}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {isPastDateTime(travelDate) ? 'Select Future Date/Time' : 'Submit Booking'}
          </Text>
        )}
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
  pastInput: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  pastText: {
    color: '#dc3545',
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
  paymentSuggestionText: {
    textTransform: 'capitalize',
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
  disabledBtn: {
    backgroundColor: '#6c757d',
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
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 5,
  },
  warningText: {
    fontSize: 12,
    color: '#dc3545',
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    marginTop: 5,
  },
});