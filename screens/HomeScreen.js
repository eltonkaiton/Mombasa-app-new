import React, { useState, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import custom components
import DashboardContent from '../components/DashboardContent';
import BookFerryContent from '../components/BookFerryContent';
import MyBookingsContent from '../components/MyBookingsContent';
import HelpContent from '../components/HelpContent';
import ContactUsContent from '../components/ContactUsContent';
import AboutUsContent from '../components/AboutUsContent';

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'speedometer' },
  { key: 'booking', label: 'Book a Ferry', icon: 'boat' },
  { key: 'mybookings', label: 'My Bookings', icon: 'bookmarks' },
  { key: 'help', label: 'Help', icon: 'help-circle' },
  { key: 'contact', label: 'Contact Us', icon: 'call' },
  { key: 'about', label: 'About Us', icon: 'information-circle' },
  { key: 'logout', label: 'Logout', icon: 'log-out' }, // <-- Added Logout here
];

const sidebarWidth = 220;
const screenWidth = Dimensions.get('window').width;

export default function HomeScreen({ navigation }) {  // <- add navigation prop
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(screenWidth > 600);

  const slideAnim = useRef(new Animated.Value(sidebarVisible ? 0 : -sidebarWidth)).current;

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(slideAnim, {
        toValue: -sidebarWidth,
        duration: 250,
        useNativeDriver: false,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
            // Navigate to Login screen - replace the stack so user can't go back
            navigation.navigate('Register');
          } 
        },
      ],
      { cancelable: true }
    );
  };

  const onMenuItemPress = (key) => {
    if (key === 'logout') {
      handleLogout();
    } else {
      setSelectedMenu(key);
      if (screenWidth <= 600) {
        toggleSidebar(); // close sidebar on small screens after selection
      }
    }
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return <DashboardContent />;
      case 'booking':
        return <BookFerryContent />;
      case 'mybookings':
        return <MyBookingsContent />;
      case 'help':
        return <HelpContent />;
      case 'contact':
        return <ContactUsContent />;
      case 'about':
        return <AboutUsContent />;
      default:
        return <Text style={styles.contentText}>Select a menu item.</Text>;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top bar with menu icon */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#0077B6" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Mombasa Ferry Services</Text>
      </View>

      {/* Sidebar */}
      {sidebarVisible && screenWidth > 600 ? (
        // Static sidebar on wide screens
        <View style={styles.sidebar}>
          <ScrollView>
            {MENU_ITEMS.map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuItem, selectedMenu === item.key && styles.menuItemSelected]}
                onPress={() => onMenuItemPress(item.key)}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={selectedMenu === item.key ? '#fff' : '#caf0f8'}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={[styles.menuItemText, selectedMenu === item.key && styles.menuItemTextSelected]}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        // Animated sidebar drawer on small screens
        <Animated.View style={[styles.sidebarDrawer, { left: slideAnim }]}>
          <ScrollView>
            {MENU_ITEMS.map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuItem, selectedMenu === item.key && styles.menuItemSelected]}
                onPress={() => onMenuItemPress(item.key)}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={selectedMenu === item.key ? '#fff' : '#caf0f8'}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={[styles.menuItemText, selectedMenu === item.key && styles.menuItemTextSelected]}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Main content */}
      <View style={[styles.content, sidebarVisible && screenWidth > 600 ? { marginLeft: sidebarWidth } : null]}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f0f9' },
  topBar: {
    height: 56,
    backgroundColor: '#caf0f8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
  },
  menuButton: { marginRight: 15 },
  topBarTitle: { fontSize: 20, fontWeight: 'bold', color: '#0077B6' },
  sidebar: {
    position: 'absolute',
    top: 56,
    left: 0,
    width: sidebarWidth,
    bottom: 0,
    backgroundColor: '#0077B6',
    paddingTop: 10,
  },
  sidebarDrawer: {
    position: 'absolute',
    top: 56,
    width: sidebarWidth,
    bottom: 0,
    backgroundColor: '#0077B6',
    paddingTop: 10,
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 0 },
  },
  menuItem: { paddingVertical: 15, paddingHorizontal: 15 },
  menuItemSelected: { backgroundColor: '#00b4d8' },
  menuItemContent: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { color: '#caf0f8', fontSize: 16 },
  menuItemTextSelected: { color: '#fff', fontWeight: 'bold' },
  content: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  contentText: { fontSize: 18, color: '#023e8a' },
});
