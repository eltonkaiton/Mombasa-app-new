import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

const AboutUsContent = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Optional: Add a banner or logo image */}
      

      <Text style={styles.heading}>About Mombasa Ferry Services</Text>

      <Text style={styles.paragraph}>
        Mombasa Ferry Services has been the leading provider of safe, reliable, and efficient ferry transport
        services in the coastal region of Kenya for over 30 years. Our commitment to excellence and
        customer satisfaction has made us the trusted choice for thousands of daily commuters and travelers.
      </Text>

      <Text style={styles.subheading}>Our Mission</Text>
      <Text style={styles.paragraph}>
        To provide timely, safe, and affordable ferry transport services that connect communities and
        promote economic growth along the Kenyan coast.
      </Text>

      <Text style={styles.subheading}>Our Vision</Text>
      <Text style={styles.paragraph}>
        To be the most reliable and innovative ferry service provider in East Africa, setting the highest
        standards for safety, customer care, and environmental sustainability.
      </Text>

      <Text style={styles.subheading}>Our Core Values</Text>
      <View style={styles.list}>
        <Text style={styles.listItem}>• Safety First: We prioritize the safety of our passengers and staff above all else.</Text>
        <Text style={styles.listItem}>• Customer Focus: Delivering exceptional service to meet the needs of our customers.</Text>
        <Text style={styles.listItem}>• Integrity: Conducting our business with honesty, transparency, and fairness.</Text>
        <Text style={styles.listItem}>• Innovation: Continuously improving and adopting new technologies to enhance service.</Text>
        <Text style={styles.listItem}>• Sustainability: Committed to protecting our environment for future generations.</Text>
      </View>

      <Text style={styles.subheading}>Our History</Text>
      <Text style={styles.paragraph}>
        Founded in 1990, Mombasa Ferry Services started with just two boats ferrying passengers between Mombasa and
        the surrounding islands. Over the years, we have expanded our fleet, routes, and services to become
        the backbone of coastal transportation.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: '#f9f9fb',
    flexGrow: 1,
  },
  logo: {
    width: '60%',
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  list: {
    marginLeft: 12,
    marginTop: 8,
  },
  listItem: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 6,
    lineHeight: 22,
  },
});

export default AboutUsContent;
