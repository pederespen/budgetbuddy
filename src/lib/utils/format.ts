import type { Currency, DateFormat } from "../types";

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
