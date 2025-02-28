import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWallet, saveWallet, updateWalletBalance } from '../../services/firebase/storage';
import { useAuth } from '../hooks/useAuth';

export interface Wallet {
  id: string;
  name: string;
  balance: number; // Số dư cố định ban đầu
  currentBalance: number; // Số dư hiện tại thay đổi theo giao dịch
  createdAt: string;
  lastResetDate: string;
  lastProcessedTime?: number;
  isActive: boolean;
}

interface WalletContextType {
  wallet: Wallet | null;
  loadWallet: () => Promise<void>;
  createWallet: (name: string, initialBalance: number) => Promise<void>;
  deleteWallet: () => Promise<void>;
  updateWallet: (updates: Partial<Wallet>) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  /**
   * 🔄 Load ví từ Firebase Storage
   */
  const loadWallet = async () => {
    if (!user) return;
    try {
      const userWallet = await getWallet(user.uid);
      setWallet(userWallet);
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  /**
   * 🏦 Tạo một ví mới (Chỉ 1 ví duy nhất)
   */
  const createWallet = async (name: string, initialBalance: number) => {
    if (!user) return;

    if (wallet) {
      console.error('Only one wallet is allowed');
      return;
    }

    const newWallet: Wallet = {
      id: Date.now().toString(),
      name,
      balance: initialBalance,
      currentBalance: initialBalance,
      createdAt: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
      isActive: true,
    };

    try {
      await saveWallet(user.uid, newWallet);
      setWallet(newWallet);
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  };

  /**
   * 🗑️ Xóa ví của người dùng
   */
  const deleteWallet = async () => {
    if (!user) return;
  
    try {
      await saveWallet(user.uid, null); // ✅ Hợp lệ sau khi sửa `saveWallet`
      setWallet(null);
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };
  

  /**
   * ✏️ Cập nhật ví (Cập nhật số dư, tên,...)
   */
  const updateWallet = async (updates: Partial<Wallet>) => {
    if (!user || !wallet) return;

    const updatedWallet = { ...wallet, ...updates };

    try {
      await saveWallet(user.uid, updatedWallet);
      setWallet(updatedWallet);
    } catch (error) {
      console.error('Error updating wallet:', error);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [user]);

  return (
    <WalletContext.Provider value={{ wallet, loadWallet, createWallet, deleteWallet, updateWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
