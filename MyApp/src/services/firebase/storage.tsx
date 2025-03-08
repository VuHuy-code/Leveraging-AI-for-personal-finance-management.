import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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

    // Cập nhật tổng chi tiêu từng mục
    await updateCategoryTotals(userId, {
      category: expenseData.category,
      amount: expenseData.amount,
      type: expenseData.type,
    });

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
  lastProcessedTime?: number;
  isActive: boolean;
}

interface UserBalance {
  totalBalance: number;
  currentBalance: number;
  lastResetDate: string;
}

// 📌 Trả về đường dẫn Firebase Storage của ví người dùng
const getWalletPath = (userId: string) => `wallets/${userId}/wallet.json`;
const getBalancePath = (userId: string) => `balances/${userId}/balance.json`;

/**
 * 🏦 Lấy ví của người dùng
 */
export const getWallet = async (userId: string): Promise<Wallet | null> => {
  if (!userId) throw new Error("User ID is required");

  const storage = getStorage();
  const fileRef = ref(storage, getWalletPath(userId));

  try {
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    return await response.json();
  } catch (error: any) {
    if (error.code === "storage/object-not-found") {
      console.log("No wallet found. Please create a new wallet.");
      return null;
    }
    console.error("Error getting wallet:", error);
    throw error;
  }
};

/**
 * 💾 Lưu ví vào Firebase Storage
 */
// In services/firebase/storage.tsx

export const saveWallet = async (userId: string, wallet: Wallet | null): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  const storage = getStorage();
  const walletPath = `wallets/${userId}/wallet.json`;
  const fileRef = ref(storage, walletPath);

  try {
    if (wallet === null) {
      // Delete the wallet if null is passed
      await deleteObject(fileRef);
      return;
    }

    // Otherwise save/update the wallet
    const walletData = JSON.stringify(wallet);
    const file = new Blob([walletData], { type: 'application/json' });
    await uploadBytes(fileRef, file);
    console.log('Wallet saved successfully');
  } catch (error) {
    console.error('Error saving wallet:', error);
    throw error;
  }
};


/**
 * 🔄 Cập nhật thông tin ví
 */
export const updateWallet = async (userId: string, updatedWallet: Wallet): Promise<void> => {
  if (!userId) throw new Error("User ID is required");

  try {
    await saveWallet(userId, updatedWallet);
  } catch (error) {
    console.error("Error updating wallet:", error);
    throw error;
  }
};

/**
 * 💰 Cập nhật số dư hiện tại của ví
 */
export const updateWalletBalance = async (userId: string, newCurrentBalance: number): Promise<void> => {
  if (!userId) throw new Error("User ID is required");

  try {
    const wallet = await getWallet(userId);
    if (!wallet) throw new Error("Wallet not found");

    wallet.currentBalance = newCurrentBalance;
    await saveWallet(userId, wallet);
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    throw error;
  }
};

/**
 * 💾 Lưu số dư tổng của người dùng
 */
export const saveUserBalance = async (userId: string, balance: UserBalance): Promise<void> => {
  if (!userId) throw new Error("User ID is required");

  const storage = getStorage();
  const fileRef = ref(storage, getBalancePath(userId));

  try {
    const blob = new Blob([JSON.stringify(balance)], { type: "application/json" });
    await uploadBytes(fileRef, blob);
  } catch (error) {
    console.error("Error saving balance:", error);
    throw error;
  }
};

/**
 * 📊 Lấy số dư tổng của người dùng
 */
export const getUserBalance = async (userId: string): Promise<UserBalance | null> => {
  if (!userId) throw new Error("User ID is required");

  const storage = getStorage();
  const fileRef = ref(storage, getBalancePath(userId));

  try {
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    return null;
  }
};

/**
 * 📉 Tính toán xu hướng thu nhập và chi tiêu hàng ngày
 */
export const calculateDailyTrends = async (userId: string): Promise<{
  expenseTrend: number;
  incomeTrend: number;
}> => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  try {
    const todayExpenses = await getDailyExpenses(userId, today);
    const yesterdayExpenses = await getDailyExpenses(userId, yesterday);

    const todayTotals = todayExpenses.reduce(
      (acc, expense) => {
        const amount = parseFloat(expense.amount);
        if (expense.type === "expense") acc.expenses += amount;
        else acc.income += amount;
        return acc;
      },
      { expenses: 0, income: 0 }
    );

    const yesterdayTotals = yesterdayExpenses.reduce(
      (acc, expense) => {
        const amount = parseFloat(expense.amount);
        if (expense.type === "expense") acc.expenses += amount;
        else acc.income += amount;
        return acc;
      },
      { expenses: 0, income: 0 }
    );

    const expenseTrend = yesterdayTotals.expenses === 0
      ? 0
      : ((todayTotals.expenses - yesterdayTotals.expenses) / yesterdayTotals.expenses) * 100;

    const incomeTrend = yesterdayTotals.income === 0
      ? 0
      : ((todayTotals.income - yesterdayTotals.income) / yesterdayTotals.income) * 100;

    return {
      expenseTrend: Number(expenseTrend.toFixed(2)),
      incomeTrend: Number(incomeTrend.toFixed(2)),
    };
  } catch (error) {
    console.error("Error calculating daily trends:", error);
    return { expenseTrend: 0, incomeTrend: 0 };
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

interface DailyCategoryTotal {
  date: string; // YYYY-MM-DD
  totalExpense: number;
  totalIncome: number;
}

interface CategoryTotal {
  category: string;
  dailyTotals: DailyCategoryTotal[]; // Tổng chi tiêu và thu nhập theo ngày
  totalExpense: number; // Tổng chi tiêu trong tháng
  totalIncome: number; // Tổng thu nhập trong tháng
}

const getCategoryTotalsPath = (userId: string, date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `categoryTotals/${userId}/${year}-${month}/totals.json`;
};

export const updateCategoryTotals = async (
  userId: string,
  expenseData: {
    category: string;
    amount: string;
    type: 'income' | 'expense';
  }
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  const expenseDate = new Date(); // Sử dụng ngày hiện tại để xác định tháng và ngày
  const storage = getStorage();
  const fileRef = ref(storage, getCategoryTotalsPath(userId, expenseDate));

  try {
    let existingTotals: CategoryTotal[] = [];

    // Kiểm tra xem file tồn tại chưa
    try {
      const url = await getDownloadURL(fileRef);
      const response = await fetch(url);
      existingTotals = await response.json();
    } catch (error) {
      console.log('No existing category totals found. Creating new file.');
    }

    const amount = parseFloat(expenseData.amount);
    const dateKey = expenseDate.toISOString().split('T')[0]; // Lấy ngày dưới dạng YYYY-MM-DD

    const categoryIndex = existingTotals.findIndex(
      (item) => item.category === expenseData.category
    );

    if (categoryIndex !== -1) {
      // Cập nhật tổng chi tiêu hoặc thu nhập nếu danh mục đã tồn tại
      const category = existingTotals[categoryIndex];

      // Tìm ngày trong dailyTotals
      const dailyTotalIndex = category.dailyTotals.findIndex(
        (daily) => daily.date === dateKey
      );

      if (dailyTotalIndex !== -1) {
        // Cập nhật tổng chi tiêu hoặc thu nhập theo ngày
        if (expenseData.type === 'expense') {
          category.dailyTotals[dailyTotalIndex].totalExpense += amount;
          category.totalExpense += amount;
        } else {
          category.dailyTotals[dailyTotalIndex].totalIncome += amount;
          category.totalIncome += amount;
        }
      } else {
        // Thêm mới tổng chi tiêu hoặc thu nhập theo ngày
        category.dailyTotals.push({
          date: dateKey,
          totalExpense: expenseData.type === 'expense' ? amount : 0,
          totalIncome: expenseData.type === 'income' ? amount : 0,
        });

        // Cập nhật tổng tháng
        if (expenseData.type === 'expense') {
          category.totalExpense += amount;
        } else {
          category.totalIncome += amount;
        }
      }
    } else {
      // Thêm danh mục mới nếu chưa tồn tại
      existingTotals.push({
        category: expenseData.category,
        dailyTotals: [
          {
            date: dateKey,
            totalExpense: expenseData.type === 'expense' ? amount : 0,
            totalIncome: expenseData.type === 'income' ? amount : 0,
          },
        ],
        totalExpense: expenseData.type === 'expense' ? amount : 0,
        totalIncome: expenseData.type === 'income' ? amount : 0,
      });
    }

    // Lưu lại vào file
    const blob = new Blob([JSON.stringify(existingTotals)], {
      type: 'application/json',
    });
    await uploadBytes(fileRef, blob);
  } catch (error) {
    console.error('Error updating category totals:', error);
    throw error;
  }
};

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
export const getCategoryTotals = async (userId: string, date: Date): Promise<CategoryTotal[]> => {
  if (!userId) throw new Error('User ID is required');

  const storage = getStorage();
  const fileRef = ref(storage, getCategoryTotalsPath(userId, date));

  try {
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    const data = await response.json(); // Parse JSON
    return data;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return [];
    }
    console.error('Error getting category totals:', error);
    throw error;
  }
};

