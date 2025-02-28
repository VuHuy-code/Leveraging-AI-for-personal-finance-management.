import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
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
import WalletScreen from './wallet';
import { useWalletContext } from '../../contexts/WalletContext';

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

const formatCurrency = (amount: number) => {
  return Math.floor(amount).toLocaleString('vi-VN');
};

const isToday = (timestamp: string) => {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
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
  const [isWalletModalVisible, setWalletModalVisible] = useState(false);
  const { wallet } = useWalletContext();
  const [expenseTrend, setExpenseTrend] = useState(0);
  const [incomeTrend, setIncomeTrend] = useState(0);

  // Handle wallet creation or update
  const handleWalletCreate = useCallback((newBalance: number) => {
    refreshTransactions(); // Refresh transactions when wallet is created or updated
  }, [refreshTransactions]);

  // Load wallet and transactions
  useEffect(() => {
    const loadWalletAndTransactions = async () => {
      if (!user || !wallet) return;
    
      try {
        // Get all transactions for today
        const csvTransactions = await getExpensesFromCSV(user.uid);
        const todayTransactions = csvTransactions.filter((t) => isToday(t.timestamp));
    
        // Format transactions for display
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
    
        // Set income and expense from all today's transactions (for display purposes)
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
        
        setIncome(allTodayTotals.income);
        setExpense(allTodayTotals.expense);
    
        // Get the last processed time from the wallet
        const lastProcessedTime = wallet.lastProcessedTime || 0;
        
        // IMPORTANT: Only count UNPROCESSED transactions for balance updates
        const unprocessedTransactions = todayTransactions.filter(
          t => new Date(t.timestamp).getTime() > lastProcessedTime
        );
        
        // Calculate balance changes from unprocessed transactions only
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
        
        // Set the current balance based only on new transactions
        const newCurrentBalance = wallet.currentBalance + 
          unprocessedTotals.income - unprocessedTotals.expense;
        
        setCurrentBalance(newCurrentBalance);
    
        // Only update wallet in storage if there are new unprocessed transactions
        if (unprocessedTransactions.length > 0) {
          const latestTimestamp = Math.max(
            ...unprocessedTransactions.map(t => new Date(t.timestamp).getTime())
          );
          
          const updatedWallet = {
            ...wallet,
            currentBalance: newCurrentBalance,
            lastProcessedTime: latestTimestamp
          };
          
          // Pass userId and the updated wallet object
          await updateWallet(user.uid, updatedWallet);
        }
      } catch (error) {
        console.error('Error loading wallet and transactions:', error);
      }
    };

    loadWalletAndTransactions();
  }, [user, wallet, refreshKey]);

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
        <Image source={require('../../../assets/images/bgg.png')} style={styles.headerBg} />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              {userData?.avatarUrl && (
                <Image source={{ uri: userData.avatarUrl }} style={styles.avatar} />
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
              onPress={() => {}}
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

          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Income</Text>
            <Text style={styles.overviewAmount}>{formatCurrency(income)} VNĐ</Text>
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

      <WalletScreen
        isVisible={isWalletModalVisible}
        onClose={() => setWalletModalVisible(false)}
        onWalletCreate={handleWalletCreate}
        currentBalance={wallet?.currentBalance || 0}
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