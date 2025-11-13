import type { Category } from "../types";
import * as LucideIcons from "lucide-svelte";

export function getCategoryById(
  categories: Category[],
  categoryId: string,
): Category | undefined {
  return categories.find((c) => c.id === categoryId);
}

export function getIconComponent(iconName: string) {
  return (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
}

// Popular icon options for categories
export const POPULAR_ICONS = [
  "ShoppingCart",
  "ShoppingBag",
  "Receipt",
  "Wallet",
  "CreditCard",
  "Banknote",
  "Car",
  "Bus",
  "Plane",
  "Train",
  "Bike",
  "Fuel",
  "Home",
  "Building",
  "Hotel",
  "Warehouse",
  "Coffee",
  "Utensils",
  "Pizza",
  "Beer",
  "Wine",
  "IceCream",
  "Briefcase",
  "GraduationCap",
  "BookOpen",
  "Book",
  "Newspaper",
  "Pencil",
  "Tv",
  "Monitor",
  "Smartphone",
  "Laptop",
  "Gamepad2",
  "Headphones",
  "Music",
  "Film",
  "Camera",
  "Video",
  "Heart",
  "HeartPulse",
  "Activity",
  "Dumbbell",
  "Pill",
  "Stethoscope",
  "Gift",
  "PartyPopper",
  "Sparkles",
  "Trophy",
  "Dog",
  "Cat",
  "PawPrint",
  "Baby",
  "Users",
  "User",
  "Shirt",
  "Watch",
  "Glasses",
  "Scissors",
  "Wrench",
  "Hammer",
  "Paintbrush",
  "Palette",
  "Flower",
  "TreePine",
  "Leaf",
  "Lightbulb",
  "Zap",
  "Droplet",
  "Flame",
  "MoreHorizontal",
];

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
