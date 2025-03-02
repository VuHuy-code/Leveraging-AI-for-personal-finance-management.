import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, MaterialCommunityIcons,FontAwesome6, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import DashboardHome from './dashboardHome';
import DashboardBills from './dashboardBills';
import DashboardSavings from './dashboardSubs';
import DashboardSettings from './dashboardSetting';
import {
  getExpensesFromCSV,
  calculateDailyTrends
} from '../../../services/firebase/storage';
import { useWalletContext } from '../../contexts/WalletContext';
import { useTransactionContext } from '../../contexts/TransactionContext';

type ActionButtonType = 'expense' | 'camera' | 'income';

// First, add an interface for the user data structure
interface UserData {
  uid: string;
  name: string;
  avatarUrl: string;
}

interface ButtonScales {
  [key: string]: Animated.Value;
  expense: Animated.Value;
  camera: Animated.Value;
  income: Animated.Value;
}

interface ButtonPositions {
  expense: Animated.ValueXY;
  camera: Animated.ValueXY;
  income: Animated.ValueXY;
}

// Add these helper functions
const isToday = (timestamp: string) => {
  const date = new Date(timestamp);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Add interface for totals
interface DailyTotals {
  income: number;
  expense: number;
}

const getRobotIcon = (currentBalance: number, expense: number, income: number, hasTransactions: boolean, expenseTrend: number) => {
  // Check if no transactions today
  if (!hasTransactions) {
    return "robot-confused-outline";
  }

  // Check if balance is 0 or negative
  if (currentBalance <= 0) {
    return "robot-dead-outline";
  }

  // Check if expense trend is increasing
  if (expenseTrend > 0) {
    return "robot-angry-outline";
  }

  // Check if income is greater than expense
  if (income > expense) {
    return "robot-love-outline";
  }

  // Default icon
  return "robot-outline";
};

const Dashboard: React.FC = () => {
  const { user, userData, logout, updateProfile } = useAuth();

  // Add these context hooks
  const { wallet } = useWalletContext();
  const { refreshKey } = useTransactionContext();

  // Update userData creation
  const userInfo: UserData | null = user && userData ? {
    uid: user.uid,
    name: userData.name || 'User',
    avatarUrl: userData.avatarUrl || 'https://via.placeholder.com/150',
  } : null;

  const [activeTab, setActiveTab] = useState('Home');
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionButtonType | null>(null);
  const actionButtonsScale = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const buttonScales: ButtonScales = {
    expense: useRef(new Animated.Value(1)).current,
    camera: useRef(new Animated.Value(1)).current,
    income: useRef(new Animated.Value(1)).current,
  };

  const buttonPositions: ButtonPositions = {
    expense: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    camera: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    income: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
  };

  const showActionButtons = () => {
    setIsActionsVisible(true);
    Animated.parallel([
      Animated.spring(actionButtonsScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 40,
      }),
      Animated.spring(buttonPositions.expense, {
        toValue: { x: 0, y: -10 },
        useNativeDriver: true,
      }),
      Animated.spring(buttonPositions.camera, {
        toValue: { x: 0, y: -30 },
        useNativeDriver: true,
      }),
      Animated.spring(buttonPositions.income, {
        toValue: { x: 0, y: -10 },
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideActionButtons = () => {
    Animated.parallel([
      // Scale down main container
      Animated.spring(actionButtonsScale, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 40,
      }),
      // Move buttons back to center
      Animated.spring(buttonPositions.expense, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }),
      Animated.spring(buttonPositions.camera, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }),
      Animated.spring(buttonPositions.income, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }),
      // Reset scales
      ...Object.values(buttonScales).map(scale =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      setIsActionsVisible(false);
      setActiveAction(null);
    });
  };


  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        showActionButtons();
      },
      onPanResponderMove: (_, gestureState) => {
        const { moveX, moveY } = gestureState;
        const screenWidth = Dimensions.get('window').width;
        const centerX = screenWidth / 2;
        const buttonY = 100;

        let hoveredButton: ActionButtonType | null = null;

        if (moveY < buttonY - 60) {
          hoveredButton = 'camera';
        } else if (moveX < centerX - 50) {
          hoveredButton = 'expense';
        } else if (moveX > centerX + 50) {
          hoveredButton = 'income';
        }

        if (hoveredButton !== activeAction) {
          if (activeAction) {
            Animated.spring(buttonScales[activeAction], {
              toValue: 1,
              useNativeDriver: true,
            }).start();
          }
          if (hoveredButton) {
            Animated.spring(buttonScales[hoveredButton], {
              toValue: 1.2,
              useNativeDriver: true,
            }).start();
          }
          setActiveAction(hoveredButton);
        }
      },
      onPanResponderRelease: () => {
        if (activeAction) {
          switch (activeAction) {
            case 'expense':
              router.push('./expense');
              break;
            case 'camera':
              router.push('./camera');
              break;
            case 'income':
              router.push('./income');
              break;
          }
        }
        hideActionButtons();
      },
      onPanResponderTerminate: () => {
        hideActionButtons();
      },
    })
  ).current;

  useEffect(() => {
    const handleBackPress = () => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (!userInfo) {
      router.push('/components/Dashboard/dashboard');
    }
  }, [userInfo]);

  const handleLogout = async () => {
    try {
      await logout();
      // Change this line to navigate to login screen instead of root
      router.replace('/components/Auth/login'); // Use replace to prevent going back to dashboard
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderContent = () => {
    if (!userInfo) {
      return null; // Just return null, the useEffect above will handle the redirect
    }

    switch (activeTab) {
      case 'Home':
        return <DashboardHome userData={userInfo} />;
      case 'Bills':
        return <DashboardBills userData={userInfo} />;
      case 'Subs':
        return <DashboardSavings userData={userInfo} />;
      case 'Settings':
        return <DashboardSettings
          userData={userInfo}
          onUpdateProfile={updateProfile}
          onLogout={handleLogout}
        />;
      default:
        return null;
    }
  };

  // Add these states
  const [hasTransactions, setHasTransactions] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [expense, setExpense] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenseTrend, setExpenseTrend] = useState(0);

  // Add this useEffect to check for transactions and update states
  useEffect(() => {
    const checkTodayTransactions = async () => {
      if (!user) return;

      try {
        const csvTransactions = await getExpensesFromCSV(user.uid);
        const todayTransactions = csvTransactions.filter(t => isToday(t.timestamp));
        setHasTransactions(todayTransactions.length > 0);

        // Calculate totals with proper typing
        const totals = todayTransactions.reduce((acc: DailyTotals, t) => {
          if (t.type === 'income') {
            acc.income += parseFloat(t.amount);
          } else {
            acc.expense += parseFloat(t.amount);
          }
          return acc;
        }, { income: 0, expense: 0 });

        setIncome(totals.income);
        setExpense(totals.expense);

        // Get current balance from wallet (thay đổi từ activeWallet sang wallet)
        if (wallet) {
          setCurrentBalance(wallet.currentBalance);
        }

        // Get expense trend
        const trends = await calculateDailyTrends(user.uid);
        setExpenseTrend(trends.expenseTrend);
      } catch (error) {
        console.error('Error checking transactions:', error);
      }
    };

    checkTodayTransactions();
  }, [user, wallet, refreshKey]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#09090b', '#09090b']} style={styles.gradientBackground}>
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>

        {isActionsVisible && (
          <Animated.View
            style={[
              styles.actionButtonsContainer,
              { opacity: actionButtonsScale }
            ]}
          >
            <Animated.View
              style={[
                styles.actionButton,
                styles.actionButtonLeft,
                {
                  transform: [
                    { scale: buttonScales.expense },
                    { translateX: buttonPositions.expense.x },
                    { translateY: buttonPositions.expense.y },
                  ],
                }
              ]}
            >
              <MaterialCommunityIcons name="cash-minus" size={24} color="#fff" />
            </Animated.View>

            <Animated.View
              style={[
                styles.actionButton,
                styles.actionButtonTop,
                {
                  transform: [
                    { scale: buttonScales.camera },
                    { translateX: buttonPositions.camera.x },
                    { translateY: buttonPositions.camera.y },
                  ],
                }
              ]}
            >
              <MaterialIcons name="camera-alt" size={24} color="#000" />
            </Animated.View>

            <Animated.View
              style={[
                styles.actionButton,
                styles.actionButtonRight,
                {
                  transform: [
                    { scale: buttonScales.income },
                    { translateX: buttonPositions.income.x },
                    { translateY: buttonPositions.income.y },
                  ],
                }
              ]}
            >
              <MaterialCommunityIcons name="cash-plus" size={24} color="#fff" />
            </Animated.View>
          </Animated.View>
        )}

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Home')}>
            <AntDesign name="home" size={24} color={activeTab === 'Home' ? '#fff' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Bills')}>
            <Ionicons name="receipt-outline" size={24} color={activeTab === 'Bills' ? '#fff' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('./chatbot')}
            onLongPress={showActionButtons}
            onPressOut={() => {
              if (isActionsVisible) {
                hideActionButtons();
              }
            }}
            delayLongPress={200}
            {...panResponder.panHandlers}
          >
            <View style={styles.plusButton}>
              <MaterialCommunityIcons
                name={getRobotIcon(currentBalance, expense, income, hasTransactions, expenseTrend)}
                size={32}
                color="#000"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Subs')}>
            <MaterialCommunityIcons name="piggy-bank-outline" size={24} color={activeTab === 'Subs' ? '#fff' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Settings')}>
            <AntDesign name="setting" size={24} color={activeTab === 'Settings' ? '#fff' : '#666'} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 90,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 9, 11, 0.6)', // Trong suốt với màu nền tương tự màu nền chính
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Thêm viền nhẹ
  },
  navItem: {
    padding: 10,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  actionButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionButtonTop: {
    bottom: 35,
    backgroundColor: '#fff',
  },
  actionButtonLeft: {
    right: '60%',
    bottom: 0,
    backgroundColor: '#ef4444',
  },
  actionButtonRight: {
    left: '60%',
    bottom: 0,
    backgroundColor: '#22c55e',
  },
  plusButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButton: {
    marginTop: -25,
  },
});

export default Dashboard;
