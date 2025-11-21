import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';

const API_BASE_URL = 'http://192.168.100.13:5000';
const { width } = Dimensions.get('window');

const ServiceManagerScreen = ({ navigation }) => {
  const [selectedSection, setSelectedSection] = useState('Dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ferries, setFerries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ ferries: 0, bookings: 0, active: 0, inactive: 0 });
  const [error, setError] = useState(null);
  const [addFerryModal, setAddFerryModal] = useState(false);
  const [newFerry, setNewFerry] = useState({ name: '', capacity: '', status: 'active' });
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredFerries, setFilteredFerries] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);

  // PDF View Modal
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [pdfContent, setPdfContent] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');

  // Messages state
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    fetchUnreadMessagesCount();
  }, []);

  useEffect(() => {
    applySearchFilter();
  }, [searchQuery, ferries, bookings]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('staffToken');
      if (!token) {
        Alert.alert('Authentication Error', 'No token found, please log in again.');
        navigation.replace('Login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/service/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response.data) {
        const data = response.data;

        const sortedBookings = Array.isArray(data.bookings) 
          ? data.bookings.sort((a, b) => new Date(b.createdAt || b.travel_date) - new Date(a.createdAt || a.travel_date))
          : [];

        setStats({
          ferries: data.ferries?.length || 0,
          bookings: sortedBookings.length || 0,
          active: data.ferries?.filter((f) => f.status === 'active').length || 0,
          inactive: data.ferries?.filter((f) => f.status === 'inactive').length || 0,
        });

        setFerries(Array.isArray(data.ferries) ? data.ferries : []);
        setBookings(sortedBookings);
      }
    } catch (err) {
      console.log('Error fetching service data:', err);
      setError('Failed to fetch data. Ensure backend is running.');
      setFerries([]);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUnreadMessagesCount = async () => {
    try {
      const token = await AsyncStorage.getItem('staffToken');
      if (!token) return;

      // You'll need to implement this endpoint in your backend
      const response = await axios.get(`${API_BASE_URL}/service/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setUnreadMessagesCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.log('Error fetching unread messages count:', err);
      // Don't show error for this as it's not critical
    }
  };

  const applySearchFilter = () => {
    if (!searchQuery.trim()) {
      setFilteredFerries(ferries);
      setFilteredBookings(bookings);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase().trim();

    // Filter ferries
    const filteredF = ferries.filter(ferry => 
      ferry.name.toLowerCase().includes(query) ||
      ferry.status.toLowerCase().includes(query) ||
      ferry.capacity.toString().includes(query)
    );
    setFilteredFerries(filteredF);

    // Filter bookings
    const filteredB = bookings.filter(booking => 
      booking.booking_type.toLowerCase().includes(query) ||
      booking.booking_status.toLowerCase().includes(query) ||
      (booking.route && booking.route.toLowerCase().includes(query)) ||
      (booking.ferry_name && booking.ferry_name.toLowerCase().includes(query)) ||
      (booking._id && booking._id.toLowerCase().includes(query)) ||
      (booking.payment_status && booking.payment_status.toLowerCase().includes(query))
    );
    setFilteredBookings(filteredB);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    fetchDashboardData();
    fetchUnreadMessagesCount();
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'staffToken', 'role', 'user']);
      navigation.replace('Login');
    } catch (err) {
      console.log('Logout error:', err);
      navigation.replace('Login');
    }
  };

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);
  const handleSectionChange = (section) => {
    setSelectedSection(section);
    setSearchQuery('');
    setSidebarVisible(false);
  };

  const navigateToMessages = () => {
    setSidebarVisible(false);
    navigation.navigate('ServiceMessages');
  };

  const handleAddFerry = async () => {
    if (!newFerry.name || !newFerry.capacity) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('staffToken');
      await axios.post(
        `${API_BASE_URL}/service/ferry`,
        { name: newFerry.name, capacity: parseInt(newFerry.capacity), status: newFerry.status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAddFerryModal(false);
      setNewFerry({ name: '', capacity: '', status: 'active' });
      Alert.alert('Success', 'Ferry added successfully');
      fetchDashboardData();
    } catch (err) {
      console.log('Error adding ferry:', err);
      Alert.alert('Error', 'Failed to add ferry');
    }
  };

  const updateFerryStatus = async (ferryId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('staffToken');
      await axios.put(
        `${API_BASE_URL}/service/ferry/${ferryId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', `Ferry status updated to ${newStatus}`);
      fetchDashboardData();
    } catch (err) {
      console.log('Error updating ferry:', err);
      Alert.alert('Error', 'Failed to update ferry status');
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('staffToken');
      await axios.put(
        `${API_BASE_URL}/service/booking/${bookingId}`,
        { booking_status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', `Booking marked as ${newStatus}`);
      fetchDashboardData();
    } catch (err) {
      console.log('Error updating booking:', err);
      Alert.alert('Error', 'Failed to update booking status');
    }
  };

  const markAsDelivered = async (bookingId) => {
    try {
      const token = await AsyncStorage.getItem('staffToken');
      await axios.put(
        `${API_BASE_URL}/service/booking/${bookingId}`,
        { booking_status: 'delivered' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Booking marked as delivered');
      fetchDashboardData();
    } catch (err) {
      console.log('Error marking as delivered:', err);
      Alert.alert('Error', 'Failed to mark booking as delivered');
    }
  };

  const markAsCompleted = async (bookingId) => {
    try {
      const token = await AsyncStorage.getItem('staffToken');
      await axios.put(
        `${API_BASE_URL}/service/booking/${bookingId}`,
        { booking_status: 'completed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Booking marked as completed');
      fetchDashboardData();
    } catch (err) {
      console.log('Error marking as completed:', err);
      Alert.alert('Error', 'Failed to mark booking as completed');
    }
  };

  // Generate PDF Receipt Content
  const generatePDFReceipt = (data, type) => {
    if (data.length === 0) {
      Alert.alert('No Data', `There are no ${type.toLowerCase()} to generate a receipt.`);
      return;
    }

    const timestamp = new Date().toLocaleString();
    let content = `FORGE REACTOR FERRY SERVICES\n`;
    content += `=${'='.repeat(30)}=\n`;
    content += `${type.toUpperCase()} RECEIPT\n`;
    content += `Generated on: ${timestamp}\n`;
    content += `Total Records: ${data.length}\n`;
    content += `=${'='.repeat(30)}=\n\n`;

    if (type === 'Ferries') {
      content += `FERRY FLEET OVERVIEW\n`;
      content += `${'-'.repeat(40)}\n`;
      data.forEach((ferry, index) => {
        const assignedBookings = bookings.filter(b => b.ferry_name === ferry.name).length;
        content += `\n${index + 1}. ${ferry.name}\n`;
        content += `   Capacity: ${ferry.capacity} spaces\n`;
        content += `   Status: ${ferry.status.toUpperCase()}\n`;
        content += `   Assigned Bookings: ${assignedBookings}\n`;
        content += `   Availability: ${ferry.capacity - assignedBookings} spaces remaining\n`;
      });
    } else {
      content += `BOOKING DETAILS\n`;
      content += `${'-'.repeat(40)}\n`;
      data.forEach((booking, index) => {
        content += `\n${index + 1}. Booking ID: ${booking._id?.substring(0, 8) || 'N/A'}\n`;
        content += `   Type: ${booking.booking_type.toUpperCase()}\n`;
        content += `   Route: ${booking.route || 'N/A'}\n`;
        content += `   Status: ${booking.booking_status.toUpperCase()}\n`;
        content += `   Travel Date: ${new Date(booking.travel_date).toLocaleDateString()}\n`;
        content += `   Ferry: ${booking.ferry_name || 'Not Assigned'}\n`;
        if (booking.booking_type === 'passenger' && booking.num_passengers) {
          content += `   Passengers: ${booking.num_passengers}\n`;
        }
        if (booking.payment_status) {
          content += `   Payment: ${booking.payment_status.toUpperCase()}\n`;
        }
      });
    }

    content += `\n${'='.repeat(40)}\n`;
    content += `SUMMARY\n`;
    content += `${'-'.repeat(40)}\n`;
    content += `Total ${type}: ${data.length}\n`;
    
    if (type === 'Ferries') {
      const activeCount = data.filter(f => f.status === 'active').length;
      const inactiveCount = data.filter(f => f.status === 'inactive').length;
      content += `Active: ${activeCount}\n`;
      content += `Inactive: ${inactiveCount}\n`;
      const totalCapacity = data.reduce((sum, ferry) => sum + ferry.capacity, 0);
      content += `Total Capacity: ${totalCapacity} spaces\n`;
    } else {
      const pendingCount = data.filter(b => b.booking_status === 'pending').length;
      const approvedCount = data.filter(b => b.booking_status === 'approved').length;
      const completedCount = data.filter(b => b.booking_status === 'completed').length;
      content += `Pending: ${pendingCount}\n`;
      content += `Approved: ${approvedCount}\n`;
      content += `Completed: ${completedCount}\n`;
    }

    content += `\n${'='.repeat(50)}\n`;
    content += `End of Receipt\n`;
    content += `© 2025 Forge Reactor - Forging Digital Innovation\n`;
    content += `This is a computer-generated receipt.`;

    // Show the receipt in modal
    setPdfTitle(`${type} Receipt`);
    setPdfContent(content);
    setPdfModalVisible(true);
  };

  // Calculate assigned count and remaining space for a ferry
  const calculateFerryCapacity = (ferry) => {
    const assignedBookings = bookings.filter(
      booking => booking.ferry_name === ferry.name && 
      (booking.booking_status === 'approved' || booking.booking_status === 'assigned')
    );
    
    const totalUsedSpace = assignedBookings.reduce((total, booking) => {
      if (booking.booking_type === 'passenger') {
        return total + (booking.num_passengers || 1);
      } else if (booking.booking_type === 'vehicle') {
        return total + 1;
      } else if (booking.booking_type === 'cargo') {
        return total + 1;
      }
      return total;
    }, 0);

    const remaining = ferry.capacity - totalUsedSpace;
    const assignedCount = assignedBookings.length;

    return {
      assignedCount,
      totalUsedSpace,
      remaining: Math.max(0, remaining),
      assignedBookings
    };
  };

  // Sort bookings by date (newest first)
  const getSortedBookings = () => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.travel_date || a.updatedAt);
      const dateB = new Date(b.createdAt || b.travel_date || b.updatedAt);
      return dateB - dateA;
    });
  };

  // Format booking type with icons
  const getBookingTypeIcon = (type) => {
    switch (type) {
      case 'passenger': return '👤';
      case 'vehicle': return '🚗';
      case 'cargo': return '📦';
      default: return '📋';
    }
  };

  // Format status for better display
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Search Bar Component
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Icon name="search" size={20} color="#718096" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${selectedSection.toLowerCase()}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A0AEC0"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Icon name="close" size={18} color="#718096" />
          </TouchableOpacity>
        )}
      </View>
      {isSearching && (
        <Text style={styles.searchResultsText}>
          Found {selectedSection === 'Ferry Management' ? filteredFerries.length : filteredBookings.length} results
        </Text>
      )}
    </View>
  );

  // PDF Receipt Button Component
  const renderPDFReceiptButton = (data, type) => (
    <TouchableOpacity 
      style={styles.pdfReceiptButton}
      onPress={() => generatePDFReceipt(data, type)}
      disabled={data.length === 0}
    >
      <Icon name="receipt" size={16} color="#FFFFFF" />
      <Text style={styles.pdfReceiptButtonText}>
        View {type} Receipt ({data.length})
      </Text>
    </TouchableOpacity>
  );

  // Messages Button Component for Header
  const renderMessagesButton = () => (
    <TouchableOpacity 
      style={styles.messagesButton}
      onPress={navigateToMessages}
    >
      <Icon name="message" size={20} color="#FFFFFF" />
      {unreadMessagesCount > 0 && (
        <View style={styles.messageBadge}>
          <Text style={styles.messageBadgeText}>
            {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // PDF Receipt Modal
  const renderPDFModal = () => (
    <Modal
      visible={pdfModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setPdfModalVisible(false)}
    >
      <View style={styles.pdfModalContainer}>
        <View style={styles.pdfModalContent}>
          <View style={styles.pdfModalHeader}>
            <Text style={styles.pdfModalTitle}>{pdfTitle}</Text>
            <TouchableOpacity 
              onPress={() => setPdfModalVisible(false)}
              style={styles.pdfCloseButton}
            >
              <Icon name="close" size={24} color="#1A1F2E" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.pdfContentContainer}>
            <Text style={styles.pdfContentText}>{pdfContent}</Text>
          </ScrollView>

          <View style={styles.pdfModalActions}>
            <TouchableOpacity 
              style={[styles.pdfActionButton, styles.pdfCloseAction]}
              onPress={() => setPdfModalVisible(false)}
            >
              <Text style={styles.pdfActionText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Sidebar - Optimized for Mobile
  const renderSidebar = () => (
    <View style={[styles.sidebar, !sidebarVisible && styles.sidebarHidden]}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Service Manager</Text>
        <TouchableOpacity onPress={toggleSidebar} style={styles.closeSidebar}>
          <Icon name="close" size={24} color="#E2E8F0" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sidebarContent}>
        {/* Main Navigation Items */}
        <Text style={styles.sidebarSectionTitle}>MAIN MENU</Text>
        {['Dashboard', 'Ferry Management', 'Bookings'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.sidebarItem, selectedSection === item && styles.sidebarItemActive]}
            onPress={() => handleSectionChange(item)}
          >
            <Icon 
              name={
                item === 'Dashboard' ? 'dashboard' : 
                item === 'Ferry Management' ? 'directions-boat' : 'book'
              } 
              size={20} 
              color={selectedSection === item ? '#FFFFFF' : '#E2E8F0'} 
            />
            <Text style={[styles.sidebarText, selectedSection === item && styles.sidebarTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Messages Section */}
        <Text style={styles.sidebarSectionTitle}>COMMUNICATION</Text>
        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={navigateToMessages}
        >
          <Icon name="message" size={20} color="#E2E8F0" />
          <Text style={styles.sidebarText}>
            Messages
          </Text>
          {unreadMessagesCount > 0 && (
            <View style={styles.sidebarMessageBadge}>
              <Text style={styles.sidebarMessageBadgeText}>
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Information Sections */}
        <Text style={styles.sidebarSectionTitle}>SUPPORT</Text>
        {['About Us', 'Help', 'Contact Us'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.sidebarItem]}
            onPress={() => {
              setSidebarVisible(false);
              navigation.navigate(item.replace(' ', ''));
            }}
          >
            <Icon 
              name={
                item === 'About Us' ? 'info' : 
                item === 'Help' ? 'help' : 'contact-support'
              } 
              size={20} 
              color="#E2E8F0" 
            />
            <Text style={styles.sidebarText}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Icon name="logout" size={20} color="#E53E3E" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  // Table Headers
  const renderFerryTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.colName]}>Ferry Name</Text>
      <Text style={[styles.tableHeaderText, styles.colCapacity]}>Capacity</Text>
      <Text style={[styles.tableHeaderText, styles.colAssigned]}>Assigned</Text>
      <Text style={[styles.tableHeaderText, styles.colRemaining]}>Remaining</Text>
      <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
      <Text style={[styles.tableHeaderText, styles.colActions]}>Actions</Text>
    </View>
  );

  const renderBookingTableHeader = () => (
    <View style={styles.bookingTableHeader}>
      <Text style={[styles.bookingHeaderText, styles.bookingColType]}>Type</Text>
      <Text style={[styles.bookingHeaderText, styles.bookingColDetails]}>Details</Text>
      <Text style={[styles.bookingHeaderText, styles.bookingColDate]}>Travel Date</Text>
      <Text style={[styles.bookingHeaderText, styles.bookingColStatus]}>Status</Text>
      <Text style={[styles.bookingHeaderText, styles.bookingColActions]}>Actions</Text>
    </View>
  );

  // Ferries Table Rows
  const renderFerryItem = ({ item }) => {
    const capacityData = calculateFerryCapacity(item);
    const { assignedCount, totalUsedSpace, remaining } = capacityData;
    const isLowSpace = remaining <= (item.capacity * 0.2);
    const isFull = remaining === 0;
    
    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.colName]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.tableCell, styles.colCapacity]}>{item.capacity}</Text>
        <View style={[styles.tableCell, styles.colAssigned]}>
          <Text style={styles.assignedText}>
            {assignedCount} ({totalUsedSpace})
          </Text>
        </View>
        <View style={[styles.tableCell, styles.colRemaining]}>
          <Text style={[
            styles.remainingText,
            isLowSpace && styles.lowSpaceText,
            isFull && styles.noSpaceText
          ]}>
            {remaining}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.colStatus]}>
          <View style={[styles.statusBadge, styles[item.status]]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={[styles.tableCell, styles.colActions]}>
          <TouchableOpacity
            style={[styles.smallActionButton, styles.statusButton]}
            onPress={() =>
              updateFerryStatus(item._id, item.status === 'active' ? 'inactive' : 'active')
            }
          >
            <Text style={styles.smallActionText}>
              {item.status === 'active' ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Bookings Table Rows
  const renderBookingItem = ({ item, index }) => {
    const isEvenRow = index % 2 === 0;
    
    return (
      <View style={[
        styles.bookingTableRow,
        isEvenRow ? styles.bookingRowEven : styles.bookingRowOdd
      ]}>
        <View style={[styles.bookingTableCell, styles.bookingColType]}>
          <View style={styles.bookingTypeContainer}>
            <Text style={styles.bookingTypeIcon}>
              {getBookingTypeIcon(item.booking_type)}
            </Text>
            <Text style={styles.bookingTypeText}>
              {item.booking_type.charAt(0).toUpperCase() + item.booking_type.slice(1)}
            </Text>
            {item.booking_type === 'passenger' && item.num_passengers > 1 && (
              <Text style={styles.passengerCount}>
                {item.num_passengers}pax
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.bookingTableCell, styles.bookingColDetails]}>
          <Text style={styles.bookingRoute} numberOfLines={1}>
            {item.route}
          </Text>
          {item.ferry_name && (
            <Text style={styles.ferryName} numberOfLines={1}>
              Ferry: {item.ferry_name}
            </Text>
          )}
          <Text style={styles.bookingId} numberOfLines={1}>
            ID: {item._id?.substring(0, 8)}...
          </Text>
        </View>

        <View style={[styles.bookingTableCell, styles.bookingColDate]}>
          <Text style={styles.travelDate}>
            {new Date(item.travel_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          <Text style={styles.createdDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </Text>
        </View>

        <View style={[styles.bookingTableCell, styles.bookingColStatus]}>
          <View style={[styles.bookingStatusBadge, styles[`booking_${item.booking_status}`]]}>
            <Text style={styles.bookingStatusText}>
              {formatStatus(item.booking_status)}
            </Text>
          </View>
          {item.payment_status && (
            <View style={[styles.paymentBadge, styles[`payment_${item.payment_status}`]]}>
              <Text style={styles.paymentStatusText}>
                {item.payment_status}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.bookingTableCell, styles.bookingColActions]}>
          <View style={styles.bookingActionGroup}>
            {item.booking_status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.bookingActionButton, styles.approveButton]}
                  onPress={() => updateBookingStatus(item._id, 'approved')}
                >
                  <Icon name="check" size={14} color="#FFFFFF" />
                  <Text style={styles.bookingActionText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bookingActionButton, styles.rejectButton]}
                  onPress={() => updateBookingStatus(item._id, 'cancelled')}
                >
                  <Icon name="close" size={14} color="#FFFFFF" />
                  <Text style={styles.bookingActionText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}
            
            {(item.booking_status === 'approved' || item.booking_status === 'assigned') && (
              <>
                {(item.booking_type === 'cargo' || item.booking_type === 'vehicle') && (
                  <TouchableOpacity
                    style={[styles.bookingActionButton, styles.deliverButton]}
                    onPress={() => markAsDelivered(item._id)}
                  >
                    <Icon name="local-shipping" size={14} color="#FFFFFF" />
                    <Text style={styles.bookingActionText}>Deliver</Text>
                  </TouchableOpacity>
                )}
                {item.booking_type === 'passenger' && (
                  <Text style={styles.noActionsText}>No actions</Text>
                )}
              </>
            )}

            {item.booking_status === 'arrived' && (
              <TouchableOpacity
                style={[styles.bookingActionButton, styles.completeButton]}
                onPress={() => markAsCompleted(item._id)}
              >
                <Icon name="check-circle" size={14} color="#FFFFFF" />
                <Text style={styles.bookingActionText}>Complete</Text>
              </TouchableOpacity>
            )}

            {item.booking_status === 'delivered' && (
              <View style={styles.deliveredContainer}>
                <Icon name="local-shipping" size={16} color="#805AD5" />
                <Text style={styles.deliveredText}>Delivered</Text>
              </View>
            )}

            {item.booking_status === 'completed' && (
              <View style={styles.completedContainer}>
                <Icon name="check-circle" size={16} color="#38A169" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}

            {item.booking_status === 'cancelled' && (
              <View style={styles.cancelledContainer}>
                <Icon name="cancel" size={16} color="#E53E3E" />
                <Text style={styles.cancelledText}>Cancelled</Text>
              </View>
            )}

            {!['pending', 'approved', 'assigned', 'arrived', 'delivered', 'completed', 'cancelled'].includes(item.booking_status) && (
              <Text style={styles.noActionsText}>-</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Stats
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{stats.ferries}</Text>
        <Text style={styles.statLabel}>Total Ferries</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{stats.bookings}</Text>
        <Text style={styles.statLabel}>Total Bookings</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{stats.active}</Text>
        <Text style={styles.statLabel}>Active Ferries</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{stats.inactive}</Text>
        <Text style={styles.statLabel}>Inactive Ferries</Text>
      </View>
    </View>
  );

  // Main sections
  const renderDashboard = () => {
    const sortedBookings = getSortedBookings();
    const recentBookings = searchQuery ? filteredBookings.slice(0, 5) : sortedBookings.slice(0, 5);
    const displayFerries = searchQuery ? filteredFerries.slice(0, 5) : ferries.slice(0, 5);
    
    return (
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Icon name="menu" size={28} color="#1A1F2E" />
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          {renderMessagesButton()}
        </View>

        {error && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
        ) : (
          <ScrollView>
            {renderSearchBar()}
            {renderStats()}
            
            <View style={styles.tableSection}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.subHeader}>
                  {isSearching ? 'Search Results - Ferries' : 'Recent Ferries'}
                </Text>
                {renderPDFReceiptButton(displayFerries, 'Ferries')}
              </View>
              <View style={styles.tableContainer}>
                {renderFerryTableHeader()}
                {displayFerries.length > 0 ? (
                  displayFerries.map((item) => (
                    <View key={item._id}>
                      {renderFerryItem({ item })}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyText}>
                      {isSearching ? 'No ferries found matching your search' : 'No ferries available'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.tableSection}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.subHeader}>
                  {isSearching ? 'Search Results - Bookings' : 'Recent Bookings (Latest First)'}
                </Text>
                {renderPDFReceiptButton(recentBookings, 'Bookings')}
              </View>
              <View style={styles.bookingTableContainer}>
                {renderBookingTableHeader()}
                {recentBookings.length > 0 ? (
                  recentBookings.map((item, index) => (
                    <View key={item._id}>
                      {renderBookingItem({ item, index })}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyText}>
                      {isSearching ? 'No bookings found matching your search' : 'No bookings available'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  const renderFerryManagement = () => {
    const displayFerries = searchQuery ? filteredFerries : ferries;
    
    return (
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Icon name="menu" size={28} color="#1A1F2E" />
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Ferry Management</Text>
          <View style={styles.headerActions}>
            {renderMessagesButton()}
            <TouchableOpacity style={styles.addButton} onPress={() => setAddFerryModal(true)}>
              <Icon name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {renderSearchBar()}

        <View style={styles.tableSection}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.subHeader}>
              {isSearching ? 'Search Results' : 'All Ferries'}
            </Text>
            {renderPDFReceiptButton(displayFerries, 'Ferries')}
          </View>
          <View style={styles.tableContainer}>
            {renderFerryTableHeader()}
            {displayFerries.length > 0 ? (
              <FlatList
                data={displayFerries}
                keyExtractor={(item) => item._id}
                renderItem={renderFerryItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />}
              />
            ) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  {isSearching ? 'No ferries found matching your search' : 'No ferries available'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderBookings = () => {
    const sortedBookings = getSortedBookings();
    const displayBookings = searchQuery ? filteredBookings : sortedBookings;
    
    return (
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Icon name="menu" size={28} color="#1A1F2E" />
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>
            {isSearching ? 'Search Results - Bookings' : 'All Bookings (Latest First)'}
          </Text>
          {renderMessagesButton()}
        </View>

        {renderSearchBar()}

        <View style={styles.tableSection}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.subHeader}>
              {isSearching ? 'Search Results' : 'All Bookings'}
            </Text>
            {renderPDFReceiptButton(displayBookings, 'Bookings')}
          </View>
          <View style={styles.bookingTableContainer}>
            {renderBookingTableHeader()}
            {displayBookings.length > 0 ? (
              <FlatList
                data={displayBookings}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => renderBookingItem({ item, index })}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />}
              />
            ) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  {isSearching ? 'No bookings found matching your search' : 'No bookings available'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <TouchableOpacity 
          style={styles.overlay}
          onPress={toggleSidebar}
          activeOpacity={1}
        />
      )}

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <View style={styles.content}>
        {selectedSection === 'Dashboard' && renderDashboard()}
        {selectedSection === 'Ferry Management' && renderFerryManagement()}
        {selectedSection === 'Bookings' && renderBookings()}
      </View>

      {/* Add Ferry Modal */}
      <Modal
        visible={addFerryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddFerryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Ferry</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Ferry Name"
              value={newFerry.name}
              onChangeText={(text) => setNewFerry({...newFerry, name: text})}
              placeholderTextColor="#A0AEC0"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Capacity"
              value={newFerry.capacity}
              onChangeText={(text) => setNewFerry({...newFerry, capacity: text})}
              keyboardType="numeric"
              placeholderTextColor="#A0AEC0"
            />
            
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  newFerry.status === 'active' && styles.statusOptionActive
                ]}
                onPress={() => setNewFerry({...newFerry, status: 'active'})}
              >
                <Text style={[
                  styles.statusOptionText,
                  newFerry.status === 'active' && styles.statusOptionTextActive
                ]}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  newFerry.status === 'inactive' && styles.statusOptionActive
                ]}
                onPress={() => setNewFerry({...newFerry, status: 'inactive'})}
              >
                <Text style={[
                  styles.statusOptionText,
                  newFerry.status === 'inactive' && styles.statusOptionTextActive
                ]}>
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setAddFerryModal(false);
                  setNewFerry({ name: '', capacity: '', status: 'active' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddFerry}
              >
                <Text style={styles.addButtonText}>Add Ferry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PDF Receipt Modal */}
      {renderPDFModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F2E',
    textAlign: 'center',
    flex: 1,
  },
  messagesButton: {
    backgroundColor: '#3182CE',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    position: 'relative',
  },
  messageBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  warningBanner: {
    backgroundColor: '#FED7D7',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E53E3E',
  },
  warningText: {
    color: '#C53030',
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    marginTop: 50,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1A1F2E',
  },
  clearButton: {
    padding: 4,
  },
  searchResultsText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  tableSection: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F2E',
  },
  pdfReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3182CE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    elevation: 1,
  },
  pdfReceiptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  tableContainer: {
    maxHeight: 400,
  },
  bookingTableContainer: {
    maxHeight: 500,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A5568',
    textAlign: 'center',
  },
  colName: { flex: 2 },
  colCapacity: { flex: 1 },
  colAssigned: { flex: 1.2 },
  colRemaining: { flex: 1 },
  colStatus: { flex: 1.2 },
  colActions: { flex: 1.5 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedText: {
    fontSize: 12,
    color: '#4A5568',
    textAlign: 'center',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38A169',
    textAlign: 'center',
  },
  lowSpaceText: {
    color: '#D69E2E',
  },
  noSpaceText: {
    color: '#E53E3E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
  },
  active: {
    backgroundColor: '#C6F6D5',
  },
  inactive: {
    backgroundColor: '#FED7D7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1A1F2E',
    textTransform: 'uppercase',
  },
  smallActionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
  },
  statusButton: {
    backgroundColor: '#3182CE',
  },
  smallActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bookingTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bookingHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A5568',
    textAlign: 'center',
  },
  bookingColType: { flex: 1.2 },
  bookingColDetails: { flex: 2 },
  bookingColDate: { flex: 1.2 },
  bookingColStatus: { flex: 1.5 },
  bookingColActions: { flex: 2 },
  bookingTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    alignItems: 'center',
    minHeight: 70,
  },
  bookingRowEven: {
    backgroundColor: '#FFFFFF',
  },
  bookingRowOdd: {
    backgroundColor: '#F7FAFC',
  },
  bookingTableCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  bookingTypeContainer: {
    alignItems: 'center',
  },
  bookingTypeIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  bookingTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A5568',
    textAlign: 'center',
  },
  passengerCount: {
    fontSize: 9,
    color: '#718096',
    marginTop: 2,
  },
  bookingRoute: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1F2E',
    textAlign: 'center',
  },
  ferryName: {
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
    textAlign: 'center',
  },
  bookingId: {
    fontSize: 9,
    color: '#A0AEC0',
    marginTop: 2,
    textAlign: 'center',
  },
  travelDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1F2E',
    textAlign: 'center',
  },
  createdDate: {
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
    textAlign: 'center',
  },
  bookingStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    minWidth: 80,
  },
  booking_pending: {
    backgroundColor: '#FEFCBF',
  },
  booking_approved: {
    backgroundColor: '#BEE3F8',
  },
  booking_assigned: {
    backgroundColor: '#C6F6D5',
  },
  booking_arrived: {
    backgroundColor: '#E9D8FD',
  },
  booking_delivered: {
    backgroundColor: '#FAF5FF',
  },
  booking_completed: {
    backgroundColor: '#C6F6D5',
  },
  booking_cancelled: {
    backgroundColor: '#FED7D7',
  },
  bookingStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1A1F2E',
    textTransform: 'uppercase',
  },
  paymentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  payment_paid: {
    backgroundColor: '#C6F6D5',
  },
  payment_pending: {
    backgroundColor: '#FEFCBF',
  },
  payment_failed: {
    backgroundColor: '#FED7D7',
  },
  paymentStatusText: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1A1F2E',
    textTransform: 'uppercase',
  },
  bookingActionGroup: {
    alignItems: 'center',
  },
  bookingActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#38A169',
  },
  rejectButton: {
    backgroundColor: '#E53E3E',
  },
  deliverButton: {
    backgroundColor: '#805AD5',
  },
  completeButton: {
    backgroundColor: '#3182CE',
  },
  bookingActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  deliveredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveredText: {
    fontSize: 10,
    color: '#805AD5',
    fontWeight: '600',
    marginLeft: 4,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    fontSize: 10,
    color: '#38A169',
    fontWeight: '600',
    marginLeft: 4,
  },
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelledText: {
    fontSize: 10,
    color: '#E53E3E',
    fontWeight: '600',
    marginLeft: 4,
  },
  noActionsText: {
    fontSize: 10,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  emptyRow: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: '#1A1F2E',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  sidebarHidden: {
    display: 'none',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeSidebar: {
    padding: 4,
  },
  sidebarContent: {
    flex: 1,
    paddingVertical: 16,
  },
  sidebarSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#718096',
    paddingHorizontal: 20,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  sidebarItemActive: {
    backgroundColor: '#FF6B35',
  },
  sidebarText: {
    fontSize: 16,
    color: '#E2E8F0',
    marginLeft: 12,
    fontWeight: '500',
  },
  sidebarTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sidebarMessageBadge: {
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  sidebarMessageBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2D3748',
    marginHorizontal: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#E53E3E',
    marginLeft: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F2E',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
    color: '#1A1F2E',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    color: '#4A5568',
    marginRight: 12,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  statusOptionActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#FF6B35',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pdfModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  pdfModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pdfModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pdfModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F2E',
  },
  pdfCloseButton: {
    padding: 4,
  },
  pdfContentContainer: {
    padding: 20,
  },
  pdfContentText: {
    fontSize: 12,
    color: '#1A1F2E',
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  pdfModalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  pdfActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pdfCloseAction: {
    backgroundColor: '#FF6B35',
  },
  pdfActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceManagerScreen;