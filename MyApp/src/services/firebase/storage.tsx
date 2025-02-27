import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Papa from 'papaparse';

interface Expense {
  timestamp: string;
  type: string;
  category: string;
  amount: string;
  title: string;
}

interface ExtendedExpense extends Expense {
  iconName?: string;
  iconFamily?: string;
  iconColor?: string;
}

interface TransactionCache {
  transactions: Expense[];
  timestamp: number;
  userId: string;
}

const TRANSACTION_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
let transactionCache: TransactionCache | null = null;

const getExpenseStoragePath = (userId: string, date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;
  return `expenses/${userId}/${dateKey}.csv`;
};


const convertExpensesToCSV = (expenses: Expense[], isNewFile: boolean = false): string => {
  let csvContent = isNewFile ? 'timestamp,type,category,amount,title\n' : '';
  expenses.forEach(expense => {
    csvContent += `${expense.timestamp},${expense.type},${expense.category},${expense.amount},${expense.title}\n`;
  });
  return csvContent;
};

export const saveExpenseToCSV = async (
  userId: string,
  expenseData: {
    category: string;
    amount: string;
    title: string;
    type: 'income' | 'expense';
    timestamp?: string;
  }
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  const expenseDate = expenseData.timestamp ? new Date(expenseData.timestamp) : new Date();
  const storagePath = getExpenseStoragePath(userId, expenseDate);
  const storage = getStorage();
  const fileRef = ref(storage, storagePath);


  try {
    let existingContent = '';
    let isNewFile = false;

    try {
      const url = await getDownloadURL(fileRef);
      const response = await fetch(url);
      existingContent = await response.text();
    } catch {
      isNewFile = true;
    }

    const newExpense: Expense = {
      timestamp: expenseData.timestamp || new Date().toISOString(),
      type: expenseData.type,
      category: expenseData.category,
      amount: expenseData.amount,
      title: expenseData.title,
    };

    if (transactionCache && transactionCache.userId === userId) {
      transactionCache.transactions.push(newExpense);
      transactionCache.timestamp = Date.now();
    }

    const rowData = `${newExpense.timestamp},${newExpense.type},${newExpense.category},${newExpense.amount},${newExpense.title}\n`;
    const finalContent = isNewFile
      ? `timestamp,type,category,amount,title\n${rowData}`
      : `${existingContent}${rowData}`;

    const blob = new Blob([finalContent], { type: 'text/csv' });
    await uploadBytes(fileRef, blob);

  } catch (error) {
    console.error('Error saving expense to CSV:', error);
    throw error;
  }
};

async function getCSVFilesInRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<string[]> {
  const storage = getStorage();
  const fileUrls: string[] = [];
  
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const path = getExpenseStoragePath(userId, currentDate);
    try {
      const url = await getDownloadURL(ref(storage, path));
      fileUrls.push(url);
    } catch (error) {
      // Skip if file doesn't exist
      console.log(`No data for ${currentDate.toISOString().split('T')[0]}`);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return fileUrls;
}

export const getDailyExpenses = async (userId: string, date: Date): Promise<Expense[]> => {
  const path = getExpenseStoragePath(userId, date);
  try {
    const url = await getDownloadURL(ref(getStorage(), path));
    const response = await fetch(url);
    const csvContent = await response.text();
    return parseCSVToExpenses(csvContent);
  } catch (error) {
    console.log(`No expenses for ${date.toISOString().split('T')[0]}`);
    return [];
  }
};

export const getMonthlyExpenses = async (
  userId: string,
  year: number,
  month: number
): Promise<Expense[]> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month
  
  const fileUrls = await getCSVFilesInRange(userId, startDate, endDate);
  const allExpenses: Expense[] = [];
  
  for (const url of fileUrls) {
    const response = await fetch(url);
    const csvContent = await response.text();
    const expenses = parseCSVToExpenses(csvContent);
    allExpenses.push(...expenses);
  }
  
  return allExpenses;
};

