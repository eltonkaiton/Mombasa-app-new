// ferryCrewApi.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Backend base URL
const API_BASE_URL = "http://192.168.100.8:5000/api/ferrycrew";

// Helper → get token from AsyncStorage
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("token"); // stored at login
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Fetch all bookings with payment_status = "paid"
 */
export const fetchPaidBookings = async () => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/bookings/paid`, config);
    return response.data.bookings; // array of bookings
  } catch (err) {
    console.error("fetchPaidBookings error:", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Approve a booking
 * @param {string} bookingId
 */
export const approveBooking = async (bookingId) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.put(
      `${API_BASE_URL}/bookings/${bookingId}/approve`,
      {}, // body is empty
      config
    );
    return response.data.booking;
  } catch (err) {
    console.error("approveBooking error:", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Assign a ferry to a booking
 * @param {string} bookingId
 * @param {string} ferryId
 */
export const assignFerryToBooking = async (bookingId, ferryId) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.put(
      `${API_BASE_URL}/bookings/${bookingId}/assign`,
      { ferryId },
      config
    );
    return response.data.booking;
  } catch (err) {
    console.error("assignFerryToBooking error:", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Fetch all ferries
 */
export const fetchFerries = async () => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/ferries`, config);
    return response.data.ferries;
  } catch (err) {
    console.error("fetchFerries error:", err.response?.data || err.message);
    throw err;
  }
};
