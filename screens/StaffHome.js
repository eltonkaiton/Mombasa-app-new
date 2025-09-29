import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// NEW imports for pickers
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { height } = Dimensions.get('window');

// API Endpoints
const API_URL = 'http://192.168.100.8:5000/staff-bookings';
const FERRIES_URL = 'http://192.168.100.8:5000/ferries';
const APPROVE_URL = 'http://192.168.100.8:5000/staff-bookings/approve';
const REJECT_URL = 'http://192.168.100.8:5000/staff-bookings/reject';
const ASSIGN_FERRY_URL = 'http://192.168.100.8:5000/staff-bookings/assign-ferry';

const StaffHome = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ferries, setFerries] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [ferriesLoading, setFerriesLoading] = useState(false);

  // Booking form state
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingType, setBookingType] = useState('passenger');
  const [travelDate, setTravelDate] = useState('');
  const [travelTime, setTravelTime] = useState('');
  const [route, setRoute] = useState('');
  const [numPassengers, setNumPassengers] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [cargoDescription, setCargoDescription] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [paymentCode, setPaymentCode] = useState('');

  // NEW: picker visibility state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('staffToken');
      if (!token) return Alert.alert('Error', 'No token found. Please login again.');
      const response = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error.message);
      Alert.alert('Error', 'Failed to fetch bookings from server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFerries = async () => {
    try {
      setFerriesLoading(true);
      const token = await AsyncStorage.getItem('staffToken');
      const response = await axios.get(FERRIES_URL, { headers: { Authorization: `Bearer ${token}` } });
      setFerries(response.data.ferries || []);
    } catch (error) {
      console.error('Error fetching ferries:', error.message);
      Alert.alert('Error', 'Failed to fetch ferries.');
    } finally {
      setFerriesLoading(false);
    }
  };

  const approveBooking = async (booking) => {
    try {
      const token = await AsyncStorage.getItem('staffToken');
      await axios.post(`${APPROVE_URL}/${booking._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('Success', 'Booking approved! Assign a ferry now.');
      setSelectedBooking(booking);
      await fetchFerries();
      setAssignModalVisible(true);
      fetchBookings();
    } catch (error) {
      console.error('Error approving booking:', error.message);
      Alert.alert('Error', 'Failed to approve booking.');
    }
  };

  const rejectBooking = async (booking) => {
    try {
      const token = await AsyncStorage.getItem('staffToken');
      await axios.post(`${REJECT_URL}/${booking._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('Success', 'Booking rejected.');
      fetchBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error.message);
      Alert.alert('Error', 'Failed to reject booking.');
    }
  };

  const assignFerry = async (ferry) => {
    try {
      if (!selectedBooking) return;
      const token = await AsyncStorage.getItem('staffToken');
      await axios.post(
        `${ASSIGN_FERRY_URL}/${selectedBooking._id}`,
        { ferryId: ferry._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', `Ferry ${ferry.name} assigned!`);
      setAssignModalVisible(false);
      fetchBookings();
    } catch (error) {
      console.error('Error assigning ferry:', error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign ferry.');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('staffToken');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings().then(() => setRefreshing(false));
  }, []);

  // Auto calculation logic
  const calculateAmount = () => {
    if (bookingType === 'vehicle') {
      switch (vehicleType.toLowerCase()) {
        case 'car':
          return 500;
        case 'truck':
          return 1500;
        case 'bus':
          return 1000;
        case 'motorcycle':
          return 200;
        default:
          return 800;
      }
    }
    if (bookingType === 'cargo') {
      const weight = parseFloat(cargoWeight) || 0;
      return weight * 50;
    }
    return 0; // passengers free
  };

  // Handle new booking submission
  const submitBooking = async () => {
    if (!travelDate || !travelTime || !route) {
      return Alert.alert('Error', 'Please fill in all required fields.');
    }

    if ((bookingType === 'vehicle' || bookingType === 'cargo') && !paymentCode) {
      return Alert.alert('Error', 'Payment code is required for Vehicle and Cargo bookings.');
    }

    try {
      const token = await AsyncStorage.getItem('staffToken');
      const autoAmount = calculateAmount();

      const payload = {
        booking_type: bookingType,
        travel_date: travelDate,
        travel_time: travelTime,
        route,
        num_passengers: bookingType === 'passenger' ? Math.max(0, parseInt(numPassengers) || 0) : undefined,
        vehicle_type: bookingType === 'vehicle' ? vehicleType : undefined,
        vehicle_plate: bookingType === 'vehicle' ? vehiclePlate : undefined,
        cargo_description: bookingType === 'cargo' ? cargoDescription : undefined,
        cargo_weight_kg: bookingType === 'cargo' ? parseFloat(cargoWeight) || 0 : undefined,
        amount_paid: autoAmount,
        ...(bookingType !== 'passenger' && {
          payment_method: paymentMethod,
          payment_code: paymentCode,
        }),
      };

      await axios.post(API_URL, payload, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('Success', `Booking created successfully! Amount: KES ${autoAmount}`);
      setBookingModalVisible(false);
      fetchBookings();

      // reset form
      setBookingType('passenger');
      setTravelDate('');
      setTravelTime('');
      setRoute('');
      setNumPassengers('');
      setVehicleType('');
      setVehiclePlate('');
      setCargoDescription('');
      setCargoWeight('');
      setAmountPaid('');
      setPaymentMethod('mpesa');
      setPaymentCode('');
    } catch (error) {
      console.error('Error creating booking:', error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create booking.');
    }
  };

  // ✅ Generate PDF receipt for all bookings
  const generatePDF = async () => {
    if (bookings.length === 0) return Alert.alert('No bookings', 'There are no bookings to generate receipt.');
    let html = `
      <h1>Mombasa Ferry Services - Bookings Receipt</h1>
      <table border="1" cellspacing="0" cellpadding="5" style="width:100%; border-collapse: collapse;">
        <tr>
          <th>ID</th>
          <th>Passenger Name</th>
          <th>Type</th>
          <th>Status</th>
          <th>Travel Date</th>
          <th>Travel Time</th>
          <th>Route</th>
          <th>Passengers</th>
          <th>Amount Paid</th>
          <th>Payment Method</th>
          <th>Payment Code</th>
          <th>Ferry</th>
        </tr>
    `;
    bookings.forEach((b) => {
      html += `
        <tr>
          <td>${b._id}</td>
          <td>${b.user_id?.full_name || 'N/A'}</td>
          <td>${b.booking_type}</td>
          <td>${b.booking_status}</td>
          <td>${new Date(b.travel_date).toLocaleDateString()}</td>
          <td>${b.travel_time}</td>
          <td>${b.route}</td>
          <td>${b.num_passengers || '-'}</td>
          <td>${b.amount_paid}</td>
          <td>${b.payment_method || '-'}</td>
          <td>${b.payment_code || '-'}</td>
          <td>${b.ferry_name || 'Not assigned'}</td>
        </tr>
      `;
    });
    html += `</table>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error.message);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  // ✅ Generate individual booking ticket
  const generateTicketPDF = async (booking) => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .ticket { border: 2px solid #000; border-radius: 10px; padding: 20px; }
              h1 { text-align: center; }
              .row { margin-bottom: 10px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <h1>Ferry Ticket</h1>
              <div class="row"><span class="label">Booking ID:</span> ${booking._id}</div>
              <div class="row"><span class="label">Passenger Name:</span> ${booking.user_id?.full_name || 'N/A'}</div>
              <div class="row"><span class="label">Type:</span> ${booking.booking_type}</div>
              <div class="row"><span class="label">Status:</span> ${booking.booking_status}</div>
              <div class="row"><span class="label">Date:</span> ${new Date(booking.travel_date).toLocaleDateString()}</div>
              <div class="row"><span class="label">Time:</span> ${booking.travel_time}</div>
              <div class="row"><span class="label">Route:</span> ${booking.route}</div>
              <div class="row"><span class="label">Passengers:</span> ${booking.num_passengers || '-'}</div>
              <div class="row"><span class="label">Amount Paid:</span> KES ${booking.amount_paid}</div>
              <div class="row"><span class="label">Payment Method:</span> ${booking.payment_method || '-'}</div>
              <div class="row"><span class="label">Payment Code:</span> ${booking.payment_code || '-'}</div>
              <div class="row"><span class="label">Ferry:</span> ${booking.ferry_name || 'Not assigned'}</div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Failed', 'Could not generate ticket.');
    }
  };

  // renderBooking
  const renderBooking = ({ item }) => (
    <View style={styles.bookingCard}>
      <Text style={styles.title}>Booking ID: {item._id}</Text>
      <Text>Passenger Name: {item.user_id?.full_name || 'N/A'}</Text>
      <Text>Type: {item.booking_type}</Text>
      <Text>Status: {item.booking_status}</Text>
      <Text>Travel Date: {new Date(item.travel_date).toLocaleDateString()}</Text>
      <Text>Travel Time: {item.travel_time}</Text>
      <Text>Route: {item.route}</Text>
      <Text>Passengers: {item.num_passengers}</Text>
      <Text>Amount Paid: {item.amount_paid}</Text>
      {item.booking_type !== 'passenger' && (
        <>
          <Text>Payment Method: {item.payment_method}</Text>
          <Text>Payment Code: {item.payment_code}</Text>
        </>
      )}
      <Text>Payment Status: {item.payment_status}</Text>
      <Text>Ferry: {item.ferry_name || 'Not assigned'}</Text>

      {/* Buttons for actions */}
      <View style={styles.bookingButtonContainer}>
        {/* Approve / Reject / Assign Ferry */}
        {(item.booking_status === 'pending' || (item.booking_status === 'approved' && !item.ferry_name)) && (
          <>
            {item.booking_status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.bookingButton, { backgroundColor: '#28a745' }]}
                  onPress={() => approveBooking(item)}
                >
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bookingButton, { backgroundColor: '#dc3545' }]}
                  onPress={() => rejectBooking(item)}
                >
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}
            {item.booking_status === 'approved' && !item.ferry_name && (
              <TouchableOpacity
                style={[styles.bookingButton, { backgroundColor: '#007bff' }]}
                onPress={async () => {
                  setSelectedBooking(item);
                  await fetchFerries();
                  setAssignModalVisible(true);
                }}
              >
                <Text style={styles.buttonText}>Assign Ferry</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Download Ticket */}
        <TouchableOpacity
          style={[styles.bookingButton, { backgroundColor: '#17a2b8' }]}
          onPress={() => generateTicketPDF(item)}
        >
          <Text style={styles.buttonText}>Download Ticket</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Helpers
  const formatDateString = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };
  const formatTimeString = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dashboard Info */}
      <View style={styles.dashboardInfo}>
        <Text style={styles.dashboardTitle}>Welcome to Mombasa Ferry Services</Text>
        <Text style={styles.dashboardText}>
          Manage bookings, approve requests, assign ferries, and generate receipts.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.bottomButton} onPress={logout}>
            <Text style={styles.bottomButtonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={() => navigation.navigate('AboutUs')}>
            <Text style={styles.bottomButtonText}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={() => navigation.navigate('ContactUs')}>
            <Text style={styles.bottomButtonText}>Contact Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={() => navigation.navigate('FerriesScreen')}>
            <Text style={styles.bottomButtonText}>Ferries</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={generatePDF}>
            <Text style={styles.bottomButtonText}>Download Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={() => setBookingModalVisible(true)}>
            <Text style={styles.bottomButtonText}>Book Ferry</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No bookings found.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBooking}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Ferry Assignment Modal */}
      <Modal
        visible={assignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Ferry</Text>
            {ferriesLoading ? (
              <ActivityIndicator size="large" color="#007bff" />
            ) : ferries.length === 0 ? (
              <Text>No ferries available.</Text>
            ) : (
              ferries.map((ferry) => (
                <TouchableOpacity
                  key={ferry._id}
                  style={styles.ferryButton}
                  onPress={() => assignFerry(ferry)}
                >
                  <Text style={styles.ferryButtonText}>
                    {ferry.name} - Capacity: {ferry.capacity}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={[styles.bookingButton, { backgroundColor: '#6c757d' }]}
              onPress={() => setAssignModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Booking Modal */}
      <Modal
        visible={bookingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.modalTitle}>Book Ferry</Text>

            {/* Booking Type */}
            <Text style={styles.label}>Booking Type</Text>
            <Picker selectedValue={bookingType} onValueChange={(v) => setBookingType(v)} style={styles.picker}>
              <Picker.Item label="Passenger" value="passenger" />
              <Picker.Item label="Vehicle" value="vehicle" />
              <Picker.Item label="Cargo" value="cargo" />
            </Picker>

            {/* Date Picker */}
            <Text style={styles.label}>Travel Date</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text>{travelDate ? travelDate : 'Select Date'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={travelDate ? new Date(travelDate) : new Date()}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date) setTravelDate(formatDateString(date));
                }}
              />
            )}

            {/* Time Picker */}
            <Text style={styles.label}>Travel Time</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
              <Text>{travelTime ? travelTime : 'Select Time'}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={travelTime ? new Date(`1970-01-01T${travelTime}:00`) : new Date()}
                mode="time"
                display="default"
                onChange={(e, date) => {
                  setShowTimePicker(false);
                  if (date) setTravelTime(formatTimeString(date));
                }}
              />
            )}

            {/* Route */}
            <Text style={styles.label}>Route</Text>
            <TextInput style={styles.input} placeholder="Enter Route" value={route} onChangeText={setRoute} />

            {/* Passenger-specific */}
            {bookingType === 'passenger' && (
              <>
                <Text style={styles.label}>Number of Passengers</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Number of Passengers"
                  value={numPassengers}
                  onChangeText={setNumPassengers}
                  keyboardType="numeric"
                />
              </>
            )}

            {/* Vehicle-specific */}
            {bookingType === 'vehicle' && (
              <>
                <Text style={styles.label}>Vehicle Type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Car, Truck, Bus, Motorcycle"
                  value={vehicleType}
                  onChangeText={setVehicleType}
                />

                <Text style={styles.label}>Vehicle Plate</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Vehicle Plate"
                  value={vehiclePlate}
                  onChangeText={setVehiclePlate}
                />
              </>
            )}

            {/* Cargo-specific */}
            {bookingType === 'cargo' && (
              <>
                <Text style={styles.label}>Cargo Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Cargo Description"
                  value={cargoDescription}
                  onChangeText={setCargoDescription}
                />

                <Text style={styles.label}>Cargo Weight (Kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Cargo Weight"
                  value={cargoWeight}
                  onChangeText={setCargoWeight}
                  keyboardType="numeric"
                />
              </>
            )}

            {/* Payment (only for non-passenger bookings) */}
            {bookingType !== 'passenger' && (
              <>
                <Text style={styles.label}>Payment Method</Text>
                <Picker selectedValue={paymentMethod} onValueChange={(v) => setPaymentMethod(v)} style={styles.picker}>
                  <Picker.Item label="M-Pesa" value="mpesa" />
                  <Picker.Item label="Card" value="card" />
                  <Picker.Item label="Cash" value="cash" />
                </Picker>

                <Text style={styles.label}>Payment Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Payment Code"
                  value={paymentCode}
                  onChangeText={setPaymentCode}
                />
              </>
            )}

            {/* Auto Calculated Amount */}
            {bookingType !== 'passenger' && (
              <Text style={styles.autoAmount}>Auto Amount: KES {calculateAmount()}</Text>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={submitBooking}>
              <Text style={styles.submitButtonText}>Submit Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bookingButton, { backgroundColor: '#6c757d', marginTop: 10 }]}
              onPress={() => setBookingModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default StaffHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  dashboardInfo: {
    padding: 16,
    backgroundColor: '#007bff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  dashboardText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bottomButton: {
    backgroundColor: '#0056b3',
    padding: 8,
    borderRadius: 8,
    margin: 3,
  },
  bottomButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 10,
  },
  bookingCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  bookingButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 5,
  },
  bookingButton: {
    padding: 8,
    borderRadius: 6,
    margin: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ferryButton: {
    padding: 10,
    backgroundColor: '#007bff',
    marginVertical: 5,
    borderRadius: 6,
  },
  ferryButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 6,
    marginTop: 15,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  autoAmount: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#28a745',
  },
});