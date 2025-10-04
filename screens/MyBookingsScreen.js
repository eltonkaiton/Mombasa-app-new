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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const API_BASE_URL = "http://192.168.100.8:5000";

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratings, setRatings] = useState({});

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  // Ticket generator
  const generateTicket = async (booking) => {
    try {
      const amountDisplay = booking.amount_paid === 0 ? "N/A" : `KES ${booking.amount_paid}`;

      const html = `
        <html>
          <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
          </head>
          <body class="p-4">
            <div class="container">
              <h2 class="text-center mb-4">Mombasa Ferry Services</h2>
              <h4 class="text-center mb-3">Booking Ticket</h4>
              <table class="table table-bordered">
                <tbody>
                  <tr><th>Booking ID</th><td>${booking._id}</td></tr>
                  <tr><th>Passenger Name</th><td>${booking.user_id?.full_name || "N/A"}</td></tr>
                  <tr><th>Ferry</th><td>${booking.ferry_name || "Not assigned"}</td></tr>
                  <tr><th>Date</th><td>${new Date(booking.travel_date).toLocaleDateString()}</td></tr>
                  <tr><th>Time</th><td>${booking.travel_time || "N/A"}</td></tr>
                  <tr><th>Route</th><td>${booking.route || "N/A"}</td></tr>
                  <tr><th>Status</th><td>${booking.booking_status}</td></tr>
                  <tr><th>Payment Status</th><td>${booking.payment_status}</td></tr>
                  <tr><th>Amount Paid</th><td>${amountDisplay}</td></tr>
                </tbody>
              </table>
              <p class="text-center mt-4">Please present this ticket before boarding.</p>
              <p class="text-center">Thank you for booking with Mombasa Ferry Services.</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Ticket generation error:", error);
      Alert.alert("Error", "Failed to generate ticket.");
    }
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

    return (
      <View style={styles.bookingCard}>
        <Text style={styles.bookingText}>
          Ferry: {item.ferry_name || "Not assigned"}
        </Text>
        <Text style={styles.bookingText}>
          Date: {new Date(item.travel_date).toLocaleDateString()}
        </Text>
        <Text style={styles.bookingText}>Time: {item.travel_time || "N/A"}</Text>
        <Text style={styles.bookingText}>Route: {item.route || "N/A"}</Text>
        <Text style={styles.bookingText}>Status: {item.booking_status}</Text>
        <Text style={styles.bookingText}>Payment: {item.payment_status}</Text>
        <Text style={styles.bookingText}>Amount Paid: {amountDisplay}</Text>
        <Text style={styles.bookingText}>
          Passenger: {item.user_id?.full_name || "N/A"}
        </Text>

        {item.payment_status === "paid" && item.booking_status === "assigned" ? (
          <TouchableOpacity
            style={styles.ticketButton}
            onPress={() => generateTicket(item)}
          >
            <Text style={styles.ticketButtonText}>Download Ticket</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.disabledButton}>
            <Text style={styles.disabledButtonText}>Ticket Unavailable</Text>
          </View>
        )}

        {/* ⭐ 5-Star Rating Section */}
        {item.booking_status === "assigned" && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ marginBottom: 4 }}>Rate this trip:</Text>
            <View style={{ flexDirection: "row" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  disabled={item.payment_status !== "paid"}
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
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No bookings found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={bookings}
      keyExtractor={(item) => item._id}
      renderItem={renderBooking}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, paddingTop: 40 },
  bookingCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bookingText: { fontSize: 16, marginBottom: 4 },
  ticketButton: { marginTop: 10, padding: 10, backgroundColor: "#007BFF", borderRadius: 6 },
  ticketButtonText: { color: "#fff", textAlign: "center" },
  disabledButton: { marginTop: 10, padding: 10, backgroundColor: "#ccc", borderRadius: 6 },
  disabledButtonText: { color: "#666", textAlign: "center" },
  star: { fontSize: 28, color: "#ccc", marginRight: 4 },
  starSelected: { fontSize: 28, color: "#FFD700", marginRight: 4 },
});

export default MyBookingsScreen;
