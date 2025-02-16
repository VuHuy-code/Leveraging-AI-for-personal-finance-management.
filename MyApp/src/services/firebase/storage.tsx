import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';  // Add this import at the top

interface Expense {
  timestamp: string;
  type: string;
  category: string;
  amount: string;
  title: string;
}

// Get Firebase storage path for expenses
const getExpenseStoragePath = (userId: string): string => {
  return `expenses/${userId}/chi_tieu.csv`;
};

// Modify the convertExpensesToCSV function to create Excel-like CSV format
const convertExpensesToCSV = (expenses: Expense[], isNewFile: boolean = false): string => {
  // Add headers only for new files
  let csvContent = isNewFile 
    ? 'timestamp,type,category,amount,title\n' 
    : '';
  
  // Add each expense as a new row
  expenses.forEach(expense => {
    csvContent += `${expense.timestamp},${expense.type},${expense.category},${expense.amount},${expense.title}\n`;
  });
  
  return csvContent;
};

// Update the saveExpenseToCSV function to append new data
export const saveExpenseToCSV = async (
  userId: string, 
  expenseData: {
    category: string;
    amount: string;
    title: string;
    type: 'income' | 'expense';
    timestamp?: string; // Optional since we'll set it if not provided
  }
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  const storagePath = getExpenseStoragePath(userId);
  const storage = getStorage();
  const fileRef = ref(storage, storagePath);

  try {
    let existingContent = '';
    let isNewFile = false;

    try {
      const url = await getDownloadURL(fileRef);
      const response = await fetch(url);
      existingContent = await response.text();
    } catch (error) {
      isNewFile = true;
    }

    // Create new expense row
    const newExpense: Expense = {
      timestamp: expenseData.timestamp || new Date().toISOString(),
      type: expenseData.type,
      category: expenseData.category,
      amount: expenseData.amount,
      title: expenseData.title
    };

    // Create the row data without headers
    const rowData = `${newExpense.timestamp},${newExpense.type},${newExpense.category},${newExpense.amount},${newExpense.title}\n`;

    // Add headers only if it's a new file
    const finalContent = isNewFile 
      ? `timestamp,type,category,amount,title\n${rowData}`
      : `${existingContent}${rowData}`;

    // Upload to Firebase Storage
    const blob = new Blob([finalContent], { type: 'text/csv' });
    await uploadBytes(fileRef, blob);

    console.log('Expense saved to CSV successfully');
  } catch (error) {
    console.error('Error saving expense to CSV:', error);
    throw error;
  }
};

// Update the parseCSVToExpenses function to handle column-based format
const parseCSVToExpenses = (csvContent: string): Expense[] => {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });

  return result.data.map((row: any) => ({
    timestamp: row.timestamp,
    type: row.type,
    category: row.category,
    amount: row.amount,
    title: row.title
  }));
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