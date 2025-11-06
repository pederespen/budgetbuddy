export type Currency = "NOK" | "USD" | "EUR" | "GBP" | "SEK" | "DKK";

export interface Expense {
  id: string;
  date: string; // ISO date string
  category: string;
  amount: number;
  note: string;
}

export interface BudgetLimit {
  [category: string]: number;
}

export interface Budget {
  id: string;
  name: string;
  currency: Currency;
  categories: string[];
  entries: Expense[];
  budgetLimits: BudgetLimit;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  budgets: Budget[];
  activeBudgetId: string | null;
}
