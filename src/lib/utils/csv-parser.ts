/**
 * CSV Parser for Handelsbanken format
 * Parses CSV files and helps with column mapping
 */

export interface CSVRow {
  [key: string]: string;
}

export interface CSVPreview {
  headers: string[];
  rows: CSVRow[];
  totalRows: number;
}

export interface ColumnMapping {
  date: string;
  description: string;
  amountIn: string;
  amountOut: string;
}

/**
 * Parse CSV text into rows
 */
export function parseCSV(csvText: string, delimiter: string = ";"): CSVPreview {
  const lines = csvText.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Parse header
  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  // Parse rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(delimiter)
      .map((v) => v.trim().replace(/^"|"$/g, ""));

    if (values.length !== headers.length) {
      continue; // Skip malformed rows
    }

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    rows.push(row);
  }

  return {
    headers,
    rows,
    totalRows: rows.length,
  };
}

/**
 * Get a preview of the CSV (first N rows)
 */
export function getCSVPreview(
  csvPreview: CSVPreview,
  previewCount: number = 5
): CSVPreview {
  return {
    ...csvPreview,
    rows: csvPreview.rows.slice(0, previewCount),
  };
}

/**
 * Auto-detect column mapping based on common column names
 */
export function detectColumnMapping(headers: string[]): ColumnMapping | null {
  const mapping: Partial<ColumnMapping> = {};

  headers.forEach((header) => {
    const lower = header.toLowerCase();

    // Date detection
    if (lower.includes("dato") || lower.includes("date")) {
      if (!mapping.date) mapping.date = header;
    }

    // Description detection
    if (
      lower.includes("beskrivelse") ||
      lower.includes("description") ||
      lower.includes("tekst")
    ) {
      if (!mapping.description) mapping.description = header;
    }

    // Amount in detection
    if (
      lower.includes("inn") ||
      lower.includes("credit") ||
      lower.includes("innskudd")
    ) {
      if (!mapping.amountIn) mapping.amountIn = header;
    }

    // Amount out detection
    if (
      (lower.includes("ut") && !lower.includes("utført")) ||
      lower.includes("debit") ||
      lower.includes("uttak")
    ) {
      if (!mapping.amountOut) mapping.amountOut = header;
    }
  });

  // Check if we found all required columns
  if (
    mapping.date &&
    mapping.description &&
    mapping.amountIn &&
    mapping.amountOut
  ) {
    return mapping as ColumnMapping;
  }

  return null;
}

/**
 * Parse date from DD.MM.YYYY to ISO format YYYY-MM-DD
 */
export function parseDate(dateStr: string): string {
  try {
    const parts = dateStr.split(".");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  } catch (e) {
    console.error("Failed to parse date:", dateStr, e);
  }
  return dateStr;
}

/**
 * Parse Norwegian number format to float
 */
export function parseAmount(amountStr: string): number | null {
  if (!amountStr || amountStr.trim() === "") {
    return null;
  }

  try {
    const cleaned = amountStr
      .trim()
      .replace(/\s/g, "") // Remove spaces
      .replace(",", ".") // Replace comma with dot
      .replace("-", ""); // Remove minus sign

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Get date range from CSV data
 */
export function getDateRange(
  rows: CSVRow[],
  dateColumn: string
): { start: string; end: string } | null {
  if (rows.length === 0) return null;

  const dates = rows
    .map((row) => parseDate(row[dateColumn]))
    .filter(Boolean)
    .sort();

  if (dates.length === 0) return null;

  return {
    start: dates[0],
    end: dates[dates.length - 1],
  };
}
