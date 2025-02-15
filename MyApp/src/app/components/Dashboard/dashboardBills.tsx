import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const DashboardBills: React.FC = () => {
  // Spending data for bar chart
  const spendingData = [
    { day: 'Mon', amount: 1200 },
    { day: 'Tue', amount: 800 },
    { day: 'Wed', amount: 1500 },
    { day: 'Thu', amount: 600 },
    { day: 'Fri', amount: 1500},
    { day: 'Sat', amount: 1000 },
    { day: 'Sun', amount: 1000 }
  ];

  // Transaction data
  const transactions = [
    {
      id: '1',
      title: 'Dinner',
      time: 'Today, 12:30 AM',
      amount: 89.69,
      type: 'expense',
      category: 'food',
      account: 'Cash'
    },
    {
      id: '2',
      title: 'Design Project',
      time: 'Yesterday, 08:10 AM',
      amount: 1500.00,
      type: 'income',
      category: 'work',
      account: 'Cash'
    },
    {
      id: '3',
      title: 'Medicine',
      time: 'Today, 12:30 AM',
      amount: 369.54,
      type: 'expense',
      category: 'health',
      account: 'Cash'
    },
    {
      id: '4',
      title: 'Grocery',
      time: 'Today, 12:30 AM',
      amount: 126.21,
      type: 'expense',
      category: 'shopping',
      account: 'Cash'
    },
    {
      id: '5',
      title: 'Bus Ticket',
      time: 'Today, 09:00 AM',
      amount: 2.50,
      type: 'expense',
      category: 'transportation',
      account: 'Card'
    }
  ];

  const maxAmount = Math.max(...spendingData.map(item => item.amount));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return 'fast-food';
      case 'work': return 'briefcase';
      case 'health': return 'medical';
      case 'shopping': return 'cart';
      case 'transportation': return 'car-sport';
      case 'bills': return 'document-text';
      case 'entertainment': return 'film';
      case 'education': return 'school';
      case 'investment': return 'trending-up';
      case 'savings': return 'wallet';
      case 'other': return 'help';
      default: return 'cube';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header} />

      {/* Bar Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How You Spend</Text>
          <TouchableOpacity style={styles.dropdownButton}>
            <Text style={styles.dropdownText}>Weekly</Text>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.graphContainer}>
          <View style={styles.yAxisLabels}>
            <Text style={styles.axisLabel}>$2k</Text>
            <Text style={styles.axisLabel}>$1.5k</Text>
            <Text style={styles.axisLabel}>$1k</Text>
            <Text style={styles.axisLabel}>$0.5k</Text>
            <Text style={styles.axisLabel}>$0</Text>
          </View>

          <View style={styles.barsContainer}>
            {spendingData.map((item, index) => (
              <View key={index} style={styles.barColumn}>
                <LinearGradient
                  colors={['#4f46e580', '#4f46e5']}
                  style={[
                    styles.bar,
                    { height: `${(item.amount / maxAmount) * 100}%` }
                  ]}
                />
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Transactions */}
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
                  {transaction.type === 'income' ? '+' : '-'} ${transaction.amount.toFixed(2)}
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
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 35 : 55,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: '#fff',
    marginRight: 5,
  },
  graphContainer: {
    flexDirection: 'row',
    height: 250,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 16,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    marginRight: 10,
  },
  axisLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  barLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 8,
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
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

export default DashboardBills;