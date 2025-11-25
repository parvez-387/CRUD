import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Transaction, Loan, Account, UserSettings } from '../types';
import * as db from '../services/db';

interface AppContextType {
  state: AppState;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pin: string) => Promise<boolean>;
  signup: (pin: string) => Promise<void>;
  logout: () => void;
  hasPinSetup: boolean;
  
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  addLoan: (l: Loan) => void;
  addRepayment: (loanId: string, t: Transaction) => void;
  updateSettings: (s: Partial<UserSettings>) => void;
  deleteTransaction: (id: string) => void;
  refreshState: () => Promise<void>;
  addCategory: (type: 'income' | 'expense', name: string) => void;
  removeCategory: (type: 'income' | 'expense', name: string) => void;
  addAccount: (name: string, currency: string) => void;
  removeAccount: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(db.DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPinSetup, setHasPinSetup] = useState(false);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      // Check auth requirements
      const hasPin = await db.hasPin();
      setHasPinSetup(hasPin);
      
      if (!hasPin) {
        // No PIN setup, load data immediately and allow access
        const loaded = await db.loadState();
        setState(loaded);
        setIsAuthenticated(true);
      }
      // If PIN exists, we wait for login() to call loadState()
      setIsLoading(false);
    };
    init();
  }, []);

  // Save on change (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      db.saveState(state);
      // Apply theme
      if (state.settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [state, isAuthenticated, isLoading]);

  const login = async (pin: string) => {
    const isValid = await db.verifyPin(pin);
    if (isValid) {
      const loaded = await db.loadState();
      setState(loaded);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const signup = async (pin: string) => {
    await db.setPin(pin);
    setHasPinSetup(true);
    // If we are setting up for the first time or from settings, ensure state is loaded
    if (!isAuthenticated) {
        const loaded = await db.loadState();
        setState(loaded);
        setIsAuthenticated(true);
    }
  };

  const logout = () => {
      // Clear sensitive state from memory
      setState(db.DEFAULT_STATE);
      setIsAuthenticated(false);
      // Do not use window.location.reload() as it causes white screens in some environments
  };

  const refreshState = async () => {
    const loaded = await db.loadState();
    setState(loaded);
  };

  const addTransaction = (t: Transaction) => {
    setState(prev => {
      const newTransactions = [t, ...prev.transactions];
      const accounts = prev.accounts.map(acc => {
        if (acc.id === t.accountId) {
          let newBalance = acc.balance;
          if (t.type === 'INCOME') newBalance += t.amount;
          if (t.type === 'EXPENSE') newBalance -= t.amount;
          return { ...acc, balance: newBalance };
        }
        return acc;
      });
      return { ...prev, transactions: newTransactions, accounts };
    });
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setState(prev => {
      const oldTx = prev.transactions.find(t => t.id === updatedTx.id);
      if (!oldTx) return prev;

      let accounts = prev.accounts.map(a => {
        if (a.id === oldTx.accountId) {
           let bal = a.balance;
           if (oldTx.type === 'INCOME') bal -= oldTx.amount;
           if (oldTx.type === 'EXPENSE') bal += oldTx.amount;
           return { ...a, balance: bal };
        }
        return a;
      });

      accounts = accounts.map(a => {
        if (a.id === updatedTx.accountId) {
           let bal = a.balance;
           if (updatedTx.type === 'INCOME') bal += updatedTx.amount;
           if (updatedTx.type === 'EXPENSE') bal -= updatedTx.amount;
           return { ...a, balance: bal };
        }
        return a;
      });

      const newTransactions = prev.transactions.map(t => t.id === updatedTx.id ? updatedTx : t);

      let newLoans = prev.loans;
      if (updatedTx.relatedLoanId) {
         newLoans = newLoans.map(loan => {
            if (loan.id === updatedTx.relatedLoanId) {
                const totalRepaid = newTransactions
                  .filter(t => loan.repayments.includes(t.id))
                  .reduce((sum, t) => sum + t.amount, 0);
                  
                const totalDue = loan.principal * (1 + (loan.interestRate||0) / 100);
                let status = loan.status;
                if (totalRepaid >= totalDue - 0.01) status = 'PAID';
                else if (status === 'PAID') status = 'ACTIVE';
                
                return { ...loan, status };
            }
            return loan;
         });
      }

      return { ...prev, accounts, transactions: newTransactions, loans: newLoans };
    });
  };

  const addLoan = (l: Loan) => {
    setState(prev => {
      const newLoans = [l, ...prev.loans];
      const relatedTx: Transaction = {
        id: `tx_${Date.now()}`,
        amount: l.principal,
        type: l.type === 'GIVEN' ? 'EXPENSE' : 'INCOME',
        category: 'Loan Principal',
        date: l.startDate,
        accountId: prev.accounts[0]?.id || 'acc_default', 
        notes: `Loan ${l.type} - ${l.counterparty}`,
        relatedLoanId: l.id
      };

      const accounts = prev.accounts.map(acc => {
         if (acc.id === relatedTx.accountId) {
           return {
             ...acc,
             balance: l.type === 'GIVEN' ? acc.balance - l.principal : acc.balance + l.principal
           };
         }
         return acc;
      });

      return { ...prev, loans: newLoans, transactions: [relatedTx, ...prev.transactions], accounts };
    });
  };

  const addRepayment = (loanId: string, t: Transaction) => {
    setState(prev => {
      const loanIndex = prev.loans.findIndex(l => l.id === loanId);
      if (loanIndex === -1) return prev;
      
      const loan = prev.loans[loanIndex];
      const updatedLoan = { ...loan, repayments: [...loan.repayments, t.id] };
      
      const previousRepayments = prev.transactions
        .filter(tx => loan.repayments.includes(tx.id))
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const totalDue = loan.principal * (1 + (loan.interestRate||0) / 100);
      if (previousRepayments + t.amount >= totalDue - 0.01) {
        updatedLoan.status = 'PAID';
      }

      const newLoans = [...prev.loans];
      newLoans[loanIndex] = updatedLoan;

      const accounts = prev.accounts.map(acc => {
        if (acc.id === t.accountId) {
           const isIncomeForMe = loan.type === 'GIVEN';
           return {
             ...acc,
             balance: isIncomeForMe ? acc.balance + t.amount : acc.balance - t.amount
           };
        }
        return acc;
      });
      
      const realTx: Transaction = { 
        ...t, 
        type: (loan.type === 'GIVEN' ? 'INCOME' : 'EXPENSE'),
        category: 'Loan Repayment',
        relatedLoanId: loanId 
      };

      return { ...prev, loans: newLoans, transactions: [realTx, ...prev.transactions], accounts };
    });
  };

  const deleteTransaction = (id: string) => {
    setState(prev => {
       const tx = prev.transactions.find(t => t.id === id);
       if (!tx) {
           console.warn("Transaction not found for deletion:", id);
           return prev;
       }

       // 1. Revert Balance
       const accounts = prev.accounts.map(acc => {
         if (acc.id === tx.accountId) {
            let revBalance = acc.balance;
            if (tx.type === 'INCOME') revBalance -= tx.amount;
            if (tx.type === 'EXPENSE') revBalance += tx.amount;
            return { ...acc, balance: revBalance };
         }
         return acc;
       });

       // 2. Handle Loan Logic
       let newLoans = prev.loans;
       if (tx.relatedLoanId) {
          newLoans = newLoans.map(loan => {
             if (loan.id === tx.relatedLoanId) {
                const newRepayments = loan.repayments.filter(rId => rId !== id);
                
                // Recalculate based on REMAINING transactions only
                // We must look at 'prev.transactions' but EXCLUDE the current one being deleted
                const remainingRepayAmount = prev.transactions
                    .filter(t => newRepayments.includes(t.id) && t.id !== id)
                    .reduce((sum, t) => sum + t.amount, 0);

                const totalDue = loan.principal * (1 + (loan.interestRate||0) / 100);
                
                let status = loan.status;
                if (remainingRepayAmount < totalDue - 0.01) {
                    status = 'ACTIVE';
                }
                return { ...loan, repayments: newRepayments, status };
             }
             return loan;
          });
       }
       
       return { 
         ...prev, 
         transactions: prev.transactions.filter(t => t.id !== id), 
         accounts,
         loans: newLoans 
       };
    });
  };

  const updateSettings = (s: Partial<UserSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...s } }));
  };

  const addCategory = (type: 'income' | 'expense', name: string) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        categories: {
          ...prev.settings.categories,
          [type]: [...prev.settings.categories[type], name]
        }
      }
    }));
  };

  const removeCategory = (type: 'income' | 'expense', name: string) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        categories: {
          ...prev.settings.categories,
          [type]: prev.settings.categories[type].filter(c => c !== name)
        }
      }
    }));
  };

  const addAccount = (name: string, currency: string) => {
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, { id: `acc_${Date.now()}`, name, currency, balance: 0 }]
    }));
  };

  const removeAccount = (id: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id)
    }));
  };

  return (
    <AppContext.Provider value={{ 
      state, isAuthenticated, isLoading, login, signup, logout, hasPinSetup,
      addTransaction, updateTransaction, addLoan, addRepayment, updateSettings, deleteTransaction, 
      refreshState, addCategory, removeCategory, addAccount, removeAccount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};