// Hàm lấy chi tiêu theo quý
export const getQuarterlyExpenses = async (
  userId: string,
  year: number,
  quarter: number
): Promise<Expense[]> => {
  const startMonth = (quarter - 1) * 3 + 1;
  const startDate = new Date(year, startMonth - 1, 1);
  const endDate = new Date(year, startMonth + 2, 0); // Last day of quarter
  
  const fileUrls = await getCSVFilesInRange(userId, startDate, endDate);
  const allExpenses: Expense[] = [];
  
  for (const url of fileUrls) {
    const response = await fetch(url);
    const csvContent = await response.text();
    const expenses = parseCSVToExpenses(csvContent);
    allExpenses.push(...expenses);
  }
  
  return allExpenses;
};

// Hàm lấy chi tiêu theo năm
export const getYearlyExpenses = async (
  userId: string,
  year: number
): Promise<Expense[]> => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const fileUrls = await getCSVFilesInRange(userId, startDate, endDate);
  const allExpenses: Expense[] = [];
  
  for (const url of fileUrls) {
    const response = await fetch(url);
    const csvContent = await response.text();
    const expenses = parseCSVToExpenses(csvContent);
    allExpenses.push(...expenses);
  }
  
  return allExpenses;
};

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

export const getExpensesFromCSV = async (userId: string): Promise<Expense[]> => {
  if (!userId) throw new Error('User ID is required');

  if (
    transactionCache &&
    transactionCache.userId === userId &&
    Date.now() - transactionCache.timestamp < TRANSACTION_CACHE_EXPIRY
  ) {
    console.log('Returning expenses from cache');
    return transactionCache.transactions;
  }

  try {
    const dateKey = getDateKey(new Date());
    const storagePath = `expenses/${userId}/${dateKey}.csv`;
    const url = await getDownloadURL(ref(getStorage(), storagePath));
    const response = await fetch(url);
    const csvContent = await response.text();
    const expenses = parseCSVToExpenses(csvContent);

    transactionCache = {
      transactions: expenses,
      timestamp: Date.now(),
      userId
    };

    return expenses;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return [];
    }
    console.error('Error getting expenses:', error);
    return [];
  }
};

// ------------------- Chat-Message Handling -------------------

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
let messageCache: {
  messages: ChatMessage[];
  timestamp: number;
  userId: string;
  dateKey: string;
} | null = null;

// Helper to format Date objects as YYYY-MM-DD
function getDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const convertMessagesToCSV = (messages: ChatMessage[]): string => {
  const rows = ['id,text,isUser,timestamp'];
  messages.forEach(msg => {
    const escapedText = msg.text.replace(/"/g, '""').replace(/\n/g, ' ');
    rows.push(`${msg.id},"${escapedText}",${msg.isUser},${msg.timestamp.toISOString()}`);
  });
  return rows.join('\n');
};

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
    const text =
      quotedText.startsWith('"') && quotedText.endsWith('"')
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

function getDailyStorageRef(userId: string, date?: Date) {
  const d = date || new Date();
  const dateKey = getDateKey(d);
  const dailyPath = `chat_histories/${userId}/${dateKey}.csv`;
  return ref(getStorage(), dailyPath);
}

export const initializeChatHistory = async (
  userId: string,
  initialMessage: ChatMessage
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  const fileRef = getDailyStorageRef(userId);

  try {
    // If file exists, do nothing
    await getDownloadURL(fileRef);
  } catch {
    // Otherwise, create it
    const csvContent = convertMessagesToCSV([initialMessage]);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    await uploadBytes(fileRef, blob);

    const today = new Date();
    const dateKey = getDateKey(today);

    messageCache = {
      messages: [initialMessage],
      timestamp: Date.now(),
      userId,
      dateKey
    };
  }
};

export const getRecentMessages = async (
  userId: string,
  count: number = 2
): Promise<ChatMessage[]> => {
  const messages = await getChatHistory(userId);
  return messages.slice(-count);
};
export const getChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  if (!userId) throw new Error('User ID is required');

  const today = new Date();
  const dateKey = getDateKey(today);

  if (
    messageCache &&
    messageCache.userId === userId &&
    messageCache.dateKey === dateKey &&
    Date.now() - messageCache.timestamp < CACHE_EXPIRY
  ) {
    console.log('Returning chat history from cache');
    return messageCache.messages;
  }

  try {
    const storagePath = `chat_histories/${userId}/${dateKey}.csv`;
    const url = await getDownloadURL(ref(getStorage(), storagePath));
    const response = await fetch(url);
    const csvContent = await response.text();
    const messages = parseCSVToMessages(csvContent);

    messageCache = {
      messages,
      timestamp: Date.now(),
      userId,
      dateKey
    };

    return messages;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return [];
    }
    console.error('Error getting chat history:', error);
    return [];
  }
};

