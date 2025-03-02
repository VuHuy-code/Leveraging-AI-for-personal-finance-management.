import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Groq } from 'groq-sdk';
import { getAllExpenses, getSavingGoals } from '../../../services/firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { LinearGradient } from 'expo-linear-gradient';

// Kích hoạt LayoutAnimation cho Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SavingsinsightProps {
  userData: {
    uid: string;
  };
}

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true
});

const BACKGROUND_SAVINGS_UPDATE = 'background-savings-update';

const generateSavingsInsight = async (expenses: any[], savingGoals: any[]) => {
  try {
    const expensesData = expenses
      .filter(exp => exp.type === 'expense')
      .map(expense =>
        `Date: ${new Date(expense.timestamp).toLocaleDateString()}, Category: ${expense.category}, Amount: ${expense.amount} VND, Title: ${expense.title}`
      ).join('\n');

    const incomeData = expenses
      .filter(exp => exp.type === 'income')
      .map(income =>
        `Date: ${new Date(income.timestamp).toLocaleDateString()}, Category: ${income.category}, Amount: ${income.amount} VND, Title: ${income.title}`
      ).join('\n');

    const goalsData = savingGoals.map(goal =>
      `Goal: ${goal.name}, Target: ${goal.goal} VND, Current: ${goal.current} VND, Target Date: ${goal.targetDate}`
    ).join('\n');

    const prompt = `Dựa trên dữ liệu thu chi và mục tiêu tiết kiệm sau, hãy phân tích và đưa ra lời khuyên về cách tiết kiệm hiệu quả:

    THU NHẬP:
    ${incomeData}

    CHI TIÊU:
    ${expensesData}

    MỤC TIÊU TIẾT KIỆM:
    ${goalsData}

    Hãy phân tích:
    1. So sánh thu nhập và chi tiêu
    2. Khả năng đạt được mục tiêu tiết kiệm với thu nhập hiện tại
    3. Các khoản chi tiêu có thể cắt giảm
    4. Đề xuất phương pháp tiết kiệm cụ thể dựa trên thu nhập
    5. Thời gian dự kiến đạt mục tiêu với tốc độ hiện tại`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 6000,
    });

    return completion.choices[0]?.message?.content || "Không thể tạo phân tích lúc này.";
  } catch (error) {
    console.error('Error generating insight:', error);
    return "Đã xảy ra lỗi khi phân tích tiết kiệm.";
  }
};

