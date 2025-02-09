// components/ChatBox.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatBoxProps {
  visible: boolean;
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ visible, onClose }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; message: string }[]>([]);

  const handleSendChat = () => {
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, { sender: 'user', message: chatInput }]);

      setTimeout(() => {
        setChatMessages(prevMessages => [
          ...prevMessages,
          { sender: 'bot', message: 'Xin chào! Tôi có thể giúp gì cho bạn?' },
        ]);
      }, 500);

      setChatInput('');
    }
  };

  return (
    <Modal visible={visible} animationType="none" transparent={true}>
      <View style={styles.chatBoxContainer}>
        <View style={styles.chatBoxContent}>
          <Text style={styles.chatTitle}>Chat Box</Text>
          <ScrollView style={styles.chatMessagesContainer}>
            {chatMessages.map((chat, index) => (
              <View
                key={index}
                style={chat.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer}
              >
                <Text style={chat.sender === 'user' ? styles.userMessage : styles.botMessage}>
                  {chat.message}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type a message..."
              onSubmitEditing={handleSendChat}
              blurOnSubmit={false}
            />
            <TouchableOpacity onPress={handleSendChat} style={styles.sendButton}>
              <Ionicons name="send" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeChatButton}>
            <Text style={styles.closeChatText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  chatBoxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBoxContent: {
    backgroundColor: '#ffffff',
    width: '90%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chatMessagesContainer: {
    maxHeight: 200,
    marginBottom: 10,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#4facfe',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  userMessage: {
    color: '#ffffff',
  },
  botMessage: {
    color: '#000000',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4facfe',
    padding: 10,
    borderRadius: 5,
  },
  closeChatButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  closeChatText: {
    color: '#4facfe',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatBox;