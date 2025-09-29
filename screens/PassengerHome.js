import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons'; // Added more icon sets

const ferryUpdatesData = [
  { id: '1', title: 'Ferry Schedule Update', description: 'New timings for the Mombasa-Dar ferry effective next week.' },
  { id: '2', title: 'Safety Notice', description: 'Please wear masks while onboard for your safety.' },
  { id: '3', title: 'Holiday Schedule', description: 'Check special holiday ferry schedules on our website.' },
];

// Icon mapping for sidebar items
const sidebarItems = [
  { label: 'Dashboard', screen: 'PassengerHome', icon: <Ionicons name="speedometer" size={22} color="#fff" /> },
  { label: 'Book Ferry', screen: 'BookFerry', icon: <Ionicons name="boat" size={22} color="#fff" /> },
  { label: 'My Bookings', screen: 'MyBookings', icon: <Ionicons name="calendar" size={22} color="#fff" /> },
  { label: 'About Us', screen: 'AboutUs', icon: <Ionicons name="information-circle" size={22} color="#fff" /> },
  { label: 'Help', screen: 'Help', icon: <Ionicons name="help-circle" size={22} color="#fff" /> },
  { label: 'Contact Us', screen: 'ContactUs', icon: <MaterialIcons name="contact-mail" size={22} color="#fff" /> },
];

const PassengerHomeScreen = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const loadUserData = async () => {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userInfo');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // SidebarButton now accepts icon and label, and shows label only if menuOpen is true
  const SidebarButton = ({ label, screen, icon, onPress }) => (
    <TouchableOpacity
      style={[styles.sidebarButton, !menuOpen && styles.sidebarButtonClosed]}
      onPress={onPress || (() => {
        setMenuOpen(false);
        navigation.navigate(screen);
      })}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{icon}</View>
      {menuOpen && <Text style={styles.sidebarButtonText}>{label}</Text>}
    </TouchableOpacity>
  );

  const renderUpdateItem = ({ item }) => (
    <View style={styles.updateItem}>
      <Text style={styles.updateTitle}>{item.title}</Text>
      <Text style={styles.updateDescription}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {/* Sidebar */}
      <View style={[styles.sidebar, menuOpen ? styles.sidebarOpen : styles.sidebarClosed]}>
        {menuOpen && <Text style={styles.logoText}>Mombasa Ferry</Text>}

        {sidebarItems.map(({ label, screen, icon }) => (
          <SidebarButton key={label} label={label} screen={screen} icon={icon} />
        ))}

        <SidebarButton
          label="Logout"
          icon={<Ionicons name="log-out-outline" size={22} color="#fff" />}
          onPress={handleLogout}
        />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons name="menu" size={28} color="#006699" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={styles.welcomeText}>
            Welcome, {user?.full_name || 'Passenger'}!
          </Text>

          {/* Next Ferry Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Next Ferry</Text>
            <Text style={styles.infoText}>No upcoming bookings.</Text>
          </View>

          {/* Ferry Updates */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ferry Updates & Announcements</Text>
            <FlatList
              data={ferryUpdatesData}
              keyExtractor={(item) => item.id}
              renderItem={renderUpdateItem}
              scrollEnabled={false}
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#0077cc' }]}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('BookFerry');
              }}
            >
              <Ionicons name="boat" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Book a Ferry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#009933' }]}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('MyBookings');
              }}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>My Bookings</Text>
            </TouchableOpacity>
          </View>

          {/* Weather Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Weather at the Port</Text>
            <Text style={styles.infoText}>Sunny, 28°C. Calm waters.</Text>
          </View>

          {/* Passenger Tips */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Passenger Tips</Text>
            <Text style={styles.infoText}>
              Arrive at least 30 minutes before your ferry departure. Carry your booking confirmation.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingTop: 40,
  },
  sidebar: {
    paddingTop: 40,
    paddingHorizontal: 10,
    paddingBottom: 20,
    backgroundColor: '#006699',
    
    // height: '100%', // full height by default
  },
  sidebarOpen: {
    width: 200,
  },
  sidebarClosed: {
    width: 60,
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  sidebarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomColor: '#ffffff44',
    borderBottomWidth: 1,
    width: '100%',
  },
  sidebarButtonClosed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  sidebarButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  menuButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#006699',
  },
  card: {
    backgroundColor: '#e6f2ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 5,
    color: '#003366',
  },
  infoText: {
    fontSize: 16,
    color: '#444',
  },
  updateItem: {
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0077cc',
    paddingLeft: 10,
  },
  updateTitle: {
    fontWeight: '600',
    color: '#004080',
    fontSize: 16,
  },
  updateDescription: {
    fontSize: 14,
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
  },
});

export default PassengerHomeScreen;
