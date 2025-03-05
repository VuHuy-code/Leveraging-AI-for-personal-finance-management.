import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, Easing } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getUserTransactions } from '../../../services/firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useTransactionContext } from '../../contexts/TransactionContext';
import AIinsight from './AIinsight';
import {
  getExpensesFromCSV,
  calculateDailyTrends,
  updateWallet,
} from '../../../services/firebase/storage';
import { useRouter } from 'expo-router';
import { useWalletContext } from '../../contexts/WalletContext';
import { LinearGradient } from 'expo-linear-gradient';

interface HomeProps {
  userData: {
    uid: string;
    avatarUrl?: string;
    name?: string;
  };
}

interface Transaction {
  id: string;
  title: string;
  time: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  account: string;
  rawTimestamp: number;
}

// Helper function to get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return Math.floor(amount).toLocaleString('vi-VN');
};

// Helper function to check if a timestamp is today
const isToday = (timestamp: string) => {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Helper function for animated count
const formatAnimatedValue = (value: number): string => {
  return Math.floor(value).toLocaleString('vi-VN');
};

// Optimized TypewriterText - chỉ hiển thị nếu text thay đổi
const TypewriterText = ({ text, style }: { text: string, style: any }) => {
  const [displayedText, setDisplayedText] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset text khi input thay đổi
    setDisplayedText("");

    // Clear previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (text) {
      let index = 0;
      intervalRef.current = setInterval(() => {
        if (index <= text.length) {
          setDisplayedText(text.substring(0, index));
          index++;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, 20); // Tăng tốc độ đánh máy
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text]);

  return <Text style={style}>{displayedText}</Text>;
};

const DashboardHome: React.FC<HomeProps> = ({ userData }) => {
  const router = useRouter();
  const { refreshKey, refreshTransactions } = useTransactionContext();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [expense, setExpense] = useState(0);
  const [income, setIncome] = useState(0);
  const { wallet } = useWalletContext();
  const [expenseTrend, setExpenseTrend] = useState(0);
  const [incomeTrend, setIncomeTrend] = useState(0);

  // Add greeting state
  const [greeting, setGreeting] = useState(getGreeting());

  // Animation values for balance counting
  const balanceCountAnim = useRef(new Animated.Value(0)).current;
  const [countedBalance, setCountedBalance] = useState("0");
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const [prevBalance, setPrevBalance] = useState(0);

  // Thêm animation values cho expense và income
  const expenseCountAnim = useRef(new Animated.Value(0)).current;
  const incomeCountAnim = useRef(new Animated.Value(0)).current;
  const [countedExpense, setCountedExpense] = useState("0");
  const [countedIncome, setCountedIncome] = useState("0");
  const [prevExpense, setPrevExpense] = useState(0);
  const [prevIncome, setPrevIncome] = useState(0);

  // Update greeting based on time of day
  useEffect(() => {
    setGreeting(getGreeting());

    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Animate balance counting effect when currentBalance changes
  useEffect(() => {
    if (currentBalance > 0) {
      // Tối ưu: Bỏ qua animation nếu sự thay đổi quá nhỏ và không phải lần đầu tiên
      if (prevBalance > 0 && Math.abs(currentBalance - prevBalance) < 10) {
        setCountedBalance(formatAnimatedValue(currentBalance));
        setPrevBalance(currentBalance);
        return;
      }

      balanceCountAnim.setValue(prevBalance);

      Animated.timing(balanceCountAnim, {
        toValue: currentBalance,
        duration: 1000, // Giảm thời gian animation để tối ưu
        useNativeDriver: false,
        easing: Easing.out(Easing.ease)
      }).start();

      const listener = balanceCountAnim.addListener(({ value }) => {
        setCountedBalance(formatAnimatedValue(value));
      });

      // Shake effect if balance has changed significantly
      if (prevBalance > 0 && Math.abs(currentBalance - prevBalance) > 1000) {
        Animated.sequence([
          Animated.timing(shakeAnimation, { toValue: 5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: -5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
      }

      setPrevBalance(currentBalance);
      return () => balanceCountAnim.removeListener(listener);
    }
  }, [currentBalance]);

  // Animate expense counting effect
  useEffect(() => {
    // Bỏ qua animation nếu giá trị thay đổi quá nhỏ
    if (prevExpense > 0 && Math.abs(expense - prevExpense) < 10) {
      setCountedExpense(formatAnimatedValue(expense));
      setPrevExpense(expense);
      return;
    }

    expenseCountAnim.setValue(prevExpense);

    Animated.timing(expenseCountAnim, {
      toValue: expense,
      duration: 800, // Thời gian ngắn hơn cho expense
      useNativeDriver: false,
      easing: Easing.out(Easing.ease)
    }).start();

    const listener = expenseCountAnim.addListener(({ value }) => {
      setCountedExpense(formatAnimatedValue(value));
    });

    setPrevExpense(expense);
    return () => expenseCountAnim.removeListener(listener);
  }, [expense]);

  // Animate income counting effect
  useEffect(() => {
    // Bỏ qua animation nếu giá trị thay đổi quá nhỏ
    if (prevIncome > 0 && Math.abs(income - prevIncome) < 10) {
      setCountedIncome(formatAnimatedValue(income));
      setPrevIncome(income);
      return;
    }

    incomeCountAnim.setValue(prevIncome);

    Animated.timing(incomeCountAnim, {
      toValue: income,
      duration: 800, // Thời gian ngắn hơn cho income
      useNativeDriver: false,
      easing: Easing.out(Easing.ease)
    }).start();

    const listener = incomeCountAnim.addListener(({ value }) => {
      setCountedIncome(formatAnimatedValue(value));
    });

    setPrevIncome(income);
    return () => incomeCountAnim.removeListener(listener);
  }, [income]);

  // Load wallet and transactions
  useEffect(() => {
    const loadWalletAndTransactions = async () => {
      if (!user || !wallet) return;

      try {
        // Get today's transactions from CSV
        const csvTransactions = await getExpensesFromCSV(user.uid);
        const todayTransactions = csvTransactions.filter((t) => isToday(t.timestamp));

        const formattedTransactions = todayTransactions
          .map((t) => ({
            id: `${t.timestamp}-${Math.random()}`,
            title: t.title,
            time: new Date(t.timestamp).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            amount: parseFloat(t.amount),
            type: t.type as 'income' | 'expense',
            category: t.category,
            account: 'Cash',
            rawTimestamp: new Date(t.timestamp).getTime(),
          }))
          .sort((a, b) => b.rawTimestamp - a.rawTimestamp);

        setTransactions(formattedTransactions);

        // Recalculate daily totals from the fresh CSV data
        const allTodayTotals = todayTransactions.reduce(
          (acc, t) => {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') {
              acc.income += amount;
            } else {
              acc.expense += amount;
            }
            return acc;
          },
          { income: 0, expense: 0 }
        );

        // Update today's income/expense totals with the fresh values
        setIncome(allTodayTotals.income);
        setExpense(allTodayTotals.expense);

        // Update wallet balance with the latest transactions
        const lastProcessedTime = wallet.lastProcessedTime || 0;
        const unprocessedTransactions = todayTransactions.filter(
          t => new Date(t.timestamp).getTime() > lastProcessedTime
        );

        // Calculate totals from unprocessed transactions
        const unprocessedTotals = unprocessedTransactions.reduce(
          (acc, t) => {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') {
              acc.income += amount;
            } else {
              acc.expense += amount;
            }
            return acc;
          },
          { income: 0, expense: 0 }
        );

        // Calculate and update the new current balance
        const newCurrentBalance = wallet.currentBalance +
          unprocessedTotals.income - unprocessedTotals.expense;

        setCurrentBalance(newCurrentBalance);

        if (unprocessedTransactions.length > 0) {
          const latestTimestamp = Math.max(
            ...unprocessedTransactions.map(t => new Date(t.timestamp).getTime())
          );

          const updatedWallet = {
            ...wallet,
            currentBalance: newCurrentBalance,
            lastProcessedTime: latestTimestamp
          };

          await updateWallet(user.uid, updatedWallet);
        }
      } catch (error) {
        console.error('Error loading wallet and transactions:', error);
      }
    };

    loadWalletAndTransactions();
  }, [user, wallet, refreshKey]); // refreshKey will trigger reload when transactions change

  // Calculate trends
  useEffect(() => {
    const calculateTrends = async () => {
      if (!user) return;

      try {
        const trends = await calculateDailyTrends(user.uid);
        setExpenseTrend(trends.expenseTrend);
        setIncomeTrend(trends.incomeTrend);
      } catch (error) {
        console.error('Error calculating trends:', error);
      }
    };

    calculateTrends();
  }, [user, refreshKey]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["#150f3c", "#09090b"]}
          style={styles.headerBg}
        />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* User information section */}
            <View style={styles.userInfo}>
              {userData?.avatarUrl ? (
                <Image source={{ uri: userData.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              )}
              <View style={styles.nameContainer}>
                <Text style={styles.greetingText}>{greeting}</Text>
                <Text style={styles.userName}>
                  {userData.name ? userData.name.split(' ')[0] : 'User'}
                </Text>
              </View>
            </View>

            {/* Notification button - move this right after user info */}
            <TouchableOpacity
              style={[
                styles.notificationButton,
                { backgroundColor: "rgba(61, 46, 156, 0.3)" },
              ]}
              onPress={() => {}}
            >
              <Ionicons name="notifications" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance section - moved up to replace wallet container */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <TypewriterText
            text={`${countedBalance} VNĐ`}
            style={styles.balanceAmount}
          />
        </View>

        <View style={styles.overviewSection}>
          {/* Card chi tiêu với hiệu ứng đếm số */}
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Expense</Text>
            <TypewriterText
              text={`${countedExpense} VNĐ`}
              style={styles.overviewAmount}
            />
            <View style={styles.trendContainer}>
              <Ionicons
                name={expenseTrend > 0 ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={expenseTrend > 0 ? '#ef4444' : '#22c55e'}
              />
              <Text
                style={[
                  styles.trendText,
                  { color: expenseTrend > 0 ? '#ef4444' : '#22c55e' },
                ]}
              >
                {Math.abs(expenseTrend).toFixed(2)}% today
              </Text>
            </View>
          </View>

          {/* Card thu nhập với hiệu ứng đếm số */}
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Income</Text>
            <TypewriterText
              text={`${countedIncome} VNĐ`}
              style={styles.overviewAmount}
            />
            <View style={styles.trendContainer}>
              <Ionicons
                name={incomeTrend > 0 ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={incomeTrend > 0 ? '#22c55e' : '#ef4444'}
              />
              <Text
                style={[
                  styles.trendText,
                  { color: incomeTrend > 0 ? '#22c55e' : '#ef4444' },
                ]}
              >
                {Math.abs(incomeTrend).toFixed(2)}% today
              </Text>
            </View>
          </View>
        </View>

        <AIinsight userData={userData} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  headerWrapper: {
    position: 'relative',
    width: '100%',
    paddingBottom: 20,
  },
  headerBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    // Bỏ resizeMode: 'cover' vì không còn cần thiết cho gradient
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 35 : 55,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Change to space-between
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow it to take available space
  },
  rightContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-start', // Căn các phần tử về bên trái
    paddingLeft: 10, // Thêm padding bên trái để dịch cả khối sang trái
    alignItems: 'center',
  },
  nameContainer: {
    flexShrink: 1, // Cho phép thu nhỏ nếu cần
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  greetingText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  balanceSection: {
    alignItems: 'center',
    marginTop: -10, // Đẩy lên trên
    paddingVertical: 10, // Giảm khoảng trống trên dưới
  },
  balanceLabel: {
    color: '#9ca3af',
    fontSize: 16,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '600',
    marginTop: 4,
  },
  totalBalanceLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  overviewSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: 'rgba(23, 23, 23, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  overviewLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  overviewAmount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 4,
  },
  insightCard: {
    backgroundColor: 'rgba(23, 23, 23, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
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
  transactionsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    paddingBottom: 80,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  showAllButton: {
    color: '#9ca3af',
    fontSize: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(23, 23, 23, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  transactionTime: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  accountName: {
    color: '#9ca3af',
    fontSize: 12,
    marginRight: 4,
  },
  typeIndicator: {
    width: 14,
    height: 14,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardHome;
