import React from 'react';
import { View, Text, StyleSheet, Linking, ScrollView, TouchableOpacity } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const contacts = {
  phoneNumbers: [
    { label: 'Customer Care', number: '+254700000000' },
    { label: 'Booking Office', number: '+254711111111' },
  ],
  emails: [
    { label: 'Support', email: 'support@mombasaferry.co.ke' },
    { label: 'Info', email: 'info@mombasaferry.co.ke' },
  ],
  addresses: [
    { label: 'Main Office', address: 'Mombasa Ferry Terminal, Mombasa, Kenya' },
  ],
  socialMedia: [
    { label: 'Facebook', url: 'https://www.facebook.com/mombasaferry', icon: 'facebook-f' },
    { label: 'Twitter', url: 'https://twitter.com/mombasaferry', icon: 'twitter' },
  ],
};

const ContactUsContent = () => {
  const handleCall = (number) => Linking.openURL(`tel:${number}`);
  const handleEmail = (email) => Linking.openURL(`mailto:${email}`);
  const handleOpenURL = (url) => Linking.openURL(url);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Contact Us</Text>

      <Section title="Phone Numbers">
        {contacts.phoneNumbers.map(({ label, number }, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleCall(number)}
            style={styles.item}
          >
            <View style={styles.iconLabel}>
              <FontAwesome5 name="phone-alt" size={18} color="#2563EB" style={styles.icon} />
              <Text style={styles.label}>{label}</Text>
            </View>
            <Text style={styles.link}>{number}</Text>
          </TouchableOpacity>
        ))}
      </Section>

      <Section title="Emails">
        {contacts.emails.map(({ label, email }, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleEmail(email)}
            style={styles.item}
          >
            <View style={styles.iconLabel}>
              <FontAwesome5 name="envelope" size={18} color="#2563EB" style={styles.icon} />
              <Text style={styles.label}>{label}</Text>
            </View>
            <Text style={styles.link}>{email}</Text>
          </TouchableOpacity>
        ))}
      </Section>

      <Section title="Office Addresses">
        {contacts.addresses.map(({ label, address }, idx) => (
          <View key={idx} style={styles.item}>
            <View style={styles.iconLabel}>
              <FontAwesome5 name="map-marker-alt" size={18} color="#2563EB" style={styles.icon} />
              <Text style={styles.label}>{label}</Text>
            </View>
            <Text style={styles.text}>{address}</Text>
          </View>
        ))}
      </Section>

      <Section title="Social Media">
        {contacts.socialMedia.map(({ label, url, icon }, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleOpenURL(url)}
            style={styles.item}
          >
            <View style={styles.iconLabel}>
              <FontAwesome5 name={icon} size={20} color="#2563EB" style={styles.icon} />
              <Text style={[styles.link, styles.socialLink]}>{label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Section>
    </ScrollView>
  );
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    paddingHorizontal: 25,
    backgroundColor: '#f9f9fb',
    flexGrow: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 25,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingBottom: 6,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.8,
    borderBottomColor: '#E5E7EB',
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
  link: {
    fontSize: 16,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  socialLink: {
    fontWeight: '700',
  },
  text: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default ContactUsContent;
