import type { Budget, AppState, Category } from "./types";

const STORAGE_KEY = "budgetbuddy-data";

export function loadState(): AppState {
  if (typeof window === "undefined") {
    return { budgets: [], activeBudgetId: null };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Migration: Check if old format with string categories
      if (parsed.budgets && parsed.budgets.length > 0) {
        const firstBudget = parsed.budgets[0];
        if (
          firstBudget.categories &&
          typeof firstBudget.categories[0] === "string"
        ) {
          // Old format detected, clear storage
          console.log("Old data format detected, clearing localStorage...");
          localStorage.removeItem(STORAGE_KEY);
          return { budgets: [], activeBudgetId: null };
        }
      }

      return parsed;
    }
  } catch (error) {
    console.error("Failed to load state from localStorage:", error);
  }

  return { budgets: [], activeBudgetId: null };
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);
  }
}

export function getDefaultCategories(): Category[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Food & Groceries",
      icon: "ShoppingCart",
      color: "#ff6b6b",
    },
    {
      id: crypto.randomUUID(),
      name: "Transportation",
      icon: "Car",
      color: "#4ecdc4",
    },
    {
      id: crypto.randomUUID(),
      name: "Entertainment",
      icon: "Tv",
      color: "#a29bfe",
    },
    {
      id: crypto.randomUUID(),
      name: "Shopping",
      icon: "ShoppingBag",
      color: "#fd79a8",
    },
    {
      id: crypto.randomUUID(),
      name: "Bills & Utilities",
      icon: "Receipt",
      color: "#fdcb6e",
    },
    {
      id: crypto.randomUUID(),
      name: "Health & Fitness",
      icon: "Heart",
      color: "#00b894",
    },
    {
      id: crypto.randomUUID(),
      name: "Other",
      icon: "MoreHorizontal",
      color: "#636e72",
    },
  ];
}

export function createDefaultBudget(): Budget {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "My Budget",
    currency: "NOK",
    categories: getDefaultCategories(),
    entries: [],
    budgetLimits: {},
    createdAt: now,
    updatedAt: now,
  };
}
