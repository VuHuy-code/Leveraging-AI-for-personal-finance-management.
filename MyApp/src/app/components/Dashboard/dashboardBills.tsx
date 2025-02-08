import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DashboardBills: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Bills</Text>
      <View style={styles.billItem}><Text>Spotify - $5.99</Text></View>
      <View style={styles.billItem}><Text>YouTube Premium - $18.99</Text></View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  billItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
});

export default DashboardBills;