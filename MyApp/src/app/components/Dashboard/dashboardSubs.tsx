import React, { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  getSavingGoals,
  saveSavingGoals,
} from "../../../services/firebase/storage";
import Savingsinsight from "./Savingsinsight";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSavings } from '../../contexts/SavingsContext';
import SavingGoalUpdate from "./SavingGoalUpdate";

// Get screen dimensions for responsive design
const { width } = Dimensions.get("window");

// Define the icon types for TypeScript
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
type MaterialCommunityIconsName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type FontAwesome5Name = React.ComponentProps<typeof FontAwesome5>["name"];

interface DashboardSavingsProps {
  userData: {
    uid: string;
    name?: string;
    avatarUrl?: string;
  };
}

interface Saving {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material' | 'fontawesome';
  goal: number;
  current: number;
}

interface SavingGoal {
  id: string;
  name: string;
  goal: number;
  current: number;
  createdAt: string;
  targetDate: string;
  duration: {
    value: number;
    unit: 'week' | 'month' | 'year';
  };
  description?: string;
}

interface Category {
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material' | 'fontawesome';
  color: string;
}

interface TimeOption {
  label: string;
  unit: 'week' | 'month' | 'year';
  defaultValue: number;
  maxValue: number;
}

const formatCurrency = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VNĐ";
};

