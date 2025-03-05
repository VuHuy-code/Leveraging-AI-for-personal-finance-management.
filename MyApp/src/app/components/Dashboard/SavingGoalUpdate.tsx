import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useSavings } from '../../contexts/SavingsContext';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SavingGoalUpdateProps {
  goalId: string;
  isVisible: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VNĐ";
};

const formatNumberWithCommas = (number: string): string => {
  // Remove non-numeric characters
  const numericValue = number.replace(/[^0-9]/g, "");
  // Add commas for thousands
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const SavingGoalUpdate: React.FC<SavingGoalUpdateProps> = ({ goalId, isVisible, onClose }) => {
  const { savingGoals, updateSavingGoal, loading } = useSavings();
  const [amount, setAmount] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const goal = savingGoals.find(g => g.id === goalId);

  // Reset input khi modal mở
  useEffect(() => {
    if (isVisible) {
      setAmount('');
    }
  }, [isVisible]);

  const handleChangeAmount = (text: string) => {
    setAmount(formatNumberWithCommas(text));
  };

  const handleAddProgress = async () => {
    if (!goal) return;

    const amountValue = parseFloat(amount.replace(/[^0-9]/g, ''));

    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      setIsUpdating(true);
      const newCurrent = goal.current + amountValue;
      await updateSavingGoal(goalId, { current: newCurrent });

      // Hiển thị thông báo thành công với số tiền đã thêm
      Alert.alert(
        'Thành công',
        `Đã thêm ${formatCurrency(amountValue)} vào mục tiêu "${goal.name}"`
      );

      setAmount('');
      onClose();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật mục tiêu');
    } finally {
      setIsUpdating(false);
    }
  };

  // Tính toán thời gian còn lại cho mục tiêu
  const getRemainingTimeText = (goal: any) => {
    if (!goal.targetDate) return 'Không có hạn';

    const targetDate = new Date(goal.targetDate);
    const now = new Date();

    // Nếu ngày đã qua
    if (targetDate < now) {
      return 'Đã hết hạn';
    }

    try {
      // Format ngày theo định dạng Việt Nam
      return format(targetDate, "dd 'tháng' MM, yyyy", { locale: vi });
    } catch (error) {
      return targetDate.toLocaleDateString();
    }
  };

  if (!goal) return null;

  // Tính % hoàn thành mục tiêu
  const progressPercent = Math.min(100, (goal.current / goal.goal) * 100);
  // Còn cần thêm bao nhiêu nữa
  const remainingAmount = Math.max(0, goal.goal - goal.current);
  // Đã hoàn thành mục tiêu chưa
  const isCompleted = goal.current >= goal.goal;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.modalContentWrapper}>
          <View style={styles.modalContent}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mục tiêu: {goal.name}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Thông tin chi tiết mục tiêu */}
              <View style={styles.goalDetailsContainer}>
                <View style={styles.goalAmountRow}>
                  <View style={styles.goalAmountSection}>
                    <Text style={styles.amountLabel}>Mục tiêu</Text>
                    <Text style={styles.amountValue}>{formatCurrency(goal.goal)}</Text>
                  </View>
                  <View style={styles.goalAmountSection}>
                    <Text style={styles.amountLabel}>Đã tiết kiệm</Text>
                    <Text style={[styles.amountValue, { color: '#10b981' }]}>{formatCurrency(goal.current)}</Text>
                  </View>
                </View>

                {/* Thời gian còn lại */}
                <View style={styles.targetDateContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#d1d5db" />
                  <Text style={styles.targetDateText}>
                    Thời hạn: {getRemainingTimeText(goal)}
                  </Text>
                </View>
              </View>

              {/* Tiến độ */}
              <View style={styles.progressInfo}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressLabel}>Tiến độ hiện tại</Text>
                  <Text style={styles.progressPercentText}>
                    {progressPercent.toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, (goal.current / goal.goal) * 100)}%`,
                        backgroundColor: isCompleted ? '#10b981' : '#6c63ff'
                      }
                    ]}
                  />
                </View>

                {!isCompleted ? (
                  <Text style={styles.remainingText}>
                    Còn {formatCurrency(remainingAmount)} nữa để đạt mục tiêu
                  </Text>
                ) : (
                  <Text style={[styles.remainingText, { color: '#10b981' }]}>
                    Bạn đã đạt mục tiêu! 🎉
                  </Text>
                )}
              </View>

              {/* Phần cập nhật tiến độ */}
              {!isCompleted && (
                <>
                  <Text style={styles.inputLabel}>Cập nhật tiến độ</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập số tiền"
                      value={amount}
                      onChangeText={handleChangeAmount}
                      keyboardType="numeric"
                      placeholderTextColor="#6b7280"
                    />
                    <Text style={styles.inputSuffix}>VNĐ</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      isUpdating ? styles.disabledButton : {}
                    ]}
                    onPress={handleAddProgress}
                    disabled={isUpdating}
                  >
                    <LinearGradient
                      colors={["#251b5f", "#150f3c"]}
                      style={styles.saveButtonGradient}
                    >
                      {isUpdating ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.saveButtonText}>Cập nhật tiến độ</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {/* Nút đóng ở phía dưới, đặc biệt là cho trường hợp đã hoàn thành */}
              {isCompleted && (
                <TouchableOpacity
                  style={styles.closeFullButton}
                  onPress={onClose}
                >
                  <LinearGradient
                    colors={["#10b981", "#059669"]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Đóng</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center', // Thay đổi từ flex-end sang center
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 50, // Đẩy modal lên cao hơn
    paddingBottom: 30,
  },
  modalContentWrapper: {
    flex: 0, // Không sử dụng flex: 1 để không chiếm toàn bộ màn hình
    marginHorizontal: 20, // Thêm margin để modal không quá sát viền
    maxHeight: '85%', // Giới hạn chiều cao tối đa
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  scrollContent: {
    maxHeight: '100%',
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flexShrink: 1, // Cho phép tiêu đề co lại nếu quá dài
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
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#d1d5db',
  },
  progressPercentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#6c63ff',
    borderRadius: 4,
  },
  remainingText: {
    marginTop: 10,
    color: '#d1d5db',
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 10,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 60,
    color: '#fff',
    fontSize: 18,
  },
  inputSuffix: {
    color: '#a8a8a8',
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.7,
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
  closeFullButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  goalDetailsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  goalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  goalAmountSection: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 14,
    color: '#a8a8a8',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  targetDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetDateText: {
    color: '#d1d5db',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default SavingGoalUpdate;
