import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Animated,
  Modal,
  Image,
  TextInput,
  ScrollView,
  Easing,
} from "react-native";
import {
  Ionicons,
  EvilIcons,
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome,
  AntDesign,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import Groq from "groq-sdk";
import { useAuth } from "../../hooks/useAuth";
import { useTransactionContext } from "../../contexts/TransactionContext";
import {
  initializeChatHistory,
  getChatHistory,
  updateChatHistory,
  saveExpenseToCSV,
  getExpensesFromCSV,
  analyzeTimeRange,
  getDailyExpenses,
  getMonthlyExpenses,
  getQuarterlyExpenses,
  getYearlyExpenses,
  getRecentMessages,
  getSavingGoals,
  saveSavingGoals,
  SavingGoal,
  updateExpenseInCSV,
} from "../../../services/firebase/storage";

interface Expense {
  timestamp: string;
  type: string;
  category: string;
  amount: string;
  title: string;
}

// Add these missing helper functions to filter expenses by date/month:
async function getExpensesForDate(
  userId: string,
  date: Date
): Promise<Expense[]> {
  const allExpenses = await getExpensesFromCSV(userId);
  return allExpenses.filter((exp) => {
    const expDate = new Date(exp.timestamp);
    return expDate.toDateString() === date.toDateString();
  });
}

async function getExpensesForMonth(
  userId: string,
  year: number,
  month: number
): Promise<Expense[]> {
  const allExpenses = await getExpensesFromCSV(userId);
  return allExpenses.filter((exp) => {
    const expDate = new Date(exp.timestamp);
    return expDate.getFullYear() === year && expDate.getMonth() + 1 === month;
  });
}

const SAVING_KEYWORDS = [
  "tiết kiệm",
  "để dành",
  "mục tiêu",
  "target",
  "saving",
  "quỹ",
  "fund",
];

const isSavingRequest = (text: string): boolean => {
  const normalizedText = text.toLowerCase();
  return SAVING_KEYWORDS.some((keyword) => normalizedText.includes(keyword));
};

const extractSavingGoalInfo = (text: string) => {
  // Mẫu regex để tìm số tiền
  const amountPattern = /(\d+([.,]\d+)?)\s*(tr|triệu|m|k|nghìn|đồng|vnd)/i;
  const amount = text.match(amountPattern);

  // Chuyển đổi số tiền về dạng số
  const convertAmount = (value: string, unit: string): number => {
    const baseValue = parseFloat(value.replace(",", "."));
    switch (unit.toLowerCase()) {
      case "tr":
      case "triệu":
      case "m":
        return baseValue * 1000000;
      case "k":
      case "nghìn":
        return baseValue * 1000;
      default:
        return baseValue;
    }
  };

  let goalAmount = 0;
  if (amount) {
    goalAmount = convertAmount(amount[1], amount[3]);
  }

  // Tìm tên mục tiêu tiết kiệm
  const commonGoals = [
    { name: "Thiết bị công nghệ", keywords: ["laptop", "máy tính"] },
    {
      name: "Du lịch",
      keywords: ["du lịch", "nghỉ dưỡng", "holiday", "travel"],
    },
    { name: "Phương tiện", keywords: ["xe", "ô tô", "car"] },
    { name: "Nhà", keywords: ["nhà", "house", "căn hộ"] },
    { name: "Y tế", keywords: ["khẩn cấp", "emergency", "dự phòng"] },
    { name: "Giáo dục", keywords: ["học", "education", "trường"] },
  ];

  const text_lower = text.toLowerCase();
  const matchedGoal = commonGoals.find((goal) =>
    goal.keywords.some((keyword) => text_lower.includes(keyword))
  );

  return {
    name: matchedGoal?.name || "General Savings",
    goal: goalAmount,
    current: 0,
    targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 tháng từ hiện tại
  };
};

// Khởi tạo Groq
const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
});

const baseSystemPrompt = `Bạn là trợ lý tài chính thông minh, nhiệm vụ chính là giúp người dùng theo dõi thu chi. Hãy phân tích và phản hồi ngắn gọn, súc tích.
PHÂN LOẠI:
THU NHẬP:
- Lương tháng: lương, thưởng công việc
- Tiết kiệm: lãi suất, đầu tư
- Khác: quà, tiền mừng, thưởng
CHI TIÊU:
- Ăn uống:
- Y tế: thuốc
- Mua sắm:sàn thương mại điện tử, có từ mua, những gì liên quan đến mua sắm.
- Di chuyển: xăng,du lịch,...
- Giải trí: phim, game,...
- Giáo dục: học phí, sách vở
- Khác: chi phí phát sinh có liên quan đến những vấn đè chi tiêu chứ không phải thu nhập, bạn sẽ tự phân tích xem đây là chi tiêu hay là thu nhập nhé.
Output format:
**Phân loại: [category], Tiền: [amount] VNĐ, Tiêu đề: [short_title]** sau phần này là thêm lời văn của bạn cho người dùng nếu thấy khoảng chi hợp lí thì sao đó tùy bạn còn nếu thấy không hợp lý thì chửi người dùng cho tôi.
Với câu hỏi không liên quan tài chính: Trả lời ngắn gọn, thân thiện.`;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface TranscriptionResponse {
  text: string;
  x_groq: {
    id: string;
  };
}

// Add proper type annotations to the FormattedMessage component
interface FormattedMessageProps {
  text: string;
  isUserMessage: boolean;
  onEditTransaction?: (data: {
    category: string;
    amount: string;
    title: string;
  }) => void;
}

