import React, { createContext, useContext, useState } from 'react';

interface TransactionContextType {
  refreshKey: number;
  refreshTransactions: () => void;
}

const TransactionContext = createContext<TransactionContextType>({
  refreshKey: 0,
  refreshTransactions: () => {},
});

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshTransactions = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <TransactionContext.Provider value={{ refreshKey, refreshTransactions }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => useContext(TransactionContext);