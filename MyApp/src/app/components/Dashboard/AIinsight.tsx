import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Groq } from 'groq-sdk';
import { getAllExpenses } from '../../../services/firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Kích hoạt LayoutAnimation cho Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AIinsightProps {
  userData: {
    uid: string;
  };
}

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true
});

const AIinsight: React.FC<AIinsightProps> = ({ userData }) => {
  const [insight, setInsight] = useState<string>('Loading AI insights...');
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation values
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const shouldGenerateNewInsight = async () => {
    try {
      const lastInsightDate = await AsyncStorage.getItem(`lastInsightDate_${userData.uid}`);
      const lastInsight = await AsyncStorage.getItem(`lastInsight_${userData.uid}`);

      if (!lastInsightDate || !lastInsight) return true;

      const lastDate = new Date(lastInsightDate);
      const today = new Date();

      return lastDate.getDate() !== today.getDate() ||
             lastDate.getMonth() !== today.getMonth() ||
             lastDate.getFullYear() !== today.getFullYear();
    } catch (error) {
      console.error('Error checking insight date:', error);
      return true;
    }
  };

  const saveInsight = async (newInsight: string) => {
    try {
      await AsyncStorage.setItem(`lastInsightDate_${userData.uid}`, new Date().toISOString());
      await AsyncStorage.setItem(`lastInsight_${userData.uid}`, newInsight);
    } catch (error) {
      console.error('Error saving insight:', error);
    }
  };

  const loadCachedInsight = async () => {
    try {
      const cachedInsight = await AsyncStorage.getItem(`lastInsight_${userData.uid}`);
      if (cachedInsight) {
        setInsight(cachedInsight);
        setIsLoading(false);

        // Hiệu ứng fade in khi load xong
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error loading cached insight:', error);
    }
  };

  const generateInsight = async (expenses: any[]) => {
    try {
      const expensesData = expenses
        .filter(exp => exp.type === 'expense')
        .map(expense =>
          `Chi tiêu: Date: ${new Date(expense.timestamp).toLocaleDateString()}, Category: ${expense.category}, Amount: ${expense.amount} VND, Title: ${expense.title}`
        ).join('\n');

      const incomeData = expenses
        .filter(exp => exp.type === 'income')
        .map(income =>
          `Thu nhập: Date: ${new Date(income.timestamp).toLocaleDateString()}, Category: ${income.category}, Amount: ${income.amount} VND, Title: ${income.title}`
        ).join('\n');

      const prompt = `Dựa trên dữ liệu thu chi sau, vui lòng phân tích xu hướng và cung cấp lời khuyên tài chính ngắn gọn bằng tiếng Việt:

      THU NHẬP:
      ${incomeData}

      CHI TIÊU:
      ${expensesData}

      Hãy phân tích:
      1. So sánh tổng thu nhập và chi tiêu
      2. Các danh mục chi tiêu cao nhất
      3. Chi tiêu không cần thiết có thể cắt giảm
      4. Xu hướng thu chi
      5. Đề xuất cách quản lý tài chính hiệu quả hơn`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 6000,
      });

      return completion.choices[0]?.message?.content || "Không thể tạo phân tích lúc này.";
    } catch (error) {
      console.error('Error generating insight:', error);
      return "Đã xảy ra lỗi khi phân tích chi tiêu.";
    }
  };

  useEffect(() => {
    const fetchDataAndGenerateInsight = async () => {
      try {
        // First try to load cached insight
        await loadCachedInsight();

        // Check if we need to generate new insight
        const needsNewInsight = await shouldGenerateNewInsight();

        if (needsNewInsight) {
          setIsLoading(true);
          const expenses = await getAllExpenses(userData.uid);
          const generatedInsight = await generateInsight(expenses);
          setInsight(generatedInsight);
          await saveInsight(generatedInsight);

          // Hiệu ứng fade in khi hoàn tất
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setInsight('Không thể tải phân tích chi tiêu lúc này.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndGenerateInsight();
  }, [userData.uid]);

  // Effect để xử lý animation khi state isExpanded thay đổi
  useEffect(() => {
    // Cấu hình animation
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity
      },
      update: { type: LayoutAnimation.Types.easeInEaseOut }
    });

    // Animation xoay icon
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

  }, [isExpanded]);

  // Function to get a shortened version of the insight
  const getShortInsight = () => {
    if (insight.length <= 150) return insight;
    return insight.substring(0, 150) + '...';
  };

  // Rotate interpolation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(37, 27, 95, 0.8)', 'rgba(37, 27, 95, 0.4)']}
        style={styles.insightCard}
      >
        <View style={styles.insightHeader}>
          <View style={styles.titleRow}>
            <Ionicons name="bulb" size={20} color="#fff" />
            <Text style={styles.insightTitle}>AI Insights</Text>
          </View>

          {!isLoading && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={toggleExpand}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Ionicons name="chevron-down" size={20} color="#fff" />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.separator} />

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingText}>Analyzing your finances...</Text>
          </View>
        ) : (
          <Animated.View
            style={{
              opacity: opacityAnim,
            }}
          >
            <Text style={styles.insightText}>
              {isExpanded ? insight : getShortInsight()}
            </Text>

            {!isExpanded && insight.length > 150 && (
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={toggleExpand}
                activeOpacity={0.6}
              >
                <Text style={styles.readMoreText}>Xem thêm</Text>
                <Ionicons name="chevron-down" size={16} color="#8b5cf6" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            {isExpanded && (
              <TouchableOpacity
                style={styles.readLessButton}
                onPress={toggleExpand}
                activeOpacity={0.6}
              >
                <Text style={styles.readMoreText}>Thu gọn</Text>
                <Ionicons name="chevron-up" size={16} color="#8b5cf6" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  insightCard: {
    borderRadius: 16,
    padding: 16,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  insightText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    flexWrap: 'wrap',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#d1d5db',
    fontSize: 14,
    marginTop: 10,
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readMoreButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  readLessButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 14,
  }
});

export default AIinsight;
