
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons, Entypo } from '@expo/vector-icons'; // example icon libraries

const HelpContent = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Help & Support</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Getting Started</Text>
        <Text style={styles.text}>
          To book a ferry ticket, select your booking type (Passenger, Vehicle, Cargo), fill out the required details, and submit your booking.
          You can track your bookings in your account dashboard.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Common Questions</Text>

        <View style={styles.faqItem}>
          <MaterialIcons name="help-outline" size={24} color="#007AFF" />
          <View style={styles.faqText}>
            <Text style={styles.question}>How do I cancel a booking?</Text>
            <Text style={styles.answer}>
              You can cancel a booking by navigating to your bookings section and selecting the booking you want to cancel. Then tap 'Cancel Booking'.
            </Text>
          </View>
        </View>

        <View style={styles.faqItem}>
          <MaterialIcons name="help-outline" size={24} color="#007AFF" />
          <View style={styles.faqText}>
            <Text style={styles.question}>What payment methods are accepted?</Text>
            <Text style={styles.answer}>
              We accept payments via M-Pesa, Credit/Debit Cards, and Mobile Money.
            </Text>
          </View>
        </View>

        <View style={styles.faqItem}>
          <MaterialIcons name="help-outline" size={24} color="#007AFF" />
          <View style={styles.faqText}>
            <Text style={styles.question}>Can I change my travel date?</Text>
            <Text style={styles.answer}>
              Travel dates can be changed up to 24 hours before departure by contacting customer support.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Support</Text>
        <Text style={styles.text}>
          If you need further assistance, please contact us at:
        </Text>
        <View style={styles.contactRow}>
          <Entypo name="phone" size={20} color="#007AFF" />
          <Text style={styles.contactText}>+254 712 345 678</Text>
        </View>
        <View style={styles.contactRow}>
          <Entypo name="email" size={20} color="#007AFF" />
          <Text style={styles.contactText}>support@mombasaferry.co.ke</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007AFF',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#004080',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  faqItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  faqText: {
    marginLeft: 10,
    flex: 1,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0059b3',
  },
  answer: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  contactText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
  },
});

export default HelpContent;
