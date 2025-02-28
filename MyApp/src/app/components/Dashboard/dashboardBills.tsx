import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  Platform,
  Image,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDailyExpenses, getMonthlyExpenses } from '../../../services/firebase/storage';
import { useTransactionContext } from '../../contexts/TransactionContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DashboardProps {
  userData: {
    uid: string;
    avatarUrl?: string;
    name?: string;
  };
}

// Helper functions
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'ăn uống':
      return 'fast-food';
    case 'di chuyển':
      return 'car';
    case 'mua sắm':
      return 'cart';
    case 'hóa đơn':
      return 'receipt';
    case 'y tế':
      return 'medical';
    case 'giải trí':
      return 'film';
    case 'giáo dục':
      return 'school';
    default:
      return 'wallet';
  }
};

const formatCurrency = (amount: number) => {
  return Math.floor(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const getAvailableCategories = (transactions: any[]) => {
  const uniqueCategories = new Set(['All']);
  transactions.forEach(transaction => {
    uniqueCategories.add(transaction.category);
  });
  return Array.from(uniqueCategories);
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const calculateWeekDays = (date: Date) => {
  const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = currentDate.getDay();
  const diff = currentDate.getDate() - day;
  const sunday = new Date(currentDate.getFullYear(), currentDate.getMonth(), diff);
  const week = [];

  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(sunday);
    nextDay.setDate(sunday.getDate() + i);
    week.push({
      day: WEEKDAYS[nextDay.getDay()].substring(0, 2),
      date: nextDay.getDate(),
      fullDate: new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate())
    });
  }

  return week;
};

const DashboardBills: React.FC<DashboardProps> = ({ userData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [weekDays, setWeekDays] = useState(calculateWeekDays(new Date()));
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily'); // State để quản lý tab hiện tại
  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>([]); // State cho thống kê tháng

  const scrollViewRef = React.useRef<ScrollView>(null);

  const scrollToSelectedDay = () => {
    if (scrollViewRef.current) {
      const selectedIndex = weekDays.findIndex(
        item => 
          item.fullDate.getDate() === selectedDate.getDate() &&
          item.fullDate.getMonth() === selectedDate.getMonth() &&
          item.fullDate.getFullYear() === selectedDate.getFullYear()
      );

      if (selectedIndex !== -1) {
        scrollViewRef.current.scrollTo({
          x: selectedIndex * 70,
          animated: true
        });
      }
    }
  };

  useEffect(() => {
    setTimeout(scrollToSelectedDay, 50);
  }, [selectedDate]);

  const fetchTransactions = async (date: Date) => {
    try {
      const expenses = await getDailyExpenses(userData.uid, date);
      const sortedExpenses = expenses.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      setTransactions(sortedExpenses);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchMonthlyTransactions = async (month: number, year: number) => {
    try {
      const expenses = await getMonthlyExpenses(userData.uid, month, year);
      const sortedExpenses = expenses.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      setMonthlyTransactions(sortedExpenses);
    } catch (error) {
      console.error('Error fetching monthly transactions:', error);
    }
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(selectedYear, selectedMonth, day);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
    setShowFullCalendar(false);
    fetchTransactions(newDate);
  };

  useEffect(() => {
    fetchTransactions(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyTransactions(selectedMonth, selectedYear);
    }
  }, [activeTab, selectedMonth, selectedYear]);

  const renderContent = () => {
    if (activeTab === 'daily') {
      return (
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <View style={styles.categoryDropdownContainer}>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowCategoryModal(!showCategoryModal)}
              >
                <Text style={styles.dropdownText}>{selectedCategory}</Text>
                <Ionicons 
                  name={showCategoryModal ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {showCategoryModal && (
                <View style={styles.dropdownList}>
                  {getAvailableCategories(transactions).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.dropdownItem,
                        selectedCategory === category && styles.selectedDropdownItem
                      ]}
                      onPress={() => {
                        setSelectedCategory(category);
                        setShowCategoryModal(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedCategory === category && styles.selectedDropdownItemText
                      ]}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <ScrollView style={styles.transactionsList}>
            {transactions.map((transaction, index) => (
              <View key={index} style={styles.transactionCard}>
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
                    <Text style={styles.transactionTime}>{formatTime(transaction.timestamp)}</Text>
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'income' ? '#22c55e' : '#ef4444' }
                    ]}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)} VNĐ
                    </Text>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>Cash</Text>
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
          </ScrollView>
        </View>
      );
    } else {
      return (
        <View style={styles.monthlyStatsContainer}>
          <Text style={styles.monthlyStatsTitle}>Thống kê theo tháng</Text>
          {/* Thêm các thành phần thống kê ở đây */}
        </View>
      );
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
              style={styles.monthSelector}
              onPress={() => setShowFullCalendar(true)}
            >
              <Text style={styles.monthTitle}>
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {}}
            >
              <Ionicons name="notifications" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'daily' && styles.activeTab]}
            onPress={() => setActiveTab('daily')}
          >
            <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>Chi tiêu theo ngày</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'monthly' && styles.activeTab]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[styles.tabText, activeTab === 'monthly' && styles.activeTabText]}>Thống kê theo tháng</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Days */}
        {activeTab === 'daily' && (
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.calendarScroll}
            onContentSizeChange={scrollToSelectedDay}
          >
            {weekDays.map((item) => (
              <TouchableOpacity
                key={`${item.fullDate.getTime()}`}
                style={[
                  styles.dayItem,
                  selectedDate.getDate() === item.fullDate.getDate() && 
                  selectedDate.getMonth() === item.fullDate.getMonth() &&
                  selectedDate.getFullYear() === item.fullDate.getFullYear() &&
                  styles.selectedDay
                ]}
                onPress={() => {
                  const newDate = new Date(
                    item.fullDate.getFullYear(),
                    item.fullDate.getMonth(),
                    item.fullDate.getDate()
                  );
                  newDate.setHours(0, 0, 0, 0);
                  setSelectedDate(newDate);
                  fetchTransactions(newDate);
                }}
              >
                <Text style={[
                  styles.dayText,
                  selectedDate.getDate() === item.fullDate.getDate() &&
                  selectedDate.getMonth() === item.fullDate.getMonth() &&
                  selectedDate.getFullYear() === item.fullDate.getFullYear() &&
                  styles.selectedDayText
                ]}>{item.day}</Text>
                <Text style={[
                  styles.dateText,
                  selectedDate.getDate() === item.fullDate.getDate() &&
                  selectedDate.getMonth() === item.fullDate.getMonth() &&
                  selectedDate.getFullYear() === item.fullDate.getFullYear() &&
                  styles.selectedDayText
                ]}>{item.date}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {renderContent()}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  headerWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1.5,
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
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1c1c1e',
    paddingVertical: 8,
  },
  tabButton: {
    padding: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3d2e9c',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarScroll: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  dayItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: 'rgba(23, 23, 23, 0.5)',
    width: 60,
    borderWidth: 1,
    borderColor: '#3d2e9c',
  },
  selectedDay: {
    backgroundColor: '#3d2e9c',
  },
  dayText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  selectedDayText: {
    color: '#fff',
    opacity: 1,
  },
  transactionsSection: {
    flex: 1,
    backgroundColor: '#09090b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 23, 23, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    right: 0,
    width: 160,
    backgroundColor: '#0c0b11',
    borderRadius: 12,
    paddingVertical: 4,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectedDropdownItem: {
    backgroundColor: 'transparent',
  },
  dropdownText: {
    fontSize: 14,
    color: '#fff',
    marginRight: 5,
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 14,
  },
  selectedDropdownItemText: {
    color: '#4f46e5',
    fontWeight: '600',
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
  transactionCategory: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
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
  transactionsList: {
    flex: 1,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 15,
    padding: 10,
    width: '80%',
    maxHeight: '70%',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalItemText: {
    fontSize: 16,
    color: '#fff',
  },
  selectedModalItemText: {
    color: '#1e174f',
    fontWeight: '600',
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContent: {
    width: width * 0.9,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yearText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  monthContainer: {
    width: '100%',
  },
  monthText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  weekdayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    color: '#666',
    fontSize: 14,
    width: (width * 0.9 - 32) / 7,
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (width * 0.9 - 32) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayCell: {
    backgroundColor: '#1e174f',
    borderRadius: 20,
  },
  dayNumber: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#1e174f',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  monthlyStatsContainer: {
    flex: 1,
    padding: 16,
  },
  monthlyStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
});

export default DashboardBills;