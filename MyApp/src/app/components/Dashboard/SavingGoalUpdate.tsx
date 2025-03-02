import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert
} from 'react-native';
import { useSavings } from '../../contexts/SavingsContext';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface SavingGoalUpdateProps {
  goalId: string;
  isVisible: boolean;
  onClose: () => void;
}

const SavingGoalUpdate: React.FC<SavingGoalUpdateProps> = ({ goalId, isVisible, onClose }) => {
  const { savingGoals, updateSavingGoal } = useSavings();
  const [amount, setAmount] = useState('');

  const goal = savingGoals.find(g => g.id === goalId);

  const handleAddProgress = async () => {
    if (!goal) return;

    const amountValue = parseFloat(amount.replace(/[^0-9.]/g, ''));

    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      const newCurrent = goal.current + amountValue;
      await updateSavingGoal(goalId, { current: newCurrent });
      Alert.alert('Thành công', 'Đã cập nhật tiến độ mục tiêu');
      setAmount('');
      onClose();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật mục tiêu');
    }
  };

  if (!goal) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cập nhật mục tiêu: {goal.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Tiến độ hiện tại:</Text>
            <Text style={styles.progressValue}>
              {goal.current.toLocaleString()} / {goal.goal.toLocaleString()} VNĐ
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, (goal.current / goal.goal) * 100)}%` }
                ]}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Thêm tiến độ</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số tiền"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholderTextColor="#6b7280"
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleAddProgress}>
            <LinearGradient
              colors={["#251b5f", "#150f3c"]}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Cập nhật</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInfo: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
  },
  progressLabel: {
    color: '#d1d5db',
    marginBottom: 8,
  },
  progressValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 10,
  },
  input: {
    height: 60,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SavingGoalUpdate;
