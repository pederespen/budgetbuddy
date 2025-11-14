export type Currency = "NOK" | "USD" | "EUR" | "GBP" | "SEK" | "DKK";

export type DateFormat =
  | "MM/DD/YYYY"
  | "DD/MM/YYYY"
  | "YYYY-MM-DD"
  | "DD.MM.YYYY";

export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  date: string;
  categoryId: string;
  amount: number;
  note: string;
  type: TransactionType;
}

export type Expense = Transaction;

export interface BudgetLimit {
  [categoryId: string]: number;
}

export interface Budget {
  id: string;
  name: string;
  currency: Currency;
  dateFormat: DateFormat;
  categories: Category[];
  entries: Transaction[];
  budgetLimits: BudgetLimit;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  budgets: Budget[];
  activeBudgetId: string | null;
}
