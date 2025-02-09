import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import DashboardHome from './dashboardHome';
import DashboardBills from './dashboardBills';
import DashboardSubs from './dashboardSubs';
import DashboardSettings from './dashboardSetting';
import ChatBox from './dashboardChatbox'; // Import ChatBox component

const Dashboard: React.FC = () => {
  const { userData, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('Home');
  const [chatBoxVisible, setChatBoxVisible] = useState(false);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <DashboardHome userData={userData} />;
      case 'Bills':
        return <DashboardBills />;
      case 'Subs':
        return <DashboardSubs />;
      case 'Settings':
        return <DashboardSettings userData={userData} onUpdateProfile={updateProfile} onLogout={handleLogout} />;
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

          <TouchableOpacity style={styles.addButtonWrapper} onPress={() => setChatBoxVisible(true)}>
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

        {/* Chat Box Modal */}
        <ChatBox visible={chatBoxVisible} onClose={() => setChatBoxVisible(false)} />
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