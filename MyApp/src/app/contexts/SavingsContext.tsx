import React, { createContext, useState, useContext, useEffect } from 'react';
import { getSavingGoals, saveSavingGoals, SavingGoal } from '../../services/firebase/storage';
import { useAuth } from '../hooks/useAuth';

interface SavingsContextType {
  savingGoals: SavingGoal[];
  loading: boolean;
  error: string | null;
  fetchSavingGoals: () => Promise<void>;
  addSavingGoal: (newGoal: Omit<SavingGoal, 'id'>) => Promise<void>;
  updateSavingGoal: (id: string, updates: Partial<SavingGoal>) => Promise<void>;
  deleteSavingGoal: (id: string) => Promise<void>;
  totalCurrent: number;
  totalGoal: number;
}

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

export const SavingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCurrent, setTotalCurrent] = useState(0);
  const [totalGoal, setTotalGoal] = useState(0);

  // Fetch saving goals from Firebase
  const fetchSavingGoals = async () => {
    if (!user?.uid) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const goals = await getSavingGoals(user.uid);
      setSavingGoals(goals);

      // Calculate totals
      const current = goals.reduce((sum, goal) => sum + goal.current, 0);
      const goal = goals.reduce((sum, goal) => sum + goal.goal, 0);

      setTotalCurrent(current);
      setTotalGoal(goal);

    } catch (err) {
      console.error('Error fetching saving goals:', err);
      setError('Failed to fetch saving goals');
    } finally {
      setLoading(false);
    }
  };

  // Add a new saving goal
  const addSavingGoal = async (newGoal: Omit<SavingGoal, 'id'>) => {
    if (!user?.uid) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generate a unique ID for the new goal
      const goalId = Date.now().toString();
      const goalWithId: SavingGoal = {
        ...newGoal,
        id: goalId
      };

      // Add to the existing goals
      const updatedGoals = [...savingGoals, goalWithId];

      // Save to Firebase
      await saveSavingGoals(user.uid, updatedGoals);

      // Update local state
      setSavingGoals(updatedGoals);
      setTotalCurrent(prev => prev + goalWithId.current);
      setTotalGoal(prev => prev + goalWithId.goal);

      console.log('Saving goal added successfully:', goalWithId);

    } catch (err) {
      console.error('Error adding saving goal:', err);
      setError('Failed to add saving goal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing saving goal
  const updateSavingGoal = async (id: string, updates: Partial<SavingGoal>) => {
    if (!user?.uid) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Find the goal to update
      const goalIndex = savingGoals.findIndex(goal => goal.id === id);
      if (goalIndex === -1) {
        throw new Error(`Goal with ID ${id} not found`);
      }

      // Create updated goal and goals array
      const oldGoal = savingGoals[goalIndex];
      const updatedGoal = { ...oldGoal, ...updates };
      const updatedGoals = [...savingGoals];
      updatedGoals[goalIndex] = updatedGoal;

      // Save to Firebase
      await saveSavingGoals(user.uid, updatedGoals);

      // Update local state
      setSavingGoals(updatedGoals);

      // Update totals if necessary
      if (updates.current !== undefined || updates.goal !== undefined) {
        const currentDiff = updates.current !== undefined ? updates.current - oldGoal.current : 0;
        const goalDiff = updates.goal !== undefined ? updates.goal - oldGoal.goal : 0;

        setTotalCurrent(prev => prev + currentDiff);
        setTotalGoal(prev => prev + goalDiff);
      }

    } catch (err) {
      console.error('Error updating saving goal:', err);
      setError('Failed to update saving goal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a saving goal
  const deleteSavingGoal = async (id: string) => {
    if (!user?.uid) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Find the goal to delete
      const goalToDelete = savingGoals.find(goal => goal.id === id);
      if (!goalToDelete) {
        throw new Error(`Goal with ID ${id} not found`);
      }

      // Remove from goals array
      const updatedGoals = savingGoals.filter(goal => goal.id !== id);

      // Save to Firebase
      await saveSavingGoals(user.uid, updatedGoals);

      // Update local state
      setSavingGoals(updatedGoals);
      setTotalCurrent(prev => prev - goalToDelete.current);
      setTotalGoal(prev => prev - goalToDelete.goal);

    } catch (err) {
      console.error('Error deleting saving goal:', err);
      setError('Failed to delete saving goal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load goals when the user changes
  useEffect(() => {
    if (user?.uid) {
      fetchSavingGoals();
    } else {
      setSavingGoals([]);
      setTotalCurrent(0);
      setTotalGoal(0);
      setLoading(false);
    }
  }, [user?.uid]);

  return (
    <SavingsContext.Provider value={{
      savingGoals,
      loading,
      error,
      fetchSavingGoals,
      addSavingGoal,
      updateSavingGoal,
      deleteSavingGoal,
      totalCurrent,
      totalGoal
    }}>
      {children}
    </SavingsContext.Provider>
  );
};

export const useSavings = () => {
  const context = useContext(SavingsContext);
  if (context === undefined) {
    throw new Error('useSavings must be used within a SavingsProvider');
  }
  return context;
};
