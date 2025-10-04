import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const isStrongPassword = (pw) => pw.length >= 6;

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword || !phone) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!isStrongPassword(password)) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    if (phone.length < 10 || phone.length > 20) {
      Alert.alert('Invalid Phone Number', 'Phone number must be between 10 and 20 digits.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('https://mombasa-backend.onrender.com/users/register', {
        full_name: fullName,
        email,
        phone,
        password,
      });

      if (res.status === 201 || res.status === 200) {
        Alert.alert(
          'Registration Successful',
          'Your account was created successfully! Please wait for admin approval.'
        );

        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          navigation.replace('Login');
        }, 1000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.status === 409) {
        Alert.alert('Email Exists', 'This email is already registered.');
      } else {
        Alert.alert('Registration Failed', 'Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register as Passenger</Text>

      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={styles.label}>Email Address *</Text>
      <TextInput
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Phone *</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={phone}
        maxLength={20}
        onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
      />

      <Text style={styles.label}>Password *</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Confirm Password *</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login here</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#006699',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#006699',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: '#006699',
    fontSize: 15,
  },
});

export default RegisterScreen;
