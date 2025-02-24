import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWallets, saveWallets } from '../../services/firebase/storage';
import { useAuth } from '../hooks/useAuth';

export interface Wallet {
  id: string;
  name: string;
  balance: number;      // This is the fixed total balance
  currentBalance: number; // This is the daily running balance
  createdAt: string;
  lastResetDate: string;
  isActive: boolean;
}

interface WalletContextType {
  wallets: Wallet[];
  activeWallet: Wallet | null;
  loadWallets: () => Promise<void>;
  createWallet: (name: string, initialBalance: number) => Promise<void>;
  selectWallet: (walletId: string) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
  updateWallet: (walletId: string, updates: Partial<Wallet>) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<Wallet | null>(null);

  const loadWallets = async () => {
    if (!user) return; // Check if user is null
    try {
      const userWallets = await getWallets(user.uid);
      setWallets(userWallets);
      const active = userWallets.find(w => w.isActive);
      if (active) {
        setActiveWallet(active);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const createWallet = async (name: string, initialBalance: number) => {
    if (!user) return;
    
    // Check if a wallet already exists
    if (wallets.length > 0) {
      console.error('Only one wallet is allowed');
      return;
    }
  
    const newWallet: Wallet = {
      id: Date.now().toString(),
      name,
      balance: initialBalance,      // Initial balance that won't change
      currentBalance: initialBalance, // Current balance that will change with transactions
      createdAt: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
      isActive: true // Always active since it's the only wallet
    };
  
    const updatedWallets = [newWallet];
    await saveWallets(user.uid, updatedWallets);
    setWallets(updatedWallets);
    setActiveWallet(newWallet);
  };

  const selectWallet = async (walletId: string) => {
    if (!user) return;

    const updatedWallets = wallets.map(w => ({
      ...w,
      isActive: w.id === walletId
    }));

    try {
      await saveWallets(user.uid, updatedWallets);
      setWallets(updatedWallets);
      const newActiveWallet = updatedWallets.find(w => w.id === walletId) || null;
      setActiveWallet(newActiveWallet);
    } catch (error) {
      console.error('Error selecting wallet:', error);
    }
  };

  const deleteWallet = async (walletId: string) => {
    if (!user) return;

    const updatedWallets = wallets.filter(w => w.id !== walletId);
    
    // If we're deleting the active wallet, set the first remaining wallet as active
    if (updatedWallets.length > 0 && activeWallet?.id === walletId) {
      updatedWallets[0].isActive = true;
    }

    try {
      await saveWallets(user.uid, updatedWallets);
      setWallets(updatedWallets);
      
      // Update active wallet if needed
      if (activeWallet?.id === walletId) {
        setActiveWallet(updatedWallets.length > 0 ? updatedWallets[0] : null);
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };

  const updateWallet = async (walletId: string, updates: Partial<Wallet>) => {
    if (!user) return;

    const updatedWallets = wallets.map(wallet => 
      wallet.id === walletId 
        ? { ...wallet, ...updates }
        : wallet
    );

    try {
      await saveWallets(user.uid, updatedWallets);
      setWallets(updatedWallets);
      const updatedActiveWallet = updatedWallets.find(w => w.id === activeWallet?.id) || null;
      setActiveWallet(updatedActiveWallet);
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadWallets();
  }, [user]);

  return (
    <WalletContext.Provider value={{ 
      wallets, 
      activeWallet, 
      loadWallets, 
      createWallet, 
      selectWallet,
      deleteWallet,
      updateWallet
    }}>
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
