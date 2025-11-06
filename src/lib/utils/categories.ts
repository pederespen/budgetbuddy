import type { Category } from "../types";

// Helper to get category by ID
export function getCategoryById(
  categories: Category[],
  categoryId: string
): Category | undefined {
  return categories.find((c) => c.id === categoryId);
}

// Popular icon options for categories
export const POPULAR_ICONS = [
  "ShoppingCart",
  "Car",
  "Tv",
  "ShoppingBag",
  "Receipt",
  "Heart",
  "Home",
  "Briefcase",
  "Coffee",
  "Utensils",
  "Plane",
  "Gift",
  "Book",
  "Music",
  "Smartphone",
  "Laptop",
  "Dumbbell",
  "Pill",
  "Dog",
  "Cat",
  "Baby",
  "Shirt",
  "Scissors",
  "Wrench",
  "Palette",
  "Camera",
  "Film",
  "Gamepad2",
  "Beer",
  "Pizza",
  "MoreHorizontal",
];

// Preset color options
export const PRESET_COLORS = [
  "#ff6b6b", // Red
  "#4ecdc4", // Teal
  "#a29bfe", // Purple
  "#fd79a8", // Pink
  "#fdcb6e", // Yellow
  "#00b894", // Green
  "#0984e3", // Blue
  "#fd7e14", // Orange
  "#6c5ce7", // Violet
  "#e17055", // Coral
  "#74b9ff", // Light Blue
  "#fab1a0", // Peach
  "#636e72", // Gray
  "#2d3436", // Dark Gray
  "#00b465", // Brand Green
  "#fffbea", // Brand Cream
];
