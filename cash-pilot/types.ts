export type TransactionType = 'INCOME' | 'EXPENSE' | 'REPAYMENT';
export type LoanType = 'GIVEN' | 'TAKEN';
export type LoanStatus = 'ACTIVE' | 'PAID' | 'OVERDUE';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string
  notes?: string;
  relatedLoanId?: string; // If it's a repayment
  accountId: string;
  fileUrl?: string; // Base64 or URL
}

export interface Loan {
  id: string;
  type: LoanType;
  counterparty: string;
  principal: number;
  interestRate: number; // Percentage
  startDate: string;
  dueDate: string;
  status: LoanStatus;
  notes?: string;
  repayments: string[]; // List of Transaction IDs
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

export interface UserSettings {
  currency: string;
  darkMode: boolean;
  categories: {
    income: string[];
    expense: string[];
  };
}

export interface AppState {
  transactions: Transaction[];
  loans: Loan[];
  accounts: Account[];
  settings: UserSettings;
}

export const DEFAULT_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
};