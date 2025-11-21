import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = "http://192.168.100.13:5000";

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratings, setRatings] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch bookings from backend
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "User not authenticated. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/bookings/mybookings`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const data = await response.json();
      setBookings(data.bookings || []);
      setFilteredBookings(data.bookings || []);
    } catch (error) {
      console.error("Fetch bookings error:", error);
      Alert.alert("Error", "Failed to fetch bookings. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filter bookings based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(booking => 
        booking.ferry_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.route?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.booking_status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.payment_status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.travel_date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.travel_time?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user_id?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.booking_type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBookings(filtered);
    }
  }, [searchQuery, bookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Mark booking as arrived/received
  const markAsArrived = async (bookingId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "User not authenticated. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/arrived`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      Alert.alert("Success", "Booking marked as arrived!");
      fetchBookings(); // Refresh the bookings list
    } catch (error) {
      console.error("Mark as arrived error:", error);
      Alert.alert("Error", "Failed to mark booking as arrived. Please try again.");
    }
  };

  // Generate Ticket for Passenger bookings
  const generateTicket = async (booking) => {
    try {
      const amountDisplay = booking.amount_paid === 0 ? "N/A" : `KES ${booking.amount_paid}`;

      const html = `
        <html>
          <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
            <style>
              body { font-family: Arial, sans-serif; }
              .ticket { border: 2px dashed #333; padding: 20px; max-width: 400px; margin: 0 auto; }
              .header { text-align: center; color: #006699; margin-bottom: 20px; }
              .barcode { text-align: center; font-family: 'Barcode', monospace; font-size: 36px; margin: 15px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body class="p-4">
            <div class="ticket">
              <div class="header">
                <h2>Mombasa Ferry Services</h2>
                <h4>BOARDING TICKET</h4>
              </div>
              <table class="table table-bordered">
                <tbody>
                  <tr><th>Ticket ID</th><td>${booking._id}</td></tr>
                  <tr><th>Passenger Name</th><td>${booking.user_id?.full_name || "N/A"}</td></tr>
                  <tr><th>Ferry</th><td>${booking.ferry_name || "Not assigned"}</td></tr>
                  <tr><th>Date</th><td>${new Date(booking.travel_date).toLocaleDateString()}</td></tr>
                  <tr><th>Time</th><td>${booking.travel_time || "N/A"}</td></tr>
                  <tr><th>Route</th><td>${booking.route || "N/A"}</td></tr>
                  <tr><th>Status</th><td>${booking.booking_status}</td></tr>
                  <tr><th>Payment Status</th><td>${booking.payment_status}</td></tr>
                  <tr><th>Amount Paid</th><td>${amountDisplay}</td></tr>
                  <tr><th>Booking Type</th><td>Passenger</td></tr>
                </tbody>
              </table>
              <div class="barcode">■■■■■■ ${booking._id.slice(-8)} ■■■■■■</div>
              <p class="text-center mt-3"><strong>Please present this ticket before boarding</strong></p>
              <div class="footer">
                <p>Thank you for choosing Mombasa Ferry Services</p>
                <p>For assistance: +254-700-000000</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { 
        UTI: '.pdf', 
        mimeType: 'application/pdf' 
      });
    } catch (error) {
      console.error("Ticket generation error:", error);
      Alert.alert("Error", "Failed to generate ticket.");
    }
  };

  // Generate Receipt for Cargo and Vehicle bookings
  const generateReceipt = async (booking) => {
    try {
      const amountDisplay = booking.amount_paid === 0 ? "N/A" : `KES ${booking.amount_paid}`;
      const cargoDetails = booking.cargo_details || "No cargo details provided";
      const vehicleDetails = booking.vehicle_type ? `${booking.vehicle_type} (${booking.vehicle_plate || 'No plate'})` : "No vehicle details provided";
      const isCargo = booking.booking_type?.toLowerCase() === 'cargo';

      const html = `
        <html>
          <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
            <style>
              body { font-family: Arial, sans-serif; }
              .receipt { border: 1px solid #333; padding: 20px; max-width: 400px; margin: 0 auto; }
              .header { text-align: center; color: #006699; margin-bottom: 20px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              .stamp { text-align: center; margin: 20px 0; color: #006699; font-weight: bold; }
            </style>
          </head>
          <body class="p-4">
            <div class="receipt">
              <div class="header">
                <h2>Mombasa Ferry Services</h2>
                <h4>${isCargo ? 'CARGO TRANSPORT RECEIPT' : 'VEHICLE TRANSPORT RECEIPT'}</h4>
                <p>Official Receipt</p>
              </div>
              <table class="table table-bordered">
                <tbody>
                  <tr><th>Receipt No</th><td>${booking._id}</td></tr>
                  <tr><th>Customer Name</th><td>${booking.user_id?.full_name || "N/A"}</td></tr>
                  <tr><th>Ferry</th><td>${booking.ferry_name || "Not assigned"}</td></tr>
                  <tr><th>Shipping Date</th><td>${new Date(booking.travel_date).toLocaleDateString()}</td></tr>
                  <tr><th>Departure Time</th><td>${booking.travel_time || "N/A"}</td></tr>
                  <tr><th>Route</th><td>${booking.route || "N/A"}</td></tr>
                  <tr><th>${isCargo ? 'Cargo Details' : 'Vehicle Details'}</th><td>${isCargo ? cargoDetails : vehicleDetails}</td></tr>
                  <tr><th>Status</th><td>${booking.booking_status}</td></tr>
                  <tr><th>Payment Status</th><td>${booking.payment_status}</td></tr>
                  <tr><th>Amount Paid</th><td>${amountDisplay}</td></tr>
                  <tr><th>Booking Type</th><td>${isCargo ? 'Cargo Transport' : 'Vehicle Transport'}</td></tr>
                </tbody>
              </table>
              <div class="stamp">
                <p>OFFICIAL RECEIPT</p>
                <p>Mombasa Ferry Services</p>
              </div>
              <div class="footer">
                <p>This receipt must be presented for ${isCargo ? 'cargo collection' : 'vehicle collection'}</p>
                <p>For inquiries: +254-700-000000</p>
                <p>Email: ${isCargo ? 'cargo@mombasaferry.com' : 'vehicle@mombasaferry.com'}</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { 
        UTI: '.pdf', 
        mimeType: 'application/pdf' 
      });
    } catch (error) {
      console.error("Receipt generation error:", error);
      Alert.alert("Error", "Failed to generate receipt.");
    }
  };

  // Handle document generation based on booking type
  const handleDocumentGeneration = (booking) => {
    const bookingType = booking.booking_type?.toLowerCase();
    
    if (bookingType === 'passenger') {
      generateTicket(booking);
    } else {
      generateReceipt(booking);
    }
  };

  // Get document button text based on booking type
  const getDocumentButtonText = (booking) => {
    const bookingType = booking.booking_type?.toLowerCase();
    return bookingType === 'passenger' ? 'Download Ticket' : 'Download Receipt';
  };

  // Submit rating to backend
  const submitRating = async (bookingId, ratingValue) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("User not authenticated.");

      const response = await fetch(`${API_BASE_URL}/bookings/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId, rating: ratingValue }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      Alert.alert("Success", "Thank you for rating this trip!");
      fetchBookings(); // Refresh to show updated ratings
    } catch (error) {
      console.error("Rating error:", error);
      Alert.alert("Error", "Failed to submit rating. Please try again.");
    }
  };

  const renderBooking = ({ item }) => {
    const currentRating = ratings[item._id] || item.ferry_rating || 0;
    const amountDisplay = item.amount_paid === 0 ? "N/A" : `KES ${item.amount_paid}`;
    const bookingType = item.booking_type || 'passenger';
    const isPassenger = bookingType.toLowerCase() === 'passenger';
    const isCargo = bookingType.toLowerCase() === 'cargo';
    const isVehicle = bookingType.toLowerCase() === 'vehicle';
    const isAssigned = item.booking_status === 'assigned';
    const isDelivered = item.booking_status === 'delivered';
    const isArrived = item.booking_status === 'arrived';
    const isCompleted = item.booking_status === 'completed'; // UPDATED: changed from 'complete' to 'completed'
    const isPaid = item.payment_status === 'paid';

    // Determine if "Mark as Received" button should be shown
    const showReceivedButton = 
      (isPassenger && isAssigned) || // For passenger: show when assigned
      ((isCargo || isVehicle) && isDelivered); // For cargo/vehicle: show when delivered

    // Determine if "Arrived/Received" status should be shown
    const showReceivedStatus = 
      (isPassenger && isArrived) || // For passenger: show when arrived
      ((isCargo || isVehicle) && isArrived); // For cargo/vehicle: show when arrived

    // Determine if rating should be shown (for completed trips) - UPDATED
    const showRating = isCompleted;

    // Get button text based on booking type
    const getReceivedButtonText = () => {
      if (isPassenger) return 'Mark as Arrived';
      if (isCargo) return 'Mark Cargo as Received';
      if (isVehicle) return 'Mark Vehicle as Received';
      return 'Mark as Received';
    };

    const getReceivedStatusText = () => {
      if (isPassenger) return 'Arrived at Destination';
      if (isCargo) return 'Cargo Received';
      if (isVehicle) return 'Vehicle Received';
      return 'Received';
    };

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingTypeBadge}>
            {isPassenger ? '👤 PASSENGER' : isCargo ? '🚚 CARGO' : '🚗 VEHICLE'}
          </Text>
          <Text style={styles.bookingId}>ID: {item._id.slice(-8)}</Text>
        </View>

        <Text style={styles.bookingText}>
          Ferry: {item.ferry_name || "Not assigned"}
        </Text>
        <Text style={styles.bookingText}>
          Date: {new Date(item.travel_date).toLocaleDateString()}
        </Text>
        <Text style={styles.bookingText}>Time: {item.travel_time || "N/A"}</Text>
        <Text style={styles.bookingText}>Route: {item.route || "N/A"}</Text>
        
        {isCargo && item.cargo_details && (
          <Text style={styles.bookingText}>Cargo: {item.cargo_details}</Text>
        )}
        
        {isVehicle && item.vehicle_type && (
          <Text style={styles.bookingText}>
            Vehicle: {item.vehicle_type} {item.vehicle_plate ? `(${item.vehicle_plate})` : ''}
          </Text>
        )}
        
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusBadge, 
            { 
              backgroundColor: 
                isCompleted ? '#28a745' : // UPDATED: changed from isComplete to isCompleted
                isArrived ? '#28a745' : 
                isDelivered ? '#17a2b8' :
                isAssigned ? '#ffc107' : 
                '#6c757d' 
            }
          ]}>
            {item.booking_status}
          </Text>
          <Text style={[
            styles.statusBadge, 
            { backgroundColor: isPaid ? '#28a745' : '#dc3545' }
          ]}>
            {item.payment_status}
          </Text>
        </View>
        
        <Text style={styles.bookingText}>Amount Paid: {amountDisplay}</Text>
        <Text style={styles.bookingText}>
          {isPassenger ? 'Passenger' : isCargo ? 'Shipper' : 'Vehicle Owner'}: {item.user_id?.full_name || "N/A"}
        </Text>

        {/* Action Buttons Container */}
        <View style={styles.actionsContainer}>
          {/* Download Ticket/Receipt Button - ONLY AVAILABLE WHEN PAYMENT IS PAID */}
          {isPaid ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                isPassenger ? styles.ticketButton : styles.receiptButton
              ]}
              onPress={() => handleDocumentGeneration(item)}
            >
              <Ionicons 
                name={isPassenger ? "ticket" : "document-text"} 
                size={20} 
                color="#fff" 
                style={styles.buttonIcon} 
              />
              <Text style={styles.actionButtonText}>
                {getDocumentButtonText(item)}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionButton, styles.disabledButton]}>
              <Text style={styles.disabledButtonText}>
                {isPassenger ? 'Ticket Unavailable' : 'Receipt Unavailable'}
              </Text>
              <Text style={styles.paymentRequiredText}>
                Complete payment to download
              </Text>
            </View>
          )}

          {/* Mark as Arrived/Received Button */}
          {showReceivedButton && (
            <TouchableOpacity
              style={[styles.actionButton, styles.arrivedButton]}
              onPress={() => markAsArrived(item._id)}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color="#fff" 
                style={styles.buttonIcon} 
              />
              <Text style={styles.actionButtonText}>
                {getReceivedButtonText()}
              </Text>
            </TouchableOpacity>
          )}

          {/* Arrived/Received Status Display */}
          {showReceivedStatus && (
            <View style={[styles.actionButton, styles.arrivedStatus]}>
              <Ionicons 
                name="checkmark-done-circle" 
                size={20} 
                color="#fff" 
                style={styles.buttonIcon} 
              />
              <Text style={styles.actionButtonText}>
                {getReceivedStatusText()}
              </Text>
            </View>
          )}
        </View>

        {/* ⭐ 5-Star Rating Section - Available for passenger bookings that are completed */}
        {showRating && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ marginBottom: 4, fontWeight: '500' }}>Rate this trip:</Text>
            <View style={{ flexDirection: "row" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setRatings({ ...ratings, [item._id]: star });
                    submitRating(item._id, star);
                  }}
                >
                  <Text style={star <= currentRating ? styles.starSelected : styles.star}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {currentRating > 0 && (
              <Text style={styles.ratingThankYou}>
                Thank you for your {currentRating}-star rating!
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenTitle}>My Bookings</Text>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ferry, route, status, type..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.resultsText}>
        Showing {filteredBookings.length} of {bookings.length} bookings
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? "No bookings match your search" : "No bookings found"}
      </Text>
      {searchQuery ? (
        <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
          <Text style={styles.clearSearchButtonText}>Clear Search</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBooking}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006699',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  list: { 
    flexGrow: 1,
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bookingTypeBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
  },
  bookingId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  bookingText: { 
    fontSize: 16, 
    marginBottom: 6,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 8,
  },
  statusBadge: {
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  actionButton: { 
    padding: 12, 
    borderRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketButton: {
    backgroundColor: "#007BFF",
  },
  receiptButton: {
    backgroundColor: "#28a745",
  },
  arrivedButton: {
    backgroundColor: "#17a2b8",
  },
  arrivedStatus: {
    backgroundColor: "#28a745",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    flexDirection: 'column',
    gap: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: { 
    color: "#fff", 
    textAlign: "center",
    fontWeight: '600',
  },
  disabledButtonText: { 
    color: "#666", 
    textAlign: "center",
    fontWeight: '600',
  },
  paymentRequiredText: {
    color: "#666", 
    textAlign: "center",
    fontSize: 12,
    fontStyle: 'italic',
  },
  star: { 
    fontSize: 28, 
    color: "#ccc", 
    marginRight: 4 
  },
  starSelected: { 
    fontSize: 28, 
    color: "#FFD700", 
    marginRight: 4 
  },
  ratingThankYou: {
    fontSize: 12,
    color: '#28a745',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  clearSearchButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  clearSearchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default MyBookingsScreen;