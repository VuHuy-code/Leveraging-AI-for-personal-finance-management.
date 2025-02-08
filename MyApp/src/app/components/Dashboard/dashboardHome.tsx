import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface HomeProps {
  userData: {
    avatarUrl: string;
    name: string;
  };
}

const DashboardHome: React.FC<HomeProps> = ({ userData }) => {
  return (
    <View style={styles.section}>
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: userData?.avatarUrl || 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{userData?.name}</Text>
      </View>
      <Text style={styles.sectionTitle}>Welcome to the Dashboard</Text>
      <Text style={styles.sectionSubtitle}>Manage your subscriptions and finances easily.</Text>
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
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
});

export default DashboardHome;