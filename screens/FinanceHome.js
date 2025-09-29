import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Alert, TextInput, Modal, Pressable
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';

// ✅ Corrected imports with aliases
import {
  fetchFinanceSummary,
  fetchBookings,
  approveBookingPayment as approvePayment,
  rejectBookingPayment as rejectPayment,
} from '../services/financeApi';

const FinanceHome = () => {
  const [summary, setSummary] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = Array.isArray(bookings)
      ? bookings.filter((b) =>
          (b.user_id?.full_name || '').toLowerCase().includes(search.toLowerCase())
        )
      : [];
    setFilteredBookings(filtered);
  }, [search, bookings]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, bookingsData] = await Promise.all([
        fetchFinanceSummary(),
        fetchBookings(),
      ]);
      setSummary(summaryData);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setFilteredBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      Alert.alert('Finance API Error', err.message || 'Could not load finance data.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (id) => {
    try {
      await approvePayment(id);
      Alert.alert('Success', 'Payment approved');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (id) => {
    try {
      await rejectPayment(id);
      Alert.alert('Rejected', 'Payment rejected');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to reject payment');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      Alert.alert('Logout Error', err.message || 'Failed to logout.');
    }
  };

  // ✅ Generate PDF for all bookings
  const handleDownloadAllBookings = async () => {
    try {
      if (!bookings.length) {
        Alert.alert('No Data', 'There are no bookings to export.');
        return;
      }

      let rows = bookings.map(
        (b, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${b.user_id?.full_name || 'N/A'}</td>
            <td>${b.booking_type}</td>
            <td>${b.route}</td>
            <td>${b.travel_date} ${b.travel_time}</td>
            <td>${b.amount_paid}</td>
            <td>${b.payment_status}</td>
            <td>${b.booking_status}</td>
          </tr>
        `
      ).join('');

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h2 { text-align: center; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #333; padding: 8px; font-size: 12px; text-align: left; }
              th { background: #0077b6; color: #fff; }
            </style>
          </head>
          <body>
            <h2>Finance Bookings Report</h2>
            <table>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Type</th>
                <th>Route</th>
                <th>Travel</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
              ${rows}
            </table>
            <p style="margin-top:20px;">Generated on: ${new Date().toLocaleString()}</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const fileUri = FileSystem.documentDirectory + `bookings_report.pdf`;
      await FileSystem.moveAsync({ from: uri, to: fileUri });

      await Sharing.shareAsync(fileUri);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to generate report.');
    }
  };

  // ✅ Generate professional PDF receipt for one booking
  const handleDownloadReceipt = async (booking) => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h2 { text-align: center; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #333; padding: 8px; font-size: 14px; text-align: left; }
              th { width: 30%; background: #0077b6; color: #fff; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; }
              .signature { margin-top: 40px; text-align: center; }
              .signature-line { margin-top: 50px; border-top: 1px solid #000; width: 200px; margin-left: auto; margin-right: auto; }
            </style>
          </head>
          <body>
            <h2>Booking Receipt</h2>
            <table>
              <tr><th>User</th><td>${booking.user_id?.full_name || 'N/A'}</td></tr>
              <tr><th>Booking Type</th><td>${booking.booking_type}</td></tr>
              <tr><th>Route</th><td>${booking.route}</td></tr>
              <tr><th>Date</th><td>${booking.travel_date} ${booking.travel_time}</td></tr>
              <tr><th>Amount Paid</th><td>KES ${booking.amount_paid}</td></tr>
              <tr><th>Payment Status</th><td>${booking.payment_status}</td></tr>
              <tr><th>Booking Status</th><td>${booking.booking_status}</td></tr>
            </table>

            <p class="footer">Generated on: ${new Date().toLocaleString()}</p>
            <div class="signature">
              <p>Authorized Signature</p>
              <div class="signature-line"></div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const fileUri = FileSystem.documentDirectory + `receipt_${booking._id}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: fileUri });

      await Sharing.shareAsync(fileUri);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to generate receipt.');
    }
  };

  const renderBooking = ({ item }) => {
    return (
      <View style={styles.bookingCard}>
        <Text style={styles.bookingText}>User: {item.user_id?.full_name || 'N/A'}</Text>
        <Text style={styles.bookingText}>Amount: KES {item.amount_paid}</Text>
        <Text style={styles.bookingText}>Booking Type: {item.booking_type}</Text>
        <Text style={styles.bookingText}>Route: {item.route}</Text>
        <Text style={styles.bookingText}>Date: {item.travel_date}</Text>
        <Text style={styles.bookingText}>Time: {item.travel_time}</Text>

        {item.booking_type === 'passenger' && (
          <Text style={styles.bookingText}>Passengers: {item.num_passengers}</Text>
        )}
        {item.booking_type === 'vehicle' && (
          <>
            <Text style={styles.bookingText}>Vehicle Type: {item.vehicle_type}</Text>
            <Text style={styles.bookingText}>Plate: {item.vehicle_plate}</Text>
          </>
        )}
        {item.booking_type === 'cargo' && (
          <>
            <Text style={styles.bookingText}>Cargo: {item.cargo_description}</Text>
            <Text style={styles.bookingText}>Weight (kg): {item.cargo_weight_kg}</Text>
          </>
        )}

        <Text style={styles.bookingText}>Payment Status: {item.payment_status}</Text>
        <Text style={styles.bookingText}>Booking Status: {item.booking_status}</Text>
        <Text style={styles.bookingText}>Created: {new Date(item.created_at).toLocaleDateString()}</Text>

        <View style={styles.buttonRow}>
          {item.payment_status === 'pending' && (
            <>
              <TouchableOpacity onPress={() => handleApprovePayment(item._id)} style={styles.approveBtn}>
                <Text style={styles.btnText}>Approve Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRejectPayment(item._id)} style={styles.rejectBtn}>
                <Text style={styles.btnText}>Reject Payment</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={() => handleDownloadReceipt(item)}
            style={[styles.approveBookingBtn, { backgroundColor: '#8e44ad', marginTop: 8 }]}
          >
            <Text style={styles.btnText}>Download/View Receipt</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 40 }} />;
  }

  return (
    <>
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
        renderItem={renderBooking}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>Finance Dashboard</Text>

            {summary && (
              <View style={styles.summaryCard}>
                <Text>Total Bookings: {summary.totalBookings}</Text>
                <Text>Total Orders: {summary.totalOrders}</Text>
                <Text>Total Revenue: KES {summary.totalRevenue}</Text>
                <Text>Pending: KES {summary.pendingAmount}</Text>
                <Text>Rejected: KES {summary.rejectedAmount}</Text>
              </View>
            )}

            <TextInput
              style={styles.searchInput}
              placeholder="Search by user name"
              value={search}
              onChangeText={setSearch}
            />

            <View style={styles.navButtons}>
              <TouchableOpacity style={styles.navBtn} onPress={() => loadData()}>
                <Text style={styles.btnText}>Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('FinanceOrders')}>
                <Text style={styles.btnText}>Orders</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: '#8e44ad', marginVertical: 10 }]}
              onPress={handleDownloadAllBookings}
            >
              <Text style={styles.btnText}>Download All Bookings</Text>
            </TouchableOpacity>

            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('AboutUs')}>
                <Text style={styles.btnText}>About Us</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Help')}>
                <Text style={styles.btnText}>Help</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('ContactUs')}>
                <Text style={styles.btnText}>Contact Us</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: 'red' }]} onPress={handleLogout}>
                <Text style={styles.btnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#eef6fa', paddingBottom: 80 },
  heading: { fontSize: 26, fontWeight: 'bold', color: '#0077b6', textAlign: 'center', marginBottom: 20 },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ccc' },
  summaryCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 },
  bookingCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  bookingText: { fontSize: 14, marginBottom: 5 },
  buttonRow: { flexDirection: 'column', gap: 8, marginTop: 10 },
  approveBtn: { backgroundColor: 'green', padding: 8, borderRadius: 6, marginBottom: 5 },
  rejectBtn: { backgroundColor: 'red', padding: 8, borderRadius: 6 },
  approveBookingBtn: { backgroundColor: '#0077b6', padding: 8, borderRadius: 6, marginTop: 10 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  headerButtons: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, flexWrap: 'wrap' },
  headerBtn: { backgroundColor: '#0077b6', padding: 10, borderRadius: 6, margin: 5 },
  navButtons: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  navBtn: { backgroundColor: '#0077b6', padding: 10, borderRadius: 6, flex: 1, marginHorizontal: 5 },
});

export default FinanceHome;
