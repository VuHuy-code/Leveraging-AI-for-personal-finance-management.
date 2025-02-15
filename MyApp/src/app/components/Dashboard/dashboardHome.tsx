import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserTransactions } from '../../../services/firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useTransactionContext } from '../../contexts/TransactionContext';

interface HomeProps {
  userData: {
    avatarUrl: string;
    name: string;
  }| null; 
}

interface Transaction {
  id: string;
  title: string;
  time: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  account: string;
}

// Add this function at the top of your component, after the interfaces
const formatCurrency = (amount: number) => {
  // Remove decimal places and format with thousand separators
  return Math.floor(amount).toLocaleString('vi-VN');
};

const DashboardHome: React.FC<HomeProps> = ({ userData }) => {
  const { refreshKey } = useTransactionContext();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [expense, setExpense] = useState(0);
  const [income, setIncome] = useState(0);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;

      try {
        const userTransactions = await getUserTransactions(user.uid);
        const formattedTransactions = userTransactions.map((t: any) => ({
          id: t.id,
          title: t.title,
          time: new Date(t.createdAt?.toDate()).toLocaleString(),
          amount: parseFloat(t.amount),
          type: t.type,
          category: t.category,
          account: t.account
        }));

        // Calculate totals
        let totalIncome = 0;
        let totalExpense = 0;

        formattedTransactions.forEach((t: Transaction) => {
          if (t.type === 'income') {
            totalIncome += t.amount;
          } else {
            totalExpense += t.amount;
          }
        });

        setTransactions(formattedTransactions);
        setIncome(totalIncome);
        setExpense(totalExpense);
        setTotalBalance(totalIncome - totalExpense);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, [user, refreshKey]); // Add refreshKey to dependencies
  
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
          source={require('../../../assets/images/header-bg.png')} 
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
            
            <TouchableOpacity style={styles.accountSelector}>
              <View style={styles.accountIcon}>
                <Ionicons name="wallet-outline" size={14} color="#fff" />
              </View>
              <Text style={styles.accountText}>All account</Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)} VNĐ</Text>
        </View>

        <View style={styles.overviewSection}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Expense</Text>
            <Text style={styles.overviewAmount}>{formatCurrency(expense)} VNĐ</Text>
            <View style={styles.trendContainer}>
              <Ionicons name="arrow-down" size={12} color="#ef4444" />
              <Text style={styles.trendText}>13.39% in this month</Text>
            </View>
          </View>

          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Income</Text>
            <Text style={styles.overviewAmount}>{formatCurrency(income)} VNĐ</Text>
            <View style={styles.trendContainer}>
              <Ionicons name="arrow-up" size={12} color="#22c55e" />
              <Text style={styles.trendText}>5.22% in this month</Text>
            </View>
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={16} color="#d1d5db" />
            <Text style={styles.insightTitle}>AI Insight</Text>
          </View>
          <Text style={styles.insightText}>
            Great job! You've saved 20% more than last month.
          </Text>
        </View>
      </View>

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
                <Text style={styles.transactionTime}>{transaction.time}</Text>
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
    aspectRatio: 0.966,
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
    backgroundColor: '#4f46e5',
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
    marginTop: -40,
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