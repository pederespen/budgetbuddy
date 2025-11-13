/**
 * Generate a unique identifier
 * Uses crypto.randomUUID() in browsers that support it
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get date string in YYYY-MM-DD format
 */
export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}