export const updateChatHistory = async (
  userId: string,
  messages: ChatMessage[]
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  const today = new Date();
  const dateKey = getDateKey(today);
  const fileRef = getDailyStorageRef(userId, today);

  try {
    messageCache = {
      messages,
      timestamp: Date.now(),
      userId,
      dateKey
    };

    const csvContent = convertMessagesToCSV(messages);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    await uploadBytes(fileRef, blob);
  } catch (error) {
    console.error('Error updating chat history:', error);
    messageCache = null;
    throw error;
  }
};

// ------------------- Extra Utilities -------------------

export const analyzeTimeRange = (question: string): {
  type: 'day' | 'month' | 'quarter' | 'year' | 'none';
  date?: Date;
  year?: number;
  month?: number;
  quarter?: number;
} => {
  const lowerQuestion = question.toLowerCase();
  const today = new Date();

  // Kiểm tra các từ khóa theo ngày
  if (lowerQuestion.includes('hôm nay') || lowerQuestion.includes('ngày này')) {
    return { type: 'day', date: today };
  }

  // Kiểm tra các từ khóa theo tháng
  if (lowerQuestion.includes('tháng này')) {
    return { 
      type: 'month',
      year: today.getFullYear(),
      month: today.getMonth() + 1
    };
  }

  // Kiểm tra các từ khóa theo quý
  if (lowerQuestion.includes('quý này')) {
    const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
    return {
      type: 'quarter',
      year: today.getFullYear(),
      quarter: currentQuarter
    };
  }

  // Kiểm tra các từ khóa theo năm
  if (lowerQuestion.includes('năm nay')) {
    return {
      type: 'year',
      year: today.getFullYear()
    };
  }

  // Xử lý các pattern ngày tháng cụ thể
  const datePattern = /ngày (\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
  const monthPattern = /tháng (\d{1,2})[/-](\d{4})/;
  const quarterPattern = /quý (\d{1})[/-](\d{4})/;
  const yearPattern = /năm (\d{4})/;

  const dateMatch = lowerQuestion.match(datePattern);
  if (dateMatch) {
    const [_, day, month, year] = dateMatch;
    return { 
      type: 'day',
      date: new Date(+year, +month - 1, +day)
    };
  }

  const monthMatch = lowerQuestion.match(monthPattern);
  if (monthMatch) {
    const [_, month, year] = monthMatch;
    return {
      type: 'month',
      year: +year,
      month: +month
    };
  }

  const quarterMatch = lowerQuestion.match(quarterPattern);
  if (quarterMatch) {
    const [_, quarter, year] = quarterMatch;
    return {
      type: 'quarter',
      year: +year,
      quarter: +quarter
    };
  }

  const yearMatch = lowerQuestion.match(yearPattern);
  if (yearMatch) {
    const [_, year] = yearMatch;
    return {
      type: 'year',
      year: +year
    };
  }

  return { type: 'none' };
};

// Add these interfaces
export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currentBalance: number;
  createdAt: string;
  lastResetDate: string;
  lastProcessedTime?: number; // New field to track processed transactions
  isActive: boolean;
}

