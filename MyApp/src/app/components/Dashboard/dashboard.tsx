import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, ScrollView, Image, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { userData, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('Home');
  const [newName, setNewName] = useState(userData?.name || '');
  const [newAvatar, setNewAvatar] = useState(userData?.avatarUrl || '');
  const router = useRouter();

  useEffect(() => {
    const handleBackPress = () => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      if (!newName.trim()) {
        Alert.alert('Invalid Input', 'Name cannot be empty.');
        return;
      }
      await updateProfile(newName, newAvatar);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
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
      case 'Bills':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Bills</Text>
            <View style={styles.billItem}><Text>Spotify - $5.99</Text></View>
            <View style={styles.billItem}><Text>YouTube Premium - $18.99</Text></View>
          </View>
        );
      case 'Subs':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscriptions</Text>
            <Text>No subscriptions added yet.</Text>
          </View>
        );
      case 'Settings':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Settings</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new name"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter new avatar URL"
              value={newAvatar}
              onChangeText={setNewAvatar}
            />
            <TouchableOpacity style={styles.updateButton} onPress={handleProfileUpdate}>
              <Text style={styles.updateButtonText}>Update Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#ffffff', '#ffffff']} style={styles.gradientBackground}>
        <ScrollView style={styles.contentContainer}>{renderContent()}</ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Home')}>
            <Ionicons name="home" size={24} color={activeTab === 'Home' ? '#4facfe' : '#000000'} />
            <Text style={[styles.navText, activeTab === 'Home' && styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Bills')}>
            <Ionicons name="document-text" size={24} color={activeTab === 'Bills' ? '#4facfe' : '#000000'} />
            <Text style={[styles.navText, activeTab === 'Bills' && styles.activeNavText]}>Bills</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addButtonWrapper} onPress={() => alert('Add feature coming soon!')}>
            <LinearGradient colors={['#4facfe', '#00CED1']} style={styles.addButtonGradient}>
              <MaterialIcons name="add-circle" size={40} color={'#ffffff'} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Subs')}>
            <Ionicons name="list" size={24} color={activeTab === 'Subs' ? '#4facfe' : '#000000'} />
            <Text style={[styles.navText, activeTab === 'Subs' && styles.activeNavText]}>Subs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Settings')}>
            <Ionicons name="settings" size={24} color={activeTab === 'Settings' ? '#4facfe' : '#000000'} />
            <Text style={[styles.navText, activeTab === 'Settings' && styles.activeNavText]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flex: 1,
  },
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
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  billItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    borderColor: '#cccccc',
    borderWidth: 1,
    marginBottom: 15,
  },
  updateButton: {
    backgroundColor: '#4facfe',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff6666',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingVertical: 10,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#000000',
    marginTop: 5,
  },
  activeNavText: {
    color: '#4facfe',
    fontWeight: 'bold',
  },
  addButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Dashboard;
