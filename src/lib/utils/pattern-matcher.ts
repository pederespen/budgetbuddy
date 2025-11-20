/**
 * Pattern matcher for transaction categorization
 * Automatically detects patterns in transaction descriptions
 */

import type { Category } from "$lib/types";

/**
 * Patterns for transactions that should be skipped (internal transfers)
 */
export const SKIP_PATTERNS: string[] = [
  "overføring fra sparekonto",
  "overføring til sparekonto",
  "overføring fra brukskonto",
  "overføring til brukskonto",
  "overføring fra faste",
  "overføring til faste",
  "peder hanch-hansen espen",
  "til konto: 9053 08 39558",
];

/**
 * Note replacements to clean up descriptions
 */
export const NOTE_REPLACEMENTS: Record<string, string> = {
  "til konto: 9053 71 05460": "Boliglån",
  "til konto: 6122 06 30691": "Kron",
};

/**
 * Check if a transaction should be skipped (internal transfer)
 */
export function shouldSkipTransaction(description: string): boolean {
  const descLower = description.toLowerCase();
  return SKIP_PATTERNS.some((pattern) => descLower.includes(pattern));
}

/**
 * Clean up transaction note by applying replacements
 */
export function cleanNote(description: string): string {
  const descLower = description.toLowerCase();

  for (const [pattern, replacement] of Object.entries(NOTE_REPLACEMENTS)) {
    if (descLower.includes(pattern.toLowerCase())) {
      return replacement;
    }
  }

  return description;
}

/**
 * Extract potential pattern from description
 * Extracts the first meaningful word/term (usually the merchant/vendor name)
 */
export function extractPattern(description: string): string {
  const cleaned = description
    .toLowerCase()
    .trim()
    // Remove common prefixes
    .replace(/^(vipps\*|zettle_\*|paypal \*)/i, "")
    .trim();

  // Split by common separators and take the first meaningful part
  const parts = cleaned.split(/[\s\-_.,;]+/);

  // Find the first part that's at least 3 characters and not a number
  const pattern = parts.find((part) => part.length >= 3 && !/^\d+$/.test(part));

  return pattern || cleaned.split(/\s+/)[0] || cleaned;
}

/**
 * Group transactions by detected patterns
 */
export interface PatternGroup {
  pattern: string;
  count: number;
  totalAmount: number;
  descriptions: string[];
  transactionIds: string[];
  isIncome: boolean;
}

export function detectPatterns(
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    isIncome: boolean;
  }>
): PatternGroup[] {
  const patternMap = new Map<string, PatternGroup>();

  for (const transaction of transactions) {
    const pattern = extractPattern(transaction.description);

    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, {
        pattern,
        count: 0,
        totalAmount: 0,
        descriptions: [],
        transactionIds: [],
        isIncome: transaction.isIncome,
      });
    }

    const group = patternMap.get(pattern)!;
    group.count++;
    group.totalAmount += transaction.amount;
    group.transactionIds.push(transaction.id);

    // Keep unique descriptions (max 3 examples)
    if (
      group.descriptions.length < 3 &&
      !group.descriptions.includes(transaction.description)
    ) {
      group.descriptions.push(transaction.description);
    }
  }

  // Convert to array, filter out single transactions, and sort by count (most frequent first)
  return Array.from(patternMap.values())
    .filter((group) => group.count >= 2)
    .sort((a, b) => b.count - a.count);
}