interface UserBalance {
  totalBalance: number;
  currentBalance: number;
  lastResetDate: string;
}

export const updateWallet = async (userId: string, wallet: Wallet): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  
  const wallets = await getWallets(userId);
  const updatedWallets = wallets.map(w => 
    w.id === wallet.id ? wallet : w
  );
  
  await saveWallets(userId, updatedWallets);
};
// Add these functions
export const saveWallets = async (userId: string, wallets: Wallet[]): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  
  const storage = getStorage();
  const walletsPath = `wallets/${userId}/wallets.json`;
  const fileRef = ref(storage, walletsPath);

  try {
    const blob = new Blob([JSON.stringify(wallets)], { type: 'application/json' });
    await uploadBytes(fileRef, blob);
  } catch (error) {
    console.error('Error saving wallets:', error);
    throw error;
  }
};

export const getWallets = async (userId: string): Promise<Wallet[]> => {
  if (!userId) throw new Error('User ID is required');

  const storage = getStorage();
  const walletsPath = `wallets/${userId}/wallets.json`;
  const fileRef = ref(storage, walletsPath);

  try {
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch wallets data');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    // Khi chưa có ví, trả về mảng rỗng và không log lỗi
    if (error.code === 'storage/object-not-found') {
      console.log('You haven\'t added any wallets yet. Please create a new wallet.'); 
      return [];
    }
    // Log các lỗi khác nếu có
    console.error('Error getting wallets:', error);
    throw error;
  }
};

export const saveUserBalance = async (userId: string, balance: UserBalance): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  
  const storage = getStorage();
  const balancePath = `balances/${userId}/balance.json`;
  const fileRef = ref(storage, balancePath);

  try {
    const blob = new Blob([JSON.stringify(balance)], { type: 'application/json' });
    await uploadBytes(fileRef, blob);
  } catch (error) {
    console.error('Error saving balance:', error);
    throw error;
  }
};

export const getUserBalance = async (userId: string): Promise<UserBalance | null> => {
  if (!userId) throw new Error('User ID is required');

  const storage = getStorage();
  const balancePath = `balances/${userId}/balance.json`;
  const fileRef = ref(storage, balancePath);

  try {
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    return null;
  }
};

