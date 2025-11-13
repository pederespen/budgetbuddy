import { writable } from "svelte/store";
import type { AppState, Budget, Transaction, Category } from "../types";

function createBudgetStore() {
  const initialState: AppState = { budgets: [], activeBudgetId: null };
  const { subscribe, set, update } = writable<AppState>(initialState);

  return {
    subscribe,
    set,
    update,

    // Budget operations
    addBudget: (budget: Budget) => {
      update((state) => ({
        ...state,
        budgets: [...state.budgets, budget],
        activeBudgetId: state.activeBudgetId || budget.id,
      }));
    },

    deleteBudget: (budgetId: string) => {
      update((state) => {
        const budgets = state.budgets.filter((b) => b.id !== budgetId);
        const activeBudgetId =
          state.activeBudgetId === budgetId
            ? budgets[0]?.id || null
            : state.activeBudgetId;
        return { budgets, activeBudgetId };
      });
    },

    setActiveBudget: (budgetId: string) => {
      update((state) => ({
        ...state,
        activeBudgetId: budgetId,
      }));
    },

    updateBudget: (budgetId: string, updates: Partial<Budget>) => {
      update((state) => ({
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === budgetId
            ? { ...b, ...updates, updatedAt: new Date().toISOString() }
            : b,
        ),
      }));
    },

    // Transaction operations
    addTransaction: (budgetId: string, transaction: Transaction) => {
      update((state) => ({
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === budgetId
            ? {
                ...b,
                entries: [...b.entries, transaction],
                updatedAt: new Date().toISOString(),
              }
            : b,
        ),
      }));
    },

    updateTransaction: (
      budgetId: string,
      transactionId: string,
      updates: Partial<Transaction>,
    ) => {
      update((state) => ({
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === budgetId
            ? {
                ...b,
                entries: b.entries.map((e) =>
                  e.id === transactionId ? { ...e, ...updates } : e,
                ),
                updatedAt: new Date().toISOString(),
              }
            : b,
        ),
      }));
    },

    deleteTransaction: (budgetId: string, transactionId: string) => {
      update((state) => ({
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === budgetId
            ? {
                ...b,
                entries: b.entries.filter((e) => e.id !== transactionId),
                updatedAt: new Date().toISOString(),
              }
            : b,
        ),
      }));
    },

    // Category operations
    addCategory: (budgetId: string, category: Category) => {
      update((state) => ({
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === budgetId
            ? {
                ...b,
                categories: [...b.categories, category],
                updatedAt: new Date().toISOString(),
              }
            : b,
        ),
      }));
    },

    updateCategory: (
      budgetId: string,
      categoryId: string,
      updates: Partial<Category>,
    ) => {
      update((state) => ({
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === budgetId
            ? {
                ...b,
                categories: b.categories.map((c) =>
                  c.id === categoryId ? { ...c, ...updates } : c,
                ),
                updatedAt: new Date().toISOString(),
              }
            : b,
        ),
      }));
    },

    deleteCategory: (budgetId: string, categoryId: string) => {
      update((state) => ({
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === budgetId
            ? {
                ...b,
                categories: b.categories.filter((c) => c.id !== categoryId),
                updatedAt: new Date().toISOString(),
              }
            : b,
        ),
      }));
    },

    // Budget limit operations
    setBudgetLimit: (budgetId: string, categoryId: string, limit: number) => {
      update((state) => ({
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === budgetId
            ? {
                ...b,
                budgetLimits: { ...b.budgetLimits, [categoryId]: limit },
                updatedAt: new Date().toISOString(),
              }
            : b,
        ),
      }));
    },
  };
}

export const budgetStore = createBudgetStore();
