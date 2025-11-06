import type { Currency } from "../types";

const currencySymbols: Record<Currency, string> = {
  NOK: "kr",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SEK: "kr",
  DKK: "kr",
};

export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = currencySymbols[currency];
  const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // For NOK, SEK, DKK, put symbol after the amount
  if (currency === "NOK" || currency === "SEK" || currency === "DKK") {
    return `${formatted} ${symbol}`;
  }

  // For USD, EUR, GBP, put symbol before
  return `${symbol}${formatted}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getMonthName(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getCurrentMonth(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}
