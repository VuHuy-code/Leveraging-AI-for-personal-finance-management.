import React, { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons,MaterialIcons } from '@expo/vector-icons';
import { getUserTransactions } from '../../../services/firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useTransactionContext } from '../../contexts/TransactionContext';
import AIinsight from './AIinsight';
import {
  getExpensesFromCSV,
  getUserBalance,
  saveUserBalance,
  getWallets,
  Wallet,
  saveWallets,
  calculateDailyTrends,
  updateWallet  // Add this import
} from '../../../services/firebase/storage'; // Đường dẫn đến file chứa hàm getExpensesFromCSV
import { useRouter } from 'expo-router';
import WalletScreen from './wallet';
import { useWalletContext } from '../../contexts/WalletContext'; // <--- Lấy từ context


interface HomeProps {
  userData: {
    uid: string;
    avatarUrl?: string;  // Make optional
    name?: string;       // Make optional
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
  rawTimestamp: number; // Add this field
}

// Add this function at the top of your component, after the interfaces
const formatCurrency = (amount: number) => {
  // Remove decimal places and format with thousand separators
  return Math.floor(amount).toLocaleString('vi-VN');
};

// Add this helper function to check if a date is today
const isToday = (timestamp: string) => {
  const date = new Date(timestamp);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const DashboardHome: React.FC<HomeProps> = ({ userData }) => {
  const router = useRouter();
  const { refreshKey, refreshTransactions } = useTransactionContext(); // Get refreshTransactions
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [expense, setExpense] = useState(0);
  const [income, setIncome] = useState(0);
  const [isWalletModalVisible, setWalletModalVisible] = useState(false);
  const { activeWallet, wallets } = useWalletContext();
  const [currentBalance, setCurrentBalance] = useState(0);
  const [expenseTrend, setExpenseTrend] = useState(0);
  const [incomeTrend, setIncomeTrend] = useState(0);

  // Use useCallback to memoize handleWalletCreate
  const handleWalletCreate = useCallback((newBalance: number) => {
    setCurrentBalance(newBalance);
    refreshTransactions();
  }, [refreshTransactions]);

  useEffect(() => {
    if (activeWallet) {
      setCurrentBalance(activeWallet.currentBalance);
    } else {
      setCurrentBalance(0);
    }
  }, [activeWallet]); // This will run whenever the active wallet changes

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user || !activeWallet) return;

      try {
        const csvTransactions = await getExpensesFromCSV(user.uid);
        const todayTransactions = csvTransactions.filter(t => isToday(t.timestamp));

        // Convert and sort today's transactions
        const formattedTransactions = todayTransactions
          .map((t) => ({
            id: `${t.timestamp}-${Math.random()}`,
            title: t.title,
            time: new Date(t.timestamp).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            amount: parseFloat(t.amount),
            type: t.type as 'income' | 'expense',
            category: t.category,
            account: 'Cash',
            rawTimestamp: new Date(t.timestamp).getTime()
          }))
          .sort((a, b) => b.rawTimestamp - a.rawTimestamp);

        // Calculate today's totals
        const todayTotals = formattedTransactions.reduce((acc, t) => {
          if (t.type === 'income') {
            acc.income += t.amount;
          } else {
            acc.expense += t.amount;
          }
          return acc;
        }, { income: 0, expense: 0 });

        setTransactions(formattedTransactions);
        setIncome(todayTotals.income);
        setExpense(todayTotals.expense);

        // Update current balance based on today's transactions
        if (activeWallet) {
          const newCurrentBalance = activeWallet.balance + todayTotals.income - todayTotals.expense;
          setCurrentBalance(newCurrentBalance);
          
          // Update the wallet in storage with new current balance
          const updatedWallet = {
            ...activeWallet,
            currentBalance: newCurrentBalance
          };
          await updateWallet(user.uid, updatedWallet);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, [user, refreshKey, refreshTransactions, activeWallet]);

  useEffect(() => {
    const initializeWalletBalance = async () => {
      if (!user || !activeWallet) return;

      try {
        const wallets = await getWallets(user.uid);
        const existingWallet = wallets.find(w => w.id === activeWallet.id);

        if (existingWallet) {
          // Set the total balance to the fixed initial balance
          setTotalBalance(existingWallet.balance); // This is the fixed initial balance
          
          // Get today's transactions to calculate current balance
          const csvTransactions = await getExpensesFromCSV(user.uid);
          const todayTransactions = csvTransactions.filter(t => isToday(t.timestamp));
          
          const todayTotals = todayTransactions.reduce((acc, t) => {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') {
              acc.income += amount;
            } else {
              acc.expense += amount;
            }
            return acc;
          }, { income: 0, expense: 0 });

          // Calculate current balance based on initial balance and today's transactions
          const newCurrentBalance = existingWallet.balance + todayTotals.income - todayTotals.expense;
          setCurrentBalance(newCurrentBalance);

          // Update the wallet with new current balance but keep initial balance fixed
          const updatedWallet = {
            ...existingWallet,
            currentBalance: newCurrentBalance,
            // balance remains unchanged
          };
          await updateWallet(user.uid, updatedWallet);
        }
      } catch (error) {
        console.error('Error initializing wallet balance:', error);
      }
    };

    initializeWalletBalance();
  }, [user, activeWallet?.id]); // Only run when user or active wallet changes

  useEffect(() => {
    const loadUserBalance = async () => {
      if (!user) return;

      const userBalance = await getUserBalance(user.uid);
      if (userBalance) {
        setCurrentBalance(userBalance.currentBalance);

        // Check if we need to reset for new month
        const lastReset = new Date(userBalance.lastResetDate);
        const now = new Date();
        if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
          await saveUserBalance(user.uid, {
            ...userBalance,
            currentBalance: userBalance.totalBalance,
            lastResetDate: now.toISOString()
          });
          setCurrentBalance(userBalance.totalBalance);
        }
      }
    };

    loadUserBalance();
  }, [user, refreshKey, refreshTransactions]); // Add refreshKey and refreshTransactions

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
  }, [user, refreshKey]); // This will update whenever transactions change

  useEffect(() => {
    if (activeWallet) {
      setCurrentBalance(activeWallet.currentBalance);
      
      // Optional: Recalculate today's transactions for the new wallet
      const fetchCurrentWalletTransactions = async () => {
        if (!user) return;

        try {
          const csvTransactions = await getExpensesFromCSV(user.uid);
          const todayTransactions = csvTransactions.filter(t => isToday(t.timestamp));
          
          const todayTotals = todayTransactions.reduce((acc, t) => {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') {
              acc.income += amount;
            } else {
              acc.expense += amount;
            }
            return acc;
          }, { income: 0, expense: 0 });

          // Update expense and income states
          setExpense(todayTotals.expense);
          setIncome(todayTotals.income);
        } catch (error) {
          console.error('Error fetching wallet transactions:', error);
        }
      };

      fetchCurrentWalletTransactions();
    } else {
      setCurrentBalance(0);
      setExpense(0);
      setIncome(0);
    }
  }, [activeWallet, user]); // Dependencies include activeWallet and user

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Ăn uống':
        return 'fast-food';
      case 'Lương tháng':
        return 'briefcase';
      case 'Y tế':
        return 'medical';
      case 'Mua sắm':
        return 'cart';
      case 'Di chuyển':
        return 'car-sport';
      case 'Hóa đơn':
        return 'receipt';
      case 'Giải trí':
        return 'film';
      case 'Giáo dục':
        return 'school';
      case 'Đầu tư':
        return 'trending-up';
      case 'Tiết kiệm':
        return 'cash';
      case 'khác':
        return 'help';
      default:
        return 'logo-usd';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerWrapper}>
        <Image
          source={require('../../../assets/images/bgg.png')}
          style={styles.headerBg}
        />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              {userData?.avatarUrl && (
                <Image
                  source={{ uri: userData.avatarUrl }}
                  style={styles.avatar}
                />
              )}
            </View>

            <TouchableOpacity
              style={styles.accountSelector}
              onPress={() => setWalletModalVisible(true)}
            >
              <View style={styles.accountIcon}>
                <Ionicons name="wallet-outline" size={14} color="#fff" />
              </View>
              <Text style={styles.accountText}>All account</Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {
              }}
            >
              <Ionicons name="notifications" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(currentBalance)} VNĐ</Text>
        </View>

        <View style={styles.overviewSection}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Expense</Text>
            <Text style={styles.overviewAmount}>{formatCurrency(expense)} VNĐ</Text>
            <View style={styles.trendContainer}>
              <Ionicons 
                name={expenseTrend > 0 ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={expenseTrend > 0 ? "#ef4444" : "#22c55e"} 
              />
              <Text style={[
                styles.trendText,
                { color: expenseTrend > 0 ? "#ef4444" : "#22c55e" }
              ]}>
                {Math.abs(expenseTrend).toFixed(2)}% today
              </Text>
            </View>
          </View>

          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Income</Text>
            <Text style={styles.overviewAmount}>{formatCurrency(income)} VNĐ</Text>
            <View style={styles.trendContainer}>
              <Ionicons 
                name={incomeTrend > 0 ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={incomeTrend > 0 ? "#22c55e" : "#ef4444"} 
              />
              <Text style={[
                styles.trendText,
                { color: incomeTrend > 0 ? "#22c55e" : "#ef4444" }
              ]}>
                {Math.abs(incomeTrend).toFixed(2)}% today
              </Text>
            </View>
          </View>
        </View>

        <AIinsight userData={userData} />
      </View>

      {/* Temporarily hide transactions section
      <View style={styles.transactionsSection}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.showAllButton}>Show All</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: transaction.type === 'income' ? '#22c55e20' : '#ef444420' }
            ]}>
              <Ionicons
                name={getCategoryIcon(transaction.category)}
                size={28}
                color={transaction.type === 'income' ? '#22c55e' : '#ef4444'}
              />
            </View>

            <View style={styles.transactionDetails}>
              <View>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionTime}>
                  {`Hôm nay ${transaction.time}`}
                </Text>
              </View>

              <View style={styles.amountContainer}>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'income' ? '#22c55e' : '#ef4444' }
                ]}>
                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)} VNĐ
                </Text>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{transaction.account}</Text>
                  <View style={[
                    styles.typeIndicator,
                    { backgroundColor: transaction.type === 'income' ? '#22c55e20' : '#ef444420' }
                  ]}>
                    <Ionicons
                      name={transaction.type === 'income' ? 'arrow-up' : 'arrow-down'}
                      size={8}
                      color={transaction.type === 'income' ? '#22c55e' : '#ef4444'}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
      */}

      <WalletScreen
        isVisible={isWalletModalVisible}
        onClose={() => setWalletModalVisible(false)}
        onWalletCreate={handleWalletCreate}
        currentBalance={activeWallet?.currentBalance || 0}
      />
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
    paddingBottom: 20, // Add padding at the bottom
  },
  headerBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 35 : 55,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
    paddingRight: 8,
  },
  accountIcon: {
    backgroundColor: '#1e174f',
    padding: 8,
    borderRadius: 16,
  },
  accountText: {
    color: '#fff',
    marginHorizontal: 8,
    fontSize: 14,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceSection: {
    alignItems: 'center',
    marginTop: 16,
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