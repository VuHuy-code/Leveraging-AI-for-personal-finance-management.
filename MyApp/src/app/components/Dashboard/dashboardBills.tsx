import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Image,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getDailyExpenses,
  getMonthlyExpenses,
  getCategoryTotals,
  getWallet,
} from "../../../services/firebase/storage";
import { useTransactionContext } from "../../contexts/TransactionContext";
import Svg, { Circle, G, Path, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

interface CategoryTotal {
  category: string;
  totalExpense: number;
  totalIncome: number;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    case "ăn uống":
      return "fast-food-outline";
    case "di chuyển":
      return "car-outline";
    case "mua sắm":
      return "cart-outline";
    case "hóa đơn":
      return "receipt-outline";
    case "y tế":
      return "medical-outline";
    case "giải trí":
      return "film-outline";
    case "giáo dục":
      return "school-outline";
    default:
      return "wallet-outline";
  }
};

const formatCurrency = (amount: number) => {
  return Math.floor(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const getAvailableCategories = (transactions: any[]) => {
  const uniqueCategories = new Set(["All"]);
  transactions.forEach((transaction) => {
    uniqueCategories.add(transaction.category);
  });
  return Array.from(uniqueCategories);
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const calculateWeekDays = (date: Date) => {
  const currentDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const day = currentDate.getDay();
  const diff = currentDate.getDate() - day;
  const sunday = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    diff
  );
  const week = [];

  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(sunday);
    nextDay.setDate(sunday.getDate() + i);
    week.push({
      day: WEEKDAYS[nextDay.getDay()].substring(0, 2),
      date: nextDay.getDate(),
      fullDate: new Date(
        nextDay.getFullYear(),
        nextDay.getMonth(),
        nextDay.getDate()
      ),
    });
  }

  return week;
};

// Function to get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Function to get first day of month
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case "ăn uống":
      return "#FF6384"; // Red
    case "di chuyển":
      return "#36A2EB"; // Blue
    case "mua sắm":
      return "#FFCE56"; // Yellow
    case "hóa đơn":
      return "#4BC0C0"; // Green
    case "y tế":
      return "#F66D44"; // Orange
    case "giải trí":
      return "#9966FF"; // Purple
    case "giáo dục":
      return "#C9CBCF"; // Gray
    default:
      return "#8A2BE2"; // Default purple
  }
};

interface PieChartProps {
  data: { category: string; amount: number; color: string }[];
  totalBalance: number;
}