// Component to format message text properly
const FormattedMessage: React.FC<FormattedMessageProps> = ({
  text,
  isUserMessage,
  onEditTransaction,
}) => {
  // Function to process message text and format it properly
  const formatMessageText = (messageText: string) => {
    // Check if the message contains the transaction pattern
    const transactionPattern =
      /\*\*Phân loại:\s*(.*?),\s*Tiền:\s*([\d,.]+)\s*VNĐ,\s*Tiêu đề:\s*(.*?)\*\*/;
    const match = messageText.match(transactionPattern);

    if (match) {
      // Extract transaction details
      const [fullMatch, category, amount, title] = match;
      // Get the comment part (everything after the transaction details)
      const commentPart = messageText.replace(fullMatch, "").trim();

      // Return formatted transaction with proper styling and edit button
      return (
        <View>
          <View style={styles.transactionDetails}>
            <View style={styles.transactionHeader}>
              <Text
                style={[
                  styles.transactionText,
                  isUserMessage
                    ? styles.userMessageText
                    : styles.botMessageText,
                ]}
              >
                <Text style={styles.transactionLabel}>Phân loại:</Text>{" "}
                {category}
                {"\n"}
                <Text style={styles.transactionLabel}>Tiền:</Text>{" "}
                {amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} VNĐ{"\n"}
                <Text style={styles.transactionLabel}>Tiêu đề:</Text> {title}
              </Text>

              {!isUserMessage && onEditTransaction && (
                <TouchableOpacity
                  style={styles.transactionEditButton}
                  onPress={() => {
                    // Extract transaction data and open edit modal
                    const transactionData = {
                      category: category.trim(),
                      amount: amount.replace(/[,.]|VNĐ/g, "").trim(),
                      title: title.trim(),
                    };
                    onEditTransaction(transactionData);
                  }}
                >
                  <FontAwesome name="pencil" size={14} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {commentPart.length > 0 && (
            <Text
              style={[
                styles.messageText,
                isUserMessage ? styles.userMessageText : styles.botMessageText,
                styles.commentText,
              ]}
            >
              {commentPart}
            </Text>
          )}
        </View>
      );
    }

    // For messages without transaction pattern, just return the text
    return (
      <Text
        style={[
          styles.messageText,
          isUserMessage ? styles.userMessageText : styles.botMessageText,
        ]}
      >
        {messageText}
      </Text>
    );
  };

  return formatMessageText(text);
};

const Chatbot: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshTransactions } = useTransactionContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [awaitingPriceInput, setAwaitingPriceInput] = useState(false);
  const [tempProductInfo, setTempProductInfo] = useState<{
    type: string;
    category: string;
  } | null>(null);
  const [isInitializingRecording, setIsInitializingRecording] = useState(false);

  // State for the edit transaction modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [lastTransaction, setLastTransaction] = useState<Expense | null>(null);

  // State for the help modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [categories, setCategories] = useState([
    "Ăn uống",
    "Y tế",
    "Mua sắm",
    "Di chuyển",
    "Hóa đơn",
    "Giải trí",
    "Giáo dục",
    "Đầu tư",
    "Khác",
    "Lương tháng",
    "Tiết kiệm",
  ]);

  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const amplitudes = useRef(
    [...Array(15)].map(() => new Animated.Value(1))
  ).current;
  const [waveData, setWaveData] = useState<number[]>(Array(15).fill(1));
  const animationFrameId = useRef<number>();

  // Add this state near other state declarations
  const [isSaving, setIsSaving] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const startSpinAnimation = useCallback(() => {
    spinAnim.setValue(0);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  // Function to stop spin animation
  const stopSpinAnimation = useCallback(() => {
    spinAnim.stopAnimation();
  }, [spinAnim]);
  // Function to edit transaction from message
  const editTransactionFromMessage = async (transactionData: {
    category: string;
    amount: string;
    title: string;
  }) => {
    if (!user) return;

    // Set the edit form data
    setEditCategory(transactionData.category);
    setEditAmount(transactionData.amount);
    setEditTitle(transactionData.title);

    try {
      // Find the transaction in history to edit
      const expenses = await getExpensesFromCSV(user.uid);

      // Find a transaction with matching details
      // This is a simplified approach - in a real app you might need
      // a more sophisticated matching algorithm
      const matchingTransaction = expenses.find(
        (exp) =>
          exp.category === transactionData.category &&
          exp.amount === transactionData.amount &&
          exp.title === transactionData.title
      );

      if (matchingTransaction) {
        setLastTransaction(matchingTransaction);
        setShowEditModal(true);
      } else {
        Alert.alert("Thông báo", "Không tìm thấy giao dịch để chỉnh sửa.");
      }
    } catch (error) {
      console.error("Error finding transaction:", error);
      Alert.alert("Lỗi", "Không thể tìm thấy giao dịch. Vui lòng thử lại.");
    }
  };

  const updateWaveData = useCallback(() => {
    if (isRecording) {
      const newAmplitude = Math.random() * 0.5 + 0.75;
      setWaveData((prevData) => {
        const newData = [...prevData.slice(1), newAmplitude];
        return newData;
      });

      animationFrameId.current = requestAnimationFrame(updateWaveData);
    }
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      setWaveData(Array(15).fill(1));
      animationFrameId.current = requestAnimationFrame(updateWaveData);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      setWaveData(Array(15).fill(1));
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isRecording, updateWaveData]);

  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      durationTimer.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) return;

      setIsLoadingHistory(true);
      try {
        const welcomeMessage: Message = {
          id: "1",
          text: "Xin chào! Tôi có thể giúp gì cho bạn?",
          isUser: false,
          timestamp: new Date(),
        };

        await initializeChatHistory(user.uid, welcomeMessage);
        const history = await getChatHistory(user.uid);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        Alert.alert("Error", "Không thể tải lịch sử chat");
        setMessages([
          {
            id: "1",
            text: "Xin chào! Tôi có thể giúp gì cho bạn?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), 10000);
    });

    Promise.race([loadChatHistory(), timeoutPromise]).catch((error) => {
      if (error.message === "Timeout") {
        setIsLoadingHistory(false);
        setMessages([
          {
            id: "1",
            text: "Xin chào! Tôi có thể giúp gì cho bạn?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        Alert.alert(
          "Thông báo",
          "Tải lịch sử chat quá lâu, đã chuyển mode mới."
        );
      }
    });
  }, [user]);

  // Function to save the edited transaction
  const saveEditedTransaction = async () => {
    if (!user || !lastTransaction) return;

    try {
      // Start the loading animation
      setIsSaving(true);
      startSpinAnimation();

      // Get original amount before updating
      const originalAmount = lastTransaction.amount;
      const originalCategory = lastTransaction.category;

      // Format the amount with thousand separators for display
      const formattedAmount = parseInt(editAmount).toLocaleString("vi-VN");

      // Create the updated transaction
      const updatedTransaction: Expense = {
        ...lastTransaction,
        category: editCategory,
        amount: editAmount, // Raw amount for storage
        title: editTitle,
      };

      // Update the transaction in CSV
      await updateExpenseInCSV(
        user.uid,
        lastTransaction.timestamp,
        updatedTransaction
      );

      // Refresh transactions in the context to update the UI across the app
      refreshTransactions();

      // Add a confirmation message to the chat
      const confirmMessage: Message = {
        id: Date.now().toString(),
        text: `✅ Đã cập nhật giao dịch:

**Phân loại: ${editCategory}, Tiền: ${formattedAmount} VNĐ, Tiêu đề: ${editTitle}**

Thông tin giao dịch đã được cập nhật thành công.`,
        isUser: false,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, confirmMessage];
      setMessages(updatedMessages);
      await updateChatHistory(user.uid, updatedMessages);

      // Close the modal
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      Alert.alert("Lỗi", "Không thể cập nhật giao dịch. Vui lòng thử lại.");
    } finally {
      // Stop the loading animation
      setIsSaving(false);
      stopSpinAnimation();
    }
  };

  const getCSVString = async (userId: string): Promise<string> => {
    try {
      const expenses = await getExpensesFromCSV(userId);
      return JSON.stringify(expenses, null, 2);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu CSV:", error);
      return "Không thể đọc được nội dung chi_tieu.csv";
    }
  };

  const getDailyChatHistoryString = async (userId: string): Promise<string> => {
    try {
      const dailyMessages = await getChatHistory(userId);
      return JSON.stringify(dailyMessages, null, 2);
    } catch (error) {
      console.error("Lỗi lấy chat history ngày hôm nay:", error);
      return "Không thể đọc được lịch sử chat ngày hôm nay";
    }
  };

  const sendMessageByVoice = async (transcribedText: string) => {
    if (!transcribedText.trim() || isLoading || !user) return;

    if (isSavingRequest(transcribedText)) {
      const savingInfo = extractSavingGoalInfo(transcribedText);

      if (savingInfo.goal <= 0) {
        const askAmountMessage: Message = {
          id: Date.now().toString(),
          text: "Bạn muốn tiết kiệm bao nhiêu tiền cho mục tiêu này?",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([...messages, askAmountMessage]);
        return;
      }

      try {
        // Lấy danh sách mục tiêu hiện tại
        const currentGoals = await getSavingGoals(user.uid);

        // Tạo mục tiêu mới
        const newGoal: SavingGoal = {
          id: Date.now().toString(),
          name: savingInfo.name,
          goal: savingInfo.goal,
          current: savingInfo.current,
          createdAt: new Date().toISOString(),
          targetDate: savingInfo.targetDate,
        };

        // Thêm mục tiêu mới vào danh sách
        await saveSavingGoals(user.uid, [...currentGoals, newGoal]);

        // Phản hồi cho người dùng
        const confirmMessage: Message = {
          id: Date.now().toString(),
          text: `Đã tạo mục tiêu tiết kiệm mới:
  - Tên: ${savingInfo.name}
  - Mục tiêu: ${savingInfo.goal.toLocaleString("vi-VN")} VNĐ
  - Thời hạn: 6 tháng

  Chúc bạn sớm đạt được mục tiêu! 💪`,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages([...messages, confirmMessage]);
        return;
      } catch (error) {
        console.error("Error creating saving goal:", error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: "Có lỗi xảy ra khi tạo mục tiêu tiết kiệm. Vui lòng thử lại.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([...messages, errorMessage]);
        return;
      }
    }

    // Nếu đang chờ input giá tiền
    if (awaitingPriceInput && tempProductInfo) {
      // Xử lý text để lấy số tiền
      const amount = transcribedText.replace(/[^0-9]/g, "");

      if (amount) {
        try {
          await saveExpenseToCSV(user.uid, {
            category: tempProductInfo.category,
            amount: amount,
            title: tempProductInfo.type,
            type: "expense",
            timestamp: new Date().toISOString(),
          });
          refreshTransactions();

          const confirmMessage: Message = {
            id: Date.now().toString(),
            text: `**Phân loại: ${tempProductInfo.category}, Tiền: ${amount} VNĐ, Tiêu đề: ${tempProductInfo.type}** Đã ghi nhận khoản chi của bạn.`,
            isUser: false,
            timestamp: new Date(),
          };

          const updatedMessages = [...messages, confirmMessage];
          setMessages(updatedMessages);
          await updateChatHistory(user.uid, updatedMessages);
        } catch (error) {
          console.error("Error saving expense:", error);
          Alert.alert("Error", "Không thể lưu chi tiêu. Vui lòng thử lại.");
        }

        // Reset states
        setAwaitingPriceInput(false);
        setTempProductInfo(null);
        return;
      }
    }

    const handleUserQuestion = async (question: string) => {
      const timeRange = analyzeTimeRange(question);
      let expenses: Expense[] = [];
      const isSummaryRequest =
        question.toLowerCase().includes("tổng") ||
        question.toLowerCase().includes("bao nhiêu") ||
        question.toLowerCase().includes("chi tiêu") ||
        timeRange.type !== "none";

      try {
        // Nếu là câu hỏi tổng hợp/thống kê
        if (isSummaryRequest) {
          switch (timeRange.type) {
            case "day":
              if (timeRange.date) {
                expenses = await getDailyExpenses(user.uid, timeRange.date);
              }
              break;
            case "month":
              if (timeRange.year && timeRange.month) {
                expenses = await getMonthlyExpenses(
                  user.uid,
                  timeRange.year,
                  timeRange.month
                );
              }
              break;
            case "quarter":
              if (timeRange.year && timeRange.quarter) {
                expenses = await getQuarterlyExpenses(
                  user.uid,
                  timeRange.year,
                  timeRange.quarter
                );
              }
              break;
            case "year":
              if (timeRange.year) {
                expenses = await getYearlyExpenses(user.uid, timeRange.year);
              }
              break;
            default:
              // Mặc định lấy chi tiêu ngày hiện tại
              expenses = await getDailyExpenses(user.uid, new Date());
          }
        } else {
          // Nếu là câu hỏi thông thường, chỉ lấy chi tiêu của ngày
          expenses = await getDailyExpenses(user.uid, new Date());
        }
        return { expenses, isSummaryRequest };
      } catch (error) {
        console.error("Error getting expenses:", error);
        return { expenses: [], isSummaryRequest };
      }
    };

    const userMessage: Message = {
      id: Date.now().toString(),
      text: transcribedText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Lấy 2 tin nhắn gần nhất để có context
      const recentMessages = await getRecentMessages(user.uid, 2);
      const { expenses, isSummaryRequest } = await handleUserQuestion(
        transcribedText
      );

      // Tạo prompt khác nhau cho câu hỏi thông thường và câu hỏi tổng hợp
      let systemPromptWithData;
      if (isSummaryRequest) {
        systemPromptWithData = `
        Bạn có quyền truy cập vào dữ liệu chi tiêu (ở dạng JSON):
        ${JSON.stringify(expenses, null, 2)}

        Hãy phân tích và tổng hợp chi tiêu một cách trực quan, dễ hiểu.
        Với câu hỏi tổng hợp/thống kê, hỏi đắt hay rẻ KHÔNG sử dụng format ** ** mà hãy trình bày theo dạng:
        - Tổng thu: xxx
        - Tổng chi: xxx
        - Chi tiết theo danh mục: (nếu có)
          + Danh mục 1: xxx
          + Danh mục 2: xxx
        - Nhận xét và góp ý về tình hình chi tiêu
        `;
      } else {
        systemPromptWithData = `
        Bạn có quyền truy cập vào dữ liệu chi tiêu hôm nay (ở dạng JSON):
        ${JSON.stringify(expenses, null, 2)}

        Tin nhắn gần nhất:
        ${recentMessages
          .map((msg) => `${msg.isUser ? "User" : "Bot"}: ${msg.text}`)
          .join("\n")}

        ${baseSystemPrompt}
        `;
      }

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPromptWithData },
          { role: "user", content: userMessage.text },
        ],
        model: "qwen-2.5-32b",
        temperature: 0.5,
        max_tokens: 1024,
      });

      const responseText = completion.choices[0]?.message?.content || "";
      console.log("Bot response:", responseText);

      // Chỉ xử lý lưu chi tiêu mới nếu không phải câu hỏi tổng hợp
      if (!isSummaryRequest) {
        const match = responseText.match(
          /\*\*Phân loại:\s*(.*?),\s*Tiền:\s*([\d,.]+)\s*VNĐ,\s*Tiêu đề:\s*(.*?)\*\*/
        );

        if (match) {
          const [_, category, amount, title] = match;
          try {
            await saveExpenseToCSV(user.uid, {
              category: category.trim(),
              amount: amount.replace(/[,.]|VNĐ/g, "").trim(),
              title: title.trim(),
              type: determineTransactionType(userMessage.text, category),
              timestamp: new Date().toISOString(),
            });
            console.log("Successfully saved transaction to CSV");
            refreshTransactions();
          } catch (error) {
            console.error("Error saving to CSV:", error);
            Alert.alert("Error", "Không thể lưu chi tiêu. Vui lòng thử lại.");
          }
        }
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, botResponse];
      setMessages(finalMessages);
      await updateChatHistory(user.uid, finalMessages);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
        isUser: false,
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      await updateChatHistory(user.uid, finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm phụ trợ để xác định loại giao dịch
  const determineTransactionType = (
    message: string,
    category: string
  ): "income" | "expense" => {
    const incomeCategories = ["Lương tháng", "Tiết kiệm", "Khác"];
    const incomeKeywords = ["nhận", "được", "cho", "tặng", "thưởng"];

    return incomeCategories.includes(category) ||
      incomeKeywords.some((keyword) => message.toLowerCase().includes(keyword))
      ? "income"
      : "expense";
  };

  const handlePressIn = async () => {
    // Don't allow starting another recording if one is already in progress
    if (isRecording || isInitializingRecording) return;

    setIsInitializingRecording(true);

    try {
      // Clean up any existing recording first
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (error) {
          console.log("Error stopping existing recording:", error);
        }
        recordingRef.current = null;
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Vui lòng cấp quyền micro");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.log("Failed to start recording:", error);

      // Make sure we clean up properly
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.log("Error cleaning up:", cleanupError);
        }
        recordingRef.current = null;
      }
    } finally {
      setIsInitializingRecording(false);
    }
  };

  const handlePressOut = async () => {
    // Don't try to stop if not recording or if we're still initializing
    if (!isRecording || isInitializingRecording) {
      setIsRecording(false);
      return;
    }

    // Update UI state immediately for responsive feedback
    setIsRecording(false);

    try {
      if (!recordingRef.current) {
        return; // Nothing to stop
      }

      let uri;
      try {
        uri = recordingRef.current.getURI();
        await recordingRef.current.stopAndUnloadAsync();
      } catch (error) {
        console.log("Error stopping recording:", error);
        recordingRef.current = null;
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      if (!uri) {
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        // Process audio file
        const formData = new FormData();
        const fileData: any = {
          uri: uri,
          name: "audio.m4a",
          type: "audio/m4a",
        };
        formData.append("file", fileData);
        formData.append("model", "whisper-large-v3");

        try {
          const transcriptionResponse = await fetch(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${groq.apiKey}`,
              },
              body: formData,
            }
          );

          if (!transcriptionResponse.ok) {
            throw new Error(
              `HTTP error! status: ${transcriptionResponse.status}`
            );
          }

          const transcriptionData: TranscriptionResponse =
            await transcriptionResponse.json();
          if (transcriptionData && transcriptionData.text) {
            await sendMessageByVoice(transcriptionData.text);
          }
        } catch (transcriptionError) {
          console.log("Transcription error:", transcriptionError);
        } finally {
          try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          } catch (deleteError) {
            console.log("Error deleting audio file:", deleteError);
          }
        }
      }
    } catch (error) {
      console.log("Error processing recording:", error);
    } finally {
      recordingRef.current = null;
    }
  };

  const captureOrPickImage = async () => {
    Alert.alert(
      "Chụp hóa đơn",
      "Bạn muốn chụp hóa đơn mới hay chọn ảnh có sẵn?",
      [
        {
          text: "Chụp ảnh",
          onPress: async () => {
            try {
              const { status } =
                await ImagePicker.requestCameraPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Permission required",
                  "Vui lòng cấp quyền truy cập camera"
                );
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsEditing: false,
              });

              if (
                !result.canceled &&
                result.assets &&
                result.assets.length > 0
              ) {
                // Process image immediately after capture
                processImage(result.assets[0].uri);
              }
            } catch (error) {
              console.error("Camera error:", error);
              Alert.alert("Error", "Không thể chụp ảnh. Vui lòng thử lại.");
            }
          },
        },
        {
          text: "Chọn ảnh",
          onPress: async () => {
            try {
              const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Permission required",
                  "Vui lòng cấp quyền truy cập thư viện ảnh"
                );
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsEditing: false,
              });

              if (
                !result.canceled &&
                result.assets &&
                result.assets.length > 0
              ) {
                // Process image immediately after selection
                processImage(result.assets[0].uri);
              }
            } catch (error) {
              console.error("Image picker error:", error);
              Alert.alert("Error", "Không thể chọn ảnh. Vui lòng thử lại.");
            }
          },
        },
        { text: "Hủy", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const processImage = async (imageUri: string) => {
    if (!user) return;
    setIsLoading(true);

    // Định nghĩa types
    type TransactionType = "expense" | "income";

    interface ExpenseData {
      category: string;
      amount: string;
      title: string;
      type: TransactionType;
      timestamp?: string;
    }

    interface BillItem {
      category: string;
      amount: string;
      title: string;
    }

    interface BillResponse {
      total: string;
      items?: BillItem[];
      comment?: string;
      error?: string;
      reason?: string;
    }

    try {
      // Kiểm tra thông tin file ảnh để debug
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      console.log("Thông tin file ảnh:", fileInfo);

      // Chuyển ảnh sang base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Thêm thông báo cho người dùng
      const processingMessage: Message = {
        id: Date.now().toString(),
        text: "Đang xử lý hóa đơn, vui lòng đợi...",
        isUser: false,
        timestamp: new Date(),
      };

      const messagesWithProcessing = [...messages, processingMessage];
      setMessages(messagesWithProcessing);

      // Sử dụng model GPT-4-Vision
      const billAnalysis = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Phân tích ảnh này. Nếu đây là hóa đơn hoặc biên lai, hãy trả về thông tin dưới dạng JSON theo format sau:

{
  "total": "tổng tiền (chỉ số, không có đơn vị)",
  "items": [
    {"category": "Ăn uống/Mua sắm/Di chuyển/Giáo dục/Giải trí/Y tế/Hóa đơn/Khác", "amount": "số tiền (chỉ số, không có đơn vị)", "title": "tên món hàng/dịch vụ"},
    {"category": "Ăn uống/Mua sắm/Di chuyển/Giáo dục/Giải trí/Y tế/Hóa đơn/Khác", "amount": "số tiền (chỉ số, không có đơn vị)", "title": "tên món hàng/dịch vụ"}
  ],
  "comment": "nhận xét ngắn gọn về các khoản chi"
}

Nếu đây là hóa đơn nhưng bạn chỉ thấy tổng tiền mà không thấy chi tiết các món, hãy trả về:
{
  "total": "tổng tiền (chỉ số, không có đơn vị)",
  "items": [
    {"category": "Ăn uống", "amount": "tổng tiền", "title": "Hóa đơn không chi tiết"}
  ],
  "comment": "Không thể xác định chi tiết các món"
}

Nếu không phải là hóa đơn hoặc biên lai, hãy phản hồi: {"error": "NOT_BILL", "reason": "lý do cụ thể"}

Lưu ý: Đảm bảo tổng tiền và số tiền từng món chỉ chứa các chữ số, không có dấu phẩy, dấu chấm hay đơn vị tiền tệ.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        model: "llama-3.2-90b-vision-preview", // Sử dụng model vision tốt hơn
        temperature: 0.1, // Giảm temperature để kết quả nhất quán hơn
        max_tokens: 1500,
      });

      console.log("Phản hồi gốc:", billAnalysis.choices[0]?.message?.content);

      const response = billAnalysis.choices[0]?.message?.content;
      if (!response) {
        throw new Error("Không nhận được phản hồi từ AI");
      }

      // Loại bỏ tin nhắn "đang xử lý"
      setMessages(messages);

      // Tìm và trích xuất phần JSON từ phản hồi
      let jsonContent = response;
      const jsonMatch = response.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }

      try {
        // Thử phân tích JSON
        const parsedResponse: BillResponse = JSON.parse(jsonContent);

        if (parsedResponse.error === "NOT_BILL") {
          // Kiểm tra xem phản hồi có chứa thông tin về tổng tiền không
          const amountMatch = response.match(
            /(\d[\d.,\s]+)(?:\s*)(đồng|vnd|vnđ|₫)/i
          );
          const estimatedAmount = amountMatch
            ? amountMatch[1].replace(/[^\d]/g, "")
            : "";

          if (estimatedAmount && parseInt(estimatedAmount) > 0) {
            // Nếu tìm thấy tổng tiền, tạo một giao dịch đơn giản
            const reason =
              parsedResponse.reason || "Không nhận diện được chi tiết hóa đơn";

            // Hiển thị thông báo và tùy chọn lưu đơn giản
            Alert.alert(
              "Không nhận diện đầy đủ chi tiết hóa đơn",
              `${reason}\n\nTuy nhiên, hệ thống phát hiện tổng tiền: ${parseInt(
                estimatedAmount
              ).toLocaleString(
                "vi-VN"
              )} VNĐ\n\nBạn có muốn lưu khoản chi này không?`,
              [
                {
                  text: "Hủy",
                  style: "cancel",
                },
                {
                  text: "Lưu",
                  onPress: async () => {
                    // Tạo một giao dịch đơn giản
                    const simpleExpense: ExpenseData = {
                      category: "Ăn uống", // Giả định đây là hóa đơn ăn uống dựa trên thông tin từ AI
                      amount: estimatedAmount,
                      title: "Hóa đơn ăn uống",
                      type: "expense",
                      timestamp: new Date().toISOString(),
                    };

                    await saveExpenseToCSV(user.uid, simpleExpense);
                    refreshTransactions();

                    const simpleBillSummary = `🧾 Đã lưu hóa đơn đơn giản:

💰 Tổng tiền: ${parseInt(estimatedAmount).toLocaleString("vi-VN")} VNĐ
📋 Tiêu đề: Hóa đơn ăn uống
📁 Phân loại: Ăn uống

⚠️ Hệ thống không thể xác định đầy đủ chi tiết từ hóa đơn này.`;

                    const simpleResponse: Message = {
                      id: Date.now().toString(),
                      text: simpleBillSummary,
                      isUser: false,
                      timestamp: new Date(),
                    };

                    const updatedMessages = [...messages, simpleResponse];
                    setMessages(updatedMessages);
                    await updateChatHistory(user.uid, updatedMessages);
                  },
                },
              ]
            );

            const infoResponse: Message = {
              id: Date.now().toString(),
              text: `ℹ️ Phát hiện hóa đơn có tổng tiền: ${parseInt(
                estimatedAmount
              ).toLocaleString("vi-VN")} VNĐ

Tuy nhiên, không thể nhận diện đầy đủ chi tiết. ${parsedResponse.reason}

Vui lòng chọn lưu hoặc hủy khoản chi này.`,
              isUser: false,
              timestamp: new Date(),
            };

            const updatedMessages = [...messages, infoResponse];
            setMessages(updatedMessages);
            await updateChatHistory(user.uid, updatedMessages);
            return;
          } else {
            // Xử lý trường hợp không phải hóa đơn
            const reason =
              parsedResponse.reason || "Không nhận diện được định dạng hóa đơn";

            // Hiển thị thông báo và tùy chọn nhập thủ công
            Alert.alert(
              "Không nhận diện được hóa đơn",
              `${reason}\n\nBạn có muốn nhập thông tin chi tiêu thủ công không?`,
              [
                {
                  text: "Hủy",
                  style: "cancel",
                },
                {
                  text: "Nhập thủ công",
                  onPress: () => {
                    // Thêm tin nhắn gợi ý cách nhập thủ công
                    const helpMessage: Message = {
                      id: Date.now().toString(),
                      text: 'Bạn có thể nhập thông tin chi tiêu bằng cách nói hoặc nhắn tin theo cú pháp: "Tôi đã chi [số tiền] cho [mục đích]"',
                      isUser: false,
                      timestamp: new Date(),
                    };

                    setMessages([...messages, helpMessage]);
                    updateChatHistory(user.uid, [...messages, helpMessage]);
                  },
                },
              ]
            );

            const errorResponse: Message = {
              id: Date.now().toString(),
              text: `Ảnh này không được nhận diện là hóa đơn.\n\nLý do: ${reason}\n\nVui lòng thử lại với ảnh khác hoặc chụp lại hóa đơn rõ nét hơn.`,
              isUser: false,
              timestamp: new Date(),
            };

            const updatedMessages = [...messages, errorResponse];
            setMessages(updatedMessages);
            await updateChatHistory(user.uid, updatedMessages);
            return;
          }
        }

        // Xử lý dữ liệu JSON khi nhận diện thành công
        let totalAmount = parsedResponse.total;
        // Đảm bảo tổng tiền chỉ chứa số
        totalAmount = totalAmount.toString().replace(/[^\d]/g, "");

        if (!totalAmount || totalAmount === "0") {
          throw new Error("Không thể xác định tổng tiền từ hóa đơn");
        }

        const items = parsedResponse.items || [];
        const commentSection = parsedResponse.comment || "Không có nhận xét";

        // Chuẩn hóa dữ liệu các mục
        const normalizedItems: BillItem[] = items.map((item: BillItem) => ({
          category: item.category || "Khác",
          amount: item.amount.toString().replace(/[^\d]/g, "") || "0",
          title: item.title || "Không có tiêu đề",
        }));

        // Loại bỏ các mục trùng lặp
        const uniqueItems: BillItem[] = [];
        const processedItems = new Set<string>();

        for (const item of normalizedItems) {
          // Bỏ qua các mục có số tiền là 0
          if (item.amount === "0") continue;

          const itemKey = `${item.category}|${item.amount}|${item.title}`;
          if (!processedItems.has(itemKey)) {
            processedItems.add(itemKey);
            uniqueItems.push(item);
          }
        }

        console.log(`Tìm thấy ${uniqueItems.length} mục hợp lệ trong hóa đơn`);

        // Nếu không có mục nào được tìm thấy, tạo một mục mặc định
        if (uniqueItems.length === 0) {
          uniqueItems.push({
            category: "Khác",
            amount: totalAmount,
            title: "Chi tiêu tổng hợp",
          });
        }

        // Xác định danh mục chung cho hóa đơn
        const categoryCounts: { [key: string]: number } = {};
        uniqueItems.forEach((item) => {
          categoryCounts[item.category] =
            (categoryCounts[item.category] || 0) + 1;
        });

        // Lấy danh mục xuất hiện nhiều nhất
        let mainCategory = uniqueItems[0].category;
        let maxCount = 0;
        Object.entries(categoryCounts).forEach(([category, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mainCategory = category;
          }
        });

        // Tạo tiêu đề cho hóa đơn
        let billTitle = "";
        if (uniqueItems.length === 1) {
          billTitle = uniqueItems[0].title;
        } else if (uniqueItems.length <= 3) {
          billTitle = uniqueItems.map((item) => item.title).join(", ");
        } else {
          // Nếu có nhiều hơn 3 món, lấy 2 món đầu tiên và ghi "và x món khác"
          billTitle = `${uniqueItems[0].title}, ${uniqueItems[1].title} và ${
            uniqueItems.length - 2
          } món khác`;
        }

        // Thêm tiền tố "Hóa đơn" vào tiêu đề
        billTitle = `Hóa đơn - ${billTitle}`;

        // Lưu giao dịch vào CSV
        const expenseData: ExpenseData = {
          category: mainCategory,
          amount: totalAmount,
          title: billTitle,
          type: "expense",
          timestamp: new Date().toISOString(),
        };

        console.log("Lưu hóa đơn:", expenseData);

        await saveExpenseToCSV(user.uid, expenseData);
        refreshTransactions();

        // Hiển thị chi tiết các món cho người dùng
        const itemDetails = uniqueItems.map(
          (item) =>
            `🛍️ ${item.title}: ${parseInt(item.amount).toLocaleString(
              "vi-VN"
            )} VNĐ (${item.category})`
        );

        const billSummary = `🧾 Đã lưu hóa đơn:

💰 Tổng tiền: ${parseInt(totalAmount).toLocaleString("vi-VN")} VNĐ
📋 Tiêu đề: ${billTitle}
📁 Phân loại: ${mainCategory}

📝 Chi tiết ${uniqueItems.length} món:
${itemDetails.join("\n")}

💭 Nhận xét: ${commentSection}`;

        const botResponse: Message = {
          id: Date.now().toString(),
          text: billSummary,
          isUser: false,
          timestamp: new Date(),
        };

        const updatedMessages = [...messages, botResponse];
        setMessages(updatedMessages);
        await updateChatHistory(user.uid, updatedMessages);
      } catch (jsonError) {
        console.error("Lỗi xử lý JSON:", jsonError);

        // Thử phương pháp đơn giản hơn - tìm số tiền trực tiếp từ phản hồi
        try {
          // Tìm số tiền từ phản hồi
          const amountMatch = response.match(
            /(\d[\d\s,.]+)\s*(đồng|vnd|vnđ|₫)/i
          );
          const estimatedAmount = amountMatch
            ? amountMatch[1].replace(/[^\d]/g, "")
            : "";

          if (estimatedAmount && parseInt(estimatedAmount) > 0) {
            // Hiển thị thông báo và tùy chọn lưu đơn giản
            Alert.alert(
              "Phát hiện hóa đơn",
              `Hệ thống phát hiện hóa đơn với tổng tiền: ${parseInt(
                estimatedAmount
              ).toLocaleString(
                "vi-VN"
              )} VNĐ\n\nBạn có muốn lưu khoản chi này không?`,
              [
                {
                  text: "Hủy",
                  style: "cancel",
                },
                {
                  text: "Lưu",
                  onPress: async () => {
                    // Tạo một giao dịch đơn giản
                    const simpleExpense: ExpenseData = {
                      category: "Ăn uống", // Giả định đây là hóa đơn ăn uống
                      amount: estimatedAmount,
                      title: "Hóa đơn ăn uống",
                      type: "expense",
                      timestamp: new Date().toISOString(),
                    };

                    await saveExpenseToCSV(user.uid, simpleExpense);
                    refreshTransactions();

                    const simpleBillSummary = `🧾 Đã lưu hóa đơn đơn giản:

💰 Tổng tiền: ${parseInt(estimatedAmount).toLocaleString("vi-VN")} VNĐ
📋 Tiêu đề: Hóa đơn ăn uống
📁 Phân loại: Ăn uống

⚠️ Hệ thống không thể xác định đầy đủ chi tiết từ hóa đơn này.`;

                    const simpleResponse: Message = {
                      id: Date.now().toString(),
                      text: simpleBillSummary,
                      isUser: false,
                      timestamp: new Date(),
                    };

                    const updatedMessages = [...messages, simpleResponse];
                    setMessages(updatedMessages);
                    await updateChatHistory(user.uid, updatedMessages);
                  },
                },
              ]
            );

            const infoResponse: Message = {
              id: Date.now().toString(),
              text: `ℹ️ Phát hiện hóa đơn có tổng tiền: ${parseInt(
                estimatedAmount
              ).toLocaleString("vi-VN")} VNĐ

Tuy nhiên, không thể nhận diện đầy đủ chi tiết. Vui lòng chọn lưu hoặc hủy khoản chi này.`,
              isUser: false,
              timestamp: new Date(),
            };

            const updatedMessages = [...messages, infoResponse];
            setMessages(updatedMessages);
            await updateChatHistory(user.uid, updatedMessages);
            return;
          }

          // Nếu không tìm thấy số tiền, hiển thị lỗi
          throw new Error("Không thể xác định thông tin từ hóa đơn");
        } catch (fallbackError) {
          // Hiển thị lỗi cuối cùng
          const errorResponse: Message = {
            id: Date.now().toString(),
            text: `❌ Lỗi xử lý hóa đơn: ${
              fallbackError instanceof Error
                ? fallbackError.message
                : "Lỗi không xác định"
            }

🔍 Vui lòng thử lại với một trong các cách sau:
1. Chụp lại hóa đơn rõ ràng hơn
2. Đảm bảo hóa đơn nằm hoàn toàn trong khung hình
3. Chụp trong điều kiện ánh sáng tốt
4. Nhập thông tin chi tiêu thủ công bằng cách nói "Tôi đã chi [số tiền] cho [mục đích]"`,
            isUser: false,
            timestamp: new Date(),
          };

          const updatedMessages = [...messages, errorResponse];
          setMessages(updatedMessages);
          await updateChatHistory(user.uid, updatedMessages);
        }
      }
    } catch (error) {
      console.error("Lỗi xử lý ảnh:", error);

      const errorResponse: Message = {
        id: Date.now().toString(),
        text: `❌ Không thể xử lý ảnh: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }

Vui lòng thử lại sau hoặc nhập thông tin chi tiêu thủ công bằng cách nói "Tôi đã chi [số tiền] cho [mục đích]"`,
        isUser: false,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, errorResponse];
      setMessages(updatedMessages);
      await updateChatHistory(user.uid, updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVisualizer = () => {
    if (!isRecording) return null;

    return (
      <View style={styles.visualizerWrapper}>
        <View style={styles.recordingTimerContainer}>
          <Text style={styles.recordingTimer}>
            {Math.floor(recordingDuration / 60)}:
            {(recordingDuration % 60).toString().padStart(2, "0")}
          </Text>
        </View>
        <View style={styles.visualizerContainer}>
          {waveData.map((value, index) => (
            <Animated.View
              key={index}
              style={[
                styles.visualizerBar,
                {
                  height: 25 * value,
                  backgroundColor: `rgba(255,255,255,${
                    0.5 + (index / waveData.length) * 0.5
                  })`,
                  transform: [{ scaleY: value }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  useEffect(() => {
    if (!isRecording) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = undefined;
      }
      setWaveData(Array(15).fill(1));
      setRecordingDuration(0);
    }
  }, [isRecording]);

  if (isLoadingHistory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#eef4f0" />
        <Text style={styles.loadingText}>Đang tải lịch sử chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground
        source={require("../../../assets/images/bbgg.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Chatbot</Text>
        </View>

        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageContainer,
                  item.isUser ? styles.userMessage : styles.botMessage,
                ]}
              >
                {!item.isUser && (
                  <View style={styles.botAvatarContainer}></View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    item.isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <FormattedMessage
                    text={item.text}
                    isUserMessage={item.isUser}
                    onEditTransaction={
                      !item.isUser ? editTransactionFromMessage : undefined
                    }
                  />
                  <Text style={styles.messageTime}>
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            )}
            style={styles.messagesList}
            contentContainerStyle={{
              paddingBottom: 16,
              flexGrow: 1,
            }}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomBox}>
            {isRecording && renderVisualizer()}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                onPress={captureOrPickImage}
                style={styles.iconButton}
              >
                <EvilIcons name="camera" size={28} color="#fff" />
              </TouchableOpacity>

              <View style={styles.micButtonContainer}>
                <TouchableOpacity
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  style={[
                    styles.micButton,
                    isRecording && styles.micButtonHoldRecording,
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isRecording ? "mic" : "mic-outline"}
                    size={32}
                    color="#fff"
                  />
                  {isRecording && (
                    <View style={styles.recordingIndicator}>
                      <View style={styles.recordingDot} />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.holdToRecordText}>
                  {isRecording ? "Đang ghi âm..." : "Giữ để ghi âm"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowHelpModal(true)}
              >
                <EvilIcons name="question" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Help Modal */}
        <Modal
          visible={showHelpModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowHelpModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.helpModalContainer}>
              <View style={styles.helpModalHeader}>
                <Text style={styles.helpModalTitle}>Hướng dẫn sử dụng</Text>
                <TouchableOpacity
                  style={styles.helpModalCloseButton}
                  onPress={() => setShowHelpModal(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.helpModalContent}>
                <View style={styles.helpSection}>
                  <View style={styles.helpSectionHeader}>
                    <Ionicons name="mic-outline" size={24} color="#6c63ff" />
                    <Text style={styles.helpSectionTitle}>Ghi âm</Text>
                  </View>
                  <Text style={styles.helpSectionText}>
                    • Giữ nút micro để ghi âm câu hỏi hoặc ghi nhận chi tiêu
                    {"\n"}• Nói rõ ràng: "Tôi đã chi [số tiền] cho [mục đích]"
                    {"\n"}• Ví dụ: "Tôi đã chi 150 nghìn đồng cho bữa trưa"
                  </Text>
                </View>

                <View style={styles.helpSection}>
                  <View style={styles.helpSectionHeader}>
                    <EvilIcons name="camera" size={28} color="#6c63ff" />
                    <Text style={styles.helpSectionTitle}>Chụp hóa đơn</Text>
                  </View>
                  <Text style={styles.helpSectionText}>
                    • Nhấn vào nút máy ảnh để chụp hoặc chọn ảnh hóa đơn{"\n"}•
                    Đảm bảo hóa đơn nằm trong khung hình và có đủ ánh sáng{"\n"}
                    • Hệ thống sẽ tự động nhận diện và lưu khoản chi tiêu
                  </Text>
                </View>

                <View style={styles.helpSection}>
                  <View style={styles.helpSectionHeader}>
                    <FontAwesome name="pencil" size={20} color="#6c63ff" />
                    <Text style={styles.helpSectionTitle}>
                      Chỉnh sửa giao dịch
                    </Text>
                  </View>
                  <Text style={styles.helpSectionText}>
                    • Nhấn vào biểu tượng bút trong khung giao dịch để chỉnh sửa
                    {"\n"}• Bạn có thể thay đổi phân loại, số tiền và tiêu đề
                    {"\n"}• Nhấn Lưu để cập nhật thông tin giao dịch
                  </Text>
                </View>

                <View style={styles.helpSection}>
                  <View style={styles.helpSectionHeader}>
                    <Ionicons name="search-outline" size={24} color="#6c63ff" />
                    <Text style={styles.helpSectionTitle}>
                      Tra cứu chi tiêu
                    </Text>
                  </View>
                  <Text style={styles.helpSectionText}>
                    • Hỏi về chi tiêu trong ngày: "Hôm nay tôi đã chi bao
                    nhiêu?"{"\n"}• Hỏi về chi tiêu trong tháng: "Tháng này tôi
                    đã chi bao nhiêu?"{"\n"}• Hỏi về chi tiêu theo danh mục:
                    "Tháng này tôi chi bao nhiêu cho ăn uống?"
                  </Text>
                </View>

                <View style={styles.helpSection}>
                  <View style={styles.helpSectionHeader}>
                    <Ionicons name="wallet-outline" size={24} color="#6c63ff" />
                    <Text style={styles.helpSectionTitle}>
                      Mục tiêu tiết kiệm
                    </Text>
                  </View>
                  <Text style={styles.helpSectionText}>
                    • Tạo mục tiêu tiết kiệm: "Tôi muốn tiết kiệm 5 triệu để đi
                    du lịch"{"\n"}• Theo dõi mục tiêu: "Xem mục tiêu tiết kiệm
                    của tôi"{"\n"}• Cập nhật tiến độ: "Tôi đã tiết kiệm thêm 500
                    nghìn cho mục tiêu du lịch"
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Edit Transaction Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editModalContainer}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Chỉnh sửa giao dịch</Text>
                <TouchableOpacity
                  style={styles.editModalCloseButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.editModalContent}>
                <Text style={styles.editModalLabel}>Phân loại:</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        editCategory === category &&
                          styles.categoryButtonSelected,
                      ]}
                      onPress={() => setEditCategory(category)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          editCategory === category &&
                            styles.categoryButtonTextSelected,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.editModalLabel}>Số tiền:</Text>
                <View style={styles.editInputContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="numeric"
                    placeholder="Nhập số tiền"
                    placeholderTextColor="#9ca3af"
                  />
                  <Text style={styles.editInputSuffix}>VNĐ</Text>
                </View>

                <Text style={styles.editModalLabel}>Tiêu đề:</Text>
                <TextInput
                  style={[styles.editInput, styles.editTitleInput]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Nhập tiêu đề"
                  placeholderTextColor="#9ca3af"
                />
              </ScrollView>

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={styles.editModalCancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.editModalCancelButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editModalSaveButton}
                  onPress={saveEditedTransaction}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <View style={styles.loadingButtonContent}>
                      <Animated.View
                        style={{
                          transform: [
                            {
                              rotate: spinAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0deg", "360deg"],
                              }),
                            },
                          ],
                          marginRight: 8,
                        }}
                      >
                        <Ionicons name="sync-outline" size={18} color="#fff" />
                      </Animated.View>
                      <Text style={styles.editModalSaveButtonText}>
                        Đang lưu...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.editModalSaveButtonText}>Lưu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: "#000",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  titleContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  chatContainer: {
    flex: 1,
    marginTop: 90,
    marginHorizontal: 16,
    marginBottom: 140,
    paddingBottom: 16,
  },
  messagesList: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 8,
    maxWidth: "90%",
  },
  userMessage: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  botMessage: {
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },
  botAvatarContainer: {
    marginRight: 8,
    alignSelf: "flex-end",
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1d1c55",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: "#1d1c55",
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#0e0b27",
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#fff",
  },
  botMessageText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  transactionDetails: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  transactionText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  transactionLabel: {
    fontWeight: "600",
  },
  transactionEditButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginLeft: 8,
  },
  commentText: {
    marginTop: 4,
  },
  bottomSheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
  },
  bottomBox: {
    backgroundColor: "rgba(18, 18, 23, 0.95)",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  micButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#1d1c55",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  micButtonHoldRecording: {
    backgroundColor: "#ff4757",
  },
  recordingIndicator: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  micButtonContainer: {
    alignItems: "center",
  },
  holdToRecordText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  visualizerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 16,
    marginHorizontal: 8,
  },
  visualizerContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
    marginLeft: 16,
    marginRight: 8,
    overflow: "hidden",
  },
  visualizerBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.8)",
    marginHorizontal: 1,
  },
  recordingTimerContainer: {
    minWidth: 60,
    paddingRight: 16,
  },
  recordingTimer: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#fff",
  },
  // Modal overlay shared by all modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Edit modal styles
  editModalContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#1c1c1e",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  editModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModalContent: {
    padding: 16,
    maxHeight: 400,
  },
  editModalLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 8,
    marginTop: 12,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  categoryButtonSelected: {
    backgroundColor: "#1d1c55",
    borderColor: "#6c63ff",
  },
  categoryButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  categoryButtonTextSelected: {
    fontWeight: "600",
  },
  editInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  editInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  editTitleInput: {
    marginBottom: 16,
  },
  editInputSuffix: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  editModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  editModalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginRight: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  editModalSaveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#1d1c55",
    marginLeft: 8,
    alignItems: "center",
  },
  editModalCancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  editModalSaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Help modal styles
  helpModalContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#1c1c1e",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: "80%",
  },
  helpModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  helpModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  helpModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  helpModalContent: {
    padding: 16,
  },
  helpSection: {
    marginBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  helpSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 12,
  },
  helpSectionText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  // Add these styles to the StyleSheet
  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Chatbot;
