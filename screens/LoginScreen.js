import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const BASE_URL = "https://mombasa-backend.onrender.com";

const USER_LOGIN_URL = `${BASE_URL}/users/login`;
const SUPPLIER_LOGIN_URL = `${BASE_URL}/suppliers/login`;
const INVENTORY_LOGIN_URL = `${BASE_URL}/inventory/login`;
const FINANCE_LOGIN_URL = `${BASE_URL}/finance/login`;
const STAFF_LOGIN_URL = `${BASE_URL}/staff/login`;

const LoginScreen = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('user');

  const getLoginUrl = () => {
    switch (loginType) {
      case 'supplier': return SUPPLIER_LOGIN_URL;
      case 'inventory': return INVENTORY_LOGIN_URL;
      case 'finance': return FINANCE_LOGIN_URL;
      case 'staff': return STAFF_LOGIN_URL;
      default: return USER_LOGIN_URL;
    }
  };

  const handleToggleLoginType = () => {
    const types = ['user', 'supplier', 'inventory', 'finance', 'staff'];
    const currentIndex = types.indexOf(loginType);
    const nextIndex = (currentIndex + 1) % types.length;
    setLoginType(types[nextIndex]);
  };

  const normalizeRole = (role, category, loginType) => {
    let normalized = (role || category || loginType).toLowerCase();
    if (normalized === 'operating') normalized = 'staff';
    if (normalized === 'user') normalized = 'passenger';
    return normalized;
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const BACKEND_URL = getLoginUrl();

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const raw = await response.text();
        console.error('Raw backend response:', raw);
        throw new Error(`Unexpected response format: ${contentType}`);
      }

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        const { full_name, name, role, category } = data.user;
        const userRole = normalizeRole(role, category, loginType);

        if (userRole === 'staff') {
          await AsyncStorage.setItem('staffToken', data.token);
        } else {
          await AsyncStorage.setItem('token', data.token);
        }

        await AsyncStorage.setItem('role', userRole);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        Alert.alert('Success', 'Logged in successfully');

        let destination;
        let destinationParams = { full_name: full_name || name };

        // 🔹 Decide screen based on role and category - MATCHING App.js SCREEN NAMES
        if (userRole === 'staff') {
          if (category && category.toLowerCase() === 'service') {
            destination = 'ServiceManager'; // ✅ Fixed: matches App.js screen name
          } else {
            destination = 'StaffHome';
          }
        } else {
          switch (userRole) {
            case 'admin': 
              destination = 'AdminHome'; 
              break;
            case 'finance': 
              destination = 'FinanceHome'; 
              break;
            case 'inventory': 
              destination = 'InventoryHome'; 
              break;
            case 'passenger': 
              destination = 'PassengerHome'; 
              break;
            case 'supplier': 
              destination = 'SupplierHome'; 
              break;
            default:
              Alert.alert('Login Error', `Unknown role: ${userRole}`);
              return;
          }
        }

        // ✅ Use navigate instead of reset for better compatibility
        navigation.navigate(destination, destinationParams);
        
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Something went wrong during login');
    } finally {
      setLoading(false);
    }
  };

  const getLoginTypeDisplay = () => {
    switch (loginType) {
      case 'user': return 'Passenger Login';
      case 'supplier': return 'Supplier Login';
      case 'inventory': return 'Inventory Staff Login';
      case 'finance': return 'Finance Staff Login';
      case 'staff': return 'Operating Staff Login';
      default: return 'Login';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Ferry Management System</Text>
      <Text style={styles.subheading}>{getLoginTypeDisplay()}</Text>

      {/* Login Type Toggle */}
      <TouchableOpacity onPress={handleToggleLoginType} style={styles.toggleLoginType}>
        <Text style={styles.toggleText}>
          Switch to {loginType === 'user' ? 'Supplier' : 
                    loginType === 'supplier' ? 'Inventory Staff' : 
                    loginType === 'inventory' ? 'Finance Staff' : 
                    loginType === 'finance' ? 'Operating Staff' : 
                    'Passenger'} Login
        </Text>
      </TouchableOpacity>

      {/* Email Field */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      {/* Password Field */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
        textContentType="password"
        autoCapitalize="none"
      />

      {/* Login Button */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 20 }} />
      ) : (
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      )}

      {/* Register Link for Passengers Only */}
      {loginType === 'user' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>Don't have an account? Create one</Text>
        </TouchableOpacity>
      )}

      {/* Info Footer */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Forge Reactor © 2025 | Forging Digital Innovation
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F2E',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF6B35',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 30,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  toggleLoginType: { 
    alignItems: 'center', 
    marginBottom: 30,
    padding: 12,
    backgroundColor: '#2D3748',
    borderRadius: 8,
  },
  toggleText: { 
    color: '#FF6B35', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#2D3748',
    borderColor: '#4A5568',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    fontSize: 16,
    color: '#FFFFFF',
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  registerLink: { 
    marginTop: 25, 
    alignItems: 'center' 
  },
  registerText: { 
    color: '#FF6B35', 
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  infoText: {
    color: '#718096',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LoginScreen;