// Add this new function after getExpensesFromCSV

export const updateExpenseInCSV = async (
  userId: string,
  timestamp: string,
  updatedExpense: Expense
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');

  // Get the date from the timestamp to determine which file to update
  const expenseDate = new Date(timestamp);
  const storagePath = getExpenseStoragePath(userId, expenseDate);
  const storage = getStorage();
  const fileRef = ref(storage, storagePath);

  try {
    // Get existing content
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    const csvContent = await response.text();

    // Parse the CSV to get all expenses for that day
    const expenses = parseCSVToExpenses(csvContent);

    // Find and replace the specific expense
    const expenseIndex = expenses.findIndex(exp =>
      exp.timestamp === timestamp
    );

    if (expenseIndex === -1) {
      throw new Error('Transaction not found in CSV file');
    }

    // Replace the old expense with the updated one
    const oldExpense = expenses[expenseIndex];
    expenses[expenseIndex] = updatedExpense;

    // Convert back to CSV
    const updatedCsvContent = convertExpensesToCSV(expenses, true);

    // Save back to Firebase
    const blob = new Blob([updatedCsvContent], { type: 'text/csv' });
    await uploadBytes(fileRef, blob);

    // Update the transaction cache
    if (transactionCache && transactionCache.userId === userId) {
      const cachedIndex = transactionCache.transactions.findIndex(exp =>
        exp.timestamp === timestamp
      );
      if (cachedIndex !== -1) {
        transactionCache.transactions[cachedIndex] = updatedExpense;
      }
    }

    // Adjust category totals for the old and new expense
    await adjustCategoryTotalsForUpdate(userId, oldExpense, updatedExpense);

    console.log('Transaction updated successfully');
  } catch (error) {
    console.error('Error updating transaction in CSV:', error);
    throw error;
  }
};

// Helper function to adjust category totals when an expense is updated
const adjustCategoryTotalsForUpdate = async (
  userId: string,
  oldExpense: Expense,
  newExpense: Expense
): Promise<void> => {
  try {
    const oldDate = new Date(oldExpense.timestamp);
    const newDate = new Date(newExpense.timestamp);

    // If the date has changed, we need to adjust totals for both months
    if (oldDate.getMonth() !== newDate.getMonth() || oldDate.getFullYear() !== newDate.getFullYear()) {
      // Remove the old expense from the old month's totals
      await adjustCategoryTotalsForRemoval(userId, oldExpense);

      // Add the new expense to the new month's totals
      await adjustCategoryTotals(userId, newExpense);
    } else {
      // If the date is the same, just adjust the totals for that month
      const categoryTotals = await getCategoryTotals(userId, newDate);

      // Find the old category and subtract the old amount
      const oldCategoryIndex = categoryTotals.findIndex(cat => cat.category === oldExpense.category);
      if (oldCategoryIndex !== -1) {
        if (oldExpense.type === 'expense') {
          categoryTotals[oldCategoryIndex].totalExpense -= parseFloat(oldExpense.amount);
        } else {
          categoryTotals[oldCategoryIndex].totalIncome -= parseFloat(oldExpense.amount);
        }
      }

      // Find the new category and add the new amount
      const newCategoryIndex = categoryTotals.findIndex(cat => cat.category === newExpense.category);
      if (newCategoryIndex !== -1) {
        if (newExpense.type === 'expense') {
          categoryTotals[newCategoryIndex].totalExpense += parseFloat(newExpense.amount);
        } else {
          categoryTotals[newCategoryIndex].totalIncome += parseFloat(newExpense.amount);
        }
      } else {
        // If the category is new, add it to the list with an empty dailyTotals array
        categoryTotals.push({
          category: newExpense.category,
          totalExpense: newExpense.type === 'expense' ? parseFloat(newExpense.amount) : 0,
          totalIncome: newExpense.type === 'income' ? parseFloat(newExpense.amount) : 0,
          dailyTotals: [] // Thêm thuộc tính dailyTotals với giá trị mảng rỗng
        });
      }

      // Save the updated totals
      const storage = getStorage();
      const fileRef = ref(storage, getCategoryTotalsPath(userId, newDate));
      const blob = new Blob([JSON.stringify(categoryTotals)], { type: 'application/json' });
      await uploadBytes(fileRef, blob);
    }
  } catch (error) {
    console.error('Error adjusting category totals for update:', error);
    throw error;
  }
};