// Format number with commas
const formatNumberWithCommas = (number: string): string => {
  // Remove non-numeric characters
  const numericValue = number.replace(/[^0-9]/g, "");
  // Add commas for thousands
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Parse formatted number back to number
const parseFormattedNumber = (formattedNumber: string): number => {
  return parseInt(formattedNumber.replace(/,/g, ""), 10) || 0;
};

const DashboardSavings: React.FC<DashboardSavingsProps> = ({ userData }) => {
  // Sử dụng context để quản lý savings
  const { savingGoals, loading: savingsLoading, fetchSavingGoals, addSavingGoal } = useSavings();

  // Thêm state local để quản lý totalCurrent và totalGoal
  const [totalCurrent, setTotalCurrent] = useState(0);
  const [totalGoal, setTotalGoal] = useState(0);

  // Các states khác giữ nguyên
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTimeUnit, setSelectedTimeUnit] = useState<'week' | 'month' | 'year'>('month');
  const [timeValue, setTimeValue] = useState(3); // Default: 3 months
  const router = useRouter();
  const progressAnimation = useState(new Animated.Value(0))[0];

  // Sử dụng category của chúng ta để hiển thị
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);

  // Time options
  const timeOptions: TimeOption[] = [
    { label: 'Tuần', unit: 'week', defaultValue: 4, maxValue: 52 },
    { label: 'Tháng', unit: 'month', defaultValue: 3, maxValue: 36 },
    { label: 'Năm', unit: 'year', defaultValue: 1, maxValue: 10 },
  ];

  // Categories with improved icons and colors
  const categories: Category[] = [
    {
      name: "Thiết bị công nghệ",
      icon: "laptop-outline",
      iconType: "ionicons",
      color: "#6366f1" // Indigo
    },
    {
      name: "Du lịch",
      icon: "airplane-outline",
      iconType: "ionicons",
      color: "#0ea5e9" // Sky blue
    },
    {
      name: "Phương tiện",
      icon: "car-sport-outline",
      iconType: "ionicons",
      color: "#f43f5e" // Rose
    },
    {
      name: "Nhà cửa",
      icon: "home-outline",
      iconType: "ionicons",
      color: "#84cc16" // Lime
    },
    {
      name: "Y tế",
      icon: "medkit-outline",
      iconType: "ionicons",
      color: "#14b8a6" // Teal
    },
    {
      name: "Giáo dục",
      icon: "school-outline",
      iconType: "ionicons",
      color: "#8b5cf6" // Violet
    },
    {
      name: "Đám cưới",
      icon: "heart-outline",
      iconType: "ionicons",
      color: "#ec4899" // Pink
    },
    {
      name: "Tiết kiệm",
      icon: "wallet-outline",
      iconType: "ionicons",
      color: "#f59e0b" // Amber
    },
    {
      name: "Khác",
      icon: "bookmark-outline",
      iconType: "ionicons",
      color: "#64748b" // Slate
    },
  ];

  useEffect(() => {
    loadSavings();
  }, [userData.uid]);

  useEffect(() => {
    // Update time value when time unit changes
    const option = timeOptions.find(opt => opt.unit === selectedTimeUnit);
    if (option) {
      setTimeValue(option.defaultValue);
    }
  }, [selectedTimeUnit]);

  useEffect(() => {
    if (!savingsLoading && savingGoals.length > 0) {
      // Tính toán tổng từ savingGoals
      const current = savingGoals.reduce((sum, goal) => sum + goal.current, 0);
      const goal = savingGoals.reduce((sum, goal) => sum + goal.goal, 0);

      // Cập nhật state local
      setTotalCurrent(current);
      setTotalGoal(goal);

      // Chuyển đổi savingGoals sang định dạng savings để hiển thị
      const transformedGoals: Saving[] = savingGoals.map((goal) => {
        const category = categories.find(cat => cat.name === goal.name) || categories[categories.length - 1];
        return {
          id: goal.id,
          name: goal.name,
          icon: category.icon,
          iconType: category.iconType,
          goal: goal.goal,
          current: goal.current,
        };
      });

      setSavings(transformedGoals);

      // Animate progress bar
      Animated.timing(progressAnimation, {
        toValue: goal > 0 ? Math.min(current / goal, 1) : 0,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [savingGoals, savingsLoading]);

  const loadSavings = async () => {
    if (!userData.uid) return;
    setLoading(true);
    try {
      // Ưu tiên sử dụng fetchSavingGoals từ context để đảm bảo dữ liệu được đồng bộ
      await fetchSavingGoals();

      // Đọc dữ liệu trực tiếp từ Firebase cho màn hình này (có thể loại bỏ nếu dữ liệu từ context đã đủ)
      const goals = await getSavingGoals(userData.uid);

      // Chuyển đổi và cập nhật UI
      const transformedGoals: Saving[] = goals.map((goal) => {
        const category = categories.find(cat => cat.name === goal.name) || categories[categories.length - 1];
        return {
          id: goal.id,
          name: goal.name,
          icon: category.icon,
          iconType: category.iconType,
          goal: goal.goal,
          current: goal.current,
        };
      });

      // Tính toán tổng
      const current = transformedGoals.reduce(
        (sum, goal) => sum + goal.current,
        0
      );
      const goal = transformedGoals.reduce((sum, goal) => sum + goal.goal, 0);

      // Cập nhật state local
      setSavings(transformedGoals);
      setTotalCurrent(current);
      setTotalGoal(goal);

      // Animate progress bar
      Animated.timing(progressAnimation, {
        toValue: goal > 0 ? Math.min(current / goal, 1) : 0,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.error("Error loading savings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (current: number, goal: number) => {
    if (goal <= 0) return 0;
    return Math.min(current / goal, 1);
  };

  const renderIcon = (icon: string, type: 'ionicons' | 'material' | 'fontawesome', size: number, color: string) => {
    // Tách mã màu thành các thành phần RGB để sử dụng với transparency
    const baseColor = color;
    const lighterColor = color + '99'; // Thêm 60% opacity

    return (
      <LinearGradient
        colors={[lighterColor, baseColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: size * 0.9,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {type === 'ionicons' && <Ionicons name={icon as IoniconsName} size={size} color="#fff" />}
        {type === 'material' && <MaterialCommunityIcons name={icon as MaterialCommunityIconsName} size={size} color="#fff" />}
        {type === 'fontawesome' && <FontAwesome5 name={icon as FontAwesome5Name} size={size} color="#fff" />}
      </LinearGradient>
    );
  };

  const handleCreateSavingGoal = () => {
    // Reset form fields
    setNewGoalName("");
    setNewGoalAmount("");
    setSelectedCategory("");
    setSelectedTimeUnit('month');
    setTimeValue(3);

    // Log để debug
    console.log("Opening modal...");

    // Đặt timeout để đảm bảo state được cập nhật sau render
    setTimeout(() => {
      setModalVisible(true);
      console.log("Modal should be visible now");
    }, 100);
  };

  const handleChatbotNavigation = () => {
    router.push({
      pathname: "./chatbot",
      params: { initialMessage: "Tôi muốn tiết kiệm" },
    });
  };

  const calculateTargetDate = (duration: {value: number, unit: 'week' | 'month' | 'year'}): Date => {
    const targetDate = new Date();

    switch (duration.unit) {
      case 'week':
        targetDate.setDate(targetDate.getDate() + (duration.value * 7));
        break;
      case 'month':
        targetDate.setMonth(targetDate.getMonth() + duration.value);
        break;
      case 'year':
        targetDate.setFullYear(targetDate.getFullYear() + duration.value);
        break;
    }

    return targetDate;
  };

  const handleSaveNewGoal = async () => {
    if (!selectedCategory && !newGoalName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên mục tiêu hoặc chọn danh mục");
      return;
    }

    if (!newGoalAmount.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
      return;
    }

    // Use selected category or custom name
    const goalName = selectedCategory || newGoalName;

    // Parse the formatted amount
    const goalAmount = parseFormattedNumber(newGoalAmount);

    if (goalAmount <= 0) {
      Alert.alert("Lỗi", "Số tiền mục tiêu phải lớn hơn 0");
      return;
    }

    const duration = {
      value: timeValue,
      unit: selectedTimeUnit
    };

    const targetDate = calculateTargetDate(duration);

    try {
      setLoading(true);

      // Tạo mục tiêu mới
      const newGoal = {
        name: goalName,
        goal: goalAmount,
        current: 0,
        createdAt: new Date().toISOString(),
        targetDate: targetDate.toISOString(),
        duration: duration,
        description: ""
      };

      // Sử dụng context để thêm mục tiêu - sẽ cập nhật state context
      await addSavingGoal(newGoal);

      // Thêm vào state local để cập nhật UI ngay lập tức
      const category = categories.find(cat => cat.name === goalName) || categories[categories.length - 1];
      const newSaving: Saving = {
        id: Date.now().toString(), // ID tạm thời, sẽ được thay thế khi context được cập nhật
        name: goalName,
        icon: category.icon,
        iconType: category.iconType,
        goal: goalAmount,
        current: 0,
      };

      // Cập nhật UI ngay lập tức
      setSavings(prev => [...prev, newSaving]);
      setTotalGoal(prev => prev + goalAmount);

      // Reset form và đóng modal
      setNewGoalName("");
      setNewGoalAmount("");
      setSelectedCategory("");
      setModalVisible(false);

      // Gọi loadSavings để đảm bảo UI được cập nhật đầy đủ
      setTimeout(() => {
        loadSavings();
      }, 500);

    } catch (error) {
      console.error("Error creating saving goal:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tạo mục tiêu tiết kiệm. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAmount = (text: string) => {
    setNewGoalAmount(formatNumberWithCommas(text));
  };

  const incrementTime = () => {
    const option = timeOptions.find(opt => opt.unit === selectedTimeUnit);
    if (option && timeValue < option.maxValue) {
      setTimeValue(timeValue + 1);
    }
  };

  const decrementTime = () => {
    if (timeValue > 1) {
      setTimeValue(timeValue - 1);
    }
  };

  const totalProgress = totalGoal > 0 ? (totalCurrent / totalGoal) * 100 : 0;

  const getCategoryColor = (name: string): string => {
    const category = categories.find(cat => cat.name === name);
    return category ? category.color : "#64748b";
  };

  // Thêm state mới để quản lý modal cập nhật tiến độ
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  // Thêm function xử lý khi người dùng nhấn vào một mục tiêu
  const handleGoalPress = (goalId: string) => {
    setSelectedGoalId(goalId);
    setUpdateModalVisible(true);
  };

  // Thêm function đóng modal cập nhật
  const handleCloseUpdateModal = () => {
    setUpdateModalVisible(false);
    setSelectedGoalId(null);

    // Tải lại dữ liệu sau khi cập nhật
    setTimeout(() => {
      loadSavings();
    }, 500);
  };

  console.log("Modal visible state:", modalVisible);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={["#150f3c", "#09090b"]}
        style={styles.headerWrapper}
      >
        <View style={styles.headerTop}>
          <View style={styles.userInfoContainer}>
            {userData?.avatarUrl ? (
              <Image
                source={{ uri: userData.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            )}
            <Text style={styles.welcomeText}>
              {userData.name
                ? `Hi, ${userData.name.split(" ")[0]}`
                : "Hi there"}
            </Text>
          </View>

          {/* Thêm tiêu đề Savings ở giữa */}
          <Text style={styles.headerTitleInline}>Savings</Text>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => {}}
          >
            <Ionicons name="notifications" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.arcSection}>
          <LinearGradient
            colors={["rgba(37, 27, 95, 0.8)", "rgba(37, 27, 95, 0.4)"]}
            style={styles.arcContent}
          >
            <Text style={styles.arcValue}>{formatCurrency(totalCurrent)}</Text>
            <Text style={styles.arcLabel}>
              of {formatCurrency(totalGoal)} target
            </Text>

            <View style={styles.totalProgressContainer}>
              <View style={styles.totalProgressBar}>
                <Animated.View
                  style={[
                    styles.totalProgressFill,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.totalProgressText}>
                {totalProgress.toFixed(1)}%
              </Text>
            </View>
          </LinearGradient>
        </View>

        <Savingsinsight userData={userData} />
      </LinearGradient>

      <View style={styles.savingsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.transactionsTitle}>Your Savings</Text>
          <TouchableOpacity
            style={styles.createButtonSmall}
            onPress={handleCreateSavingGoal}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.createButtonTextSmall}>New Goal</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#251b5f"
            style={styles.loader}
          />
        ) : (
          <>
            {savings.length > 0 ? (
              savings.map((item, index) => {
                const progress = getProgress(item.current, item.goal);
                const progressPercent = (progress * 100).toFixed(1);
                const categoryColor = getCategoryColor(item.name);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.savingItem,
                      index === 0 && styles.firstSavingItem,
                    ]}
                    onPress={() => handleGoalPress(item.id)} // Thêm sự kiện onPress
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.savingIconContainer,
                        // Xóa backgroundColor từ đây vì sẽ sử dụng gradient
                      ]}
                    >
                      {renderIcon(item.icon, item.iconType, 24, categoryColor)}
                    </View>
                    <View style={styles.savingDetails}>
                      <View style={styles.savingNameRow}>
                        <Text style={styles.savingName}>{item.name}</Text>
                        <Text
                          style={[
                            styles.progressPercent,
                            { color: getProgressColor(progress) },
                          ]}
                        >
                          {progressPercent}%
                        </Text>
                      </View>
                      <View style={styles.savingGoalRow}>
                        <Text style={styles.savingGoal}>
                          {formatCurrency(item.current)}
                        </Text>
                        <Text style={styles.savingGoalSeparator}>/</Text>
                        <Text style={styles.savingGoalTotal}>
                          {formatCurrency(item.goal)}
                        </Text>
                      </View>
                      <View style={styles.progressBar}>
                        <Animated.View
                          style={[
                            styles.progressFill,
                            {
                              width: `${progress * 100}%`,
                              backgroundColor: getProgressColor(progress),
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.guidanceContainer}>
                <FontAwesome5
                  name="piggy-bank"
                  size={48}
                  color="#251b5f"
                  style={styles.guidanceIcon}
                />
                <Text style={styles.guidanceTitle}>
                  Bạn chưa có mục tiêu tiết kiệm
                </Text>
                <Text style={styles.guidanceText}>
                  Tạo mục tiêu tiết kiệm mới hoặc gõ "Tôi muốn tiết kiệm" trong
                  chat để được hướng dẫn.
                </Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleChatbotNavigation}
        >
          <LinearGradient
            colors={["#251b5f", "#150f3c"]}
            style={styles.createButtonGradient}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
            <Text style={styles.createButtonText}>
              Trao đổi với AI về tiết kiệm
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Thêm Modal cập nhật mục tiêu tiết kiệm */}
      {selectedGoalId && (
        <SavingGoalUpdate
          goalId={selectedGoalId}
          isVisible={updateModalVisible}
          onClose={handleCloseUpdateModal}
        />
      )}

      {/* New Goal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          console.log("Modal closing...");
          setModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo mục tiêu tiết kiệm mới</Text>
              <TouchableOpacity
                onPress={() => {
                  console.log("Close button pressed");
                  setModalVisible(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Category Selection */}
              <Text style={styles.inputLabel}>Danh mục</Text>
              <View style={styles.categoryGridContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.name}
                    style={[
                      styles.categoryGridItem,
                      selectedCategory === category.name && styles.selectedCategory,
                      { borderColor: selectedCategory === category.name ? category.color : 'rgba(255,255,255,0.1)' }
                    ]}
                    onPress={() => setSelectedCategory(category.name)}
                  >
                    <View
                      style={styles.categoryIcon}
                    >
                      {renderIcon(category.icon, category.iconType, 24, category.color)}
                    </View>
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category.name &&
                          styles.selectedCategoryText,
                      ]}
                      numberOfLines={2}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Luôn hiển thị trường nhập tên mục tiêu */}
              <Text style={styles.inputLabel}>Tên mục tiêu</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên mục tiêu của bạn"
                placeholderTextColor="#6b7280"
                value={newGoalName}
                onChangeText={setNewGoalName}
              />

              {/* Goal Amount */}
              <Text style={styles.inputLabel}>Số tiền mục tiêu</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.moneyInput}
                  placeholder="0"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={newGoalAmount}
                  onChangeText={handleChangeAmount}
                />
                <Text style={styles.inputSuffix}>VNĐ</Text>
              </View>

              {/* Time Period Selection */}
              <Text style={styles.inputLabel}>Thời gian tiết kiệm</Text>

              {/* Time Unit Selection */}
              <View style={styles.timeUnitContainer}>
                {timeOptions.map(option => (
                  <TouchableOpacity
                    key={option.unit}
                    style={[
                      styles.timeUnitButton,
                      selectedTimeUnit === option.unit && styles.selectedTimeUnit
                    ]}
                    onPress={() => setSelectedTimeUnit(option.unit)}
                  >
                    <Text
                      style={[
                        styles.timeUnitText,
                        selectedTimeUnit === option.unit && styles.selectedTimeUnitText
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Value Selector */}
              <View style={styles.timeValueContainer}>
                <TouchableOpacity
                  style={styles.timeValueButton}
                  onPress={decrementTime}
                >
                  <Ionicons name="remove" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.timeValueDisplay}>
                  <Text style={styles.timeValue}>{timeValue}</Text>
                  <Text style={styles.timeUnit}>
                    {selectedTimeUnit === 'week' ? 'tuần' :
                     selectedTimeUnit === 'month' ? 'tháng' : 'năm'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.timeValueButton}
                  onPress={incrementTime}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Khoảng trống cuối cùng để đảm bảo nút không bị che khuất */}
              <View style={{height: 100}} />
            </ScrollView>

            {/* Nút lưu đặt ngoài ScrollView để cố định */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveNewGoal}
              >
                <LinearGradient
                  colors={["#251b5f", "#150f3c"]}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Tạo mục tiêu</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

// Helper function to get progress color based on percentage
const getProgressColor = (progress: number): string => {
  if (progress < 0.3) return "#ef4444";
  if (progress < 0.7) return "#f59e0b";
  return "#10b981";
};

export default DashboardSavings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  headerWrapper: {
    position: "relative",
    width: "100%",
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 45 : 60,
    zIndex: 2,
  },

  // Style mới cho tiêu đề inline
  headerTitleInline: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    paddingTop: 2,
    marginLeft: -45, // Thêm margin âm để dịch sang trái
  },

  // Styles của các phần khác giữ nguyên
  welcomeText: {
    color: "#e5e7eb",
    fontSize: 16,
    marginLeft: 10,
  },

  // Có thể giữ lại hoặc xóa các style không còn sử dụng
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginTop: 10,
  },
  arcSection: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  arcContent: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  arcValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  arcLabel: {
    fontSize: 16,
    color: "#d1d5db",
    marginBottom: 16,
  },
  totalProgressContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  totalProgressBar: {
    flex: 1,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 5,
    overflow: "hidden",
    marginRight: 10,
  },
  totalProgressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 5,
  },
  totalProgressText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    width: 50,
    textAlign: "right",
  },
  savingsSection: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  transactionsTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  savingItem: {
    flexDirection: "row",
    backgroundColor: "rgba(23, 23, 23, 0.5)",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  firstSavingItem: {
    marginTop: 8,
  },
  savingIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    overflow: "hidden", // Đảm bảo gradient không tràn ra ngoài
    elevation: 5,      // Thêm shadow cho Android
    shadowColor: "#000", // Shadow cho iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  savingDetails: {
    flex: 1,
  },
  savingNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  savingName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "600",
  },
  savingGoalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  savingGoal: {
    fontSize: 14,
    fontWeight: "500",
    color: "#d1d5db",
  },
  savingGoalSeparator: {
    fontSize: 14,
    color: "#6b7280",
    marginHorizontal: 4,
  },
  savingGoalTotal: {
    fontSize: 14,
    color: "#9ca3af",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  guidanceContainer: {
    backgroundColor: "rgba(37, 27, 95, 0.2)",
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "rgba(37, 27, 95, 0.5)",
    alignItems: "center",
  },
  guidanceIcon: {
    marginBottom: 16,
  },
  guidanceTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  guidanceText: {
    fontSize: 14,
    color: "#d1d5db",
    lineHeight: 22,
    textAlign: "center",
  },
  createButton: {
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  createButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 27, 95, 0.7)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  createButtonTextSmall: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  loader: {
    marginVertical: 30,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#1a1a1a",
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#d1d5db",
    marginBottom: 10,
    marginTop: 16,
  },
  // Categories styles
  categoryGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryGridItem: {
    width: "31%", // Just under a third to fit 3 per row with spacing
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedCategory: {
    backgroundColor: "rgba(37, 27, 95, 0.3)",
    borderWidth: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden", // Đảm bảo gradient không tràn ra ngoài
    elevation: 3,      // Thêm shadow cho Android
    shadowColor: "#000", // Shadow cho iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryText: {
    color: "#d1d5db",
    fontSize: 14,
    textAlign: "center",
  },
  selectedCategoryText: {
    color: "#fff",
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 60,
  },
  moneyInput: {
    flex: 1,
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    paddingVertical: 12,
  },
  input: {
    height: 60,
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
  },
  inputSuffix: {
    color: "#d1d5db",
    fontSize: 16,
    fontWeight: "500",
  },

  // Time selection styles
  timeUnitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeUnitButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedTimeUnit: {
    backgroundColor: 'rgba(37, 27, 95, 0.5)',
    borderColor: '#7c3aed',
  },
  timeUnitText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedTimeUnitText: {
    color: '#fff',
    fontWeight: '700',
  },
  timeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    height: 80,
  },
  timeValueButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 27, 95, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7c3aed',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  timeValueDisplay: {
    alignItems: 'center',
  },
  timeValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  timeUnit: {
    color: '#d1d5db',
    fontSize: 16,
    marginTop: 4,
  },
});
