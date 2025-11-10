export type Currency = "NOK" | "USD" | "EUR" | "GBP" | "SEK" | "DKK";

export type BudgetPeriod = "weekly" | "biweekly" | "monthly";

export type DateFormat =
  | "MM/DD/YYYY"
  | "DD/MM/YYYY"
  | "YYYY-MM-DD"
  | "DD.MM.YYYY";

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // hex color
}

export interface Expense {
  id: string;
  date: string; // ISO date string
  categoryId: string; // Reference to category id
  amount: number;
  note: string;
}

export interface BudgetLimit {
  [categoryId: string]: number;
}

export interface Budget {
  id: string;
  name: string;
  currency: Currency;
  dateFormat: DateFormat;
  period: BudgetPeriod;
  categories: Category[];
  entries: Expense[];
  budgetLimits: BudgetLimit;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  budgets: Budget[];
  activeBudgetId: string | null;
}