// Updated PieChart component with enhanced category-specific shadows
// Updated PieChart component with enhanced category-specific shadows
const PieChart: React.FC<PieChartProps> = ({ data, totalBalance }) => {
  const radius = 90;
  const strokeWidth = 20; // Width of the donut ring
  const center = radius + 20;
  const gapAngle = 0; // Đã đặt giá trị là 0 để loại bỏ khoảng cách

  // Calculate total expenses for percentage
  const totalExpenses = data.reduce((sum, item) => sum + item.amount, 0);

  // The remaining budget is what's left after all expenses
  const remainingBudget = Math.max(0, totalBalance - totalExpenses);

  // Start from the top (12 o'clock position)
  let startAngle = -Math.PI / 2;

  // Create the donut chart paths with proper gaps
  const createDonutPath = (startAngle: number, endAngle: number) => {
    // Calculate start and end points
    const startX = center + radius * Math.cos(startAngle);
    const startY = center + radius * Math.sin(startAngle);
    const endX = center + radius * Math.cos(endAngle);
    const endY = center + radius * Math.sin(endAngle);

    // Determine if the arc should be drawn the long way around
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    // Create the SVG path
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  // Create the donut chart arcs
  return (
    <View style={[
      styles.chartContainer,
      {
        shadowColor: "#6c63ff",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        borderRadius: center,
        padding: 5,
      }
    ]}>
      <Svg width={center * 2} height={center * 2}>
        <Defs>
          {/* Create glowing filters for each category */}
          {data.map((item, index) => (
            <SvgLinearGradient key={`gradient-${index}`} id={`glow-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={item.color} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={item.color} stopOpacity="0.2" />
            </SvgLinearGradient>
          ))}

          {/* Create gradient for remaining section */}
          <SvgLinearGradient id="remainingGrad" gradientUnits="userSpaceOnUse" x1="-100" y1="-100" x2="100" y2="100">
            <Stop offset="0%" stopColor="#5A5A5C" />
            <Stop offset="100%" stopColor="#3A3A3C" />
          </SvgLinearGradient>
        </Defs>

        {/* Render each segment of the donut */}
        <G>
          {data.length > 0 && data.map((item, index) => {
            // Calculate segment angles
            const segmentAngle = (item.amount / totalBalance) * (2 * Math.PI);
            const endAngle = startAngle + segmentAngle;

            // Create the path for this segment
            const path = createDonutPath(startAngle, endAngle);

            // Update startAngle for the next segment
            const currentStartAngle = startAngle;
            startAngle = endAngle;

            // Create shadow effects for each category
            const outerRadius = radius + 8; // Increased for wider shadow
            const shadowPath = `
              M ${center + outerRadius * Math.cos(currentStartAngle)}
                ${center + outerRadius * Math.sin(currentStartAngle)}
              A ${outerRadius} ${outerRadius} 0
                ${endAngle - currentStartAngle > Math.PI ? 1 : 0} 1
                ${center + outerRadius * Math.cos(endAngle)}
                ${center + outerRadius * Math.sin(endAngle)}
            `;

            return (
              <React.Fragment key={index}>
                {/* Draw multiple layers of shadow for each category */}
                <Path
                  d={shadowPath}
                  stroke={item.color}
                  strokeWidth={4}
                  fill="transparent"
                  strokeLinecap="butt" // Bỏ bo tròn ở hai đầu
                  opacity={0.5}
                  strokeOpacity={0.7}
                />

                {/* Draw a second layer of shadow further out */}
                <Path
                  d={`
                    M ${center + (outerRadius+4) * Math.cos(currentStartAngle)}
                      ${center + (outerRadius+4) * Math.sin(currentStartAngle)}
                    A ${outerRadius+4} ${outerRadius+4} 0
                      ${endAngle - currentStartAngle > Math.PI ? 1 : 0} 1
                      ${center + (outerRadius+4) * Math.cos(endAngle)}
                      ${center + (outerRadius+4) * Math.sin(endAngle)}
                  `}
                  stroke={item.color}
                  strokeWidth={2}
                  fill="transparent"
                  strokeLinecap="butt" // Bỏ bo tròn ở hai đầu
                  opacity={0.3}
                  strokeOpacity={0.5}
                />

                {/* Draw the main segment with solid color */}
                <Path
                  d={path}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeLinecap="butt" // Bỏ bo tròn ở hai đầu
                />

                {/* Add a subtle inner glow along the segment */}
                <Path
                  d={path}
                  stroke={`url(#glow-${index})`}
                  strokeWidth={strokeWidth - 8}
                  fill="transparent"
                  strokeLinecap="butt" // Bỏ bo tròn ở hai đầu
                  opacity={0.6}
                />
              </React.Fragment>
            );
          })}

          {/* Remaining budget segment with custom shadow */}
          {remainingBudget > 0 && (
            <>
              {/* Draw the outer glow for remaining segment */}
              <Path
                d={`
                  M ${center + (radius+8) * Math.cos(startAngle)}
                    ${center + (radius+8) * Math.sin(startAngle)}
                  A ${radius+8} ${radius+8} 0
                    ${(-Math.PI/2 + 2*Math.PI) - startAngle > Math.PI ? 1 : 0} 1
                    ${center + (radius+8) * Math.cos(-Math.PI/2 + 2*Math.PI)}
                    ${center + (radius+8) * Math.sin(-Math.PI/2 + 2*Math.PI)}
                `}
                stroke="#5A5A5C"
                strokeWidth={4}
                fill="transparent"
                strokeLinecap="butt" // Bỏ bo tròn ở hai đầu
                opacity={0.5}
              />

              {/* Draw a second layer of shadow for remaining section */}
              <Path
                d={`
                  M ${center + (radius+12) * Math.cos(startAngle)}
                    ${center + (radius+12) * Math.sin(startAngle)}
                  A ${radius+12} ${radius+12} 0
                    ${(-Math.PI/2 + 2*Math.PI) - startAngle > Math.PI ? 1 : 0} 1
                    ${center + (radius+12) * Math.cos(-Math.PI/2 + 2*Math.PI)}
                    ${center + (radius+12) * Math.sin(-Math.PI/2 + 2*Math.PI)}
                `}
                stroke="#5A5A5C"
                strokeWidth={2}
                fill="transparent"
                strokeLinecap="butt" // Bỏ bo tròn ở hai đầu
                opacity={0.3}
              />

              {/* Draw the main remaining segment */}
              <Path
                d={createDonutPath(startAngle, -Math.PI / 2 + 2 * Math.PI)}
                stroke="#3A3A3C"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeLinecap="butt" // Bỏ bo tròn ở hai đầu
              />

              {/* Add a subtle inner glow for remaining segment */}
              <Path
                d={createDonutPath(startAngle, -Math.PI / 2 + 2 * Math.PI)}
                stroke="url(#remainingGrad)"
                strokeWidth={strokeWidth - 8}
                fill="transparent"
                strokeLinecap="butt" // Bỏ bo tròn ở hai đầu
                opacity={0.4}
              />
            </>
          )}
        </G>

        {/* Inner content showing remaining budget - maintain text with slight adjustment */}
        <G>
          <SvgText
            fill="#f5f5f5"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            x={center}
            y={center - 15}
          >
            Available
          </SvgText>
          <SvgText
            fill="#22c55e"
            fontSize="20"
            fontWeight="bold"
            textAnchor="middle"
            x={center}
            y={center + 20}
          >
            {formatCurrency(remainingBudget)}
          </SvgText>
        </G>
      </Svg>

      {/* Legend with improved styling */}
      <View style={[
        styles.legendContainer,
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
        }
      ]}>
        {data.map((item, index) => {
          const percentage = ((item.amount / totalBalance) * 100).toFixed(1);

          return (
            <View
              key={index}
              style={[
                styles.legendItem,
                {
                  backgroundColor: "rgba(40, 40, 40, 0.3)",
                  borderRadius: 10,
                  marginBottom: 8,
                  padding: 10,
                  shadowColor: item.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: `${item.color}30`,
                }
              ]}
            >
              <View
                style={[styles.legendColor, {
                  backgroundColor: item.color,
                  borderRadius: 9,
                  shadowColor: item.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.6,
                  shadowRadius: 3,
                  elevation: 3,
                }]}
              />
              <View style={styles.legendTextContainer}>
                <Text style={[styles.legendCategoryText, { color: "#f5f5f5" }]}>
                  {item.category}
                </Text>
                <Text style={[styles.legendPercentText, { color: "#a8a8a8" }]}>
                  {percentage}% · {formatCurrency(item.amount)} VNĐ
                </Text>
              </View>
            </View>
          );
        })}

        {/* Remaining budget in legend */}
        {remainingBudget > 0 && (
          <View
            style={[
              styles.legendItem,
              {
                backgroundColor: "rgba(40, 40, 40, 0.3)",
                borderRadius: 10,
                marginBottom: 8,
                padding: 10,
                shadowColor: "#5A5A5C",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: 1,
                borderColor: "rgba(90, 90, 92, 0.3)",
              }
            ]}
          >
            <View
              style={[styles.legendColor, {
                backgroundColor: "#3A3A3C",
                borderRadius: 9,
                shadowColor: "#5A5A5C",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.6,
                shadowRadius: 3,
                elevation: 3,
              }]}
            />
            <View style={styles.legendTextContainer}>
              <Text style={[styles.legendCategoryText, { color: "#f5f5f5" }]}>
                Còn lại
              </Text>
              <Text style={[styles.legendPercentText, { color: "#a8a8a8" }]}>
                {((remainingBudget / totalBalance) * 100).toFixed(1)}% · {formatCurrency(remainingBudget)} VNĐ
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const DashboardBills: React.FC<DashboardProps> = ({ userData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [weekDays, setWeekDays] = useState(calculateWeekDays(new Date()));
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { refreshKey } = useTransactionContext();

  const fetchCategoryTotals = async () => {
    try {
      const totals = await getCategoryTotals(userData.uid);
      const wallet = await getWallet(userData.uid);

      setCategoryTotals(totals);
      setTotalBalance(wallet ? wallet.balance : 0);
      const totalIncome = totals.reduce((sum, category) => sum + category.totalIncome, 0);
      console.log(`Total income from categories: ${totalIncome} VNĐ`);
      console.log(`Total expenses: ${totals.reduce((sum, category) => sum + category.totalExpense, 0)} VNĐ`);
      console.log(`Wallet balance: ${wallet ? wallet.balance : 0} VNĐ`);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error fetching category totals:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "monthly") {
      fadeAnim.setValue(0);
      fetchCategoryTotals();
    }
  }, [activeTab]);

  const scrollToSelectedDay = () => {
    if (scrollViewRef.current) {
      const selectedIndex = weekDays.findIndex(
        (item) =>
          item.fullDate.getDate() === selectedDate.getDate() &&
          item.fullDate.getMonth() === selectedDate.getMonth() &&
          item.fullDate.getFullYear() === selectedDate.getFullYear()
      );

      if (selectedIndex !== -1) {
        scrollViewRef.current.scrollTo({
          x: selectedIndex * 70,
          animated: true,
        });
      }
    }
  };

  useEffect(() => {
    setTimeout(scrollToSelectedDay, 50);
  }, [selectedDate]);

  const fetchTransactions = async (date: Date) => {
    try {
      fadeAnim.setValue(0);
      const expenses = await getDailyExpenses(userData.uid, date);
      const sortedExpenses = expenses.sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
      setTransactions(sortedExpenses);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchMonthlyTransactions = async (month: number, year: number) => {
    try {
      const expenses = await getMonthlyExpenses(userData.uid, month, year);
      const sortedExpenses = expenses.sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
      setMonthlyTransactions(sortedExpenses);
    } catch (error) {
      console.error("Error fetching monthly transactions:", error);
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
    if (activeTab === "daily") {
      fetchTransactions(selectedDate);
    }
  }, [selectedDate, activeTab]);

  useEffect(() => {
    if (activeTab === "monthly") {
      fetchMonthlyTransactions(selectedMonth, selectedYear);
      fetchCategoryTotals();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  useEffect(() => {
    // Refresh data when refreshKey changes
    if (activeTab === "daily") {
      fetchTransactions(selectedDate);
    } else {
      fetchMonthlyTransactions(selectedMonth, selectedYear);
      fetchCategoryTotals();
    }
  }, [refreshKey]);

  const handleTabChange = (tab: "daily" | "monthly") => {
    // Animate the slider
    Animated.timing(slideAnim, {
      toValue: tab === "daily" ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Set the active tab
    setActiveTab(tab);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);

    // Create array for days of month with empty slots for beginning of month
    const days = Array(firstDayOfMonth).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    // Calculate how many empty days we need at the end to complete the grid
    const totalDays = firstDayOfMonth + daysInMonth;
    const remainingDays = 7 - (totalDays % 7);
    if (remainingDays < 7) {
      for (let i = 0; i < remainingDays; i++) {
        days.push(null);
      }
    }

    return (
      <View style={styles.calendarDaysContainer}>
        {WEEKDAYS.map((day, index) => (
          <Text
            key={`weekday-${index}`}
            style={[styles.weekdayText, { color: "#a8a8a8" }]}
          >
            {day}
          </Text>
        ))}

        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.emptyDay} />;
          }

          const date = new Date(selectedYear, selectedMonth, day);
          const isSelected =
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === selectedMonth &&
            selectedDate.getFullYear() === selectedYear;

          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === selectedMonth &&
            new Date().getFullYear() === selectedYear;

          return (
            <TouchableOpacity
              key={`day-${day}`}
              style={[
                styles.calendarDay,
                isToday && styles.todayCalendarDay,
                isSelected && styles.selectedCalendarDay,
              ]}
              onPress={() => handleDateSelect(day)}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  isSelected && styles.selectedCalendarDayText,
                  isToday && !isSelected && { color: "#3d2e9c" },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderContent = () => {
    if (activeTab === "daily") {
      const filteredTransactions =
        selectedCategory === "All"
          ? transactions
          : transactions.filter((t) => t.category === selectedCategory);

      return (
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.sectionTitle, { color: "#f5f5f5" }]}>
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>

            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: "rgba(61, 46, 156, 0.3)",
                  borderColor: "rgba(61, 46, 156, 0.5)",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                },
              ]}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="filter" size={18} color="#fff" />
                <Text
                  style={{ color: "#fff", marginLeft: 6, fontWeight: "500" }}
                >
                  Filter
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>
            {filteredTransactions.length > 0 ? (
              <View style={styles.transactionsList}>
                {filteredTransactions.map((transaction, index) => {
                  const isExpense = transaction.type === "expense";
                  const backgroundColor = getCategoryColor(
                    transaction.category
                  );

                  return (
                    <View
                      key={index}
                      style={[
                        styles.transactionCard,
                        {
                          backgroundColor: "rgba(40, 40, 40, 0.3)",
                          borderColor: "rgba(61, 46, 156, 0.2)",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          {
                            backgroundColor: `${backgroundColor}20`,
                            borderWidth: 1,
                            borderColor: `${backgroundColor}40`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={getCategoryIcon(transaction.category)}
                          size={24}
                          color={backgroundColor}
                        />
                      </View>

                      <View style={styles.transactionDetails}>
                        <View>
                          <Text
                            style={[
                              styles.transactionTitle,
                              { color: "#f5f5f5" },
                            ]}
                          >
                            {transaction.title || transaction.category}
                          </Text>
                          <Text
                            style={[
                              styles.transactionTime,
                              { color: "#a8a8a8" },
                            ]}
                          >
                            {formatTime(new Date(transaction.timestamp))}
                          </Text>
                        </View>

                        <View style={styles.amountContainer}>
                          <Text
                            style={[
                              styles.transactionAmount,
                              {
                                color: isExpense ? "#ef4444" : "#22c55e",
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {isExpense ? "-" : "+"}
                            {formatCurrency(parseFloat(transaction.amount))} VNĐ
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyState,
                  {
                    backgroundColor: "rgba(40, 40, 40, 0.2)",
                    borderColor: "rgba(61, 46, 156, 0.2)",
                  },
                ]}
              >
                <LinearGradient
                  colors={["rgba(61, 46, 156, 0.2)", "rgba(40, 40, 40, 0.1)"]}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={50}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </LinearGradient>
                <Text style={[styles.emptyStateText, { color: "#e0e0e0" }]}>
                  No transactions found
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: "#a8a8a8" }]}>
                  Transactions for this day will appear here
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      );
    } else {
      // Monthly tab render with animation
      // Only include expense categories in the pie chart data
      const spendingData = categoryTotals
        .filter(category =>
          // Filter out "khác" category AND only include categories that have expenses
          category.category.toLowerCase() !== "khác" &&
          category.totalExpense > 0
        )
        .map((category) => ({
          category: category.category,
          amount: category.totalExpense,
          color: getCategoryColor(category.category),
        }));

      // Calculate total income to add to the available balance
      const totalIncome = categoryTotals.reduce((sum, category) =>
        sum + category.totalIncome, 0);

      // Add income to totalBalance to correctly reflect available funds
      const adjustedTotalBalance = totalBalance + totalIncome;

      return (
        <Animated.View
          style={[styles.monthlyStatsContainer, { opacity: fadeAnim }]}
        >
          <LinearGradient
            colors={["rgba(61, 46, 156, 0.2)", "rgba(40, 40, 40, 0.1)"]}
            style={[
              styles.balanceContainer,
              {
                borderColor: "rgba(61, 46, 156, 0.2)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                marginTop: -10, // Move up a bit
              },
            ]}
          >
            <View>
              <Text style={[styles.balanceLabel, { color: "#a8a8a8" }]}>
                Monthly Budget
              </Text>
              <Text
                style={[
                  styles.balanceAmount,
                  { color: "#22c55e", fontWeight: "700" },
                ]}
              >
                {formatCurrency(totalBalance)} VNĐ
              </Text>
            </View>
            {totalIncome > 0 && (
              <View>
                <Text style={[styles.balanceLabel, { color: "#a8a8a8", textAlign: 'right' }]}>
                  Income This Month
                </Text>
                <Text
                  style={[
                    styles.balanceAmount,
                    { color: "#22c55e", fontWeight: "700", textAlign: 'right' },
                  ]}
                >
                  +{formatCurrency(totalIncome)} VNĐ
                </Text>
              </View>
            )}
          </LinearGradient>

          <PieChart data={spendingData} totalBalance={adjustedTotalBalance} />
        </Animated.View>
      );
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView style={styles.container}>
        {/* Header with gradient */}
        <LinearGradient
          colors={["#150f3c", "#09090b"]}
          style={styles.headerWrapper}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.userInfo}>
                {userData?.avatarUrl ? (
                  <Image
                    source={{ uri: userData.avatarUrl }}
                    style={[
                      styles.avatar,
                      { borderColor: "rgba(61, 46, 156, 0.6)" },
                    ]}
                  />
                ) : (
                  <View
                  style={[
                    styles.avatarPlaceholder,
                    { borderColor: "rgba(61, 46, 156, 0.6)" },
                  ]}
                >
                  <Text style={styles.avatarInitial}>
                    {userData?.name?.charAt(0) || "U"}
                  </Text>
                </View>
              )}
              <Text style={[styles.welcomeText, { fontWeight: "500" }]}>
                {userData.name
                  ? `Hi, ${userData.name.split(" ")[0]}`
                  : "Hi there"}
              </Text>
            </View>

            <Text
              style={[
                styles.headerTitleInline,
                { fontWeight: "700", color: "#f5f5f5" },
              ]}
            >
              Expenses
            </Text>

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

        {/* Tab Bar */}
        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: "rgba(28,28,30,0.5)",
              borderWidth: 1,
              borderColor: "rgba(61, 46, 156, 0.3)",
            },
          ]}
        >
          {/* Sliding indicator */}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, width / 2 - 25], // Adjust to match the width of one tab
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Tab buttons */}
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "daily" && styles.activeTabNoBackground,
            ]}
            onPress={() => handleTabChange("daily")}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={activeTab === "daily" ? "#fff" : "#8a8a8a"}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "daily" && styles.activeTabText,
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "monthly" && styles.activeTabNoBackground,
            ]}
            onPress={() => handleTabChange("monthly")}
          >
            <Ionicons
              name="bar-chart-outline"
              size={18}
              color={activeTab === "monthly" ? "#fff" : "#8a8a8a"}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "monthly" && styles.activeTabText,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Days chỉ hiển thị trong header */}
        {activeTab === "daily" && (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.calendarScroll}
            contentContainerStyle={styles.calendarScrollContent}
            onContentSizeChange={scrollToSelectedDay}
          >
            {/* Calendar days content */}
            {weekDays.map((item) => {
              const isSelected =
                selectedDate.getDate() === item.fullDate.getDate() &&
                selectedDate.getMonth() === item.fullDate.getMonth() &&
                selectedDate.getFullYear() === item.fullDate.getFullYear();

              const isToday =
                new Date().getDate() === item.fullDate.getDate() &&
                new Date().getMonth() === item.fullDate.getMonth() &&
                new Date().getFullYear() === item.fullDate.getFullYear();

              return (
                <TouchableOpacity
                  key={`${item.fullDate.getTime()}`}
                  style={[
                    styles.dayItem,
                    isToday && [
                      styles.todayItem,
                      { backgroundColor: "rgba(61, 46, 156, 0.1)" },
                    ],
                    isSelected && [
                      styles.selectedDay,
                      {
                        shadowColor: "#3d2e9c",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                        elevation: 4,
                      },
                    ],
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
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.selectedDayText,
                      isToday && !isSelected && { color: "#a8a8a8" },
                    ]}
                  >
                    {item.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateText,
                      isSelected && styles.selectedDayText,
                    ]}
                  >
                    {item.date}
                  </Text>
                  {isToday && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </LinearGradient>

      {/* Content section moved outside the gradient */}
      <View style={styles.contentSection}>
        {renderContent()}
      </View>

      {/* Modals stay at the same place */}
      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: "#1c1c1e",
                borderWidth: 1,
                borderColor: "rgba(61, 46, 156, 0.3)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: "#f5f5f5" }]}>
              Filter by Category
            </Text>

            {getAvailableCategories(transactions).map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalItem,
                  selectedCategory === category && [
                    styles.selectedModalItem,
                    { backgroundColor: "rgba(61, 46, 156, 0.15)" },
                  ],
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategoryModal(false);
                }}
              >
                <View style={styles.modalItemContent}>
                  <Ionicons
                    name={getCategoryIcon(category)}
                    size={22}
                    color={
                      selectedCategory === category ? "#3d2e9c" : "#9ca3af"
                    }
                    style={styles.modalItemIcon}
                  />
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          selectedCategory === category
                            ? "#3d2e9c"
                            : "#f5f5f5",
                      },
                      selectedCategory === category && { fontWeight: "600" },
                    ]}
                  >
                    {category}
                  </Text>
                </View>

                {selectedCategory === category && (
                  <Ionicons name="checkmark" size={22} color="#3d2e9c" />
                )}
              </TouchableOpacity>
            ))}

            <LinearGradient
              colors={["#3d2e9c", "#5643cc"]}
              style={[styles.closeModalButton, { borderRadius: 12 }]}
            >
              <TouchableOpacity
                style={{ width: "100%", alignItems: "center", padding: 14 }}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text
                  style={[styles.closeModalButtonText, { fontWeight: "600" }]}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showFullCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullCalendar(false)}
      >
        <TouchableOpacity
          style={styles.calendarModalOverlay}
          activeOpacity={1}
          onPress={() => setShowFullCalendar(false)}
        >
          <View
            style={[
              styles.calendarModalContent,
              {
                backgroundColor: "#1c1c1e",
                borderWidth: 1,
                borderColor: "rgba(61, 46, 156, 0.3)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear(selectedYear - 1);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>

              <Text
                style={[
                  styles.yearMonthText,
                  { color: "#f5f5f5", fontWeight: "600" },
                ]}
              >
                {MONTHS[selectedMonth]} {selectedYear}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear(selectedYear + 1);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                }}
              >
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {renderCalendarDays()}

            <LinearGradient
              colors={["#3d2e9c", "#5643cc"]}
              style={[styles.closeButton, { borderRadius: 12 }]}
            >
              <TouchableOpacity
                style={{ width: "100%", alignItems: "center", padding: 14 }}
                onPress={() => setShowFullCalendar(false)}
              >
                <Text style={[styles.closeButtonText, { fontWeight: "600" }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  </>
);
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: "#09090b",
},
headerWrapper: {
  position: "relative",
  width: "100%",
  paddingBottom: 20,
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
  overflow: "hidden",
},
header: {
  paddingHorizontal: 20,
  paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 60,
},
headerTop: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},
userInfo: {
  flexDirection: "row",
  alignItems: "center",
},
welcomeText: {
  color: "#e5e7eb",
  fontSize: 16,
  marginLeft: 10,
},
headerTitleInline: {
  fontSize: 22,
  fontWeight: "700",
  color: "#fff",
  paddingTop: 2,
  marginLeft: -45, // Dịch sang trái cho căn giữa
},
avatar: {
  width: 42,
  height: 42,
  borderRadius: 21,
  borderWidth: 2,
  borderColor: "rgba(255,255,255,0.3)",
},
avatarPlaceholder: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "#3d2e9c",
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 2,
  borderColor: "rgba(255,255,255,0.3)",
},
avatarInitial: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "bold",
},
monthSelector: {
  flexDirection: "row",
  alignItems: "center",
  padding: 8,
  borderRadius: 12,
  backgroundColor: "rgba(0,0,0,0.3)",
},
monthTitle: {
  fontSize: 16,
  fontWeight: "600",
  color: "#fff",
  marginRight: 8,
},
notificationButton: {
  padding: 8,
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.1)",
},
tabContainer: {
  flexDirection: "row",
  justifyContent: "space-around",
  backgroundColor: "rgba(28,28,30,0.8)",
  marginHorizontal: 20,
  borderRadius: 16,
  padding: 4,
  marginTop: 20,
  position: "relative", // Add this for the absolute positioning of the indicator
},
tabIndicator: {
  position: "absolute",
  width: "50%", // Slightly smaller than half for better proportion
  height: "100%",
  backgroundColor: "#3d2e9c",
  borderRadius: 12,
  top: "10%", // Center vertically
  left: "1.2%", // Small offset from the edge
  shadowColor: "#3d2e9c",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.5,
  shadowRadius: 4,
  elevation: 4,
  zIndex: 0, // Put it behind the text and icons
},
tabButton: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 12,
  borderRadius: 12,
  zIndex: 1, // Ensure the button is above the indicator
},
activeTabNoBackground: {
  // This style doesn't include background color since we're using the sliding indicator
},
tabText: {
  fontSize: 15,
  color: "#8a8a8a",
  fontWeight: "500",
  zIndex: 1,
},
activeTabText: {
  color: "#fff",
  fontWeight: "600",
  zIndex: 1,
},
tabIcon: {
  marginRight: 6,
  zIndex: 1,
},
calendarScroll: {
  marginTop: 20,
},
calendarScrollContent: {
  paddingHorizontal: 20,
  paddingBottom: 10,
},
dayItem: {
  alignItems: "center",
  justifyContent: "center",
  padding: 12,
  borderRadius: 16,
  marginRight: 10,
  backgroundColor: "rgba(40, 40, 40, 0.4)",
  width: 64,
  height: 74,
  borderWidth: 1,
  borderColor: "rgba(61, 46, 156, 0.2)",
},
todayItem: {
  borderColor: "rgba(61, 46, 156, 0.8)",
  borderWidth: 1,
},
selectedDay: {
  backgroundColor: "#3d2e9c",
},
dayText: {
  fontSize: 14,
  color: "#999",
  marginBottom: 6,
},
dateText: {
  fontSize: 20,
  fontWeight: "600",
  color: "#fff",
},
selectedDayText: {
  color: "#fff",
},
todayDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: "#fff",
  marginTop: 4,
},
transactionsSection: {
  paddingHorizontal: 20,
  paddingBottom: 10,
},
transactionsHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
},
sectionTitle: {
  fontSize: 20,
  fontWeight: "600",
  color: "#fff",
},
transactionCard: {
  flexDirection: "row",
  backgroundColor: "rgba(40, 40, 40, 0.4)",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
},
categoryIcon: {
  width: 50,
  height: 50,
  borderRadius: 25,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 16,
},
transactionDetails: {
  flex: 1,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},
