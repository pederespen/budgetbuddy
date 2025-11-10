import type { Budget, Category } from "./types";

export function getDefaultCategories(): Category[] {
  return [
    // Expense categories
    {
      id: crypto.randomUUID(),
      name: "Food & Groceries",
      icon: "ShoppingCart",
      color: "#ff6b6b",
      type: "expense",
    },
    {
      id: crypto.randomUUID(),
      name: "Transportation",
      icon: "Car",
      color: "#4ecdc4",
      type: "expense",
    },
    {
      id: crypto.randomUUID(),
      name: "Entertainment",
      icon: "Tv",
      color: "#a29bfe",
      type: "expense",
    },
    {
      id: crypto.randomUUID(),
      name: "Shopping",
      icon: "ShoppingBag",
      color: "#fd79a8",
      type: "expense",
    },
    {
      id: crypto.randomUUID(),
      name: "Bills & Utilities",
      icon: "Receipt",
      color: "#fdcb6e",
      type: "expense",
    },
    {
      id: crypto.randomUUID(),
      name: "Health & Fitness",
      icon: "Heart",
      color: "#00b894",
      type: "expense",
    },
    {
      id: crypto.randomUUID(),
      name: "Other Expenses",
      icon: "Package",
      color: "#636e72",
      type: "expense",
    },
    // Income categories
    {
      id: crypto.randomUUID(),
      name: "Salary",
      icon: "Briefcase",
      color: "#10b981",
      type: "income",
    },
    {
      id: crypto.randomUUID(),
      name: "Freelance",
      icon: "Laptop",
      color: "#34d399",
      type: "income",
    },
    {
      id: crypto.randomUUID(),
      name: "Investments",
      icon: "TrendingUp",
      color: "#6ee7b7",
      type: "income",
    },
    {
      id: crypto.randomUUID(),
      name: "Gifts",
      icon: "Gift",
      color: "#86efac",
      type: "income",
    },
    {
      id: crypto.randomUUID(),
      name: "Other Income",
      icon: "DollarSign",
      color: "#4ade80",
      type: "income",
    },
  ];
}
