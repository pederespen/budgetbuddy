import type { Budget, Category } from "./types";

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
    period: "monthly",
    categories: getDefaultCategories(),
    entries: [],
    budgetLimits: {},
    createdAt: now,
    updatedAt: now,
  };
}
