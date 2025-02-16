import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

interface Expense {
  category: string;
  amount: string;
  title: string;
}

// Get Firebase storage path for expenses
const getExpenseStoragePath = (userId: string): string => {
  return `expenses/${userId}/chi_tieu.csv`;
};

// Convert expenses to CSV string
const convertExpensesToCSV = (expenses: Expense[]): string => {
  const rows = ['category,amount,title'];
  expenses.forEach(expense => {
    const escapedTitle = expense.title.replace(/"/g, '""').replace(/\n/g, ' ');
    rows.push(`${expense.category},${expense.amount},"${escapedTitle}"`);
  });
  return rows.join('\n');
};

// Parse CSV string back to expenses
const parseCSVToExpenses = (csvContent: string): Expense[] => {
  const lines = csvContent.split('\n');
  const expenses: Expense[] = new Array(lines.length - 1);
  let validExpenseCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const matches = line.match(/^([^,]+),([^,]+),(".*"|[^,]*)$/);
    if (!matches) continue;

    const [_, category, amount, quotedTitle] = matches;
    const title = quotedTitle.startsWith('"') && quotedTitle.endsWith('"')
      ? quotedTitle.slice(1, -1).replace(/""/g, '"')
      : quotedTitle;

    expenses[validExpenseCount++] = {
      category,
      amount,
      title
    };
  }

  return expenses.slice(0, validExpenseCount);
};

// Save expense to CSV
export const saveExpenseToCSV = async (userId: string, category: string, amount: string, title: string): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  const storagePath = getExpenseStoragePath(userId);

  try {
    let existingExpenses: Expense[] = [];
    try {
      const url = await getDownloadURL(ref(getStorage(), storagePath));
      const response = await fetch(url);
      const csvContent = await response.text();
      existingExpenses = parseCSVToExpenses(csvContent);
    } catch (error) {
      // If file doesn't exist, ignore and create a new one
    }

    // Add new expense
    const newExpense: Expense = { category, amount, title };
    const updatedExpenses = [...existingExpenses, newExpense];

    // Convert to CSV and upload
    const csvContent = convertExpensesToCSV(updatedExpenses);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    await uploadBytes(ref(getStorage(), storagePath), blob);

    console.log('Expense saved to CSV successfully');
  } catch (error) {
    console.error('Error saving expense to CSV:', error);
    throw error;
  }
};

// Get expenses from CSV
export const getExpensesFromCSV = async (userId: string): Promise<Expense[]> => {
  if (!userId) throw new Error('User ID is required');

  const storagePath = getExpenseStoragePath(userId);

  try {
    const url = await getDownloadURL(ref(getStorage(), storagePath));
    const response = await fetch(url);
    const csvContent = await response.text();
    return parseCSVToExpenses(csvContent);
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

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