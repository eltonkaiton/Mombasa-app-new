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
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const API_URL = 'https://mombasa-backend.onrender.com/staff-bookings';
const FERRIES_URL = 'https://mombasa-backend.onrender.com/ferries';
const APPROVE_URL = 'https://mombasa-backend.onrender.com/staff-bookings/approve';
const REJECT_URL = 'https://mombasa-backend.onrender.com/staff-bookings/reject';
const ASSIGN_FERRY_URL = 'https://mombasa-backend.onrender.com/staff-bookings/assign-ferry';
const RATE_FERRY_URL = 'https://mombasa-backend.onrender.com/staff-bookings/rate-ferry';
const CHAT_MESSAGES_URL = 'https://mombasa-backend.onrender.com/api/chat/staff-messages';

const StaffHome = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ferries, setFerries] = useState([]);
  const [activeFerries, setActiveFerries] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [ferriesLoading, setFerriesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Rating state
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [rating, setRating] = useState(0);

  // Chat messages state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('staffToken');
      if (!token) return Alert.alert('Error', 'No token found. Please login again.');
      const response = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      
      // Sort bookings by creation date (latest first) - using booking_date or created_at if available
      const sortedBookings = (response.data.bookings || []).sort((a, b) => {
        // Try to use booking_date first, then created_at, then travel_date as fallback
        const dateA = a.booking_date || a.created_at || a.travel_date;
        const dateB = b.booking_date || b.created_at || b.travel_date;
        return new Date(dateB) - new Date(dateA);
      });
      
      setBookings(sortedBookings);
      setFilteredBookings(sortedBookings);
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
      const allFerries = response.data.ferries || [];
      setFerries(allFerries);
      
      // Filter only active ferries
      const active = allFerries.filter(ferry => ferry.status === 'active');
      setActiveFerries(active);
    } catch (error) {
      console.error('Error fetching ferries:', error.message);
      Alert.alert('Error', 'Failed to fetch ferries.');
    } finally {
      setFerriesLoading(false);
    }
  };

  // Filter bookings based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBookings(bookings);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = bookings.filter(booking =>
      (booking.user_id?.full_name?.toLowerCase().includes(query)) ||
      (booking.booking_type?.toLowerCase().includes(query)) ||
      (booking.booking_status?.toLowerCase().includes(query)) ||
      (booking.route?.toLowerCase().includes(query)) ||
      (booking.travel_time?.toLowerCase().includes(query)) ||
      (booking.ferry_name?.toLowerCase().includes(query)) ||
      (booking._id?.toLowerCase().includes(query)) ||
      (booking.payment_method?.toLowerCase().includes(query)) ||
      (booking.num_passengers?.toString().includes(query)) ||
      (booking.amount_paid?.toString().includes(query))
    );
    setFilteredBookings(filtered);
  }, [searchQuery, bookings]);

  const fetchChatMessages = async () => {
    try {
      setChatMessagesLoading(true);
      const token = await AsyncStorage.getItem('staffToken');
      
      const response = await axios.get(CHAT_MESSAGES_URL, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('API Response:', response.data);
      
      const customerMessages = response.data.messages || [];
      
      // The API already provides the 'responded' status, so we can use it directly
      // No need to make additional API calls to check staff responses
      const processedMessages = customerMessages.map(msg => ({
        ...msg,
        // The API response already includes 'responded' field
      }));
      
      setChatMessages(processedMessages);
      
      // Navigate to messages screen with the fetched messages
      navigation.navigate('OperatingStaffMessages', { 
        messages: processedMessages 
      });
      
    } catch (error) {
      console.error('Error fetching chat messages:', error.message);
      
      // Fallback: Show sample customer inquiries
      const sampleMessages = [
        {
          _id: '68ee1e973e6f5753e12d074b',
          userName: 'David',
          userEmail: 'kaje@gmail.com',
          message: 'Hello, I need help with my booking',
          timestamp: '2025-10-14T09:57:43.060+00:00',
          responded: false
        },
        {
          _id: '68ee1e973e6f5753e12d074c',
          userName: 'Sarah Johnson',
          userEmail: 'sarah@example.com',
          message: 'I need to change my booking date for next week',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          responded: true
        }
      ];
      
      // Navigate to messages screen with sample messages
      navigation.navigate('OperatingStaffMessages', { 
        messages: sampleMessages 
      });
    } finally {
      setChatMessagesLoading(false);
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

  const rateFerry = async () => {
    try {
      if (!ratingBooking || rating === 0) {
        return Alert.alert('Error', 'Please select a rating between 1 and 5 stars.');
      }
      const token = await AsyncStorage.getItem('staffToken');
      await axios.post(
        `${RATE_FERRY_URL}/${ratingBooking._id}`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', `Ferry rated ${rating} stars!`);
      setRatingModalVisible(false);
      setRating(0);
      setRatingBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error rating ferry:', error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to rate ferry.');
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
    return 0;
  };

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
          <th>Rating</th>
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
          <td>${b.amount_paid === 0 ? 'N/A' : b.amount_paid}</td>
          <td>${b.payment_method || '-'}</td>
          <td>${b.payment_code || '-'}</td>
          <td>${b.ferry_name || 'Not assigned'}</td>
          <td>${b.ferry_rating ? `${b.ferry_rating} ★` : 'Not rated'}</td>
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

  const generateTicketPDF = async (booking) => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .ticket { border: 2px solid #000; border-radius: 10px; padding: 20px; }
              h1 { text-align: 'center'; }
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
              <div class="row"><span class="label">Amount Paid:</span> ${booking.amount_paid === 0 ? 'N/A' : `KES ${booking.amount_paid}`}</div>
              <div class="row"><span class="label">Payment Method:</span> ${booking.payment_method || '-'}</div>
              <div class="row"><span class="label">Payment Code:</span> ${booking.payment_code || '-'}</div>
              <div class="row"><span class="label">Ferry:</span> ${booking.ferry_name || 'Not assigned'}</div>
              <div class="row"><span class="label">Ferry Rating:</span> ${booking.ferry_rating ? `${booking.ferry_rating} ★` : 'Not rated'}</div>
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
      <Text>Amount Paid: {item.amount_paid === 0 ? 'N/A' : item.amount_paid}</Text>
      {item.booking_type !== 'passenger' && (
        <>
          <Text>Payment Method: {item.payment_method}</Text>
          <Text>Payment Code: {item.payment_code}</Text>
        </>
      )}
      <Text>Payment Status: {item.payment_status}</Text>
      <Text>Ferry: {item.ferry_name || 'Not assigned'}</Text>
      <Text>Ferry Rating: {item.ferry_rating ? `${item.ferry_rating} ★` : 'Not rated'}</Text>

      <View style={styles.bookingButtonContainer}>
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
        {item.booking_status === 'assigned' && item.ferry_name && !item.ferry_rating && (
          <TouchableOpacity
            style={[styles.bookingButton, { backgroundColor: '#ffc107' }]}
            onPress={() => {
              setRatingBooking(item);
              setRatingModalVisible(true);
            }}
          >
            <Text style={styles.buttonText}>Rate Ferry</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.bookingButton, { backgroundColor: '#17a2b8' }]}
          onPress={() => generateTicketPDF(item)}
        >
          <Text style={styles.buttonText}>Download Ticket</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starButton}>
          <Text style={[styles.star, i <= rating ? styles.starFilled : styles.starEmpty]}>
            {i <= rating ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
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
          {/* New Chat Messages Button - Now navigates to dedicated screen */}
          <TouchableOpacity 
            style={[styles.bottomButton, { backgroundColor: '#ff6b35' }]} 
            onPress={fetchChatMessages}
          >
            <Text style={styles.bottomButtonText}>
              {chatMessagesLoading ? 'Loading...' : 'View Messages'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookings by name, type, status, route..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Results Count */}
      {!loading && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            Showing {filteredBookings.length} of {bookings.length} bookings
          </Text>
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No bookings found matching your search.' : 'No bookings found.'}
          </Text>
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearEmptySearchBtn}>
              <Text style={styles.clearEmptySearchText}>Clear Search</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
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
            <Text style={styles.modalSubtitle}>Available Active Ferries</Text>
            
            {ferriesLoading ? (
              <ActivityIndicator size="large" color="#007bff" />
            ) : activeFerries.length === 0 ? (
              <View style={styles.noFerriesContainer}>
                <Ionicons name="boat-outline" size={40} color="#ccc" />
                <Text style={styles.noFerriesText}>No active ferries available</Text>
                <Text style={styles.noFerriesSubtext}>All ferries are currently inactive or under maintenance</Text>
              </View>
            ) : (
              <>
                <Text style={styles.ferriesCount}>
                  {activeFerries.length} active ferry{activeFerries.length !== 1 ? 's' : ''} available
                </Text>
                {activeFerries.map((ferry) => (
                  <TouchableOpacity
                    key={ferry._id}
                    style={styles.ferryButton}
                    onPress={() => assignFerry(ferry)}
                  >
                    <Text style={styles.ferryButtonText}>
                      {ferry.name} - Capacity: {ferry.capacity}
                    </Text>
                    <Text style={styles.ferryStatusActive}>Active</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            <TouchableOpacity
              style={[styles.bookingButton, { backgroundColor: '#6c757d', marginTop: 15 }]}
              onPress={() => setAssignModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Ferry Service</Text>
            <Text style={styles.ratingText}>How would you rate your experience with {ratingBooking?.ferry_name}?</Text>
            
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            
            <Text style={styles.ratingValue}>
              {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''} selected` : 'Select a rating'}
            </Text>

            <View style={styles.ratingButtonContainer}>
              <TouchableOpacity
                style={[styles.bookingButton, { backgroundColor: '#28a745', flex: 1 }]}
                onPress={rateFerry}
                disabled={rating === 0}
              >
                <Text style={styles.buttonText}>Submit Rating</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bookingButton, { backgroundColor: '#6c757d', flex: 1, marginLeft: 10 }]}
                onPress={() => {
                  setRatingModalVisible(false);
                  setRating(0);
                  setRatingBooking(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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

            <Text style={styles.label}>Booking Type</Text>
            <Picker selectedValue={bookingType} onValueChange={(v) => setBookingType(v)} style={styles.picker}>
              <Picker.Item label="Passenger" value="passenger" />
              <Picker.Item label="Vehicle" value="vehicle" />
              <Picker.Item label="Cargo" value="cargo" />
            </Picker>

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

            <Text style={styles.label}>Route</Text>
            <TextInput style={styles.input} placeholder="Enter Route" value={route} onChangeText={setRoute} />

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
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  dashboardInfo: { padding: 16, backgroundColor: '#007bff', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  dashboardTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  dashboardText: { fontSize: 14, color: 'white', marginBottom: 10 },
  buttonContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bottomButton: { backgroundColor: '#0056b3', padding: 8, borderRadius: 8, margin: 3 },
  bottomButtonText: { color: 'white', fontWeight: 'bold' },
  listContent: { padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#6c757d', marginTop: 10, textAlign: 'center' },
  bookingCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  bookingButtonContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  bookingButton: { padding: 10, borderRadius: 6, minWidth: 100 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#6c757d', marginBottom: 16, textAlign: 'center' },
  ferryButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ferryButtonText: { color: 'white', fontWeight: 'bold' },
  ferryStatusActive: {
    color: '#90EE90',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ferriesCount: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  noFerriesContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noFerriesText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 10,
  },
  noFerriesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  picker: { marginBottom: 8, backgroundColor: 'white' },
  autoAmount: { fontSize: 16, fontWeight: 'bold', color: '#28a745', marginVertical: 8 },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 6,
    marginTop: 16,
  },
  submitButtonText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  ratingText: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  starButton: { padding: 4 },
  star: { fontSize: 32 },
  starFilled: { color: '#ffc107' },
  starEmpty: { color: '#e0e0e0' },
  ratingValue: { textAlign: 'center', fontSize: 14, color: '#6c757d', marginBottom: 16 },
  ratingButtonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  clearSearchBtn: {
    padding: 5,
  },
  clearSearchText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  clearEmptySearchBtn: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 6,
  },
  clearEmptySearchText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});