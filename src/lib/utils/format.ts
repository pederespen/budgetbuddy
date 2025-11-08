import type { Currency, DateFormat, BudgetPeriod } from "../types";

// Currency symbols for display
export const currencySymbols: Record<Currency, string> = {
  NOK: "kr",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SEK: "kr",
  DKK: "kr",
};

// Currency labels with full names
export const currencyLabels: Record<Currency, string> = {
  NOK: "NOK - Norwegian Krone",
  USD: "USD - US Dollar",
  EUR: "EUR - Euro",
  GBP: "GBP - British Pound",
  SEK: "SEK - Swedish Krona",
  DKK: "DKK - Danish Krone",
};

// Short currency labels for compact display
export const currencyShortLabels: Record<Currency, string> = {
  NOK: "NOK (kr)",
  USD: "USD ($)",
  EUR: "EUR (€)",
  GBP: "GBP (£)",
  SEK: "SEK (kr)",
  DKK: "DKK (kr)",
};

// Date format labels
export const dateFormatLabels: Record<DateFormat, string> = {
  "DD/MM/YYYY": "DD/MM/YYYY",
  "MM/DD/YYYY": "MM/DD/YYYY",
  "YYYY-MM-DD": "YYYY-MM-DD",
  "DD.MM.YYYY": "DD.MM.YYYY",
};

// Budget period labels
export const periodLabels: Record<BudgetPeriod, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
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

export function formatDate(
  dateString: string,
  format: DateFormat = "DD/MM/YYYY"
): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  switch (format) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD.MM.YYYY":
      return `${day}.${month}.${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
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
