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
        switch (userRole) {
          case 'admin': destination = 'AdminHome'; break;
          case 'staff': destination = 'StaffHome'; break;
          case 'finance': destination = 'FinanceHome'; break;
          case 'inventory': destination = 'InventoryHome'; break;
          case 'passenger': destination = 'PassengerHome'; break;
          case 'supplier': destination = 'SupplierHome'; break;
          default:
            Alert.alert('Login Error', `Unknown role: ${userRole}`);
            return;
        }

        navigation.reset({
          index: 0,
          routes: [{ name: destination, params: { full_name: full_name || name } }],
        });
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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>

      <TouchableOpacity onPress={handleToggleLoginType} style={styles.toggleLoginType}>
        <Text style={styles.toggleText}>
          {loginType === 'user' && 'Switch to Supplier Login'}
          {loginType === 'supplier' && 'Switch to Inventory Login'}
          {loginType === 'inventory' && 'Switch to Finance Login'}
          {loginType === 'finance' && 'Switch to Staff Login'}
          {loginType === 'staff' && 'Switch to User Login'}
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

      {loading ? (
        <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 20 }} />
      ) : (
        <Button title="Log In" onPress={handleLogin} />
      )}

      {loginType === 'user' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>Don't have an account? Create one</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6fa',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#0077b6',
    textAlign: 'center',
  },
  toggleLoginType: { alignItems: 'center', marginBottom: 20 },
  toggleText: { color: '#0077b6', fontSize: 16, fontWeight: '500' },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0077b6',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#000',
  },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { color: '#0077b6', fontSize: 16 },
});

export default LoginScreen;
