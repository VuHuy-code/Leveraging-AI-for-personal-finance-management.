import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HomeProps {
  userData: {
    avatarUrl: string;
    name: string;
  };
}

const DashboardHome: React.FC<HomeProps> = ({ userData }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [budget, setBudget] = useState(5000000);
  const [tempBudget, setTempBudget] = useState('');
  const income = 10000000;
  const expenses = 5000000;
  const remainingBudget = income - expenses;

  const handleBudgetChange = () => {
    if (tempBudget) {
      setBudget(Number(tempBudget));
      setTempBudget('');
      setModalVisible(false);
    }
  };  

  const transactions = [
    { id: '1', description: 'Mua sắm', amount: 500000, type: 'expense' },
    { id: '2', description: 'Lương tháng', amount: 10000000, type: 'income' },
    { id: '3', description: 'Ăn uống', amount: 200000, type: 'expense' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: userData?.avatarUrl || 'https://via.placeholder.com/60' }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>Xin chào, {userData?.name}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.budgetContainer}>
        <Text style={styles.budgetTitle}>Số tiền còn lại trong tháng</Text>
        <Text style={styles.budgetAmount}>{budget.toLocaleString()} VNĐ</Text>
        <View style={styles.incomeExpenseContainer}>
          <View style={styles.incomeContainer}>
            <Text style={styles.incomeExpenseLabel}>Thu</Text>
            <View style={styles.amountContainer}>
              <Ionicons name="arrow-up-circle" size={24} color="green" />
              <Text style={[styles.incomeExpenseAmount, styles.incomeText]}>
                {income.toLocaleString()} VNĐ
              </Text>
            </View>
          </View>
          <View style={styles.expenseContainer}>
            <Text style={styles.incomeExpenseLabel}>Chi</Text>
            <View style={styles.amountContainer}>
              <Ionicons name="arrow-down-circle" size={24} color="red" />
              <Text style={[styles.incomeExpenseAmount, styles.expenseText]}>
                {expenses.toLocaleString()} VNĐ
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.moreButton} 
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsContainer}>
        <Text style={styles.transactionsTitle}>Giao dịch trong ngày</Text>
        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <Text style={styles.transactionDescription}>{transaction.description}</Text>
            <Text style={transaction.type === 'income' ? styles.transactionIncome : styles.transactionExpense}>
              {transaction.amount.toLocaleString()} VNĐ
            </Text>
          </View>
        ))}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Điều chỉnh ngân sách</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Nhập số tiền mới"
              value={tempBudget}
              onChangeText={setTempBudget}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleBudgetChange}
              >
                <Text style={styles.buttonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  settingsButton: {
    padding: 8,
  },
  budgetContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  budgetTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  incomeExpenseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  incomeContainer: {
    alignItems: 'center',
  },
  expenseContainer: {
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incomeExpenseLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  incomeExpenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeText: {
    color: 'green',
  },
  expenseText: {
    color: 'red',
  },
  moreButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  transactionsContainer: {
    marginBottom: 20,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionDescription: {
    fontSize: 16,
    color: '#000',
  },
  transactionIncome: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
  },
  transactionExpense: {
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff4444',
  },
  confirmButton: {
    backgroundColor: '#00C851',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DashboardHome;