// Helper function to adjust category totals when an expense is removed
const adjustCategoryTotalsForRemoval = async (
  userId: string,
  expense: Expense
): Promise<void> => {
  try {
    const expenseDate = new Date(expense.timestamp);
    const categoryTotals = await getCategoryTotals(userId, expenseDate);

    // Find the category and subtract the amount
    const categoryIndex = categoryTotals.findIndex(cat => cat.category === expense.category);
    if (categoryIndex !== -1) {
      if (expense.type === 'expense') {
        categoryTotals[categoryIndex].totalExpense -= parseFloat(expense.amount);
      } else {
        categoryTotals[categoryIndex].totalIncome -= parseFloat(expense.amount);
      }

      // If the total for the category is zero, remove it from the list
      if (categoryTotals[categoryIndex].totalExpense === 0 && categoryTotals[categoryIndex].totalIncome === 0) {
        categoryTotals.splice(categoryIndex, 1);
      }

      // Save the updated totals
      const storage = getStorage();
      const fileRef = ref(storage, getCategoryTotalsPath(userId, expenseDate));
      const blob = new Blob([JSON.stringify(categoryTotals)], { type: 'application/json' });
      await uploadBytes(fileRef, blob);
    }
  } catch (error) {
    console.error('Error adjusting category totals for removal:', error);
    throw error;
  }
};

// Function to adjust category totals when a transaction is updated
// Improve the adjustCategoryTotals function

export const adjustCategoryTotals = async (
  userId: string,
  expense: Expense
): Promise<void> => {
  try {
    const expenseDate = new Date(expense.timestamp); // Sử dụng ngày của giao dịch để xác định tháng
    const categoryTotals = await getCategoryTotals(userId, expenseDate);

    // Find the category
    const categoryIndex = categoryTotals.findIndex(cat => cat.category === expense.category);
    const amount = parseFloat(expense.amount);

    // Update or create the category totals
    if (categoryIndex !== -1) {
      // Update existing category
      if (expense.type === 'expense') {
        // Add the transaction amount to the category total
        categoryTotals[categoryIndex].totalExpense += amount;
      } else {
        // Add the transaction amount to the income total
        categoryTotals[categoryIndex].totalIncome += amount;
      }
    } else {
      // Create new category entry
      categoryTotals.push({
        category: expense.category,
        totalExpense: expense.type === 'expense' ? amount : 0,
        totalIncome: expense.type === 'income' ? amount : 0,
        dailyTotals: [] // Thêm thuộc tính dailyTotals với giá trị mảng rỗng
      });
    }

    // Save updated totals
    const storage = getStorage();
    const fileRef = ref(storage, getCategoryTotalsPath(userId, expenseDate));
    const blob = new Blob([JSON.stringify(categoryTotals)], { type: 'application/json' });
    await uploadBytes(fileRef, blob);

  } catch (error) {
    console.error('Error adjusting category totals:', error);
    throw error;
  }
};

export const getDailyCategoryTotals = async (
  userId: string,
  date: Date,
  category: string
): Promise<DailyCategoryTotal[]> => {
  const categoryTotals = await getCategoryTotals(userId, date);
  const categoryData = categoryTotals.find((cat) => cat.category === category);

  if (categoryData) {
    return categoryData.dailyTotals;
  }

  return [];
};