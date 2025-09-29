import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';

export default function InventoryReportScreen() {
  const handleGenerateReport = () => {
    // Placeholder for PDF or Excel generation
    Alert.alert('Coming Soon', 'Report generation feature will be added.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📊 Inventory Reports</Text>
      <Text style={styles.text}>
        Generate detailed inventory reports showing stock status, deliveries, and reorder alerts.
      </Text>
      <View style={{ marginTop: 20 }}>
        <Button title="Generate Report" onPress={handleGenerateReport} color="#0077b6" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6fa',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0077b6',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});
