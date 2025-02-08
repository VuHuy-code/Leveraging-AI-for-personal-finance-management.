import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DashboardSubs: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Subscriptions</Text>
      <Text>No subscriptions added yet.</Text>
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
});

export default DashboardSubs;