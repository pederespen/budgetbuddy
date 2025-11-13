import type { Currency, DateFormat } from "../types";

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
  format: DateFormat = "DD/MM/YYYY",
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

// Filter transactions by date range
export function filterTransactionsByDateRange<T extends { date: string }>(
  transactions: T[],
  startDate: string | null,
  endDate: string | null,
): T[] {
  if (!startDate && !endDate) {
    return transactions;
  }

  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    // Create date objects at midnight in local timezone
    const transactionDay = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      transactionDate.getDate(),
    );

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      return transactionDay >= start && transactionDay <= end;
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      return transactionDay >= start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      return transactionDay <= end;
    }

    return true;
  });
}

// Legacy function name for backwards compatibility
export function filterExpensesByDateRange<T extends { date: string }>(
  expenses: T[],
  startDate: string | null,
  endDate: string | null,
): T[] {
  return filterTransactionsByDateRange(expenses, startDate, endDate);
}
