import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import Groq from "groq-sdk";
import { useAuth } from "../../hooks/useAuth";
import { saveTransaction } from "../../../services/firebase/firestore";
import { useTransactionContext } from '../../contexts/TransactionContext';
import { initializeChatHistory, getChatHistory, updateChatHistory } from '../../../services/firebase/storage';
const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true
});

// Update the system prompt to remove the Loại field from output
const systemPrompt = `You are a helpful assistant. For any input containing money-related information, determine if it's income or expense and categorize as follows:

For INCOME (when receiving money), use these categories:
- Lương tháng: for salary/wages
- Tiết kiệm: for savings/investment returns
- Khác: for gifts, found money, bonuses, etc.

Income indicators:
- Words like "nhận", "được", "cho", "tặng", "thưởng"
- Getting money from family/friends
- Finding money
- Receiving gifts
- Investment returns
- Savings interest
- Bonuses or rewards
- Side job income

For EXPENSES (when spending money), use these categories:
- Ăn uống (for food and drinks)
- Y tế (for medical expenses)
- Mua sắm (for shopping)
- Di chuyển (for transportation)
- Hóa đơn (for bills)
- Giải trí (for entertainment)
- Giáo dục (for education)
- Đầu tư (for investment)
- Khác (for others)

Output format: 
**Phân loại: [category], Tiền: [amount] VNĐ, Tiêu đề: [short_title]**

Examples:
- Input: "mẹ cho 500k tiền ăn sáng"
  Output: **Phân loại: Khác, Tiền: 500,000 VNĐ, Tiêu đề: Mẹ cho tiền**
- Input: "nhận lương tháng 3 là 15 triệu"
  Output: **Phân loại: Lương tháng, Tiền: 15,000,000 VNĐ, Tiêu đề: Lương tháng 3**

For non-financial queries, answer normally.`;

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
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) return;

      setIsLoadingHistory(true);
      try {
        // Khởi tạo với tin nhắn chào mừng
        const welcomeMessage = {
          id: '1',
          text: 'Xin chào! Tôi có thể giúp gì cho bạn?',
          isUser: false,
          timestamp: new Date()
        };

        // Khởi tạo chat history nếu chưa tồn tại
        initializeChatHistory(user.uid, welcomeMessage).catch(console.error);

        // Lấy chat history
        const history = await getChatHistory(user.uid);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        Alert.alert('Error', 'Không thể tải lịch sử chat');
        // Set default welcome message if loading fails
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

    loadChatHistory();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 10000); // 10 giây timeout
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
          Alert.alert('Thông báo', 'Tải lịch sử chat quá lâu, đã chuyển sang chế độ mới');
        }
      });
    
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (imageUri: string) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Hãy phân tích hình ảnh này và trả lời bằng tiếng Việt. Nếu có thông tin về tiền bạc, hãy phân tích xem là thu nhập hay chi tiêu, liệt kê chi tiết và kết luận với format: 'Phân loại: [category], Tiền: [amount], Tiêu đề: [title], Loại: [income/expense]'" 
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
        max_tokens: 1024,
      });

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: completion.choices[0]?.message?.content || "Xin lỗi, tôi không thể xử lý hình ảnh.",
        isUser: false,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, botResponse];
      setMessages(updatedMessages);
      await updateChatHistory(user.uid, updatedMessages);

    } catch (error) {
      console.error('Image processing error:', error);
      
      let errorMessage = "Xin lỗi, đã có lỗi xảy ra khi xử lý hình ảnh.";
      if (error instanceof Error) {
        if (error.message.includes('413')) {
          errorMessage += " Hình ảnh quá lớn, vui lòng chọn hình ảnh nhỏ hơn.";
        } else if (error.message.includes('415')) {
          errorMessage += " Định dạng hình ảnh không được hỗ trợ.";
        }
      }
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        isUser: false,
        timestamp: new Date(),
      };
      const updatedMessages = [...messages, errorResponse];
      setMessages(updatedMessages);
      await updateChatHistory(user.uid, updatedMessages);
    } finally {
      setIsLoading(false);
      setImage(null);
    }
  };

  const toggleRecording = async () => {
    if (isRecording && recordingRef.current) {
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
              const transcriptionResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${groq.apiKey}`,
                },
                body: formData,
              });

              if (!transcriptionResponse.ok) {
                throw new Error(`HTTP error! status: ${transcriptionResponse.status}`);
              }

              const transcriptionData: TranscriptionResponse = await transcriptionResponse.json();

              if (transcriptionData && transcriptionData.text) {
                setInput(transcriptionData.text);
              } else {
                throw new Error('No transcription text received');
              }

            } catch (transcriptionError) {
              console.error('Transcription error:', transcriptionError);
              Alert.alert('Error', 'Failed to transcribe audio');
            }

            await FileSystem.deleteAsync(uri, { idempotent: true });
          }
        }
      } catch (err) {
        console.error('Stop recording error:', err);
        Alert.alert('Error', 'Failed to process recording');
      } finally {
        recordingRef.current = null;
        setIsRecording(false);
      }
    } else {
      try {
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          recordingRef.current = null;
        }

        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please grant microphone access');
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
      } catch (err) {
        console.error('Start recording error:', err);
        Alert.alert('Error', 'Failed to start recording');
        setIsRecording(false);
      }
    }
  };

// Update the regex pattern and transaction type detection in sendMessage
const sendMessage = async () => {
  if (!input.trim() || isLoading || !user) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    text: input.trim(),
    isUser: true,
    timestamp: new Date(),
  };

  const updatedMessages = [...messages, userMessage];
  setMessages(updatedMessages);
  setInput('');
  setIsLoading(true);

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage.text }
      ],
      model: "llama-3.2-90b-vision-preview",
      temperature: 0.5,
      max_tokens: 1024,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    
    // Updated regex to match the new format without Loại field
    const match = responseText.match(/Phân loại:\s*(.*?),\s*Tiền:\s*([\d,]+)\s*VNĐ,\s*Tiêu đề:\s*(.*?)(?:\s*$|\*\*)/);
    
    if (match) {
      const [_, category, amount, title] = match;
      const trimmedCategory = category.trim();
      
      // Determine if it's income based on category and context
      const isIncome = 
        trimmedCategory === 'Lương tháng' || 
        trimmedCategory === 'Tiết kiệm' || 
        trimmedCategory === 'Khác' ||
        userMessage.text.toLowerCase().includes('nhận') ||
        userMessage.text.toLowerCase().includes('được') ||
        userMessage.text.toLowerCase().includes('cho') ||
        userMessage.text.toLowerCase().includes('tặng') ||
        userMessage.text.toLowerCase().includes('thưởng');

      const transactionType = isIncome ? 'income' : 'expense';
      
      

      await saveTransaction(
        user.uid,
        trimmedCategory,
        amount.trim(),
        title.trim(),
        transactionType
      );
      refreshTransactions();
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
      text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
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

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.botMessage
    ]}>
      <Text style={[
        styles.messageText,
        !item.isUser && styles.botMessageText
      ]}>{item.text}</Text>
    </View>
  );

  if (isLoadingHistory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4facfe" />
        <Text style={styles.loadingText}>Đang tải lịch sử chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trợ lý AI</Text>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        style={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          onPress={pickImage}
          style={styles.imageButton}
        >
          <Ionicons name="image" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleRecording}
          style={styles.micButton}
        >
          <Ionicons
            name={isRecording ? "mic" : "mic-outline"}
            size={24}
            color={isRecording ? "#4facfe" : "#666"}
          />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#666"
          multiline
          editable={!isLoading && !isRecording}
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!input.trim() || isLoading || isRecording}
        >
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={styles.sendButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="send" size={24} color="#fff" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4facfe',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  botMessageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 20,
    marginHorizontal: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  micButton: {
    padding: 8,
  },
  imageButton: {
    padding: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default Chatbot;