TaskManager.defineTask(BACKGROUND_SAVINGS_UPDATE, async () => {
  try {
    const lastUpdate = await AsyncStorage.getItem('lastSavingsUpdate');
    const today = new Date().toDateString();

    if (lastUpdate === today) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const activeUsers = await AsyncStorage.getItem('activeUsers');
    if (!activeUsers) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const userIds = JSON.parse(activeUsers);

    for (const uid of userIds) {
      const expenses = await getAllExpenses(uid);
      const savingGoals = await getSavingGoals(uid);

      const insight = await generateSavingsInsight(expenses, savingGoals);
      await AsyncStorage.setItem(`insight_${uid}`, insight);
    }

    await AsyncStorage.setItem('lastSavingsUpdate', today);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const Savingsinsight: React.FC<SavingsinsightProps> = ({ userData }) => {
  const [insight, setInsight] = useState<string>('Loading savings insights...');
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Function to fade in content when loaded
  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  };

  // Function to get a shortened version of the insight
  const getShortInsight = () => {
    if (insight.length <= 150) return insight;
    return insight.substring(0, 150) + '...';
  };

  // Rotate interpolation for the chevron icon
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const toggleExpand = () => {
    // Cấu hình animation
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity
      },
      update: { type: LayoutAnimation.Types.easeInEaseOut }
    });

    // Toggle expanded state
    setIsExpanded(!isExpanded);

    // Animate rotation
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const loadStoredInsight = async () => {
      try {
        const storedInsight = await AsyncStorage.getItem(`insight_${userData.uid}`);
        if (storedInsight) {
          setInsight(storedInsight);
          setIsLoading(false);
          fadeIn();
        } else {
          const expenses = await getAllExpenses(userData.uid);
          const savingGoals = await getSavingGoals(userData.uid);
          const newInsight = await generateSavingsInsight(expenses, savingGoals);
          setInsight(newInsight);
          await AsyncStorage.setItem(`insight_${userData.uid}`, newInsight);
          setIsLoading(false);
          fadeIn();
        }
      } catch (error) {
        console.error('Error loading insight:', error);
        setInsight('Không thể tải phân tích tiết kiệm lúc này.');
        setIsLoading(false);
        fadeIn();
      }
    };

    loadStoredInsight();
  }, [userData.uid]);

  useEffect(() => {
    const registerBackgroundTask = async () => {
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SAVINGS_UPDATE, {
          minimumInterval: 60 * 60 * 24,
          stopOnTerminate: false,
          startOnBoot: true,
        });

        const activeUsers = await AsyncStorage.getItem('activeUsers') || '[]';
        const userIds = new Set(JSON.parse(activeUsers));
        userIds.add(userData.uid);
        await AsyncStorage.setItem('activeUsers', JSON.stringify([...userIds]));
      } catch (error) {
        console.error('Failed to register background task:', error);
      }
    };

    registerBackgroundTask();

    return () => {
      const cleanupTask = async () => {
        const activeUsers = await AsyncStorage.getItem('activeUsers') || '[]';
        const userIds = new Set(JSON.parse(activeUsers));
        userIds.delete(userData.uid);
        await AsyncStorage.setItem('activeUsers', JSON.stringify([...userIds]));
      };
      cleanupTask();
    };
  }, [userData.uid]);

  useEffect(() => {
    const checkAndUpdate = async () => {
      const lastCheck = await AsyncStorage.getItem('lastSavingsCheck');
      const currentTime = Date.now();

      if (!lastCheck || currentTime - parseInt(lastCheck) > 60000) {
        const expenses = await getAllExpenses(userData.uid);
        const savingGoals = await getSavingGoals(userData.uid);
        const newInsight = await generateSavingsInsight(expenses, savingGoals);
        setInsight(newInsight);
        await AsyncStorage.setItem('lastSavingsCheck', currentTime.toString());
      }
    };

    checkAndUpdate();
  }, [userData.uid]);

  return (
    <LinearGradient
      colors={['rgba(37, 27, 95, 0.8)', 'rgba(37, 27, 95, 0.4)']}
      style={styles.insightCard}
    >
      <View style={styles.insightHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={16} color="#d1d5db" />
          <Text style={styles.insightTitle}>Savings Insight</Text>
        </View>

        {!isLoading && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpand}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="chevron-down" size={16} color="#d1d5db" />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.separator} />

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text style={styles.loadingText}>Analyzing savings...</Text>
        </View>
      ) : (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.insightText}>
            {isExpanded ? insight : getShortInsight()}
          </Text>

          {!isExpanded && insight.length > 150 && (
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={toggleExpand}
              activeOpacity={0.6}
            >
              <View style={styles.readMoreButtonContent}>
                <Text style={styles.readMoreText}>Xem thêm</Text>
                <Ionicons name="chevron-down" size={14} color="#8b5cf6" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          )}

          {isExpanded && (
            <TouchableOpacity
              style={styles.readLessButton}
              onPress={toggleExpand}
              activeOpacity={0.6}
            >
              <View style={styles.readMoreButtonContent}>
                <Text style={styles.readMoreText}>Thu gọn</Text>
                <Ionicons name="chevron-up" size={14} color="#8b5cf6" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  insightCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightTitle: {
    color: '#d1d5db',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  insightText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    color: '#d1d5db',
    fontSize: 14,
    marginTop: 8,
  },
  expandButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readMoreButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  readLessButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  readMoreButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    color: '#8b5cf6',
    fontWeight: '500',
    fontSize: 14,
  }
});

export default Savingsinsight;
