// src/services/firebase/firestore.ts

import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

// Thời gian hết hạn cache (5 phút)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Biến cache dữ liệu giao dịch (chỉ lưu trong bộ nhớ)
let transactionCache: {
  transactions: any[];
  timestamp: number;
  userId: string;
} | null = null;

// Lưu thông tin người dùng vào Firestore
export const saveUserProfile = async (uid: string, name?: string, avatarUrl?: string) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { name, avatarUrl }, { merge: true });
    console.log("User profile updated successfully!");
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
};

// Lấy thông tin người dùng từ Firestore
export const getUserProfile = async (uid: string) => {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No user profile found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Lưu giao dịch vào Firestore
export const saveTransaction = async (
  uid: string,
  category: string,
  amount: string,
  title: string = '',
  type: 'income' | 'expense' = 'expense'
) => {
  try {
    const numericAmount = Math.floor(parseFloat(amount.replace(/[^\d]/g, '')));

    const transactionData = {
      category,
      amount: numericAmount,
      title: title || category,
      time: new Date().toLocaleString(),
      type,
      account: 'Cash',
      createdAt: new Date(),
    };

    await addDoc(collection(db, "users", uid, "transactions"), transactionData);

    // Xóa cache sau khi thêm giao dịch mới
    transactionCache = null;

    return true;
  } catch (error) {
    console.error("Error saving transaction:", error);
    throw error;
  }
};

// Lấy danh sách giao dịch với caching bộ nhớ
export const getUserTransactions = async (uid: string) => {
  try {
    // Kiểm tra cache trước
    if (transactionCache && transactionCache.userId === uid && Date.now() - transactionCache.timestamp < CACHE_EXPIRY) {
      return transactionCache.transactions;
    }

    // Nếu cache hết hạn, lấy từ Firestore
    const q = query(
      collection(db, "users", uid, "transactions"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Cập nhật cache
    transactionCache = {
      transactions,
      timestamp: Date.now(),
      userId: uid,
    };

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};
