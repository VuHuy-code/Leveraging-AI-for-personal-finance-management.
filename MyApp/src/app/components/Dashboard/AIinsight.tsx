import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Groq } from 'groq-sdk';
import { getAllExpenses } from '../../../services/firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      }
    } catch (error) {
      console.error('Error loading cached insight:', error);
    }
  };

  const generateInsight = async (expenses: any[]) => {
    try {
      const expensesData = expenses.map(expense => 
        `Date: ${new Date(expense.timestamp).toLocaleDateString()}, Category: ${expense.category}, Amount: ${expense.amount} VND, Title: ${expense.title}`
      ).join('\n');

      const prompt = `Dựa trên dữ liệu chi tiêu sau, vui lòng phân tích xu hướng chi tiêu và cung cấp lời khuyên tài chính ngắn gọn bằng tiếng Việt:

      ${expensesData}

      Please consider:
        1. Categories with highest spending
        2. Unnecessary expenses
        3. Spending patterns
        4. Suggestions for saving money
      `;

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

  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <Ionicons name="bulb" size={16} color="#d1d5db" />
        <Text style={styles.insightTitle}>AI Insight</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="small" color="#4f46e5" />
      ) : (
        <Text style={styles.insightText}>{insight}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  insightCard: {
    backgroundColor: 'rgba(23, 23, 23, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
    minHeight: 100,
    flexGrow: 0, // Allows the card to grow based on content
    flexShrink: 0, // Prevents the card from shrinking
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
    flexWrap: 'wrap',
  },
  loader: {
    marginTop: 10,
  }
});

export default AIinsight;