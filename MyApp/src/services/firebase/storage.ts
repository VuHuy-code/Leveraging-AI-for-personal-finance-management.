import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Add cache management
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
let messageCache: {
  messages: ChatMessage[];
  timestamp: number;
  userId: string;
} | null = null;

// Convert messages to CSV string
const convertMessagesToCSV = (messages: ChatMessage[]): string => {
  const rows = ['id,text,isUser,timestamp'];
  messages.forEach(msg => {
    const escapedText = msg.text.replace(/"/g, '""').replace(/\n/g, ' ');
    rows.push(`${msg.id},"${escapedText}",${msg.isUser},${msg.timestamp.toISOString()}`);
  });
  return rows.join('\n');
};

// Parse CSV string back to messages
const parseCSVToMessages = (csvContent: string): ChatMessage[] => {
  const lines = csvContent.split('\n');
  const messages: ChatMessage[] = new Array(lines.length - 1);
  let validMessageCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const matches = line.match(/^([^,]+),(".*"|[^,]*),([^,]+),(.+)$/);
    if (!matches) continue;
    
    const [_, id, quotedText, isUser, timestamp] = matches;
    const text = quotedText.startsWith('"') && quotedText.endsWith('"')
      ? quotedText.slice(1, -1).replace(/""/g, '"')
      : quotedText;
    
    messages[validMessageCount++] = {
      id,
      text,
      isUser: isUser === 'true',
      timestamp: new Date(timestamp)
    };
  }
  
  return messages.slice(0, validMessageCount);
};

// Get Firebase storage path
const getStoragePath = (userId: string): string => {
  return `chat_histories/${userId}/chat_history.csv`;
};

// Initialize chat history
export const initializeChatHistory = async (userId: string, initialMessage: ChatMessage): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  
  const storagePath = getStoragePath(userId);
  
  try {
    await getDownloadURL(ref(getStorage(), storagePath));
  } catch (error) {
    const csvContent = convertMessagesToCSV([initialMessage]);
    
    // Upload directly to Firebase without using temp file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    await uploadBytes(ref(getStorage(), storagePath), blob);
    
    // Update cache
    messageCache = {
      messages: [initialMessage],
      timestamp: Date.now(),
      userId
    };
  }
};

// Get chat history
export const getChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  if (!userId) throw new Error('User ID is required');
  
  // Check cache first
  if (messageCache && 
      messageCache.userId === userId && 
      Date.now() - messageCache.timestamp < CACHE_EXPIRY) {
    return messageCache.messages;
  }
  
  const storagePath = getStoragePath(userId);
  
  try {
    const url = await getDownloadURL(ref(getStorage(), storagePath));
    const response = await fetch(url);
    const csvContent = await response.text();
    const messages = parseCSVToMessages(csvContent);
    
    // Update cache
    messageCache = {
      messages,
      timestamp: Date.now(),
      userId
    };
    
    return messages;
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
};

// Update chat history
export const updateChatHistory = async (userId: string, messages: ChatMessage[]): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  
  const storagePath = getStoragePath(userId);
  
  try {
    // Update cache first
    messageCache = {
      messages,
      timestamp: Date.now(),
      userId
    };
    
    const csvContent = convertMessagesToCSV(messages);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    await uploadBytes(ref(getStorage(), storagePath), blob);
  } catch (error) {
    console.error('Error updating chat history:', error);
    messageCache = null; // Invalidate cache on error
    throw error;
  }
};