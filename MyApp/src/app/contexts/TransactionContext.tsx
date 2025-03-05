import React, { createContext, useContext, useState, useCallback } from 'react';

interface TransactionContextType {
  refreshKey: number;
  refreshTransactions: () => void;
}

const TransactionContext = createContext<TransactionContextType>({
  refreshKey: 0,
  refreshTransactions: () => {},
});

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshTransactions = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const value = { refreshKey, refreshTransactions };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => useContext(TransactionContext);
