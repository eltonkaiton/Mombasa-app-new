import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.100.13:5000/finance';

// ✅ Get auth headers with JWT
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token not found');
  return { headers: { Authorization: `Bearer ${token}` } };
};

/* ==========================
   BOOKINGS
========================== */

// Fetch all bookings
export const fetchBookings = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/bookings`, await getAuthHeaders());
    return Array.isArray(res.data?.bookings) ? res.data.bookings : [];
  } catch (err) {
    console.error('fetchBookings error:', err);
    return [];
  }
};

// Approve booking payment (updates payment_status)
export const approveBookingPayment = async (bookingId) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/approve-payment`,
      { bookingId },
      await getAuthHeaders()
    );
    return res.data || {};
  } catch (err) {
    console.error('approveBookingPayment error:', err);
    return {};
  }
};

// Reject booking payment (updates payment_status)
export const rejectBookingPayment = async (bookingId) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/reject-payment`,
      { bookingId },
      await getAuthHeaders()
    );
    return res.data || {};
  } catch (err) {
    console.error('rejectBookingPayment error:', err);
    return {};
  }
};

// Approve booking
export const approveBooking = async (bookingId) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/approve-booking`,
      { bookingId },
      await getAuthHeaders()
    );
    return res.data || {};
  } catch (err) {
    console.error('approveBooking error:', err);
    return {};
  }
};

// Place booking on a ferry
export const placeBookingOnFerry = async (bookingId, ferryName) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/place-on-ferry`,
      { bookingId, ferryName },
      await getAuthHeaders()
    );
    return res.data || {};
  } catch (err) {
    console.error('placeBookingOnFerry error:', err);
    return {};
  }
};

// Fetch finance summary
export const fetchFinanceSummary = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/summary`, await getAuthHeaders());
    return res.data || {};
  } catch (err) {
    console.error('fetchFinanceSummary error:', err);
    return {};
  }
};

/* ==========================
   ORDERS
========================== */

// Fetch all orders
export const fetchOrders = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/orders`, await getAuthHeaders());
    return Array.isArray(res.data?.orders) ? res.data.orders : [];
  } catch (err) {
    console.error('fetchOrders error:', err);
    return [];
  }
};

// Approve order payment (updates finance_status)
export const approveOrderPayment = async (orderId) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/approve-order-payment`, // dedicated payment route
      { orderId },
      await getAuthHeaders()
    );
    return res.data || {};
  } catch (err) {
    console.error('approveOrderPayment error:', err);
    return {};
  }
};

// Reject order payment (updates finance_status)
export const rejectOrderPayment = async (orderId) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/reject-order-payment`, // dedicated payment route
      { orderId },
      await getAuthHeaders()
    );
    return res.data || {};
  } catch (err) {
    console.error('rejectOrderPayment error:', err);
    return {};
  }
};

// Optional: approve order without payment
export const approveOrder = async (orderId) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/approve-order`,
      { orderId },
      await getAuthHeaders()
    );
    return res.data || {};
  } catch (err) {
    console.error('approveOrder error:', err);
    return {};
  }
};

// Optional: reject order without payment
export const rejectOrder = async (orderId) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/reject-order`,
      { orderId },
      await getAuthHeaders()
    );
    return res.data || {};
  } catch (err) {
    console.error('rejectOrder error:', err);
    return {};
  }
};