// Add this new function to calculate daily trends
export const calculateDailyTrends = async (userId: string): Promise<{
  expenseTrend: number;
  incomeTrend: number;
}> => {
  // Get today's date
  const today = new Date();
  
  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  try {
    // Get today's expenses
    const todayExpenses = await getDailyExpenses(userId, today);
    
    // Get yesterday's expenses
    const yesterdayExpenses = await getDailyExpenses(userId, yesterday);

    // Calculate totals for today
    const todayTotals = todayExpenses.reduce(
      (acc, expense) => {
        const amount = parseFloat(expense.amount);
        if (expense.type === 'expense') {
          acc.expenses += amount;
        } else {
          acc.income += amount;
        }
        return acc;
      },
      { expenses: 0, income: 0 }
    );

    // Calculate totals for yesterday
    const yesterdayTotals = yesterdayExpenses.reduce(
      (acc, expense) => {
        const amount = parseFloat(expense.amount);
        if (expense.type === 'expense') {
          acc.expenses += amount;
        } else {
          acc.income += amount;
        }
        return acc;
      },
      { expenses: 0, income: 0 }
    );

    // Calculate percentage changes
    const expenseTrend = yesterdayTotals.expenses === 0 
      ? 0 
      : ((todayTotals.expenses - yesterdayTotals.expenses) / yesterdayTotals.expenses) * 100;

    const incomeTrend = yesterdayTotals.income === 0 
      ? 0 
      : ((todayTotals.income - yesterdayTotals.income) / yesterdayTotals.income) * 100;

    return {
      expenseTrend: Number(expenseTrend.toFixed(2)),
      incomeTrend: Number(incomeTrend.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculating daily trends:', error);
    return {
      expenseTrend: 0,
      incomeTrend: 0
    };
  }
};

// Add this new function
export const getAllExpenses = async (userId: string): Promise<Expense[]> => {
  if (!userId) throw new Error('User ID is required');

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // First day of current month
  const endDate = today; // Current date
  
  try {
    const fileUrls = await getCSVFilesInRange(userId, startDate, endDate);
    const allExpenses: Expense[] = [];
    
    for (const url of fileUrls) {
      const response = await fetch(url);
      const csvContent = await response.text();
      const expenses = parseCSVToExpenses(csvContent);
      allExpenses.push(...expenses);
    }
    
    return allExpenses;
  } catch (error) {
    console.error('Error getting all expenses:', error);
    return [];
  }
};

export const updateWalletBalance = async (userId: string, walletId: string, newCurrentBalance: number): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  
  try {
    const wallets = await getWallets(userId);
    const updatedWallets = wallets.map(wallet => 
      wallet.id === walletId 
        ? { ...wallet, currentBalance: newCurrentBalance }
        : wallet
    );
    
    await saveWallets(userId, updatedWallets);
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw error;
  }
};

// Add these interfaces
export interface SavingGoal {
  id: string;
  name: string;
  goal: number;
  current: number;
  createdAt: string;
  targetDate: string;
  description?: string;
}

// Add these functions for savings management
export const saveSavingGoals = async (userId: string, goals: SavingGoal[]): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  
  const storage = getStorage();
  const savingsPath = `savings/${userId}/goals.json`;
  const fileRef = ref(storage, savingsPath);

  try {
    const blob = new Blob([JSON.stringify(goals)], { type: 'application/json' });
    await uploadBytes(fileRef, blob);
  } catch (error) {
    console.error('Error saving saving goals:', error);
    throw error;
  }
};

export const getSavingGoals = async (userId: string): Promise<SavingGoal[]> => {
  if (!userId) throw new Error('User ID is required');

  const storage = getStorage();
  const savingsPath = `savings/${userId}/goals.json`;
  const fileRef = ref(storage, savingsPath);

  try {
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch savings data');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return [];
    }
    console.error('Error getting saving goals:', error);
    throw error;
  }
};

// Add function to update a specific saving goal
export const updateSavingGoal = async (
  userId: string, 
  goalId: string, 
  updates: Partial<SavingGoal>
): Promise<void> => {
  const goals = await getSavingGoals(userId);
  const updatedGoals = goals.map(goal => 
    goal.id === goalId ? { ...goal, ...updates } : goal
  );
  await saveSavingGoals(userId, updatedGoals);
};

// Thêm vào file storage.tsx
export const addToSavingGoal = async (userId: string, goalNameOrId: string, amount: number): Promise<{
  success: boolean;
  goal?: SavingGoal;
  message?: string;
}> => {
  // Lấy danh sách mục tiêu
  const goals = await getSavingGoals(userId);
  
  // Tìm mục tiêu phù hợp (theo ID hoặc tên tương tự)
  const goal = goals.find(g => 
    g.id === goalNameOrId || 
    g.name.toLowerCase().includes(goalNameOrId.toLowerCase())
  );
  
  if (!goal) {
    return { success: false, message: `Không tìm thấy mục tiêu tiết kiệm "${goalNameOrId}"` };
  }
  
  // Cập nhật số tiền
  const updatedGoal = {
    ...goal,
    current: goal.current + amount
  };
  
  // Cập nhật mục tiêu cụ thể
  await updateSavingGoal(userId, goal.id, { current: updatedGoal.current });
  
  return { success: true, goal: updatedGoal };
};