transactionTitle: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "500",
  marginBottom: 4,
},
transactionTime: {
  color: "#9ca3af",
  fontSize: 12,
},
amountContainer: {
  alignItems: "flex-end",
  justifyContent: "center",
},
transactionAmount: {
  fontSize: 16,
  fontWeight: "600",
},
accountInfo: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 6,
},
accountName: {
  color: "#9ca3af",
  fontSize: 12,
  marginRight: 6,
},
typeIndicator: {
  width: 16,
  height: 16,
  borderRadius: 8,
  justifyContent: "center",
  alignItems: "center",
},
transactionsList: {
  flex: 1,
},
emptyState: {
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 60,
  backgroundColor: "rgba(40, 40, 40, 0.2)",
  borderRadius: 16,
  marginTop: 10,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.05)",
  padding: 30,
},
emptyStateText: {
  color: "#d1d5db",
  fontSize: 18,
  fontWeight: "600",
  marginTop: 16,
},
emptyStateSubtext: {
  color: "#9ca3af",
  fontSize: 14,
  marginTop: 8,
  textAlign: "center",
},
monthlyStatsContainer: {
  padding: 20,
  paddingTop: 0, // Reduced top padding to move everything up
},
chartContainer: {
  alignItems: "center",
  marginVertical: 16,
  marginTop: 10, // Reduced top margin
},
chartTitleContainer: {
  alignItems: "center",
  marginBottom: 16,
},
chartTitle: {
  fontSize: 20,
  fontWeight: "600",
  color: "#fff",
},
chartSubtitle: {
  fontSize: 14,
  color: "#9ca3af",
  marginTop: 4,
},
legendContainer: {
  marginTop: 24,
  width: "100%",
},
legendItem: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 14,
  paddingHorizontal: 8,
},
legendColor: {
  width: 20,
  height: 20,
  borderRadius: 10,
  marginRight: 12,
  overflow: 'hidden',
},
legendTextContainer: {
  flex: 1,
},
legendCategoryText: {
  color: "#fff",
  fontSize: 15,
  fontWeight: "500",
},
legendPercentText: {
  color: "#9ca3af",
  fontSize: 13,
  marginTop: 2,
},
balanceContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 16,
  backgroundColor: "rgba(40, 40, 40, 0.4)",
  borderRadius: 16,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.05)",
},
balanceLabel: {
  fontSize: 14,
  color: "#a8a8a8",
  marginBottom: 4,
},
balanceAmount: {
  fontSize: 20,
  fontWeight: "700",
  color: "#22c55e",
},
budgetIconContainer: {
  borderRadius: 12,
  overflow: 'hidden',
},
budgetIcon: {
  width: 48,
  height: 48,
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
},
balanceText: {
  fontSize: 16,
  color: "#fff",
  fontWeight: "500",
},
modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  justifyContent: "center",
  alignItems: "center",
},
modalContent: {
  backgroundColor: "#1c1c1e",
  borderRadius: 16,
  padding: 16,
  width: "85%",
  maxHeight: "70%",
},
modalTitle: {
  fontSize: 18,
  fontWeight: "600",
  color: "#fff",
  marginBottom: 16,
  textAlign: "center",
},
modalItem: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 14,
  borderRadius: 10,
  marginBottom: 4,
},
modalItemContent: {
  flexDirection: "row",
  alignItems: "center",
},
modalItemIcon: {
  marginRight: 12,
},
selectedModalItem: {
  backgroundColor: "rgba(61, 46, 156, 0.15)",
},
modalItemText: {
  fontSize: 16,
  color: "#fff",
},
selectedModalItemText: {
  color: "#3d2e9c",
  fontWeight: "600",
},
closeModalButton: {
  backgroundColor: "#3d2e9c",
  padding: 1,
  borderRadius: 12,
  marginTop: 16,
  alignItems: "center",
},
closeModalButtonText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "600",
},
calendarModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  justifyContent: "center",
  alignItems: "center",
},
calendarModalContent: {
  width: width * 0.9,
  backgroundColor: "#1c1c1e",
  borderRadius: 20,
  padding: 20,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.1)",
},
calendarHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
},
yearMonthText: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "600",
},
calendarDaysContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: 16,
},
weekdayText: {
  color: "#9ca3af",
  fontSize: 12,
  width: (width * 0.9 - 40) / 7 - 2,
  textAlign: "center",
  marginBottom: 8,
  fontWeight: "500",
},
calendarDay: {
  width: (width * 0.9 - 40) / 7 - 2,
  height: (width * 0.9 - 40) / 7 - 2,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 5,
  borderRadius: ((width * 0.9 - 40) / 7 - 2) / 2,
},
emptyDay: {
  width: (width * 0.9 - 40) / 7 - 2,
  height: (width * 0.9 - 40) / 7 - 2,
},
calendarDayText: {
  color: "#fff",
  fontSize: 16,
},
todayCalendarDay: {
  borderWidth: 1,
  borderColor: "#3d2e9c",
  backgroundColor: "rgba(61, 46, 156, 0.1)",
},
selectedCalendarDay: {
  backgroundColor: "#3d2e9c",
  shadowColor: "#3d2e9c",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.5,
  shadowRadius: 4,
  elevation: 4,
},
selectedCalendarDayText: {
  color: "#fff",
  fontWeight: "600",
},
closeButton: {
  backgroundColor: "#3d2e9c",
  padding: 14,
  borderRadius: 12,
  marginTop: 10,
  alignItems: "center",
},
closeButtonText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "600",
},
filterButton: {
  padding: 8,
  backgroundColor: "rgba(61, 46, 156, 0.3)",
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "rgba(61, 46, 156, 0.5)",
},
contentSection: {
  flex: 1,
  backgroundColor: "#09090b",
  paddingTop: 20,
},
});

export default DashboardBills;
