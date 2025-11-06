import type { Budget, AppState } from './types';

const STORAGE_KEY = 'budgetbuddy-data';

export function loadState(): AppState {
	if (typeof window === 'undefined') {
		return { budgets: [], activeBudgetId: null };
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error('Failed to load state from localStorage:', error);
	}

	return { budgets: [], activeBudgetId: null };
}

export function saveState(state: AppState): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.error('Failed to save state to localStorage:', error);
	}
}

export function createDefaultBudget(): Budget {
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		name: 'My Budget',
		currency: 'NOK',
		categories: [
			'Food & Groceries',
			'Transportation',
			'Entertainment',
			'Shopping',
			'Bills & Utilities',
			'Health & Fitness',
			'Other'
		],
		entries: [],
		budgetLimits: {},
		createdAt: now,
		updatedAt: now
	};
}
