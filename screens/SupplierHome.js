import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
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

      {/* Menu */}
      <ScrollView contentContainerStyle={styles.menuContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Actions</Text>

        {renderMenuCard(
          'View Supply Requests',
          <Ionicons name="clipboard-outline" size={30} color="#fff" />,
          ['#023e8a', '#0077b6'],
          () => navigateTo('SupplyRequests')
        )}

        {renderMenuCard(
          'Chat with Admin/Staff',
          <Ionicons name="chatbubble-ellipses-outline" size={30} color="#fff" />,
          ['#0077b6', '#00b4d8'],
          () => navigateTo('SupplierChat')
        )}

        <Text style={styles.sectionTitle}>Support</Text>

        {renderMenuCard(
          'Help',
          <MaterialIcons name="help-outline" size={30} color="#fff" />,
          ['#0096c7', '#00b4d8'],
          () => navigateTo('Help')
        )}

        {renderMenuCard(
          'About Us',
          <FontAwesome5 name="info-circle" size={30} color="#fff" />,
          ['#00b4d8', '#48cae4'],
          () => navigateTo('AboutUs')
        )}

        {renderMenuCard(
          'Contact Us',
          <Ionicons name="call-outline" size={30} color="#fff" />,
          ['#0077b6', '#00b4d8'],
          () => navigateTo('ContactUs')
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    marginBottom: 25,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#023e8a',
  },
  menuContainer: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0077b6',
    marginVertical: 10,
  },
  cardContainer: {
    marginVertical: 8,
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
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
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
});

export default SupplierHome;
