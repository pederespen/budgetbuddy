import type { Budget, Transaction, Category } from "../types";
import { formatCurrency, formatDate } from "./format";
import { getCategoryById } from "./categories";
import * as XLSX from "xlsx";

/**
 * Export budget data as JSON (for backup/restore)
 */
export function exportAsJSON(budget: Budget): void {
  const dataStr = JSON.stringify(
    { budgets: [budget], activeBudgetId: budget.id },
    null,
    2
  );
  const blob = new Blob([dataStr], { type: "application/json" });
  downloadFile(
    blob,
    `${sanitizeFilename(budget.name)}-${getDateString()}.json`
  );
}

/**
 * Export budget transactions as CSV
 */
export function exportAsCSV(budget: Budget): void {
  const headers = ["Date", "Type", "Category", "Amount", "Note"];
  const rows = budget.entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((transaction) => {
      const category = getCategoryById(
        budget.categories,
        transaction.categoryId
      );
      return [
        formatDate(transaction.date, budget.dateFormat),
        transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        category?.name || "Unknown",
        transaction.amount.toFixed(2),
        `"${transaction.note.replace(/"/g, '""')}"`, // Escape quotes in notes
      ];
    });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadFile(blob, `${sanitizeFilename(budget.name)}-${getDateString()}.csv`);
}

/**
 * Export budget transactions as XLSX (Excel format)
 */
export function exportAsXLSX(budget: Budget): void {
  // Prepare data for Excel
  const data = budget.entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((transaction) => {
      const category = getCategoryById(
        budget.categories,
        transaction.categoryId
      );
      return {
        Date: formatDate(transaction.date, budget.dateFormat),
        Type:
          transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        Category: category?.name || "Unknown",
        Amount: transaction.amount,
        Note: transaction.note,
      };
    });

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 12 }, // Date
    { wch: 10 }, // Type
    { wch: 20 }, // Category
    { wch: 12 }, // Amount
    { wch: 40 }, // Note
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadFile(
    blob,
    `${sanitizeFilename(budget.name)}-${getDateString()}.xlsx`
  );
}

/**
 * Helper function to trigger file download
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitize filename by replacing spaces and special characters
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}

/**
 * Get current date as YYYY-MM-DD string
 */
function getDateString(): string {
  return new Date().toISOString().split("T")[0];
}
