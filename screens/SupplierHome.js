import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // Two cards per row with margin

const SupplierHome = () => {
  const navigation = useNavigation();
  const [supplierName, setSupplierName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [notificationsCount, setNotificationsCount] = useState(3); // Example unread notifications

  useFocusEffect(
    React.useCallback(() => {
      const fetchUser = async () => {
        try {
          const userData = await AsyncStorage.getItem('user');
          const parsed = JSON.parse(userData);
          setSupplierName(parsed?.name || 'Supplier');
        } catch (err) {
          console.log('Failed to load supplier info', err);
        }
      };
      fetchUser();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const navigateTo = (screen) => navigation.navigate(screen);

  const renderMenuCard = (title, icon, gradientColors, onPress) => (
    <TouchableOpacity style={[styles.cardContainer, { width: cardWidth }]} onPress={onPress}>
      <LinearGradient
        colors={gradientColors}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {icon}
        <Text style={styles.cardText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with profile and notifications */}
      <View style={styles.headerWrapper}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.supplierName}>{supplierName}</Text>
        </View>
        <View style={styles.headerIcons}>
          {/* Notifications */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => alert('Notifications clicked')}
          >
            <Ionicons name="notifications-outline" size={28} color="#0077b6" />
            {notificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigateTo('Profile')}
          >
            <Ionicons name="person-circle-outline" size={32} color="#0077b6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#0077b6" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search inventory, requests..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          placeholderTextColor="#555"
        />
      </View>

      {/* Action Cards */}
      <View style={styles.cardsWrapper}>
        {renderMenuCard(
          'View Supply Requests',
          <Ionicons name="clipboard-outline" size={28} color="#fff" />,
          ['#023e8a', '#0077b6'],
          () => navigateTo('SupplyRequests')
        )}

        {renderMenuCard(
          'Help',
          <MaterialIcons name="help-outline" size={28} color="#fff" />,
          ['#0096c7', '#00b4d8'],
          () => navigateTo('Help')
        )}

        {renderMenuCard(
          'About Us',
          <FontAwesome5 name="info-circle" size={28} color="#fff" />,
          ['#00b4d8', '#48cae4'],
          () => navigateTo('AboutUs')
        )}

        {renderMenuCard(
          'Contact Us',
          <Ionicons name="call-outline" size={28} color="#fff" />,
          ['#0077b6', '#00b4d8'],
          () => navigateTo('ContactUs')
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Description & Contacts */}
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>About Mombasa</Text>
          <Text style={styles.infoText}>
            Mombasa is a vibrant coastal city in Kenya, known for its rich history, beautiful beaches, 
            and bustling port. It is a key hub for trade, tourism, and ferry services connecting the mainland to nearby islands.
          </Text>

          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={20} color="#0077b6" style={styles.contactIcon} />
            <Text style={styles.infoText}>+254 700 000 000</Text>
          </View>
          <View style={styles.contactRow}>
            <MaterialIcons name="email" size={20} color="#0077b6" style={styles.contactIcon} />
            <Text style={styles.infoText}>info@mombasaferry.co.ke</Text>
          </View>
          <View style={styles.contactRow}>
            <FontAwesome5 name="map-marker-alt" size={20} color="#0077b6" style={styles.contactIcon} />
            <Text style={styles.infoText}>Mombasa Ferry Terminal, Mombasa, Kenya</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6fa',
    padding: 20,
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#0077b6',
  },
  supplierName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#023e8a',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#023e8a',
  },
  cardsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardContainer: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0077b6',
    marginVertical: 10,
  },
});

export default SupplierHome;
