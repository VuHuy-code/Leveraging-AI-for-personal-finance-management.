import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';

// Định nghĩa interface DashboardSavingsProps
interface DashboardSavingsProps {
  userData: {
    uid: string;
    name?: string;
    avatarUrl?: string;
  };
}

interface Saving {
  id: number;
  name: string;
  icon: any;
  goal: number;     // Mục tiêu đặt ra
  current: number;  // Số tiền đang có
}

const DashboardSavings: React.FC<DashboardSavingsProps> = ({ userData }) => {
  // Ví dụ dữ liệu: có 2 mục tiêu tiết kiệm
  const [savings] = useState<Saving[]>([
    {
      id: 1,
      name: 'Laptop Fund',
      icon: require('../../../assets/images/chatbotlogo.png'),
      goal: 500,
      current: 150,
    },
    {
      id: 2,
      name: 'Holiday Fund',
      icon: require('../../../assets/images/chatbotlogo.png'),
      goal: 1000,
      current: 200,
    },
  ]);

  // Tính toán tỉ lệ % đã đạt được
  const getProgress = (current: number, goal: number) => {
    if (goal <= 0) return 0;
    return Math.min(current / goal, 1);
  };

  const getSavingIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'laptop fund':
        return 'laptop-outline';
      case 'holiday fund':
        return 'airplane-outline';
      case 'car fund':
        return 'car-outline';
      case 'house fund':
        return 'home-outline';
      case 'emergency fund':
        return 'medkit-outline';
      case 'education fund':
        return 'school-outline';
      default:
        return 'save-outline';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerWrapper}>
        <Image
          source={require('../../../assets/images/bgg.png')}
          style={styles.headerBg}
        />
        
        <View style={styles.headerTop}>
          <View style={styles.userInfoContainer}>
            {userData?.avatarUrl ? (
              <Image 
                source={{ uri: userData.avatarUrl }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => {}}
          >
            <Ionicons name="notifications" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Savings</Text>
        </View>

        <View style={styles.arcSection}>
          <View style={styles.arcContent}>
            {/* Ví dụ số tiền tiết kiệm được */}
            <Text style={styles.arcValue}>$82.90</Text>
            <Text style={styles.arcLabel}>of $2,000.00 budget</Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={16} color="#d1d5db" />
            <Text style={styles.insightTitle}>AI Insight</Text>
          </View>
          <Text style={styles.insightText}>
            Great job! You're getting closer to your savings goals.
          </Text>
        </View>
      </View>

      <View style={styles.savingsSection}>
        <Text style={styles.transactionsTitle}>Savings</Text>
        {savings.map((item) => {
          const progress = getProgress(item.current, item.goal);
          return (
            <View key={item.id} style={styles.savingItem}>
              <View style={styles.savingIconContainer}>
                <Ionicons 
                  name={getSavingIcon(item.name)} 
                  size={24} 
                  color="#fff" 
                />
              </View>
              <View style={styles.savingDetails}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.savingName}>{item.name}</Text>
                  <Text style={styles.savingGoal}>
                    ${item.current} / ${item.goal}
                  </Text>
                </View>
                {/* Thanh tiến trình */}
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
              </View>
            </View>
          );
        })}

        {savings.length === 0 && (
          <Text style={styles.noSavings}>No savings goals yet.</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default DashboardSavings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  headerWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.966, // Match home aspect ratio
  },
  headerBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  titleContainer: {
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 10 : 0, // Reduced padding
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? -40 : -20, // Added negative margin to move up
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginTop: Platform.OS === 'ios' ? 0 : 10, // Fine-tune vertical position
  },
  arcSection: {
    alignItems: 'center',
    marginTop: 50, // Reduced from 20 to 0
    marginBottom: 5, // Added margin bottom for spacing
  },
  arcContent: {
    width: 200,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: -20, // Added negative margin to move up
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  arcValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  arcLabel: {
    fontSize: 14,
    color: '#9ca3af',
    opacity: 0.8,
  },
  insightCard: {
    backgroundColor: 'rgba(23, 23, 23, 0.5)',
    borderRadius: 12,
    padding: 30,
    marginHorizontal: 20,
    marginTop: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightTitle: {
    color: '#d1d5db',
    fontSize: 14,
    marginLeft: 4,
  },
  insightText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 6,
    lineHeight: 20,
  },
  savingsSection: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    marginTop: -20, // Match home's transaction section margin
  },
  transactionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16, // Add some space between title and savings items
  },
  savingItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(23, 23, 23, 0.5)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  savingIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#150f3c', // Changed to match the progress bar color
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  savingDetails: {
    flex: 1,
  },
  savingName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  savingGoal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#251b5f',
  },
  noSavings: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 35 : 55, // Increased padding top
    zIndex: 2,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});