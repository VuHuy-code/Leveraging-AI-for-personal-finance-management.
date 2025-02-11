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
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true
});

const systemPrompt = `You are a helpful assistant. If the user's input contains expense details (e.g., a monetary amount and context about spending), please analyze and categorize the expense into only one of the following fixed categories: Di chuyển, Mua sắm, Ăn uống, Hóa đơn, Giải trí, Y tế, Giáo dục, Đầu tư & tiết kiệm, Khác. Output the response in the following format:**Phân loại: [category], Tiền: [amount]**. Định dạng của amount là xxx,xxx,xxx VNĐ. If the user's query is not expense-related, answer the question normally.`;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  pending?: boolean;
}

interface TranscriptionResponse {
  text: string;
  x_groq: {
    id: string;
  };
}

const Chatbot: React.FC = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Xin chào! Tôi có thể giúp gì cho bạn?', isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

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
            
            // Explicitly type the file object
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
  
            // Clean up the temporary file
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
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

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: completion.choices[0]?.message?.content || "Xin lỗi, tôi không thể xử lý yêu cầu.",
        isUser: false,
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
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
});

export default Chatbot;