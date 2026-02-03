
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '@/services/api';
import { useAuth } from './AuthContext';

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  receiptImage?: string;
}

interface ExpenseContextType {
  expenses: Expense[];
  floatBalance: number;
  floatId: number | null;
  loading: boolean;
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
  getTotalExpenses: () => number;
  getRemainingBalance: () => number;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const STORAGE_KEY_EXPENSES = '@expenses';
const STORAGE_KEY_FLOAT = '@float_balance';
const INITIAL_FLOAT_BALANCE = 1500.00; // R1500.00

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [floatBalance, setFloatBalance] = useState(INITIAL_FLOAT_BALANCE);
  const [floatId, setFloatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  // Helper function to get current float from tours
  const getCurrentFloat = async (): Promise<any | null> => {
    try {
      const toursResponse = await api.getTours();
      if (!toursResponse.success || !toursResponse.data) {
        return null;
      }

      const tours = toursResponse.data;
      if (tours.length === 0) {
        return null;
      }

      // Get last tour
      const currentTour = tours[tours.length - 1];

      if (!currentTour?.floats || currentTour.floats.length === 0) {
        return null;
      }

      // 🔥 Get float with highest ID
      const latestFloat = [...currentTour.floats].sort(
        (a, b) => b.id - a.id
      )[0];
      console.log('Returned float => ',latestFloat)
      return latestFloat;
    } catch (error) {
      return null;
    }
  };

  // Load expenses and float balance from storage on mount
  useEffect(() => {
    loadExpensesFromStorage();
  }, []);

  const loadExpensesFromStorage = async () => {
    setLoading(true);

    try {
      // Get current float first
      const currentFloat = await getCurrentFloat();
      if (!currentFloat) {
        await loadFromLocalStorage();
        return;
      }

      const currentFloatId = currentFloat.id;
      const floatBalance = currentFloat.balance / 100

      setFloatId(currentFloatId);

      // Try to load expenses from API first
      const apiResponse = await api.getExpensesByFloatId(currentFloatId);

      if (apiResponse.success && apiResponse.data) {
        // Extract expenses array from response
        let apiExpenses: Expense[] = [];
        if (Array.isArray(apiResponse.data)) {
          apiExpenses = apiResponse.data.map((exp: any) => ({ ...exp, amount: exp.amount / 100 }));
        } else if (apiResponse.data.expenses && Array.isArray(apiResponse.data.expenses)) {
          apiExpenses = apiResponse.data.expenses.map((exp: any) => ({ ...exp, amount: exp.amount / 100 }));
        } else if (apiResponse.data.data && Array.isArray(apiResponse.data.data)) {
          apiExpenses = apiResponse.data.data.map((exp: any) => ({ ...exp, amount: exp.amount / 100 }));
        }

        setExpenses(apiExpenses);
        setFloatBalance(floatBalance);
        // Save to local storage as backup
        await AsyncStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(apiExpenses));
        await AsyncStorage.setItem(STORAGE_KEY_FLOAT, floatBalance.toString());
      } else {
        // Fallback to local storage
        await loadFromLocalStorage();
      }
    } catch (error) {
      // Try local storage as last resort
      await loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem(STORAGE_KEY_EXPENSES);
      const storedFloat = await AsyncStorage.getItem(STORAGE_KEY_FLOAT);

      if (storedExpenses) {
        const parsedExpenses = JSON.parse(storedExpenses);
        setExpenses(parsedExpenses);
      }

      if (storedFloat) {
        const parsedFloat = parseFloat(storedFloat);
        setFloatBalance(parsedFloat);
      }
    } catch (storageError) {
      // Error handled silently
    }
  };

  const saveExpensesToStorage = async (newExpenses: Expense[], newBalance: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(newExpenses));
      await AsyncStorage.setItem(STORAGE_KEY_FLOAT, newBalance.toString());
    } catch (error) {
      // Error handled silently
    }
  };

  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'date'>) => {
    try {
      // Call API to add expense
      const apiResponse = await api.addExpense({
        category: expenseData.category,
        amount: Math.round(expenseData.amount * 100),
        description: expenseData.description,
        receiptImage: expenseData.receiptImage,
      });

      if (apiResponse.success) {
        // Extract the created expense from response
        let createdExpense: Expense;
        if (apiResponse.data && apiResponse.data.id) {
          createdExpense = {
            id: apiResponse.data.id,
            category: expenseData.category,
            amount: apiResponse.data.amount ? apiResponse.data.amount / 100 : expenseData.amount,
            description: expenseData.description,
            receiptImage: expenseData.receiptImage,
            date: apiResponse.data.date || new Date().toISOString(),
          };
        } else {
          // Fallback if API doesn't return the expense
          createdExpense = {
            ...expenseData,
            id: Date.now().toString(),
            date: new Date().toISOString(),
          };
        }

        const updatedExpenses = [createdExpense, ...expenses];
        const updatedBalance = floatBalance - expenseData.amount;

        // Update state
        setExpenses(updatedExpenses);
        setFloatBalance(updatedBalance);

        // Save to storage
        await saveExpensesToStorage(updatedExpenses, updatedBalance);
      } else {
        throw new Error(apiResponse.error || 'Failed to add expense');
      }
    } catch (error) {
      throw error;
    }
  }, [expenses, floatBalance]);

  const deleteExpense = useCallback(async (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) {
      throw new Error('Expense not found');
    }

    try {
      // Call API to delete expense
      const apiResponse = await api.deleteExpense(id);

      if (apiResponse.success) {
        const updatedExpenses = expenses.filter(e => e.id !== id);
        const updatedBalance = floatBalance + expense.amount;

        // Update state
        setExpenses(updatedExpenses);
        setFloatBalance(updatedBalance);

        // Save to storage
        await saveExpensesToStorage(updatedExpenses, updatedBalance);
      } else {
        throw new Error(apiResponse.error || 'Failed to delete expense');
      }
    } catch (error) {
      throw error;
    }
  }, [expenses, floatBalance]);

  const refreshExpenses = useCallback(async () => {
    await loadExpensesFromStorage();
  }, []);

  const getTotalExpenses = useCallback(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const getRemainingBalance = useCallback(() => {
    return floatBalance - getTotalExpenses();
  }, [floatBalance, getTotalExpenses]);

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        floatBalance,
        loading,
        addExpense,
        deleteExpense,
        refreshExpenses,
        getTotalExpenses,
        getRemainingBalance,
        floatId
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
