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
  icon: string; // lucide icon name
  color: string; // hex color
  type: TransactionType; // income or expense category
}

export interface Transaction {
  id: string;
  date: string; // ISO date string
  categoryId: string; // Reference to category id
  amount: number;
  note: string;
  type: TransactionType; // income or expense
}

// Legacy type alias for backwards compatibility during migration
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
