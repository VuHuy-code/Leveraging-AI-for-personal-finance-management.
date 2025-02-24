import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Image
} from 'react-native';
import { Ionicons, EvilIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import Groq from "groq-sdk";
import { useAuth } from "../../hooks/useAuth";
import { useTransactionContext } from '../../contexts/TransactionContext';
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
  getRecentMessages
} from '../../../services/firebase/storage';

interface Expense {
  timestamp: string;
  type: string;
  category: string;
  amount: string;
  title: string;
}

// Add these missing helper functions to filter expenses by date/month:
async function getExpensesForDate(userId: string, date: Date): Promise<Expense[]> {
  const allExpenses = await getExpensesFromCSV(userId);
  return allExpenses.filter(exp => {
    const expDate = new Date(exp.timestamp);
    return expDate.toDateString() === date.toDateString();
  });
}

async function getExpensesForMonth(userId: string, year: number, month: number): Promise<Expense[]> {
  const allExpenses = await getExpensesFromCSV(userId);
  return allExpenses.filter(exp => {
    const expDate = new Date(exp.timestamp);
    return expDate.getFullYear() === year && (expDate.getMonth() + 1) === month;
  });
}

// Khởi tạo Groq
const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true
});

const baseSystemPrompt = `Bạn là trợ lý tài chính thông minh, nhiệm vụ chính là giúp người dùng theo dõi thu chi. Hãy phân tích và phản hồi ngắn gọn,  súc tích.
PHÂN LOẠI:
THU NHẬP:
- Lương tháng: lương, thưởng công việc
- Tiết kiệm: lãi suất, đầu tư
- Khác: quà, tiền mừng, thưởng
CHI TIÊU:
- Ăn uống:
- Y tế: thuốc
- Mua sắm:sàn thương mại điện tử
- Di chuyển: xăng,du lịch  
- Hóa đơn:
- Giải trí: phim, game
- Giáo dục: học phí, sách vở
- Đầu tư: chứng khoán, tiết kiệm
- Khác: chi phí phát sinh
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

const Chatbot: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshTransactions } = useTransactionContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pressStartTime, setPressStartTime] = useState<number>(0);
  const [isLongPress, setIsLongPress] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'tap' | 'hold' | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout>();

  const amplitudes = useRef([...Array(15)].map(() => new Animated.Value(1))).current;
  const [waveData, setWaveData] = useState<number[]>(Array(15).fill(1));
  const animationFrameId = useRef<number>();
  const [awaitingPriceInput, setAwaitingPriceInput] = useState(false);
  const [tempProductInfo, setTempProductInfo] = useState<{
  type: string;
  category: string;
} | null>(null);

  const updateWaveData = useCallback(() => {
    if (isRecording) {
      const newAmplitude = (Math.random() * 0.5) + 0.75;
      setWaveData(prevData => {
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
        setRecordingDuration(prev => prev + 1);
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
          id: '1',
          text: 'Xin chào! Tôi có thể giúp gì cho bạn?',
          isUser: false,
          timestamp: new Date()
        };

        await initializeChatHistory(user.uid, welcomeMessage);
        const history = await getChatHistory(user.uid);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        Alert.alert('Error', 'Không thể tải lịch sử chat');
        setMessages([{
          id: '1',
          text: 'Xin chào! Tôi có thể giúp gì cho bạn?',
          isUser: false,
          timestamp: new Date()
        }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 10000);
    });

    Promise.race([loadChatHistory(), timeoutPromise])
      .catch(error => {
        if (error.message === 'Timeout') {
          setIsLoadingHistory(false);
          setMessages([{
            id: '1',
            text: 'Xin chào! Tôi có thể giúp gì cho bạn?',
            isUser: false,
            timestamp: new Date()
          }]);
          Alert.alert('Thông báo', 'Tải lịch sử chat quá lâu, đã chuyển mode mới.');
        }
      });
  }, [user]);

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
  
    // Nếu đang chờ input giá tiền
    if (awaitingPriceInput && tempProductInfo) {
      // Xử lý text để lấy số tiền
      const amount = transcribedText.replace(/[^0-9]/g, '');
      
      if (amount) {
        try {
          await saveExpenseToCSV(user.uid, {
            category: tempProductInfo.category,
            amount: amount,
            title: tempProductInfo.type,
            type: 'expense',
            timestamp: new Date().toISOString()
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
          console.error('Error saving expense:', error);
          Alert.alert('Error', 'Không thể lưu chi tiêu. Vui lòng thử lại.');
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
      const isSummaryRequest = question.toLowerCase().includes('tổng') || 
                              question.toLowerCase().includes('bao nhiêu') ||
                              question.toLowerCase().includes('chi tiêu') ||
                              timeRange.type !== 'none';
  
      try {
        // Nếu là câu hỏi tổng hợp/thống kê
        if (isSummaryRequest) {
          switch (timeRange.type) {
            case 'day':
              if (timeRange.date) {
                expenses = await getDailyExpenses(user.uid, timeRange.date);
              }
              break;
            case 'month':
              if (timeRange.year && timeRange.month) {
                expenses = await getMonthlyExpenses(user.uid, timeRange.year, timeRange.month);
              }
              break;
            case 'quarter':
              if (timeRange.year && timeRange.quarter) {
                expenses = await getQuarterlyExpenses(user.uid, timeRange.year, timeRange.quarter);
              }
              break;
            case 'year':
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
        console.error('Error getting expenses:', error);
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
      const { expenses, isSummaryRequest } = await handleUserQuestion(transcribedText);
  
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
        ${recentMessages.map(msg => `${msg.isUser ? 'User' : 'Bot'}: ${msg.text}`).join('\n')}
  
        ${baseSystemPrompt}
        `;
      }
  
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPromptWithData },
          { role: 'user', content: userMessage.text }
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
              amount: amount.replace(/[,.]|VNĐ/g, '').trim(),
              title: title.trim(),
              type: determineTransactionType(userMessage.text, category),
              timestamp: new Date().toISOString()
            });
            console.log("Successfully saved transaction to CSV");
            refreshTransactions();
          } catch (error) {
            console.error("Error saving to CSV:", error);
            Alert.alert('Error', 'Không thể lưu chi tiêu. Vui lòng thử lại.');
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
      console.error('Chat error:', error);
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
  ): 'income' | 'expense' => {
    const incomeCategories = ['Lương tháng', 'Tiết kiệm', 'Khác'];
    const incomeKeywords = ['nhận', 'được', 'cho', 'tặng', 'thưởng'];
    
    return incomeCategories.includes(category) ||
      incomeKeywords.some(keyword => message.toLowerCase().includes(keyword))
      ? 'income'
      : 'expense';
  };
  
  
  const toggleRecording = async (mode: 'tap' | 'hold') => {
    if (isRecording) {
      try {
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: false,
          });
  
          const uri = recordingRef.current.getURI();
          if (uri) {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (fileInfo.exists) {
              const formData = new FormData();
              const fileData: any = {
                uri: uri,
                name: 'audio.m4a',
                type: 'audio/m4a',
              };
              formData.append('file', fileData);
              formData.append('model', 'Whisper-Large-V3-Turbo');
  
              try {
                const transcriptionResponse = await fetch(
                  'https://api.groq.com/openai/v1/audio/transcriptions',
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${groq.apiKey}`,
                    },
                    body: formData,
                  }
                );
  
                if (!transcriptionResponse.ok) {
                  throw new Error(`HTTP error! status: ${transcriptionResponse.status}`);
                }
  
                const transcriptionData: TranscriptionResponse = await transcriptionResponse.json();
                if (transcriptionData && transcriptionData.text) {
                  await sendMessageByVoice(transcriptionData.text);
                } else {
                  throw new Error('No transcription text received');
                }
              } catch (transcriptionError) {
                console.error('Transcription error:', transcriptionError);
                Alert.alert('Error', 'Không thể chuyển giọng nói thành văn bản');
              }
              await FileSystem.deleteAsync(uri, { idempotent: true });
            }
          }
        }
      } catch (err) {
        console.error('Stop recording error:', err);
        Alert.alert('Error', 'Không thể xử lý ghi âm');
      } finally {
        recordingRef.current = null;
        setIsRecording(false);
        setRecordingMode(null);
      }
    } else {
      try {
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          recordingRef.current = null;
        }
  
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Vui lòng cấp quyền micro');
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
        setRecordingMode(mode);
      } catch (err) {
        console.error('Start recording error:', err);
        Alert.alert('Error', 'Không thể bắt đầu ghi âm');
        setIsRecording(false);
        setRecordingMode(null);
      }
    }
  };

  const handlePressIn = () => {
    // Start recording immediately when pressing down
    toggleRecording('hold');
  };

  const handlePressOut = async () => {
    // Stop visualizer immediately
    setIsRecording(false);
    setRecordingMode(null);

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
        });

        const uri = recordingRef.current.getURI();
        if (uri) {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists) {
            const formData = new FormData();
            const fileData: any = {
              uri: uri,
              name: 'audio.m4a',
              type: 'audio/m4a',
            };
            formData.append('file', fileData);
            formData.append('model', 'whisper-large-v3');

            try {
              const transcriptionResponse = await fetch(
                'https://api.groq.com/openai/v1/audio/transcriptions',
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${groq.apiKey}`,
                  },
                  body: formData,
                }
              );

              if (!transcriptionResponse.ok) {
                throw new Error(`HTTP error! status: ${transcriptionResponse.status}`);
              }

              const transcriptionData: TranscriptionResponse = await transcriptionResponse.json();
              if (transcriptionData && transcriptionData.text) {
                await sendMessageByVoice(transcriptionData.text);
              } else {
                throw new Error('No transcription text received');
              }
            } catch (transcriptionError) {
              console.error('Transcription error:', transcriptionError);
              Alert.alert('Error', 'Không thể chuyển giọng nói thành văn bản');
            }
            await FileSystem.deleteAsync(uri, { idempotent: true });
          }
        }
      } catch (err) {
        console.error('Stop recording error:', err);
        Alert.alert('Error', 'Không thể xử lý ghi âm');
      } finally {
        recordingRef.current = null;
      }
    }
  };

  const captureOrPickImage = async () => {
    Alert.alert(
      'Chọn ảnh',
      'Bạn muốn chụp ảnh mới hay chọn ảnh có sẵn?',
      [
        {
          text: 'Chụp ảnh',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission required', 'Vui lòng cấp quyền truy cập camera');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsEditing: false,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                // Process image immediately after capture
                processImage(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Camera error:', error);
              Alert.alert('Error', 'Không thể chụp ảnh. Vui lòng thử lại.');
            }
          },
        },
        {
          text: 'Chọn ảnh',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission required', 'Vui lòng cấp quyền truy cập thư viện ảnh');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsEditing: false,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                // Process image immediately after selection
                processImage(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Image picker error:', error);
              Alert.alert('Error', 'Không thể chọn ảnh. Vui lòng thử lại.');
            }
          },
        },
        { text: 'Hủy', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const processImage = async (imageUri: string) => {
    if (!user) return;
    setIsLoading(true);
  
    // Định nghĩa types
    type TransactionType = 'expense' | 'income';
  
    interface ExpenseData {
      category: string;
      amount: string;
      title: string;
      type: TransactionType;
      timestamp?: string;
    }
  
    try {
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Đầu tiên phân tích xem đây là bill hay sản phẩm đơn lẻ
      const initialAnalysis = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Phân tích đây là hóa đơn (bill) hay một sản phẩm đơn lẻ? Nó là sản phẩm đơn lẻ khi nó chỉ có một món đồ nào đó không có số tiền thanh toán hay gì cả. Trả lời ngắn gọn: BILL hoặc PRODUCT"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                }
              }
            ]
          }
        ],
        model: "llama-3.2-90b-vision-preview",
        temperature: 0.2,
        max_tokens: 1024,
      });
  
      const imageType = initialAnalysis.choices[0]?.message?.content?.trim().toUpperCase();
  
      if (imageType === 'BILL') {
        const billAnalysis = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Phân tích hóa đơn này và trả về CHÍNH XÁC theo format sau (không thêm bớt ký tự):
      
      TOTAL:[tổng tiền];
      ITEMS:
      **Phân loại:[loại hàng],Tiền:[số tiền] VNĐ,Tiêu đề:[tên món]**
      **Phân loại:[loại hàng],Tiền:[số tiền] VNĐ,Tiêu đề:[tên món]**
      (mỗi món một dòng);
      COMMENT:[nhận xét về các khoản chi]
      
      Ví dụ:
      TOTAL:125000;
      ITEMS:
      **Phân loại:Ăn uống,Tiền:75000 VNĐ,Tiêu đề:Cơm gà**
      **Phân loại:Ăn uống,Tiền:50000 VNĐ,Tiêu đề:Trà sữa**;
      COMMENT:Các món ăn có giá hợp lý, phù hợp với mặt bằng chung.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  }
                }
              ]
            }
          ],
          model: "llama-3.2-90b-vision-preview",
          temperature: 0.2, // Giảm temperature để response chính xác hơn
          max_tokens: 1024,
        });
      
        console.log('Raw response:', billAnalysis.choices[0]?.message?.content);
      
        const response = billAnalysis.choices[0]?.message?.content;
        if (response) {
          try {
            // Tách response theo dấu chấm phẩy và loại bỏ khoảng trắng thừa
            const sections = response.split(';').map(section => section.trim());
            console.log('Sections:', sections);
      
            // Kiểm tra format tổng quát
            if (sections.length < 3) {
              throw new Error('Thiếu thông tin trong response');
            }
      
            // Xử lý tổng tiền
            const totalMatch = sections[0].match(/TOTAL:(\d+)/);
            if (!totalMatch) {
              throw new Error('Không tìm thấy tổng tiền');
            }
            const totalAmount = totalMatch[1];
      
            // Xử lý danh sách items
            const itemsSection = sections[1];
            if (!itemsSection.startsWith('ITEMS:')) {
              throw new Error('Không tìm thấy danh sách món hàng');
            }
      
            // Tách và xử lý từng item
            const itemMatches = itemsSection.match(/\*\*Phân loại:.*?\*\*/g);
            if (!itemMatches) {
              throw new Error('Không tìm thấy món hàng nào');
            }
      
            const savedItems = [];
            for (const itemString of itemMatches) {
              const itemMatch = itemString.match(/\*\*Phân loại:\s*([^,]+),\s*Tiền:\s*([\d,.\s]+)\s*VNĐ,\s*Tiêu đề:\s*([^\*]+)\*\*/);
              if (itemMatch) {
                const [_, category, amount, title] = itemMatch;
                
                const expenseData: ExpenseData = {
                  category: category.trim(),
                  amount: amount.replace(/[,.\s]/g, ''),
                  title: title.trim(),
                  type: 'expense' as TransactionType,
                  timestamp: new Date().toISOString()
                };
      
                console.log('Saving item:', expenseData);
                
                await saveExpenseToCSV(user.uid, expenseData);
                savedItems.push(`🛍️ ${title.trim()}: ${amount.trim()} VNĐ (${category.trim()})`);
              }
            }
      
            // Xử lý comment
            const commentMatch = sections[2].match(/COMMENT:(.*)/);
            if (!commentMatch) {
              throw new Error('Không tìm thấy nhận xét');
            }
            const comment = commentMatch[1].trim();
      
            if (savedItems.length > 0) {
              refreshTransactions();
      
              const billSummary = `🧾 Đã xử lý bill:
      
      💰 Tổng tiền: ${totalAmount} VNĐ
      
      📝 Chi tiết các món:
      ${savedItems.join('\n')}
      
      💭 Nhận xét: ${comment}`;
      
              const botResponse: Message = {
                id: Date.now().toString(),
                text: billSummary,
                isUser: false,
                timestamp: new Date(),
              };
      
              const updatedMessages = [...messages, botResponse];
              setMessages(updatedMessages);
              await updateChatHistory(user.uid, updatedMessages);
            }
      
          } catch (error) {
            console.error('Error processing bill items:', error);
            const errorResponse: Message = {
              id: Date.now().toString(),
              text: `❌ Lỗi xử lý bill: ${error instanceof Error ? error.message : 'Lỗi không xác định'}
              
      🔍 Vui lòng chụp lại bill rõ ràng hơn hoặc thử lại.`,
              isUser: false,
              timestamp: new Date(),
            };
      
            const updatedMessages = [...messages, errorResponse];
            setMessages(updatedMessages);
            await updateChatHistory(user.uid, updatedMessages);
          }
        }
      } else {
        // Xử lý sản phẩm đơn lẻ
        const productAnalysis = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Mô tả sản phẩm này là gì (sách/giày/quần áo/...)? Format: PRODUCT:[loại sản phẩm];CATEGORY:[phân loại chi tiêu phù hợp]"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  }
                }
              ]
            }
          ],
          model: "llama-3.2-90b-vision-preview",
          temperature: 0.5,
          max_tokens: 256,
        });
  
        console.log('Product analysis response:', productAnalysis.choices[0]?.message?.content);
  
        const productInfo = productAnalysis.choices[0]?.message?.content;
        if (productInfo) {
          try {
            const [product, category] = productInfo.split(';');
            const productType = product.split(':')[1]?.trim();
            const expenseCategory = category.split(':')[1]?.trim();
  
            console.log('Product info:', { productType, expenseCategory });
  
            if (!productType || !expenseCategory) {
              throw new Error('Không thể nhận dạng thông tin sản phẩm');
            }
  
            // Hiển thị prompt để hỏi giá
            const botQuestion: Message = {
              id: Date.now().toString(),
              text: `Tôi thấy đây là ${productType}. Bạn đã mua với giá bao nhiêu? (Vui lòng nói giá tiền)`,
              isUser: false,
              timestamp: new Date(),
            };
  
            const updatedMessages = [...messages, botQuestion];
            setMessages(updatedMessages);
            await updateChatHistory(user.uid, updatedMessages);
  
            // Kích hoạt chế độ lắng nghe giá tiền
            setAwaitingPriceInput(true);
            setTempProductInfo({
              type: productType,
              category: expenseCategory
            });
  
            console.log('Awaiting price input for:', tempProductInfo);
  
          } catch (error) {
            console.error('Error processing product:', error);
            const errorResponse: Message = {
              id: Date.now().toString(),
              text: `Lỗi xử lý sản phẩm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
              isUser: false,
              timestamp: new Date(),
            };
  
            const updatedMessages = [...messages, errorResponse];
            setMessages(updatedMessages);
            await updateChatHistory(user.uid, updatedMessages);
          }
        }
      }
  
    } catch (error) {
      console.error('Image processing error:', error);
      let errorMessage = "Xin lỗi, đã có lỗi xảy ra khi xử lý ảnh.";
      if (error instanceof Error) {
        errorMessage += ` Chi tiết: ${error.message}`;
      } else {
        errorMessage += " Có lỗi không xác định xảy ra.";
      }
  
      const errorResponse: Message = {
        id: Date.now().toString(),
        text: errorMessage,
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
            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
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
                  backgroundColor: `rgba(255,255,255,${0.5 + (index / waveData.length) * 0.5})`,
                  transform: [{ scaleY: value }],
                }
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={require('../../../assets/images/bbgg.png')}
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
                  item.isUser ? styles.userMessage : styles.botMessage
                ]}
              >
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            )}
            style={styles.messagesList}
            contentContainerStyle={{ 
              paddingBottom: 16,
              flexGrow: 1,
            }}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd();
            }}
          />
        </View>

        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomBox}>
            {isRecording && renderVisualizer()}
            <View style={styles.actionContainer}>
              <TouchableOpacity onPress={captureOrPickImage} style={styles.iconButton}>
                <EvilIcons name="camera" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonRecording
                ]}
              >
                <Ionicons
                  name={isRecording ? "mic" : "mic-outline"}
                  size={32}
                  color="#fff"
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton}>
                <EvilIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: '#000'
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  titleContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    marginTop: 90,
    marginHorizontal: 16,
    marginBottom: 140,
    paddingBottom: 16,
  },
  messagesList: {
    flex: 1
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1d1c55'
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#0e0b27'
  },
  messageText: {
    color: '#fff',
    fontSize: 16
  },
  bottomBox: {
    backgroundColor: '#121217',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000001',
    justifyContent: 'center',
    alignItems: 'center'
  },
  micButtonRecording: {
    backgroundColor: '#ff4757',
  },
  visualizerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  visualizerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    marginLeft: 16,
    marginRight: 8,
    overflow: 'hidden',
  },
  visualizerBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginHorizontal: 1,
  },
  recordingTimerContainer: {
    minWidth: 60,
    paddingRight: 16,
  },
  recordingTimer: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#fff'
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 8,
  },
  tapModeText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default Chatbot;