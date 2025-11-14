import type { Category } from "./types";
import { generateId } from "./utils/id";

export function getDefaultCategories(): Category[] {
  return [
    {
      id: generateId(),
      name: "Food & Groceries",
      icon: "ShoppingCart",
      color: "#ff6b6b",
      type: "expense",
    },
    {
      id: generateId(),
      name: "Transportation",
      icon: "Car",
      color: "#4ecdc4",
      type: "expense",
    },
    {
      id: generateId(),
      name: "Entertainment",
      icon: "Tv",
      color: "#a29bfe",
      type: "expense",
    },
    {
      id: generateId(),
      name: "Shopping",
      icon: "ShoppingBag",
      color: "#fd79a8",
      type: "expense",
    },
    {
      id: generateId(),
      name: "Bills & Utilities",
      icon: "Receipt",
      color: "#fdcb6e",
      type: "expense",
    },
    {
      id: generateId(),
      name: "Health & Fitness",
      icon: "Heart",
      color: "#00b894",
      type: "expense",
    },
    {
      id: generateId(),
      name: "Other Expenses",
      icon: "Package",
      color: "#636e72",
      type: "expense",
    },
    {
      id: generateId(),
      name: "Salary",
      icon: "Briefcase",
      color: "#10b981",
      type: "income",
    },
    {
      id: generateId(),
      name: "Freelance",
      icon: "Laptop",
      color: "#34d399",
      type: "income",
    },
    {
      id: generateId(),
      name: "Investments",
      icon: "TrendingUp",
      color: "#6ee7b7",
      type: "income",
    },
    {
      id: generateId(),
      name: "Gifts",
      icon: "Gift",
      color: "#86efac",
      type: "income",
    },
    {
      id: generateId(),
      name: "Other Income",
      icon: "DollarSign",
      color: "#4ade80",
      type: "income",
    },
  ];
}
